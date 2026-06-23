import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'
import { scoreQuestion } from '@/lib/public-exam-scoring'

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: examId } = await context.params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id

  const body = await req.json().catch(() => null)
  if (!body?.answers || typeof body.answers !== 'object') {
    return NextResponse.json({ error: 'answers required' }, { status: 400 })
  }
  const timeSpent: number = typeof body.time_spent_seconds === 'number' ? body.time_spent_seconds : 0

  const supabase = createAdminClient()

  const { data: exam, error: examErr } = await supabase
    .from('public_exams')
    .select('id, status, max_score')
    .eq('id', examId)
    .single()

  if (examErr || !exam) return NextResponse.json({ error: 'Không tìm thấy đề thi' }, { status: 404 })
  if (exam.status !== 'published') return NextResponse.json({ error: 'Đề chưa được publish' }, { status: 400 })

  const { data: questions, error: qErr } = await supabase
    .from('public_exam_questions')
    .select('question_number, part, question_type, correct_answer, max_score, scoring_rule')
    .eq('exam_id', examId)
    .order('question_number')

  if (qErr || !questions?.length) {
    return NextResponse.json({ error: 'Đề thi chưa có đáp án' }, { status: 400 })
  }

  const answers: Record<number, string> = body.answers
  let totalScore = 0
  const breakdown: Record<number, number> = {}

  for (const q of questions) {
    const answer = answers[q.question_number] !== undefined ? String(answers[q.question_number]) : undefined
    const s = scoreQuestion(q as Parameters<typeof scoreQuestion>[0], answer)
    totalScore += s
    breakdown[q.question_number] = s
  }

  totalScore = Math.round(totalScore * 100) / 100

  const { count } = await supabase
    .from('public_exam_submissions')
    .select('id', { count: 'exact', head: true })
    .eq('exam_id', examId)
    .eq('user_id', userId)

  const attemptNumber = (count ?? 0) + 1

  const { data: submission, error: subErr } = await supabase
    .from('public_exam_submissions')
    .insert({
      exam_id: examId,
      user_id: userId,
      answers: body.answers,
      score: totalScore,
      time_spent_seconds: timeSpent,
      attempt_number: attemptNumber,
    })
    .select('id, score, attempt_number, submitted_at')
    .single()

  if (subErr) return NextResponse.json({ error: subErr.message }, { status: 500 })

  if (attemptNumber === 1) {
    await supabase.rpc('update_public_exam_stats', { p_exam_id: examId })
  }

  const correctAnswers: Record<number, string | null> = {}
  for (const q of questions) {
    correctAnswers[q.question_number] = q.correct_answer
  }

  return NextResponse.json({
    submission,
    score: totalScore,
    max_score: exam.max_score,
    breakdown,
    correct_answers: correctAnswers,
    attempt_number: attemptNumber,
  })
}
