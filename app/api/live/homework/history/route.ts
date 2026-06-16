import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'

// GET /api/live/homework/history?sessionId=  → các lần nộp của chính học sinh
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sessionId = req.nextUrl.searchParams.get('sessionId')
  if (!sessionId) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('homework_submissions')
    .select('id, score, max_score, correct_count, total_count, time_spent_seconds, created_at')
    .eq('live_session_id', sessionId)
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'Lỗi tải lịch sử' }, { status: 500 })
  return NextResponse.json({ submissions: data ?? [] })
}
