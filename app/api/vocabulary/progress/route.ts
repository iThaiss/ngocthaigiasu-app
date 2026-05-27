import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'

// GET /api/vocabulary/progress?setId=xxx&mode=due
// Returns words due for review today
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createAdminClient()
  const userId = session.user.id
  const { searchParams } = req.nextUrl
  const setId = searchParams.get('setId')
  const mode = searchParams.get('mode') ?? 'all' // all | due | stats

  if (!setId) return NextResponse.json({ error: 'setId required' }, { status: 400 })

  if (mode === 'due') {
    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from('vocab_progress')
      .select('word, state, due, stability, difficulty_fsrs, reps, lapses, elapsed_days, scheduled_days, last_review')
      .eq('user_id', userId)
      .eq('set_id', setId)
      .lte('due', now)
      .order('due', { ascending: true })
      .limit(50)

    if (error) return NextResponse.json({ error: 'Failed to load due words' }, { status: 500 })
    return NextResponse.json({ words_due: data ?? [] })
  }

  if (mode === 'stats') {
    const { data, error } = await supabase
      .from('vocab_progress')
      .select('state, due')
      .eq('user_id', userId)
      .eq('set_id', setId)

    if (error) return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 })

    const now = new Date().toISOString()
    const stats = {
      new: 0,
      learning: 0,
      review: 0,
      relearning: 0,
      mastered: 0,
      due_today: 0,
    }
    for (const p of data ?? []) {
      const state = (p.state ?? 'New').toLowerCase()
      if (state === 'new') stats.new++
      else if (state === 'learning') stats.learning++
      else if (state === 'review') { stats.review++; stats.mastered++ }
      else if (state === 'relearning') stats.relearning++
      if (p.due && p.due <= now) stats.due_today++
    }
    return NextResponse.json({ stats })
  }

  // mode === 'all'
  const { data, error } = await supabase
    .from('vocab_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('set_id', setId)

  if (error) return NextResponse.json({ error: 'Failed to load progress' }, { status: 500 })
  return NextResponse.json({ progress: data ?? [] })
}

// POST /api/vocabulary/progress — upsert FSRS card state after review
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createAdminClient()
  const userId = session.user.id
  const body = await req.json()

  const { setId, word, fsrsCard } = body as {
    setId: string
    word: string
    fsrsCard: {
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

  if (!setId || !word || !fsrsCard) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { error } = await supabase.from('vocab_progress').upsert(
    {
      user_id: userId,
      set_id: setId,
      word: word.toLowerCase(),
      due: fsrsCard.due,
      stability: fsrsCard.stability,
      difficulty_fsrs: fsrsCard.difficulty,
      elapsed_days: fsrsCard.elapsed_days,
      scheduled_days: fsrsCard.scheduled_days,
      reps: fsrsCard.reps,
      lapses: fsrsCard.lapses,
      state: fsrsCard.state,
      last_review: fsrsCard.last_review,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,set_id,word' }
  )

  if (error) return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 })
  return NextResponse.json({ success: true })
}

// POST /api/vocabulary/progress?action=like — toggle like on set
// POST /api/vocabulary/progress?action=save — toggle save on set
// (separate from word-level FSRS progress)
