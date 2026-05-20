import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'

type StandardQuestionRow = Record<string, unknown>
type StandardExamQuestionRow = Record<string, unknown> & { questions?: StandardQuestionRow | null }

function normalizeQuestion(row: StandardExamQuestionRow) {
  const q = row.questions ?? {}
  const raw = q.raw_text && typeof q.raw_text === 'object' ? q.raw_text as Record<string, unknown> : {}
  const statements = Array.isArray(q.statements) ? q.statements : Array.isArray(raw.statements) ? raw.statements : null

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
      .order('created_at', { ascending: false })

    if (setsError) {
      console.error('[exam] metadata sets error:', setsError)
      return NextResponse.json({ error: 'Failed to load standard exams' }, { status: 500 })
    }

    const defaultExamId = examSets?.[0]?.id ?? null
    const { data: sections } = defaultExamId
      ? await db
        .from('exam_sections')
        .select('id, exam_set_id, section_code, title, question_type, section_order, expected_count, extracted_count, max_score, scoring_rule')
        .eq('exam_set_id', defaultExamId)
        .order('section_order', { ascending: true })
      : { data: [] }

    return NextResponse.json({
      examSets: examSets ?? [],
      defaultExamId,
      sections: sections ?? [],
    })
  }

  if (mode !== 'session') return NextResponse.json({ error: 'Invalid mode' }, { status: 400 })

  const examSetId = searchParams.get('examSetId')?.trim()
  const sectionCode = searchParams.get('sectionCode')?.trim()

  let selectedExamSetId = examSetId
  if (!selectedExamSetId) {
    const { data: firstReady } = await db
      .from('exam_sets')
      .select('id')
      .eq('status', 'ready')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
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

  if (setError || sectionsError || !examSet) {
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

  return NextResponse.json({
    examSet,
    sections: sections ?? [],
    questions: (data ?? []).map((row) => normalizeQuestion(row as unknown as StandardExamQuestionRow)),
  })
}
