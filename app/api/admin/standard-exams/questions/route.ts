import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { createAdminClient } from '@/lib/supabase'

function cleanText(value: unknown, max = 6000) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function cleanNumber(value: unknown) {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN
  return Number.isFinite(parsed) ? parsed : null
}

export async function PATCH(req: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.res

  const body = await req.json().catch(() => null)
  const id = cleanText(body?.id, 80)
  if (!id) return NextResponse.json({ error: 'Missing question id' }, { status: 400 })

  const updates: Record<string, unknown> = {}
  if (body?.question_text !== undefined) {
    const text = cleanText(body.question_text, 8000)
    if (!text) return NextResponse.json({ error: 'Question text is required' }, { status: 400 })
    updates.question_text = text
  }
  if (body?.correct_answer !== undefined) updates.correct_answer = cleanText(body.correct_answer, 20) || null
  if (body?.numeric_answer !== undefined) updates.numeric_answer = cleanNumber(body.numeric_answer)
  if (body?.explanation !== undefined) updates.explanation = cleanText(body.explanation, 8000) || null
  if (body?.topic !== undefined) updates.topic = cleanText(body.topic, 300) || null
  if (body?.subtopic !== undefined) updates.subtopic = cleanText(body.subtopic, 300) || null
  if (body?.difficulty !== undefined) updates.difficulty = cleanText(body.difficulty, 80) || null
  if (body?.needs_visual !== undefined) updates.needs_visual = Boolean(body.needs_visual)
  if (body?.image_url !== undefined) updates.image_url = cleanText(body.image_url, 1000) || null

  if (!Object.keys(updates).length) return NextResponse.json({ error: 'No changes' }, { status: 400 })

  const { data, error } = await createAdminClient()
    .schema('standard_exam')
    .from('questions')
    .update(updates)
    .eq('id', id)
    .select('id, question_type, question_text, correct_answer, numeric_answer, explanation, topic, subtopic, difficulty, needs_visual, image_url')
    .single()

  if (error) {
    console.error('[admin/standard-exams/questions] update error:', error)
    return NextResponse.json({ error: 'Failed to update standard question' }, { status: 500 })
  }

  return NextResponse.json({ success: true, question: data })
}
