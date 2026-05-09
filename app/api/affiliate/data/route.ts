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
  const userId = session.user.id

  const [userRes, walletRes, commissionRes, referralsRes] = await Promise.all([
    supabase.from('users').select('referral_code').eq('id', userId).single(),
    supabase.from('wallets').select('points').eq('user_id', userId).single(),
    supabase
      .from('point_transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('type', 'commission'),
    supabase
      .from('affiliate_referrals')
      .select('id, status, commission_points, commission_amount, created_at, referee:referee_id(email)')
      .eq('referrer_id', userId)
      .order('created_at', { ascending: false }),
  ])

  const referralCode = userRes.data?.referral_code ?? null
  const points = walletRes.data?.points ?? 0
  const totalCommissionPoints = (commissionRes.data ?? []).reduce((sum, t) => sum + (t.amount ?? 0), 0)
  const commissionedCount = (referralsRes.data ?? []).filter(r => r.status === 'commissioned').length

  const referrals = (referralsRes.data ?? []).map((r) => {
    const referee = Array.isArray(r.referee) ? r.referee[0] : r.referee
    const email: string = (referee as { email?: string })?.email ?? ''
    return {
      id: r.id,
      status: r.status,
      commissionPoints: r.commission_points ?? 0,
      createdAt: r.created_at,
      refereeEmail: maskEmail(email),
    }
  })

  return NextResponse.json({
    referralCode,
    points,
    totalCommissionPoints,
    commissionedCount,
    referrals,
  })
}

function maskEmail(email: string): string {
  if (!email) return '***@***'
  const [local, domain] = email.split('@')
  if (!local || !domain) return email
  return local.slice(0, 3) + '***@' + domain
}
