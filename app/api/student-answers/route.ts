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

  const { question_id, answer, is_correct, time_spent } = body
  if (!question_id || answer === undefined || is_correct === undefined) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { error } = await supabase.from('student_answers').insert({
    user_id: session.user.id,
    question_id,
    answer: String(answer),
    is_correct,
    time_spent: time_spent ?? null,
  })

  if (error) {
    console.error('[student-answers] INSERT error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
