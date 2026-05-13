import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'

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
  const supabase   = createAdminClient()

  const buildQuery = (field: 'subtopic' | 'topic', value: string) => {
    let q = supabase
      .from('questions')
      .select(FIELDS)
      .eq('is_published', true)
      .ilike(field, `%${value}%`)
      .eq('difficulty', difficulty)
      .or('needs_visual.eq.false,visual_image_url.not.is.null')
      .neq('answer_source', 'AI_generated')
      .limit(20)
    if (excludeIds.length > 0) {
      q = q.not('id', 'in', `(${excludeIds.join(',')})`)
    }
    return q
  }

  if (subtopic) {
    const { data } = await buildQuery('subtopic', subtopic)
    if (data && data.length > 0) return NextResponse.json({ question: pick(data) })
  }

  if (topic) {
    const { data } = await buildQuery('topic', topic)
    if (data && data.length > 0) return NextResponse.json({ question: pick(data) })
  }

  return NextResponse.json({ done: true, message: 'Hết câu cùng dạng' })
}
