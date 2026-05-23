import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { createAdminClient } from '@/lib/supabase'

function cleanText(value: unknown, max = 300) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

export async function GET(req: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.res

  const { searchParams } = req.nextUrl
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = Math.min(50, Math.max(10, parseInt(searchParams.get('limit') ?? '20')))
  const offset = (page - 1) * limit
  const search = cleanText(searchParams.get('search'), 200)

  const supabase = createAdminClient()
  const { data: savedRows, count, error } = await supabase
    .from('saved_questions')
    .select('id, user_id, question_id, source, note, created_at, users(id, name, email)', { count: 'exact' })
    .eq('source', 'standard_exam')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('[admin/saved-questions] fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch saved questions' }, { status: 500 })
  }

  const questionIds = Array.from(new Set((savedRows ?? []).map((row) => row.question_id).filter(Boolean)))
  const { data: questions, error: questionError } = questionIds.length
    ? await supabase
      .schema('standard_exam')
      .from('questions')
      .select('id, question_type, question_text, topic, subtopic, canonical_topic_title, canonical_subtopic_title, difficulty, correct_answer, numeric_answer, needs_visual')
      .in('id', questionIds)
    : { data: [], error: null }

  if (questionError) console.error('[admin/saved-questions] question enrich error:', questionError)
  const questionMap = new Map((questions ?? []).map((question) => [question.id, question]))

  const allSaved = await supabase
    .from('saved_questions')
    .select('question_id')
    .eq('source', 'standard_exam')

  const counts = new Map<string, number>()
  for (const row of allSaved.data ?? []) counts.set(row.question_id, (counts.get(row.question_id) ?? 0) + 1)

  let rows = (savedRows ?? []).map((row) => ({
    ...row,
    question: questionMap.get(row.question_id) ?? null,
    savedCount: counts.get(row.question_id) ?? 1,
  }))

  if (search) {
    const lower = search.toLowerCase()
    rows = rows.filter((row) => {
      const question = row.question as Record<string, unknown> | null
      const rawUser = row.users as unknown
      const user = Array.isArray(rawUser)
        ? rawUser[0] as Record<string, unknown> | undefined
        : rawUser as Record<string, unknown> | null
      return [
        question?.question_text,
        question?.topic,
        question?.subtopic,
        question?.canonical_topic_title,
        question?.canonical_subtopic_title,
        user?.email,
        user?.name,
        row.note,
      ].join(' ').toLowerCase().includes(lower)
    })
  }

  const topQuestionIds = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([id]) => id)
  const { data: topQuestions } = topQuestionIds.length
    ? await supabase
      .schema('standard_exam')
      .from('questions')
      .select('id, question_text, topic, subtopic, canonical_topic_title, canonical_subtopic_title')
      .in('id', topQuestionIds)
    : { data: [] }
  const topMap = new Map((topQuestions ?? []).map((question) => [question.id, question]))

  return NextResponse.json({
    savedQuestions: rows,
    total: count ?? 0,
    totalPages: Math.max(1, Math.ceil((count ?? 0) / limit)),
    topQuestions: topQuestionIds.map((id) => ({
      question_id: id,
      count: counts.get(id) ?? 0,
      question: topMap.get(id) ?? null,
    })),
  })
}
