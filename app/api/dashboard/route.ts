import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'
import { getSolveConfig } from '@/lib/plans'

function formatActivityTime(date: string | null | undefined) {
  if (!date) return null
  return new Date(date).toISOString()
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id
  const isVip = session.user.isVip ?? false
  const vipExpiresAt = session.user.vipExpiresAt ?? null
  const today = new Date().toISOString().slice(0, 10)
  const supabase = createAdminClient()

  const [
    walletRes,
    dailySolveRes,
    solveCountRes,
    solveRecentRes,
    examRecentRes,
    notificationsRes,
    unreadNotificationsRes,
    savedCountRes,
    commissionRes,
    recentWrongAnswersRes,
  ] = await Promise.all([
    supabase.from('wallets').select('points, balance').eq('user_id', userId).maybeSingle(),
    supabase.from('daily_solve_count').select('count').eq('user_id', userId).eq('date', today).maybeSingle(),
    supabase.from('solve_history').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase
      .from('solve_history')
      .select('id, problem_text, topic, difficulty, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(3),
    supabase
      .from('exam_sessions')
      .select('id, score, total_questions, time_taken, completed_at')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(3),
    supabase
      .from('notifications')
      .select('id, title, content, type, is_read, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(3),
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false),
    supabase
      .from('saved_questions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
    supabase
      .from('point_transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('type', 'commission'),
    supabase
      .from('student_answers')
      .select('question_id, created_at')
      .eq('user_id', userId)
      .eq('is_correct', false)
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  if (walletRes.error) console.error('[dashboard] wallet error:', walletRes.error)
  if (dailySolveRes.error) console.error('[dashboard] daily solve error:', dailySolveRes.error)
  if (solveCountRes.error) console.error('[dashboard] solve count error:', solveCountRes.error)
  if (solveRecentRes.error) console.error('[dashboard] recent solve error:', solveRecentRes.error)
  if (examRecentRes.error) console.error('[dashboard] recent exam error:', examRecentRes.error)
  if (notificationsRes.error) console.error('[dashboard] notifications error:', notificationsRes.error)
  if (unreadNotificationsRes.error) console.error('[dashboard] unread notifications error:', unreadNotificationsRes.error)
  if (savedCountRes.error) console.error('[dashboard] saved count error:', savedCountRes.error)
  if (commissionRes.error) console.error('[dashboard] commission error:', commissionRes.error)
  if (recentWrongAnswersRes.error) console.error('[dashboard] weak areas error:', recentWrongAnswersRes.error)

  const wrongAnswerQuestionIds = [...new Set((recentWrongAnswersRes.data ?? []).map((r) => r.question_id).filter(Boolean))]
  let questionsMap: Record<string, { topic: string | null; subtopic: string | null; canonical_topic_title: string | null; canonical_subtopic_title: string | null }> = {}
  if (wrongAnswerQuestionIds.length > 0) {
    const { data: questionsData } = await supabase
      .from('questions')
      .select('id, topic, subtopic, canonical_topic_title, canonical_subtopic_title')
      .in('id', wrongAnswerQuestionIds)
    for (const q of questionsData ?? []) questionsMap[q.id] = q
  }

  const recentExams = examRecentRes.data ?? []
  const examScores = recentExams.filter((exam) => typeof exam.score === 'number')
  const avgExamScore = examScores.length
    ? Math.round(examScores.reduce((sum, exam) => sum + Number(exam.score ?? 0), 0) / examScores.length)
    : 0
  const { limit: solveLimit } = getSolveConfig({
    plan: session.user.plan,
    vipPlanId: session.user.vipPlan,
    isVip,
    vipExpiresAt,
  })
  const solvedToday = dailySolveRes.data?.count ?? 0
  const totalCommissionPoints = (commissionRes.data ?? []).reduce((sum, row) => sum + Number(row.amount ?? 0), 0)
  const weakAreaMap = new Map<string, { topic: string | null; subtopic: string | null; count: number }>()

  for (const row of recentWrongAnswersRes.data ?? []) {
    const question = row.question_id ? questionsMap[row.question_id] : null
    const topic = question?.canonical_topic_title ?? question?.topic ?? null
    const subtopic = question?.canonical_subtopic_title ?? question?.subtopic ?? null
    const label = subtopic || topic
    if (!label) continue
    const current = weakAreaMap.get(label) ?? { topic, subtopic, count: 0 }
    current.count += 1
    weakAreaMap.set(label, current)
  }

  const weakAreas = Array.from(weakAreaMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)

  return NextResponse.json({
    stats: {
      totalSolves: solveCountRes.count ?? 0,
      solvedToday,
      solveLimit,
      solveRemaining: Math.max(0, solveLimit - solvedToday),
      avgExamScore,
      unreadNotifications: unreadNotificationsRes.count ?? 0,
      savedQuestions: savedCountRes.count ?? 0,
      points: walletRes.data?.points ?? 0,
      totalCommissionPoints,
      isVip,
      vipExpiresAt,
    },
    recentSolves: (solveRecentRes.data ?? []).map((item) => ({
      id: item.id,
      title: item.topic || 'Bài toán AI',
      description: item.problem_text,
      difficulty: item.difficulty,
      createdAt: formatActivityTime(item.created_at),
    })),
    recentExams: recentExams.map((exam) => ({
      id: exam.id,
      score: exam.score ?? 0,
      totalQuestions: exam.total_questions ?? 50,
      timeTaken: exam.time_taken ?? 0,
      completedAt: formatActivityTime(exam.completed_at),
    })),
    notifications: (notificationsRes.data ?? []).map((notification) => ({
      id: notification.id,
      title: notification.title,
      content: notification.content,
      type: notification.type,
      isRead: notification.is_read,
      createdAt: formatActivityTime(notification.created_at),
    })),
    weakAreas,
  })
}
