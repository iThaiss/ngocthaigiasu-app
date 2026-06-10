import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const [{ data: wallet }, { data: user }] = await Promise.all([
    supabase
      .from('wallets')
      .select('points, balance')
      .eq('user_id', session.user.id)
      .single(),
    supabase
      .from('users')
      .select('last_free_vip_claimed_at')
      .eq('id', session.user.id)
      .single()
  ])

  return NextResponse.json({
    points: wallet?.points ?? 0,
    balance: wallet?.balance ?? 0,
    lastFreeVipClaimedAt: user?.last_free_vip_claimed_at ?? null,
  })
}
