import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'

function getLimit(isVip: boolean, vipExpiresAt: string | null): number {
  if (!isVip) return 3
  const expiresAt = vipExpiresAt ? new Date(vipExpiresAt) : null
  const daysLeft = expiresAt ? (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24) : 0
  return daysLeft > 200 ? 50 : 20
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id
  const today = new Date().toISOString().slice(0, 10)
  const limit = getLimit(session.user.isVip, session.user.vipExpiresAt)
  const supabase = createAdminClient()

  const { data: dailyRow } = await supabase
    .from('daily_solve_count')
    .select('count')
    .eq('user_id', userId)
    .eq('date', today)
    .single()

  let used = dailyRow?.count ?? 0

  // Reset if user upgraded to VIP today
  if (session.user.isVip && used > 0) {
    const { data: vipTx } = await supabase
      .from('transactions')
      .select('created_at')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('created_at', today)
      .limit(1)
      .single()
    if (vipTx) {
      await supabase.from('daily_solve_count').upsert(
        { user_id: userId, date: today, count: 0 },
        { onConflict: 'user_id,date' }
      )
      used = 0
    }
  }

  return NextResponse.json({
    used,
    limit,
    remaining: Math.max(0, limit - used),
  })
}
