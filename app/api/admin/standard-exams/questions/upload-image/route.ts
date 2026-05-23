import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { createAdminClient } from '@/lib/supabase'

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
  if (!ext) return NextResponse.json({ error: 'Only JPG, PNG, and WEBP images are allowed' }, { status: 400 })
  if (file.size > 8 * 1024 * 1024) return NextResponse.json({ error: 'Image must be 8MB or smaller' }, { status: 400 })

  const bucket = 'question-visuals'
  const path = `standard-exam/${questionId}-${Date.now()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())
  const supabase = createAdminClient()

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, buffer, { contentType: file.type, upsert: true })

  if (uploadError) {
    console.error('[admin/standard-exams/questions/upload-image] storage error:', uploadError)
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path)
  const publicUrl = urlData.publicUrl

  const { error: updateError } = await supabase
    .schema('standard_exam')
    .from('questions')
    .update({ image_url: publicUrl, needs_visual: false })
    .eq('id', questionId)

  if (updateError) {
    console.error('[admin/standard-exams/questions/upload-image] update error:', updateError)
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, url: publicUrl })
}
