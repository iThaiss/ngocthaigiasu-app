import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { createAdminClient } from '@/lib/supabase'
import { isQuestionStudentReady } from '@/lib/question-readiness'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.res

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const supabase = createAdminClient()
  const { difficulty, correct_answer, statement_a, statement_b, statement_c, statement_d,
    answer_a, answer_b, answer_c, answer_d, numeric_answer,
    topic, subtopic, source, grade, part, needs_visual, visual_image_url, image_url, has_image,
    needs_review, is_published, answer_source } = body

  const updates: Record<string, unknown> = {}
  if (difficulty !== undefined) updates.difficulty = difficulty || null
  if (correct_answer !== undefined) updates.correct_answer = correct_answer || null
  if (statement_a !== undefined) updates.statement_a = statement_a
  if (statement_b !== undefined) updates.statement_b = statement_b
  if (statement_c !== undefined) updates.statement_c = statement_c
  if (statement_d !== undefined) updates.statement_d = statement_d
  if (answer_a !== undefined) updates.answer_a = answer_a
  if (answer_b !== undefined) updates.answer_b = answer_b
  if (answer_c !== undefined) updates.answer_c = answer_c
  if (answer_d !== undefined) updates.answer_d = answer_d
  if (numeric_answer !== undefined) updates.numeric_answer = numeric_answer
  if (topic !== undefined) updates.topic = topic || null
  if (subtopic !== undefined) updates.subtopic = subtopic || null
  if (source !== undefined) updates.source = source || null
  if (grade !== undefined) updates.grade = grade || null
  if (part !== undefined) updates.part = part || null
  if (needs_visual !== undefined) updates.needs_visual = needs_visual
  if (visual_image_url !== undefined) updates.visual_image_url = visual_image_url || null
  if (image_url !== undefined) updates.image_url = image_url || null
  if (has_image !== undefined) updates.has_image = Boolean(has_image)
  if (needs_review !== undefined) updates.needs_review = Boolean(needs_review)
  if (is_published !== undefined) updates.is_published = Boolean(is_published)
  if (answer_source !== undefined) updates.answer_source = answer_source || null

  let mergedQuestion: Record<string, unknown> | null = null
  if (updates.is_published === true) {
    const { data: current, error: currentError } = await supabase
      .from('questions')
      .select('*')
      .eq('id', params.id)
      .single()

    if (currentError || !current) return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    mergedQuestion = { ...current, ...updates }
    if (!isQuestionStudentReady(mergedQuestion)) {
      return NextResponse.json({ error: 'Question is missing required answer or visual before publishing' }, { status: 400 })
    }
  }

  const { data, error } = await supabase
    .from('questions')
    .update(updates)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  return NextResponse.json({ success: true, question: data })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.res

  const supabase = createAdminClient()
  const { error } = await supabase.from('questions').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  return NextResponse.json({ success: true })
}
