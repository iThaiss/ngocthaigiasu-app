import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { lessonId } = await params
  const supabase = createAdminClient()
  const userId = session.user.id

  const { data: cards, error: cardsError } = await supabase
    .from('math_flashcards')
    .select('id, lesson_id, card_kind, front, back, hint, explanation, order_index')
    .eq('lesson_id', lessonId)
    .eq('is_active', true)
    .order('order_index', { ascending: true })

  if (cardsError) {
    console.error('[math flashcards] load cards failed:', cardsError)
    return NextResponse.json({ error: 'Failed to load flashcards' }, { status: 500 })
  }

  const cardIds = (cards ?? []).map((card) => card.id)
  let progress: unknown[] = []

  if (cardIds.length > 0) {
    const { data: progressData, error: progressError } = await supabase
      .from('math_fsrs_progress')
      .select('item_id, due, stability, difficulty_fsrs, elapsed_days, scheduled_days, reps, lapses, state, last_review')
      .eq('user_id', userId)
      .eq('card_type', 'formula')
      .in('item_id', cardIds)

    if (progressError) {
      console.error('[math flashcards] load progress failed:', progressError)
      return NextResponse.json({ error: 'Failed to load flashcard progress' }, { status: 500 })
    }

    progress = progressData ?? []
  }

  return NextResponse.json({ cards: cards ?? [], progress })
}
