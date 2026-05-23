import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'
import { isQuestionStudentReady } from '@/lib/question-readiness'

function cleanText(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function parseQuestionIds(value: string | null) {
  if (!value) return []
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 100)
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const source = searchParams.get('source')?.trim() || 'standard_exam'
  const questionIds = parseQuestionIds(searchParams.get('questionIds'))
  const includeQuestions = searchParams.get('include') === 'questions'

  const supabase = createAdminClient()
  let query = supabase
    .from('saved_questions')
    .select('id, question_id, source, note, created_at, updated_at')
    .eq('user_id', session.user.id)
    .eq('source', source)
    .order('created_at', { ascending: false })

  if (questionIds.length) query = query.in('question_id', questionIds)
  else query = query.limit(200)

  const { data, error } = await query
  if (error) {
    console.error('[saved-questions] SELECT error:', error)
    return NextResponse.json({ error: 'Failed to load saved questions' }, { status: 500 })
  }

  const savedQuestions = data ?? []
  if (includeQuestions && savedQuestions.length) {
    const ids = savedQuestions.map((item) => item.question_id)
    const { data: questions, error: questionsError } = await supabase
      .schema('standard_exam')
      .from('questions')
      .select('id, question_type, question_text, option_a, option_b, option_c, option_d, correct_answer, statements, answer_a, answer_b, answer_c, answer_d, numeric_answer, explanation, topic, subtopic, canonical_topic_title, canonical_subtopic_title, difficulty, needs_visual, image_url, visual_image_url')
      .in('id', ids)

    if (questionsError) {
      console.error('[saved-questions] question enrich error:', questionsError)
    }

    const questionMap = new Map((questions ?? []).filter((question) => isQuestionStudentReady(question)).map((question) => [question.id, question]))
    return NextResponse.json({
      savedQuestions: savedQuestions.map((item) => ({
        ...item,
        question: questionMap.get(item.question_id) ?? null,
      })),
      savedQuestionIds: savedQuestions.map((item) => item.question_id),
    })
  }

  return NextResponse.json({
    savedQuestions,
    savedQuestionIds: savedQuestions.map((item) => item.question_id),
  })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const raw = body as Record<string, unknown>
  const questionId = cleanText(raw.question_id, 80)
  if (!questionId) return NextResponse.json({ error: 'question_id is required' }, { status: 400 })

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('saved_questions')
    .upsert({
      user_id: session.user.id,
      question_id: questionId,
      source: cleanText(raw.source, 40) || 'standard_exam',
      note: cleanText(raw.note, 1000) || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,question_id,source' })
    .select('id, question_id, source, note, created_at')
    .single()

  if (error) {
    console.error('[saved-questions] UPSERT error:', error)
    return NextResponse.json({ error: 'Failed to save question' }, { status: 500 })
  }

  return NextResponse.json({ success: true, savedQuestion: data })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const questionId = searchParams.get('question_id')?.trim()
  const source = searchParams.get('source')?.trim() || 'standard_exam'
  if (!questionId) return NextResponse.json({ error: 'question_id is required' }, { status: 400 })

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('saved_questions')
    .delete()
    .eq('user_id', session.user.id)
    .eq('question_id', questionId)
    .eq('source', source)

  if (error) {
    console.error('[saved-questions] DELETE error:', error)
    return NextResponse.json({ error: 'Failed to remove saved question' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
