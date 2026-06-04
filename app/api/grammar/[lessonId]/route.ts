import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'

// GET /api/grammar/[lessonId]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { lessonId } = await params
  const supabase = createAdminClient()
  const userId = session.user.id

  const [lessonRes, exercisesRes, progressRes] = await Promise.all([
    supabase
      .from('grammar_lessons')
      .select('*')
      .eq('id', lessonId)
      .eq('is_active', true)
      .single(),
    supabase
      .from('grammar_exercises')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('order_index', { ascending: true }),
    supabase
      .from('grammar_progress')
      .select('mastered, best_score, attempts, last_practiced')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .maybeSingle(),
  ])

  if (lessonRes.error || !lessonRes.data) {
    return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
  }

  return NextResponse.json({
    lesson: lessonRes.data,
    exercises: exercisesRes.data ?? [],
    progress: progressRes.data ?? { mastered: false, best_score: 0, attempts: 0, last_practiced: null },
  })
}

// POST /api/grammar/[lessonId] — save exercise result
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { lessonId } = await params
  const { score, total } = await req.json() as { score: number; total: number }
  const pct = total > 0 ? Math.round((score / total) * 100) : 0

  const supabase = createAdminClient()
  const userId = session.user.id

  // Get existing progress to compare best_score
  const { data: existing } = await supabase
    .from('grammar_progress')
    .select('best_score, attempts')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .maybeSingle()

  const newBest = Math.max(pct, existing?.best_score ?? 0)
  const attempts = (existing?.attempts ?? 0) + 1

  await supabase
    .from('grammar_progress')
    .upsert({
      user_id: userId,
      lesson_id: lessonId,
      mastered: newBest >= 80,
      best_score: newBest,
      attempts,
      last_practiced: new Date().toISOString(),
    }, { onConflict: 'user_id,lesson_id' })

  return NextResponse.json({ ok: true, best_score: newBest, mastered: newBest >= 80 })
}
