import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'

// GET /api/reading?level=B1&topic=Environment
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createAdminClient()
  const userId = session.user.id
  const { searchParams } = req.nextUrl
  const level = searchParams.get('level')   // B1 | B2 | C1
  const topic = searchParams.get('topic')   // partial match

  let query = supabase
    .from('reading_passages')
    .select('id, title, title_vi, topic, topic_vi, level, word_count, question_count, order_index')
    .eq('is_active', true)
    .order('order_index', { ascending: true })
    .limit(200)

  if (level) query = query.eq('level', level)
  if (topic) query = query.ilike('topic', `%${topic}%`)

  const { data: passages, error } = await query
  if (error) return NextResponse.json({ error: 'Failed to load passages' }, { status: 500 })

  // Get progress for user
  const passageIds = (passages ?? []).map((p) => p.id)
  let progress: Record<string, { completed: boolean; score: number; total: number }> = {}

  if (passageIds.length > 0) {
    const { data: prog } = await supabase
      .from('reading_progress')
      .select('passage_id, completed, score, total')
      .eq('user_id', userId)
      .in('passage_id', passageIds)

    for (const p of prog ?? []) {
      progress[p.passage_id] = { completed: p.completed, score: p.score, total: p.total }
    }
  }

  const result = (passages ?? []).map((p) => ({
    ...p,
    progress: progress[p.id] ?? { completed: false, score: 0, total: 0 },
  }))

  return NextResponse.json({ passages: result })
}
