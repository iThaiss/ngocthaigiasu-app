import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { cardId, fsrsCard } = body as {
    cardId?: string
    fsrsCard?: {
      due: string
      stability: number
      difficulty: number
      elapsed_days: number
      scheduled_days: number
      reps: number
      lapses: number
      state: string
      last_review: string
    }
  }

  if (!cardId || !fsrsCard) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { error } = await supabase.from('math_fsrs_progress').upsert(
    {
      user_id: session.user.id,
      card_type: 'formula',
      item_id: cardId,
      due: fsrsCard.due,
      stability: fsrsCard.stability,
      difficulty_fsrs: fsrsCard.difficulty,
      elapsed_days: fsrsCard.elapsed_days,
      scheduled_days: fsrsCard.scheduled_days,
      reps: fsrsCard.reps,
      lapses: fsrsCard.lapses,
      state: fsrsCard.state,
      last_review: fsrsCard.last_review,
    },
    { onConflict: 'user_id,card_type,item_id' }
  )

  if (error) {
    console.error('[math flashcards] save progress failed:', error)
    return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
