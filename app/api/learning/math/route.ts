import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'

// GET /api/learning/math?chapterId=xxx
// Returns math lessons with progress for the current user
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const chapterId = searchParams.get('chapterId')

  const supabase = createAdminClient()
  const userId = session.user.id

  let query = supabase
    .from('math_lessons')
    .select('id, chapter_id, title, title_vi, topic, level, exercise_count, order_index, is_active')
    .eq('is_active', true)

  if (chapterId) {
    query = query.eq('chapter_id', chapterId)
  }

  const { data: lessons, error } = await query
    .order('order_index', { ascending: true })
    .limit(200)

  if (error) return NextResponse.json({ error: 'Failed to load math lessons' }, { status: 500 })

  // Get user progress
  const lessonIds = (lessons ?? []).map((l) => l.id)
  let progress: Record<string, { mastered: boolean; best_score: number; attempts: number }> = {}

  if (lessonIds.length > 0) {
    const { data: prog } = await supabase
      .from('math_progress')
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
