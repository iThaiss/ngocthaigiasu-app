import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'
import { isQuestionStudentReady } from '@/lib/question-readiness'

const QUESTION_FIELDS = 'id, question_text, difficulty, topic, subtopic, question_type, correct_answer, option_a, option_b, option_c, option_d, statements, numeric_answer, explanation, needs_visual, visual_image_url, image_url'
const DIFFICULTIES = ['Nhận biết', 'Thông hiểu', 'Vận dụng', 'Vận dụng cao']

function parseLimit(value: string | null): number {
  const limit = Number(value ?? 10)
  if (!Number.isFinite(limit)) return 10
  return Math.min(30, Math.max(5, Math.floor(limit)))
}

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5)
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
      .select('topic, subtopic, difficulty, needs_visual, visual_image_url, image_url')
      .eq('is_published', true)
      .or('needs_visual.is.null,needs_visual.eq.false,visual_image_url.not.is.null,image_url.not.is.null')
      .neq('answer_source', 'AI_generated')
      .limit(1000)

    if (error) return NextResponse.json({ error: 'Failed to load practice filters' }, { status: 500 })

    const readyData = (data ?? []).filter((question) => isQuestionStudentReady({ ...question, correct_answer: 'metadata-only' }))
    const topics = Array.from(new Set(readyData.map((q) => q.topic).filter(Boolean))).sort()
    const subtopics = Array.from(new Set(readyData.map((q) => q.subtopic).filter(Boolean))).sort()
    const subtopicsByTopic = readyData.reduce<Record<string, string[]>>((acc, question) => {
      if (!question.topic || !question.subtopic) return acc
      acc[question.topic] = acc[question.topic] ?? []
      if (!acc[question.topic].includes(question.subtopic)) acc[question.topic].push(question.subtopic)
      return acc
    }, {})

    for (const topic of Object.keys(subtopicsByTopic)) {
      subtopicsByTopic[topic].sort()
    }
    const difficulties = DIFFICULTIES.filter((d) => readyData.some((q) => q.difficulty === d))

    return NextResponse.json({
      topics,
      subtopics,
      subtopicsByTopic,
      difficulties: difficulties.length ? difficulties : DIFFICULTIES,
    })
  }

  if (mode !== 'session') return NextResponse.json({ error: 'Invalid mode' }, { status: 400 })

  const topic = searchParams.get('topic')?.trim() ?? ''
  const subtopic = searchParams.get('subtopic')?.trim() ?? ''
  const difficulty = searchParams.get('difficulty')?.trim() ?? ''
  const limit = parseLimit(searchParams.get('limit'))

  let query = supabase
    .from('questions')
    .select(QUESTION_FIELDS)
    .eq('is_published', true)
    .or('needs_visual.is.null,needs_visual.eq.false,visual_image_url.not.is.null,image_url.not.is.null')
    .neq('answer_source', 'AI_generated')
    .limit(Math.max(limit * 6, 60))

  if (topic) query = query.ilike('topic', `%${topic}%`)
  if (subtopic) query = query.ilike('subtopic', `%${subtopic}%`)
  if (difficulty) query = query.eq('difficulty', difficulty)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: 'Failed to load questions' }, { status: 500 })

  const readyQuestions = (data ?? []).filter((question) => isQuestionStudentReady(question))

  return NextResponse.json({
    questions: shuffle(readyQuestions).slice(0, limit),
    requested: limit,
    available: readyQuestions.length,
  })
}
