import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'
import { gradeHomework, type HomeworkSlot } from '@/lib/homework-grading'

// POST /api/live/homework/submit  { sessionId, answers, timeSpent }
// Chấm trên server theo đáp án gốc, lưu mọi lần nộp.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const isVip = session.user.isVip === true
  const isAdmin = session.user.role === 'admin'
  if (!isVip && !isAdmin) return NextResponse.json({ error: 'Yêu cầu tài khoản VIP' }, { status: 403 })

  const { sessionId, answers, timeSpent } = await req.json() as {
    sessionId: string
    answers: Record<string, unknown>
    timeSpent?: number
  }
  if (!sessionId || typeof answers !== 'object' || answers === null) {
    return NextResponse.json({ error: 'Thiếu dữ liệu bài làm' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data: live, error } = await supabase
    .from('live_sessions')
    .select('homework_answer_key')
    .eq('id', sessionId)
    .single()

  if (error || !live || !Array.isArray(live.homework_answer_key)) {
    return NextResponse.json({ error: 'Buổi học chưa có BTVN' }, { status: 404 })
  }

  const graded = gradeHomework(live.homework_answer_key as HomeworkSlot[], answers)

  const { error: insertError } = await supabase.from('homework_submissions').insert({
    live_session_id: sessionId,
    user_id: session.user.id,
    answers: graded.results,
    score: graded.score,
    max_score: graded.maxScore,
    correct_count: graded.correctCount,
    total_count: graded.totalCount,
    time_spent_seconds: typeof timeSpent === 'number' ? Math.round(timeSpent) : null,
  })

  if (insertError) {
    console.error('homework submit insert error:', insertError)
    return NextResponse.json({ error: 'Lỗi khi lưu bài làm' }, { status: 500 })
  }

  return NextResponse.json({
    score: graded.score,
    max_score: graded.maxScore,
    correct_count: graded.correctCount,
    total_count: graded.totalCount,
    results: graded.results,
  })
}
