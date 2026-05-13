import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'

const FIELDS = 'id, question_text, difficulty, topic, subtopic, question_type, correct_answer, option_a, option_b, option_c, option_d, statements, numeric_answer, explanation'
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

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

  const excludeIds = excludeStr.split(',').map((id) => id.trim()).filter((id) => UUID_RE.test(id))
  const supabase   = createAdminClient()

  const buildQuery = (field: 'subtopic' | 'topic', value: string) => {
    const normalizedValue = value.trim()
    if (!normalizedValue) return null

    let q = supabase
      .from('questions')
      .select(FIELDS)
      .eq('is_published', true)
      .ilike(field, `%${normalizedValue}%`)
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
    const query = buildQuery('subtopic', subtopic)
    const { data } = query ? await query : { data: null }
    if (data && data.length > 0) return NextResponse.json({ question: pick(data) })
  }

  if (topic) {
    const query = buildQuery('topic', topic)
    const { data } = query ? await query : { data: null }
    if (data && data.length > 0) return NextResponse.json({ question: pick(data) })
  }

  return NextResponse.json({ done: true, message: 'Hết câu cùng dạng' })
}
