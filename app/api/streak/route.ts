import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'

function computeStreak(dateStrings: string[]): number {
  if (dateStrings.length === 0) return 0

  // Remove duplicates and sort descending
  const uniqueDates = Array.from(new Set(dateStrings)).sort((a, b) => b.localeCompare(a))

  const today = new Date()
  const getTzDateStr = (date: Date) => {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date)
  }

  const todayStr = getTzDateStr(today)

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = getTzDateStr(yesterday)

  // If user hasn't studied today or yesterday, the streak is broken
  if (!uniqueDates.includes(todayStr) && !uniqueDates.includes(yesterdayStr)) {
    return 0
  }

  let streak = 0
  let currentDate = uniqueDates.includes(todayStr) ? today : yesterday

  // Count backwards from current active date
  while (true) {
    const checkStr = getTzDateStr(currentDate)
    if (uniqueDates.includes(checkStr)) {
      streak++
      currentDate.setDate(currentDate.getDate() - 1)
    } else {
      break
    }
  }

  return streak
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const subject = searchParams.get('subject')
    if (subject !== 'math' && subject !== 'english') {
      return NextResponse.json({ error: 'Subject must be math or english' }, { status: 400 })
    }

    const userId = session.user.id
    const supabase = createAdminClient()

    // Query last 90 days of records
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
    const ninetyDaysAgoStr = ninetyDaysAgo.toISOString()

    const dates: string[] = []
    const addDate = (timestamp: string | null | undefined) => {
      if (!timestamp) return
      try {
        const date = new Date(timestamp)
        const formatter = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Asia/Ho_Chi_Minh',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        })
        dates.push(formatter.format(date))
      } catch (e) {
        // Ignore parsing errors
      }
    }

    if (subject === 'math') {
      const [solves, exams, answers] = await Promise.all([
        supabase
          .from('solve_history')
          .select('created_at')
          .eq('user_id', userId)
          .gte('created_at', ninetyDaysAgoStr),
        supabase
          .from('exam_sessions')
          .select('completed_at')
          .eq('user_id', userId)
          .gte('completed_at', ninetyDaysAgoStr),
        supabase
          .from('student_answers')
          .select('created_at')
          .eq('user_id', userId)
          .gte('created_at', ninetyDaysAgoStr),
      ])

      if (solves.data) solves.data.forEach((r) => addDate(r.created_at))
      if (exams.data) exams.data.forEach((r) => addDate(r.completed_at))
      if (answers.data) answers.data.forEach((r) => addDate(r.created_at))
    } else {
      const [vocab, grammar, reading] = await Promise.all([
        supabase
          .from('vocab_progress')
          .select('last_review')
          .eq('user_id', userId)
          .gte('last_review', ninetyDaysAgoStr),
        supabase
          .from('grammar_progress')
          .select('last_practiced')
          .eq('user_id', userId)
          .gte('last_practiced', ninetyDaysAgoStr),
        supabase
          .from('reading_progress')
          .select('completed_at')
          .eq('user_id', userId)
          .gte('completed_at', ninetyDaysAgoStr),
      ])

      if (vocab.data) vocab.data.forEach((r) => addDate(r.last_review))
      if (grammar.data) grammar.data.forEach((r) => addDate(r.last_practiced))
      if (reading.data) reading.data.forEach((r) => addDate(r.completed_at))
    }

    const streak = computeStreak(dates)
    return NextResponse.json({ streak })
  } catch (err) {
    console.error('[streak] Error:', err)
    return NextResponse.json({ error: 'Lỗi máy chủ nội bộ' }, { status: 500 })
  }
}
