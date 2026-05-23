import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { createAdminClient } from '@/lib/supabase'

const ALLOWED_STATUSES = new Set(['ready', 'draft', 'reviewing', 'disabled', 'archived'])

function cleanText(value: unknown, max = 300) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function cleanNumber(value: unknown) {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN
  return Number.isFinite(parsed) ? parsed : null
}

function unique(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter(Boolean) as string[]))
}

export async function GET(req: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.res

  const { searchParams } = req.nextUrl
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = Math.min(50, Math.max(10, parseInt(searchParams.get('limit') ?? '20')))
  const offset = (page - 1) * limit
  const status = searchParams.get('status') ?? ''
  const examType = searchParams.get('examType') ?? ''
  const search = searchParams.get('search')?.trim() ?? ''
  const selectedId = searchParams.get('id')?.trim()

  const supabase = createAdminClient()
  const db = supabase.schema('standard_exam')

  let query = db
    .from('exam_sets')
    .select('id, title, subject, exam_type, source_file, exam_index, expected_question_count, expected_item_count, extracted_question_count, max_score, status, audit_json, created_at', { count: 'exact' })

  if (selectedId) query = query.eq('id', selectedId)
  if (status) query = query.eq('status', status)
  if (examType) query = query.eq('exam_type', examType)
  if (search) query = query.or(`title.ilike.%${search}%,exam_type.ilike.%${search}%,source_file.ilike.%${search}%`)

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('[admin/standard-exams] fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch standard exams' }, { status: 500 })
  }

  const examSets = data ?? []
  const examSetIds = unique(examSets.map((examSet) => examSet.id as string))

  const [sectionsRes, reportCountsRes, savedCountsRes, typeRes, statusRes] = await Promise.all([
    examSetIds.length
      ? db.from('exam_sections').select('id, exam_set_id, section_code, title, question_type, section_order, expected_count, extracted_count, max_score, scoring_rule').in('exam_set_id', examSetIds).order('section_order')
      : Promise.resolve({ data: [] }),
    examSetIds.length
      ? supabase.from('question_reports').select('exam_set_id, status').in('exam_set_id', examSetIds)
      : Promise.resolve({ data: [] }),
    examSetIds.length
      ? supabase.from('saved_questions').select('question_id')
      : Promise.resolve({ data: [] }),
    db.from('exam_sets').select('exam_type').not('exam_type', 'is', null),
    db.from('exam_sets').select('status').not('status', 'is', null),
  ])

  const sectionsBySet = new Map<string, Record<string, unknown>[]>()
  for (const section of sectionsRes.data ?? []) {
    const key = String((section as Record<string, unknown>).exam_set_id)
    sectionsBySet.set(key, [...(sectionsBySet.get(key) ?? []), section as Record<string, unknown>])
  }

  const reportCounts = new Map<string, { total: number; open: number }>()
  for (const report of reportCountsRes.data ?? []) {
    const key = String((report as Record<string, unknown>).exam_set_id ?? '')
    if (!key) continue
    const current = reportCounts.get(key) ?? { total: 0, open: 0 }
    current.total += 1
    if ((report as Record<string, unknown>).status === 'open') current.open += 1
    reportCounts.set(key, current)
  }

  let selectedDetails: Record<string, unknown> | null = null
  const detailId = selectedId ?? examSets[0]?.id
  if (detailId) {
    const { data: questions, error: questionsError } = await db
      .from('exam_questions')
      .select('id, exam_set_id, section_code, question_number, display_order, page_number, max_score, question_id, questions(id, question_type, question_text, correct_answer, numeric_answer, explanation, topic, subtopic, canonical_topic_title, canonical_subtopic_title, difficulty, needs_visual, image_url)')
      .eq('exam_set_id', detailId)
      .order('display_order', { ascending: true })
      .limit(80)

    if (!questionsError) selectedDetails = { questions: questions ?? [] }
  }

  const typeCounts: Record<string, number> = {}
  for (const row of typeRes.data ?? []) {
    const key = String((row as Record<string, unknown>).exam_type ?? 'unknown')
    typeCounts[key] = (typeCounts[key] ?? 0) + 1
  }

  const statusCounts: Record<string, number> = {}
  for (const row of statusRes.data ?? []) {
    const key = String((row as Record<string, unknown>).status ?? 'unknown')
    statusCounts[key] = (statusCounts[key] ?? 0) + 1
  }

  return NextResponse.json({
    examSets: examSets.map((examSet) => ({
      ...examSet,
      sections: sectionsBySet.get(String(examSet.id)) ?? [],
      reportCounts: reportCounts.get(String(examSet.id)) ?? { total: 0, open: 0 },
    })),
    total: count ?? 0,
    totalPages: Math.max(1, Math.ceil((count ?? 0) / limit)),
    filters: {
      examTypes: Object.entries(typeCounts).map(([value, count]) => ({ value, count })).sort((a, b) => a.value.localeCompare(b.value)),
      statuses: Object.entries(statusCounts).map(([value, count]) => ({ value, count })).sort((a, b) => a.value.localeCompare(b.value)),
    },
    selectedDetails,
    savedQuestionCount: savedCountsRes.data?.length ?? 0,
  })
}

export async function PATCH(req: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.res

  const body = await req.json().catch(() => null)
  const id = cleanText(body?.id, 80)
  if (!id) return NextResponse.json({ error: 'Missing exam set id' }, { status: 400 })

  const updates: Record<string, unknown> = {}
  const title = cleanText(body?.title, 300)
  const examType = cleanText(body?.exam_type, 120)
  const subject = cleanText(body?.subject, 80)
  const status = cleanText(body?.status, 40)
  const examIndex = cleanNumber(body?.exam_index)
  const maxScore = cleanNumber(body?.max_score)

  if (body?.title !== undefined) {
    if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    updates.title = title
  }
  if (body?.exam_type !== undefined) updates.exam_type = examType || null
  if (body?.subject !== undefined) updates.subject = subject || null
  if (body?.status !== undefined) {
    if (!ALLOWED_STATUSES.has(status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    updates.status = status
  }
  if (body?.exam_index !== undefined) updates.exam_index = examIndex
  if (body?.max_score !== undefined) updates.max_score = maxScore

  if (!Object.keys(updates).length) return NextResponse.json({ error: 'No changes' }, { status: 400 })

  const { data, error } = await createAdminClient()
    .schema('standard_exam')
    .from('exam_sets')
    .update(updates)
    .eq('id', id)
    .select('id, title, subject, exam_type, exam_index, max_score, status, audit_json, created_at')
    .single()

  if (error) {
    console.error('[admin/standard-exams] update error:', error)
    return NextResponse.json({ error: 'Failed to update standard exam' }, { status: 500 })
  }

  return NextResponse.json({ success: true, examSet: data })
}
