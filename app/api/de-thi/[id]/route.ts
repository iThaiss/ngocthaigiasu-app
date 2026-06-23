import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id ?? null
  const isAdmin = (session?.user as { role?: string })?.role === 'admin'

  const supabase = createAdminClient()

  const { data: exam, error } = await supabase
    .from('public_exams')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !exam) return NextResponse.json({ error: 'Không tìm thấy đề thi' }, { status: 404 })
  if (exam.status !== 'published' && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: questions } = await supabase
    .from('public_exam_questions')
    .select('question_number, part, question_type, max_score, scoring_rule')
    .eq('exam_id', id)
    .order('question_number')

  let mySubmission = null
  if (userId) {
    const { data: sub } = await supabase
      .from('public_exam_submissions')
      .select('id, score, answers, time_spent_seconds, attempt_number, submitted_at')
      .eq('exam_id', id)
      .eq('user_id', userId)
      .eq('attempt_number', 1)
      .maybeSingle()
    mySubmission = sub
  }

  return NextResponse.json({ exam, questions: questions ?? [], my_submission: mySubmission })
}
