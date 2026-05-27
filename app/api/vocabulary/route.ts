import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'

// GET /api/vocabulary
// Returns vocab sets list with user's progress summary
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createAdminClient()
  const userId = session.user.id

  const { searchParams } = req.nextUrl
  const filter = searchParams.get('filter') ?? 'all' // all | system | ai | community | mine

  // Build base query
  let query = supabase
    .from('vocab_sets')
    .select('id, name, description, topic, subtopic_code, word_count, question_count, is_public, is_ai_generated, is_system, featured, likes, order_index, created_by, created_at')
    .eq('is_active', true)
    .order('order_index', { ascending: true })
    .order('created_at', { ascending: false })

  if (filter === 'system') {
    query = query.eq('is_system', true)
  } else if (filter === 'mine') {
    query = query.eq('created_by', userId)
  } else if (filter === 'community') {
    query = query.eq('is_public', true).eq('is_system', false)
  } else {
    // all: system sets + public sets + user's own sets
    query = query.or(`is_system.eq.true,is_public.eq.true,created_by.eq.${userId}`)
  }

  const { data: sets, error } = await query.limit(100)
  if (error) return NextResponse.json({ error: 'Failed to load vocab sets' }, { status: 500 })

  // Get user's progress summary per set (word counts by state)
  const setIds = (sets ?? []).map((s) => s.id)
  let progressSummary: Record<string, { total: number; mastered: number; due_today: number }> = {}

  if (setIds.length > 0) {
    const now = new Date().toISOString()
    const { data: progress } = await supabase
      .from('vocab_progress')
      .select('set_id, state, due')
      .eq('user_id', userId)
      .in('set_id', setIds)

    for (const p of progress ?? []) {
      if (!progressSummary[p.set_id]) {
        progressSummary[p.set_id] = { total: 0, mastered: 0, due_today: 0 }
      }
      progressSummary[p.set_id].total++
      if (p.state === 'Review' || p.state === 'Relearning') {
        progressSummary[p.set_id].mastered++
      }
      if (p.due && p.due <= now) {
        progressSummary[p.set_id].due_today++
      }
    }
  }

  const result = (sets ?? []).map((s) => ({
    ...s,
    progress: progressSummary[s.id] ?? { total: 0, mastered: 0, due_today: 0 },
  }))

  return NextResponse.json({ sets: result })
}
