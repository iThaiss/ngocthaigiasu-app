import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { createAdminClient } from '@/lib/supabase'

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const guard = await requireAdmin()
  if (!guard.ok) return guard.res

  const formData = await req.formData().catch(() => null)
  if (!formData) return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })

  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'file required' }, { status: 400 })

  if (file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'Chi chap nhan file PDF' }, { status: 400 })
  }
  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json({ error: 'File PDF toi da 20MB' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const path = `exams/${id}-${Date.now()}.pdf`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await supabase.storage
    .from('exam-pdfs')
    .upload(path, buffer, { contentType: 'application/pdf', upsert: true })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: urlData } = supabase.storage.from('exam-pdfs').getPublicUrl(path)
  const pdfUrl = urlData.publicUrl

  const { error: updateError } = await supabase
    .from('public_exams')
    .update({ pdf_url: pdfUrl })
    .eq('id', id)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  return NextResponse.json({ success: true, pdf_url: pdfUrl })
}
