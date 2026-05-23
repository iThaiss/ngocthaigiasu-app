import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'

const ISSUE_TYPES = new Set(['wrong_answer', 'unclear_question', 'bad_image', 'bad_explanation', 'typo', 'other'])

function cleanText(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const raw = body as Record<string, unknown>
  const questionId = cleanText(raw.question_id, 80)
  const description = cleanText(raw.description, 1200)
  const issueType = cleanText(raw.issue_type, 40)

  if (!questionId || !description) {
    return NextResponse.json({ error: 'question_id and description are required' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('question_reports')
    .insert({
      user_id: session.user.id,
      question_id: questionId,
      exam_question_id: cleanText(raw.exam_question_id, 80) || null,
      exam_set_id: cleanText(raw.exam_set_id, 80) || null,
      source: cleanText(raw.source, 40) || 'standard_exam',
      issue_type: ISSUE_TYPES.has(issueType) ? issueType : 'other',
      description,
      status: 'open',
    })
    .select('id, status, created_at')
    .single()

  if (error) {
    console.error('[question-reports] INSERT error:', error)
    return NextResponse.json({ error: 'Failed to save report' }, { status: 500 })
  }

  return NextResponse.json({ success: true, report: data })
}
