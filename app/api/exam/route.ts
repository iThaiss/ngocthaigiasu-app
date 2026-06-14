import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'
import { isQuestionStudentReady } from '@/lib/question-readiness'
import { getPlanLimits } from '@/lib/plans'

type StandardQuestionRow = Record<string, unknown>
type StandardExamQuestionRow = Record<string, unknown> & { questions?: StandardQuestionRow | null }

function isReadyExamSet(examSet: Record<string, unknown> | null | undefined) {
  const audit = examSet?.audit_json
  const auditStatus = audit && typeof audit === 'object' && !Array.isArray(audit)
    ? (audit as Record<string, unknown>).status
    : null
  return examSet?.status === 'ready' && (!auditStatus || auditStatus === 'ready')
}

function normalizeQuestion(row: StandardExamQuestionRow) {
  const q = row.questions ?? {}
  const raw = q.raw_text && typeof q.raw_text === 'object' ? q.raw_text as Record<string, unknown> : {}
  const statements = Array.isArray(q.statements) ? q.statements : Array.isArray(raw.statements) ? raw.statements : null
  const solutionSteps = Array.isArray(raw.solution_steps) ? raw.solution_steps : null

  return {
    id: q.id,
    exam_question_id: row.id,
    exam_set_id: row.exam_set_id,
    section_id: row.section_id,
    section_code: row.section_code,
    question_number: row.question_number,
    display_order: row.display_order,
    page_number: row.page_number,
    source_hint: row.source_hint,
    max_score: Number(row.max_score ?? 0),
    scoring_rule_snapshot: row.scoring_rule_snapshot ?? null,
    question_text: q.question_text,
    question_type: q.question_type,
    topic: q.canonical_topic_title ?? q.topic ?? raw.topic ?? null,
    subtopic: q.canonical_subtopic_title ?? q.subtopic ?? raw.subtopic ?? null,
    chapter: q.chapter ?? raw.chapter ?? null,
    difficulty: q.difficulty ?? raw.difficulty ?? null,
    option_a: q.option_a,
    option_b: q.option_b,
    option_c: q.option_c,
    option_d: q.option_d,
    correct_answer: q.correct_answer,
    statements,
    numeric_answer: q.numeric_answer,
    explanation: q.explanation,
    solution_steps: solutionSteps,
    solution_style_version: typeof raw.solution_style_version === 'string' ? raw.solution_style_version : null,
    needs_visual: q.needs_visual,
    image_url: q.image_url,
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const mode = searchParams.get('mode') ?? 'metadata'
  const db = createAdminClient().schema('standard_exam')

  if (mode === 'metadata') {
    const { data: examSets, error: setsError } = await db
      .from('exam_sets')
      .select('id, title, subject, exam_type, exam_index, expected_question_count, expected_item_count, extracted_question_count, max_score, status, audit_json, created_at')
      .eq('status', 'ready')
      .order('title', { ascending: true })

    if (setsError) {
      console.error('[exam] metadata sets error:', setsError)
      return NextResponse.json({ error: 'Failed to load standard exams' }, { status: 500 })
    }

    const readyExamSets = (examSets ?? []).filter((examSet) => isReadyExamSet(examSet as Record<string, unknown>))
    const defaultExamId = readyExamSets?.[0]?.id ?? null
    const { data: sections } = defaultExamId
      ? await db
        .from('exam_sections')
        .select('id, exam_set_id, section_code, title, question_type, section_order, expected_count, extracted_count, max_score, scoring_rule')
        .eq('exam_set_id', defaultExamId)
        .order('section_order', { ascending: true })
      : { data: [] }

    return NextResponse.json({
      examSets: readyExamSets,
      defaultExamId,
      sections: sections ?? [],
    })
  }

  if (mode !== 'session') return NextResponse.json({ error: 'Invalid mode' }, { status: 400 })

  // Thi thử đề chuẩn: chỉ dành cho gói có quyền (Toán VIP / Combo). Free & Anh VIP bị chặn.
  if (!getPlanLimits(session.user.plan).examUnlimited) {
    return NextResponse.json(
      { error: 'Tính năng Thi thử dành cho gói Toán VIP hoặc Combo. Vui lòng nâng cấp để luyện đề chuẩn.' },
      { status: 403 }
    )
  }

  const examSetId = searchParams.get('examSetId')?.trim()
  const sectionCode = searchParams.get('sectionCode')?.trim()

  let selectedExamSetId = examSetId
  if (!selectedExamSetId) {
    const { data: firstReadySets } = await db
      .from('exam_sets')
      .select('id, status, audit_json')
      .eq('status', 'ready')
      .order('created_at', { ascending: false })
      .limit(10)
    const firstReady = firstReadySets?.find((examSet) => isReadyExamSet(examSet as Record<string, unknown>))
    selectedExamSetId = firstReady?.id
  }

  if (!selectedExamSetId) return NextResponse.json({ error: 'Không có đề chuẩn sẵn sàng.' }, { status: 404 })

  const [{ data: examSet, error: setError }, { data: sections, error: sectionsError }] = await Promise.all([
    db
      .from('exam_sets')
      .select('id, title, subject, exam_type, exam_index, expected_question_count, expected_item_count, extracted_question_count, max_score, status, audit_json, created_at')
      .eq('id', selectedExamSetId)
      .single(),
    db
      .from('exam_sections')
      .select('id, exam_set_id, section_code, title, question_type, section_order, expected_count, extracted_count, max_score, scoring_rule')
      .eq('exam_set_id', selectedExamSetId)
      .order('section_order', { ascending: true }),
  ])

  if (setError || sectionsError || !examSet || !isReadyExamSet(examSet as Record<string, unknown>)) {
    console.error('[exam] set/sections error:', setError ?? sectionsError)
    return NextResponse.json({ error: 'Không tải được đề chuẩn.' }, { status: 500 })
  }

  let query = db
    .from('exam_questions')
    .select('id, exam_set_id, section_id, question_id, section_code, question_number, display_order, page_number, source_hint, max_score, scoring_rule_snapshot, questions(*)')
    .eq('exam_set_id', selectedExamSetId)
    .order('display_order', { ascending: true })

  if (sectionCode) query = query.eq('section_code', sectionCode)

  const { data, error } = await query
  if (error) {
    console.error('[exam] questions error:', error)
    return NextResponse.json({ error: 'Không tải được câu hỏi đề chuẩn.' }, { status: 500 })
  }

  const readyQuestions = (data ?? [])
    .filter((row) => isQuestionStudentReady((row as unknown as StandardExamQuestionRow).questions))
    .map((row) => normalizeQuestion(row as unknown as StandardExamQuestionRow))

  if (!readyQuestions.length) {
    return NextResponse.json({ error: 'Đề này chưa có câu hỏi đủ hình và đáp án để luyện.' }, { status: 404 })
  }

  return NextResponse.json({
    examSet,
    sections: sections ?? [],
    questions: readyQuestions,
  })
}
