import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { createAdminClient } from '@/lib/supabase'

// GET /api/admin/live/homework-results?sessionId=  → mọi lần nộp của học sinh
export async function GET(req: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.res

  const sessionId = req.nextUrl.searchParams.get('sessionId')
  if (!sessionId) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })

  const supabase = createAdminClient()
  const { data: subs, error } = await supabase
    .from('homework_submissions')
    .select('id, user_id, score, max_score, correct_count, total_count, time_spent_seconds, created_at')
    .eq('live_session_id', sessionId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'Lỗi tải kết quả' }, { status: 500 })

  // Lấy tên học sinh
  const userIds = [...new Set((subs ?? []).map((s) => s.user_id).filter(Boolean))]
  const nameMap = new Map<string, { name: string | null; email: string | null }>()
  if (userIds.length > 0) {
    const { data: users } = await supabase
      .from('users')
      .select('id, name, email')
      .in('id', userIds)
    for (const u of users ?? []) nameMap.set(u.id, { name: u.name, email: u.email })
  }

  const results = (subs ?? []).map((s) => ({
    ...s,
    student_name: nameMap.get(s.user_id)?.name ?? null,
    student_email: nameMap.get(s.user_id)?.email ?? null,
  }))

  return NextResponse.json({ results })
}
