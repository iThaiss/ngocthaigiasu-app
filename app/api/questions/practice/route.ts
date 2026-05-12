import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'

const DIFFICULTY_ORDER = ['Nhận biết', 'Thông hiểu', 'Vận dụng', 'Vận dụng cao']
const FIELDS = 'id, question_text, difficulty, topic, subtopic, question_type, correct_answer, option_a, option_b, option_c, option_d, statements, numeric_answer, explanation'

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const subtopic   = searchParams.get('subtopic') ?? ''
  const topic      = searchParams.get('topic') ?? ''
  const excludeStr = searchParams.get('exclude') ?? ''
  const difficulty = searchParams.get('difficulty') ?? 'Nhận biết'

  const excludeIds = excludeStr.split(',').filter(Boolean)
  const diffIdx    = Math.max(0, DIFFICULTY_ORDER.indexOf(difficulty))
  const supabase   = createAdminClient()

  const buildQuery = (field: 'subtopic' | 'topic', value: string, diff: string) => {
    let q = supabase
      .from('questions')
      .select(FIELDS)
      .eq('is_published', true)
      .ilike(field, `%${value}%`)
      .eq('difficulty', diff)
      .neq('answer_source', 'AI_generated')
      .limit(20)
    if (excludeIds.length > 0) {
      q = q.not('id', 'in', `(${excludeIds.join(',')})`)
    }
    return q
  }

  // Try subtopic/topic at current difficulty and escalate upward
  for (let i = diffIdx; i < DIFFICULTY_ORDER.length; i++) {
    const d = DIFFICULTY_ORDER[i]

    if (subtopic) {
      const { data } = await buildQuery('subtopic', subtopic, d)
      if (data && data.length > 0) return NextResponse.json({ question: pick(data) })
    }

    if (topic) {
      const { data } = await buildQuery('topic', topic, d)
      if (data && data.length > 0) return NextResponse.json({ question: pick(data) })
    }
  }

  // All difficulties exhausted — reset exclude list and restart from beginning
  const resetQuery = () => {
    let q = supabase
      .from('questions')
      .select(FIELDS)
      .eq('is_published', true)
      .neq('answer_source', 'AI_generated')
      .limit(20)
    if (subtopic) q = q.ilike('subtopic', `%${subtopic}%`)
    else if (topic) q = q.ilike('topic', `%${topic}%`)
    return q
  }

  const { data: fallback } = await resetQuery()
  if (fallback && fallback.length > 0) {
    return NextResponse.json({ question: pick(fallback), reset: true })
  }

  return NextResponse.json({ error: 'Không còn câu hỏi phù hợp' }, { status: 404 })
}
