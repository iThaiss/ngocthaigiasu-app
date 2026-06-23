import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { createAdminClient } from '@/lib/supabase'

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const guard = await requireAdmin()
  if (!guard.ok) return guard.res

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('public_exam_questions')
    .select('*')
    .eq('exam_id', id)
    .order('question_number')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ questions: data ?? [] })
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const guard = await requireAdmin()
  if (!guard.ok) return guard.res

  const body = await req.json().catch(() => null)
  if (!Array.isArray(body?.questions)) {
    return NextResponse.json({ error: 'questions array required' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const rows = body.questions.map((q: {
    question_number: number
    part: string
    question_type: string
    correct_answer: string | null
    max_score: number
    scoring_rule: unknown
  }) => ({
    exam_id: id,
    question_number: q.question_number,
    part: q.part,
    question_type: q.question_type,
    correct_answer: q.correct_answer ?? null,
    max_score: q.max_score,
    scoring_rule: q.scoring_rule ?? null,
  }))

  const { error } = await supabase
    .from('public_exam_questions')
    .upsert(rows, { onConflict: 'exam_id,question_number' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
