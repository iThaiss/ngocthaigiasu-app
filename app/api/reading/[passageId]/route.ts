import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'

// GET /api/reading/[passageId]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ passageId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { passageId } = await params
  const supabase = createAdminClient()
  const userId = session.user.id

  const [passageRes, questionsRes, progressRes] = await Promise.all([
    supabase.from('reading_passages').select('*').eq('id', passageId).eq('is_active', true).single(),
    supabase.from('reading_questions').select('*').eq('passage_id', passageId).order('order_index'),
    supabase.from('reading_progress')
      .select('completed, score, total, answers, completed_at')
      .eq('user_id', userId).eq('passage_id', passageId).maybeSingle(),
  ])

  if (passageRes.error || !passageRes.data) {
    return NextResponse.json({ error: 'Passage not found' }, { status: 404 })
  }

  return NextResponse.json({
    passage: passageRes.data,
    questions: questionsRes.data ?? [],
    progress: progressRes.data ?? { completed: false, score: 0, total: 0, answers: {}, completed_at: null },
  })
}

// POST /api/reading/[passageId] — submit answers
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ passageId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { passageId } = await params
  const { answers } = await req.json() as { answers: Record<string, string> }

  const supabase = createAdminClient()
  const userId = session.user.id

  // Fetch correct answers
  const { data: questions } = await supabase
    .from('reading_questions')
    .select('id, correct_answer')
    .eq('passage_id', passageId)

  if (!questions?.length) return NextResponse.json({ error: 'No questions found' }, { status: 404 })

  let score = 0
  for (const q of questions) {
    if (answers[q.id]?.toUpperCase() === q.correct_answer) score++
  }

  await supabase
    .from('reading_progress')
    .upsert({
      user_id: userId,
      passage_id: passageId,
      completed: true,
      score,
      total: questions.length,
      answers,
      completed_at: new Date().toISOString(),
    }, { onConflict: 'user_id,passage_id' })

  return NextResponse.json({ ok: true, score, total: questions.length })
}
