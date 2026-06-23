import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: examId } = await context.params
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id ?? null

  const supabase = createAdminClient()

  const { data: top, error } = await supabase
    .from('public_exam_submissions')
    .select('user_id, score, time_spent_seconds, submitted_at, users!inner(name, email)')
    .eq('exam_id', examId)
    .eq('attempt_number', 1)
    .order('score', { ascending: false })
    .order('time_spent_seconds', { ascending: true })
    .limit(20)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const entries = (top ?? []).map((row, index) => ({
    rank: index + 1,
    user_id: row.user_id,
    name: (row.users as unknown as { name: string; email: string })?.name ?? 'An danh',
    score: row.score,
    time_spent_seconds: row.time_spent_seconds,
    submitted_at: row.submitted_at,
    is_me: row.user_id === userId,
  }))

  let myRank = null
  if (userId && !entries.find((e) => e.is_me)) {
    const { data: mySub } = await supabase
      .from('public_exam_submissions')
      .select('score, time_spent_seconds')
      .eq('exam_id', examId)
      .eq('user_id', userId)
      .eq('attempt_number', 1)
      .maybeSingle()

    if (mySub) {
      const { count: ahead } = await supabase
        .from('public_exam_submissions')
        .select('id', { count: 'exact', head: true })
        .eq('exam_id', examId)
        .eq('attempt_number', 1)
        .gt('score', mySub.score)

      myRank = {
        rank: (ahead ?? 0) + 1,
        score: mySub.score,
        time_spent_seconds: mySub.time_spent_seconds,
      }
    }
  }

  return NextResponse.json({ entries, my_rank: myRank })
}
