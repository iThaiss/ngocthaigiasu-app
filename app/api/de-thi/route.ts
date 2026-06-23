import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id ?? null
  const isAdmin = (session?.user as { role?: string })?.role === 'admin'

  const supabase = createAdminClient()

  let query = supabase
    .from('public_exams')
    .select('id, title, year, subject, pdf_url, time_limit_minutes, question_count, max_score, attempt_count, avg_score, status, solution_url, handwritten_url, created_at')

    .order('created_at', { ascending: false })

  if (!isAdmin) {
    query = query.eq('status', 'published')
  }

  const { data: exams, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Lấy submission đầu tiên của user hiện tại cho tất cả đề
  let mySubmissions: Record<string, { score: number; submitted_at: string }> = {}
  if (userId && exams?.length) {
    const examIds = exams.map((e) => e.id)
    const { data: subs } = await supabase
      .from('public_exam_submissions')
      .select('exam_id, score, submitted_at')
      .eq('user_id', userId)
      .eq('attempt_number', 1)
      .in('exam_id', examIds)

    if (subs) {
      for (const sub of subs) {
        mySubmissions[sub.exam_id] = { score: sub.score, submitted_at: sub.submitted_at }
      }
    }
  }

  const result = (exams ?? []).map((exam) => ({
    ...exam,
    my_submission: mySubmissions[exam.id] ?? null,
  }))

  return NextResponse.json({ exams: result })
}
