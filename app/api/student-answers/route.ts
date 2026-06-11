import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { question_id: string; answer: string; is_correct: boolean; time_spent?: number }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { question_id, answer, time_spent } = body
  if (!question_id || answer === undefined) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // 1. Fetch the correct answer details from 'questions' table
  let { data: question, error: fetchErr } = await supabase
    .from('questions')
    .select('question_type, correct_answer, numeric_answer, statements')
    .eq('id', question_id)
    .single()

  // If not found in default questions, check standard_exam schema
  if (fetchErr || !question) {
    const { data: stdQuestion, error: stdFetchErr } = await supabase
      .schema('standard_exam')
      .from('questions')
      .select('question_type, correct_answer, numeric_answer, statements')
      .eq('id', question_id)
      .single()

    if (stdFetchErr || !stdQuestion) {
      console.error('[student-answers] question not found:', fetchErr || stdFetchErr)
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }
    question = stdQuestion
  }

  // 2. Grade the submitted answer on the server side
  const { gradeQuestion } = await import('@/lib/question-grading')
  const gradeResult = gradeQuestion(
    {
      question_type: question.question_type,
      correct_answer: question.correct_answer,
      numeric_answer: question.numeric_answer,
      statements: question.statements
    },
    answer
  )

  // 3. Insert record with server-side calculated is_correct value
  const { error } = await supabase.from('student_answers').insert({
    user_id: session.user.id,
    question_id,
    answer: String(answer),
    is_correct: gradeResult.correct,
    time_spent: time_spent ?? null,
  })

  if (error) {
    console.error('[student-answers] INSERT error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, correct: gradeResult.correct })
}
