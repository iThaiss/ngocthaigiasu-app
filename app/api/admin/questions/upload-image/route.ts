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

  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `question-images/${questionId}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const supabase = createAdminClient()

  const { error: uploadError } = await supabase.storage
    .from('question-assets')
    .upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: urlData } = supabase.storage
    .from('question-assets')
    .getPublicUrl(path)

  const publicUrl = urlData.publicUrl

  const { error: updateError } = await supabase
    .from('questions')
    .update({ visual_image_url: publicUrl, needs_visual: false })
    .eq('id', questionId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, url: publicUrl })
}
