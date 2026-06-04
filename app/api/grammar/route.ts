import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'

// GET /api/grammar
// Returns grammar lessons list with user's progress
export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createAdminClient()
  const userId = session.user.id

  const { data: lessons, error } = await supabase
    .from('grammar_lessons')
    .select('id, topic_group, topic_group_en, topic_group_icon, title, title_vi, level, exercise_count, order_index')
    .eq('is_active', true)
    .order('order_index', { ascending: true })
    .limit(200)

  if (error) return NextResponse.json({ error: 'Failed to load grammar lessons' }, { status: 500 })

  // Get user progress
  const lessonIds = (lessons ?? []).map((l) => l.id)
  let progress: Record<string, { mastered: boolean; best_score: number; attempts: number }> = {}

  if (lessonIds.length > 0) {
    const { data: prog } = await supabase
      .from('grammar_progress')
      .select('lesson_id, mastered, best_score, attempts')
      .eq('user_id', userId)
      .in('lesson_id', lessonIds)

    for (const p of prog ?? []) {
      progress[p.lesson_id] = { mastered: p.mastered, best_score: p.best_score, attempts: p.attempts }
    }
  }

  const result = (lessons ?? []).map((l) => ({
    ...l,
    progress: progress[l.id] ?? { mastered: false, best_score: 0, attempts: 0 },
  }))

  return NextResponse.json({ lessons: result })
}
