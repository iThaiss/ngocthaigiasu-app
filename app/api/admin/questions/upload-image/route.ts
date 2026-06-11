import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { createAdminClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.res

  const url = req.nextUrl.searchParams.get('url')
  if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 })

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return NextResponse.json({ error: 'Invalid url' }, { status: 400 })
  }

  if (!['https:', 'http:'].includes(parsed.protocol)) {
    return NextResponse.json({ error: 'Invalid protocol' }, { status: 400 })
  }

  // SSRF Mitigation: Block local/private hosts and IP ranges
  const hostname = parsed.hostname.toLowerCase()
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal')
  ) {
    return NextResponse.json({ error: 'Forbidden destination host (SSRF Mitigation)' }, { status: 400 })
  }

  // Basic check for private IP ranges (IPv4)
  const isPrivateIp = (ip: string): boolean => {
    const parts = ip.split('.').map(Number)
    if (parts.length !== 4 || parts.some(isNaN)) return false
    return (
      parts[0] === 10 || // 10.0.0.0/8
      (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) || // 172.16.0.0/12
      (parts[0] === 192 && parts[1] === 168) || // 192.168.0.0/16
      (parts[0] === 169 && parts[1] === 254) // 169.254.0.0/16 (Link-local, including AWS metadata)
    )
  }

  if (isPrivateIp(hostname)) {
    return NextResponse.json({ error: 'Forbidden IP range (SSRF Mitigation)' }, { status: 400 })
  }

  // Attempt resolving hostname to prevent DNS rebinding or direct IP requests to private range
  try {
    const dns = await import('dns/promises')
    const lookup = await dns.lookup(parsed.hostname).catch(() => null)
    if (lookup && isPrivateIp(lookup.address)) {
      return NextResponse.json({ error: 'Forbidden resolved IP destination (SSRF Mitigation)' }, { status: 400 })
    }
  } catch {
    // Ignore DNS resolution errors and let fetch handle resolution/failure
  }

  const res = await fetch(parsed.toString())
  if (!res.ok) return NextResponse.json({ error: 'Image fetch failed' }, { status: 502 })

  const contentType = res.headers.get('content-type') ?? ''
  if (!contentType.startsWith('image/')) {
    return NextResponse.json({ error: 'URL is not an image' }, { status: 400 })
  }

  return new NextResponse(await res.arrayBuffer(), {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'private, max-age=300',
    },
  })
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.res

  const formData = await req.formData().catch(() => null)
  if (!formData) return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })

  const file = formData.get('file') as File | null
  const questionId = formData.get('questionId') as string | null

  if (!file || !questionId) {
    return NextResponse.json({ error: 'file and questionId required' }, { status: 400 })
  }

  const allowedTypes: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  }
  const ext = allowedTypes[file.type]
  if (!ext) {
    return NextResponse.json({ error: 'Only JPG, PNG, and WEBP images are allowed' }, { status: 400 })
  }
  if (file.size > 8 * 1024 * 1024) {
    return NextResponse.json({ error: 'Image must be 8MB or smaller' }, { status: 400 })
  }

  const bucket = 'question-visuals'
  const path = `admin-crops/${questionId}-${Date.now()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const supabase = createAdminClient()

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    })

  if (uploadError) {
    console.error('[admin/questions/upload-image] storage error:', uploadError)
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(path)

  const publicUrl = urlData.publicUrl

  const { error: updateError } = await supabase
    .from('questions')
    .update({ visual_image_url: publicUrl, image_url: publicUrl, has_image: true, needs_visual: false })
    .eq('id', questionId)

  if (updateError) {
    console.error('[admin/questions/upload-image] update error:', updateError)
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, url: publicUrl })
}
