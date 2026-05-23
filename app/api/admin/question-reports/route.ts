import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { createAdminClient } from '@/lib/supabase'

const REPORT_STATUSES = new Set(['open', 'reviewing', 'resolved', 'rejected'])
const ISSUE_TYPES = new Set(['wrong_answer', 'unclear_question', 'missing_image', 'bad_solution', 'typo', 'other'])

type QuestionReportRow = {
  id: string
  user_id: string
  question_id: string
  exam_question_id: string | null
  exam_set_id: string | null
  source: string
  issue_type: string
  description: string
  status: string
  admin_note: string | null
  created_at: string
  updated_at: string
}

function unique(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter(Boolean) as string[]))
}

function cleanText(value: unknown, max = 1000) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

export async function GET(req: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.res

  const { searchParams } = req.nextUrl
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = Math.min(50, Math.max(10, parseInt(searchParams.get('limit') ?? '20')))
  const offset = (page - 1) * limit
  const status = searchParams.get('status') ?? ''
  const issueType = searchParams.get('issueType') ?? ''
  const search = searchParams.get('search')?.trim() ?? ''

  const supabase = createAdminClient()
  let query = supabase
    .from('question_reports')
    .select('*', { count: 'exact' })

  if (status && REPORT_STATUSES.has(status)) query = query.eq('status', status)
  if (issueType && ISSUE_TYPES.has(issueType)) query = query.eq('issue_type', issueType)
  if (search) query = query.or(`description.ilike.%${search}%,admin_note.ilike.%${search}%`)

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('[admin/question-reports] fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
  }

  const reports = (data ?? []) as QuestionReportRow[]
  const userIds = unique(reports.map((report) => report.user_id))
  const questionIds = unique(reports.map((report) => report.question_id))
  const examQuestionIds = unique(reports.map((report) => report.exam_question_id))
  const examSetIds = unique(reports.map((report) => report.exam_set_id))

  const [usersRes, questionsRes, examQuestionsRes, examSetsRes] = await Promise.all([
    userIds.length
      ? supabase.from('users').select('id, name, email').in('id', userIds)
      : Promise.resolve({ data: [] }),
    questionIds.length
      ? supabase.schema('standard_exam').from('questions').select('*').in('id', questionIds)
      : Promise.resolve({ data: [] }),
    examQuestionIds.length
      ? supabase.schema('standard_exam').from('exam_questions').select('id, exam_set_id, section_code, question_number, display_order, max_score').in('id', examQuestionIds)
      : Promise.resolve({ data: [] }),
    examSetIds.length
      ? supabase.schema('standard_exam').from('exam_sets').select('id, title, subject, exam_type, exam_index, status').in('id', examSetIds)
      : Promise.resolve({ data: [] }),
  ])

  const users = new Map((usersRes.data ?? []).map((user: Record<string, unknown>) => [user.id, user]))
  const questions = new Map((questionsRes.data ?? []).map((question: Record<string, unknown>) => [question.id, question]))
  const examQuestions = new Map((examQuestionsRes.data ?? []).map((question: Record<string, unknown>) => [question.id, question]))
  const examSets = new Map((examSetsRes.data ?? []).map((examSet: Record<string, unknown>) => [examSet.id, examSet]))

  return NextResponse.json({
    reports: reports.map((report) => ({
      ...report,
      user: users.get(report.user_id) ?? null,
      question: questions.get(report.question_id) ?? null,
      examQuestion: report.exam_question_id ? examQuestions.get(report.exam_question_id) ?? null : null,
      examSet: report.exam_set_id ? examSets.get(report.exam_set_id) ?? null : null,
    })),
    total: count ?? 0,
    totalPages: Math.max(1, Math.ceil((count ?? 0) / limit)),
  })
}

export async function PATCH(req: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.res

  const body = await req.json().catch(() => null)
  const id = cleanText(body?.id, 80)
  if (!id) return NextResponse.json({ error: 'Missing report id' }, { status: 400 })

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  const status = cleanText(body?.status, 40)
  const adminNote = cleanText(body?.admin_note, 2000)

  if (status) {
    if (!REPORT_STATUSES.has(status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    updates.status = status
  }
  if (body?.admin_note !== undefined) updates.admin_note = adminNote || null

  if (Object.keys(updates).length === 1) {
    return NextResponse.json({ error: 'No changes' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('question_reports')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    console.error('[admin/question-reports] update error:', error)
    return NextResponse.json({ error: 'Failed to update report' }, { status: 500 })
  }

  return NextResponse.json({ success: true, report: data })
}
