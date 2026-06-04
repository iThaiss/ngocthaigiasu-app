import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id
  const now = new Date().toISOString()
  const supabase = createAdminClient()

  const [vocabAllRes, vocabDueRes, grammarRes, readingRes, totalPassagesRes] = await Promise.all([
    supabase
      .from('vocab_progress')
      .select('state, set_id')
      .eq('user_id', userId),
    supabase
      .from('vocab_progress')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .lte('due', now),
    supabase
      .from('grammar_progress')
      .select('mastered, attempts')
      .eq('user_id', userId),
    supabase
      .from('reading_progress')
      .select('completed, score, total')
      .eq('user_id', userId),
    supabase
      .from('reading_passages')
      .select('id', { count: 'exact', head: true }),
  ])

  const vocabRows = vocabAllRes.data ?? []
  const grammarRows = grammarRes.data ?? []
  const readingRows = readingRes.data ?? []

  const vocabMastered = vocabRows.filter((r) => r.state === 'review' || r.state === 'relearning').length
  const setsStarted = new Set(vocabRows.map((r) => r.set_id)).size

  const grammarMastered = grammarRows.filter((r) => r.mastered).length
  const grammarAttempted = grammarRows.filter((r) => r.attempts > 0).length

  const readingCompleted = readingRows.filter((r) => r.completed).length
  const readingScores = readingRows.filter((r) => r.completed && r.total > 0).map((r) => (r.score / r.total) * 100)
  const readingAvgScore = readingScores.length
    ? Math.round(readingScores.reduce((a, b) => a + b, 0) / readingScores.length)
    : 0

  return NextResponse.json({
    vocab: {
      mastered: vocabMastered,
      dueToday: vocabDueRes.count ?? 0,
      setsStarted,
    },
    grammar: {
      mastered: grammarMastered,
      attempted: grammarAttempted,
      total: 50,
    },
    reading: {
      completed: readingCompleted,
      total: totalPassagesRes.count ?? 0,
      avgScore: readingAvgScore,
    },
  })
}
