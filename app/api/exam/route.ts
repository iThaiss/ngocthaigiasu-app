import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'

const QUESTION_FIELDS = [
  'id',
  'question_text',
  'question_type',
  'difficulty',
  'topic',
  'subtopic',
  'grade',
  'part',
  'source',
  'correct_answer',
  'option_a',
  'option_b',
  'option_c',
  'option_d',
  'statements',
  'statement_a',
  'statement_b',
  'statement_c',
  'statement_d',
  'answer_a',
  'answer_b',
  'answer_c',
  'answer_d',
  'numeric_answer',
  'explanation',
  'created_at',
].join(', ')

function parseLimit(value: string | null) {
  const limit = Number(value ?? 50)
  if (!Number.isFinite(limit)) return 50
  return Math.min(60, Math.max(1, Math.floor(limit)))
}

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5)
}

function normalizeQuestion(row: Record<string, unknown>) {
  const statements = (() => {
    if (Array.isArray(row.statements)) return row.statements
    if (typeof row.statements === 'string') {
      try { return JSON.parse(row.statements) } catch { return null }
    }

    const parts = ['a', 'b', 'c', 'd'].map((label) => {
      const text = row[`statement_${label}`]
      const answer = row[`answer_${label}`]
      if (!text) return null
      return { label, text, answer: Boolean(answer) }
    }).filter(Boolean)

    return parts.length ? parts : null
  })()

  return {
    id: row.id,
    question_text: row.question_text,
    question_type: row.question_type ?? 'multiple_choice',
    difficulty: row.difficulty,
    topic: row.topic,
    subtopic: row.subtopic,
    grade: row.grade,
    part: row.part,
    source: row.source,
    correct_answer: row.correct_answer,
    option_a: row.option_a,
    option_b: row.option_b,
    option_c: row.option_c,
    option_d: row.option_d,
    statements,
    numeric_answer: row.numeric_answer,
    explanation: row.explanation,
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const mode = searchParams.get('mode') ?? 'metadata'
  const supabase = createAdminClient()

  if (mode === 'metadata') {
    const { data, error } = await supabase
      .from('questions')
      .select('source, grade, part, topic, subtopic, question_type')
      .eq('is_published', true)
      .or('needs_visual.eq.false,visual_image_url.not.is.null')
      .neq('answer_source', 'AI_generated')
      .limit(3000)

    if (error) return NextResponse.json({ error: 'Failed to load exam metadata' }, { status: 500 })

    const rows = data ?? []
    const sources = Array.from(new Set(rows.map((q) => q.source).filter(Boolean) as string[])).sort((a, b) => {
      const aScore = /minh|chuẩn|standard/i.test(a) ? 0 : 1
      const bScore = /minh|chuẩn|standard/i.test(b) ? 0 : 1
      return aScore - bScore || a.localeCompare(b, 'vi')
    })

    return NextResponse.json({
      sources,
      grades: Array.from(new Set(rows.map((q) => q.grade).filter(Boolean))).sort(),
      parts: Array.from(new Set(rows.map((q) => q.part).filter(Boolean) as string[])).sort(),
      topics: Array.from(new Set(rows.map((q) => q.topic).filter(Boolean) as string[])).sort(),
      subtopics: Array.from(new Set(rows.map((q) => q.subtopic).filter(Boolean) as string[])).sort(),
      total: rows.length,
      recommendedSource: sources[0] ?? '',
    })
  }

  if (mode !== 'session') return NextResponse.json({ error: 'Invalid mode' }, { status: 400 })

  const source = searchParams.get('source')?.trim() ?? ''
  const grade = searchParams.get('grade')?.trim() ?? ''
  const part = searchParams.get('part')?.trim() ?? ''
  const topic = searchParams.get('topic')?.trim() ?? ''
  const subtopic = searchParams.get('subtopic')?.trim() ?? ''
  const limit = parseLimit(searchParams.get('limit'))

  let query = supabase
    .from('questions')
    .select(QUESTION_FIELDS)
    .eq('is_published', true)
    .or('needs_visual.eq.false,visual_image_url.not.is.null')
    .neq('answer_source', 'AI_generated')
    .limit(500)

  if (source) query = query.eq('source', source)
  if (grade) query = query.eq('grade', Number(grade))
  if (part) query = query.eq('part', part)
  if (topic) query = query.ilike('topic', `%${topic}%`)
  if (subtopic) query = query.ilike('subtopic', `%${subtopic}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: 'Failed to load exam questions' }, { status: 500 })

  const normalized = (data ?? []).map((row) => normalizeQuestion(row as unknown as Record<string, unknown>))
  const sorted = normalized.sort((a, b) => {
    const partA = String(a.part ?? '')
    const partB = String(b.part ?? '')
    if (partA !== partB) return partA.localeCompare(partB, 'vi')
    return String(a.topic ?? '').localeCompare(String(b.topic ?? ''), 'vi')
  })

  const questions = source || part ? sorted.slice(0, limit) : shuffle(sorted).slice(0, limit)

  return NextResponse.json({
    questions,
    requested: limit,
    available: normalized.length,
    source,
  })
}
