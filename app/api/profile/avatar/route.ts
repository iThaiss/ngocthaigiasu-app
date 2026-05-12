import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let file: File | null = null
  try {
    const formData = await req.formData()
    file = formData.get('avatar') as File | null
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Chỉ chấp nhận JPG, PNG, WEBP, GIF' }, { status: 400 })
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'Ảnh tối đa 5MB' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const path = `${session.user.id}/avatar.${ext}`
  const arrayBuffer = await file.arrayBuffer()

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, Buffer.from(arrayBuffer), { contentType: file.type, upsert: true })

  if (uploadError) {
    console.error('[avatar] upload error:', uploadError)
    return NextResponse.json({ error: 'Upload thất bại' }, { status: 500 })
  }

  const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
  const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`

  await supabase.from('users').update({ avatar_url: avatarUrl }).eq('id', session.user.id)

  return NextResponse.json({ url: avatarUrl })
}
