import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'

const PLAN_COSTS = { monthly: 69, yearly: 699 } as const
const PLAN_NAMES = { monthly: 'Tháng', yearly: 'Năm Học' } as const

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let planId: string
  try {
    const body = await req.json()
    planId = body.planId
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  if (planId !== 'monthly' && planId !== 'yearly') {
    return NextResponse.json({ error: 'Invalid planId' }, { status: 400 })
  }

  const cost = PLAN_COSTS[planId as keyof typeof PLAN_COSTS]
  const planName = PLAN_NAMES[planId as keyof typeof PLAN_NAMES]
  const supabase = createAdminClient()
  const userId = session.user.id

  const { data: wallet } = await supabase
    .from('wallets')
    .select('points')
    .eq('user_id', userId)
    .single()

  const currentPoints = wallet?.points ?? 0

  if (currentPoints < cost) {
    return NextResponse.json(
      { error: 'Không đủ điểm', needed: cost, current: currentPoints },
      { status: 400 }
    )
  }

  const { error: deductErr } = await supabase
    .from('wallets')
    .update({ points: currentPoints - cost })
    .eq('user_id', userId)

  if (deductErr) {
    return NextResponse.json({ error: 'Failed to deduct points' }, { status: 500 })
  }

  await supabase.from('point_transactions').insert({
    user_id: userId,
    amount: -cost,
    type: 'subscribe',
    description: `Đăng ký gói VIP ${planName}`,
  })

  // Calculate VIP expiry with accumulation
  const { data: userData } = await supabase
    .from('users')
    .select('vip_expires_at')
    .eq('id', userId)
    .single()

  const currentExpiry = userData?.vip_expires_at
  const baseDate = (currentExpiry && new Date(currentExpiry) > new Date())
    ? new Date(currentExpiry)
    : new Date()

  const vipExpiresAt = new Date(baseDate)
  if (planId === 'yearly') {
    vipExpiresAt.setFullYear(vipExpiresAt.getFullYear() + 1)
  } else {
    vipExpiresAt.setMonth(vipExpiresAt.getMonth() + 1)
  }

  const { error: vipErr } = await supabase
    .from('users')
    .update({ is_vip: true, vip_expires_at: vipExpiresAt.toISOString() })
    .eq('id', userId)

  if (vipErr) {
    await supabase.from('wallets').update({ points: currentPoints }).eq('user_id', userId)
    return NextResponse.json({ error: 'Failed to activate VIP' }, { status: 500 })
  }

  await supabase.from('notifications').insert({
    user_id: userId,
    title: 'Đăng ký VIP thành công!',
    content: `Tài khoản đã kích hoạt VIP Gói ${planName}. Hiệu lực đến ${vipExpiresAt.toLocaleDateString('vi-VN')}.`,
    type: 'payment',
  })

  // ── Affiliate commission ──────────────────────────────────────────────────
  const { data: referral } = await supabase
    .from('affiliate_referrals')
    .select('id, referrer_id')
    .eq('referee_id', userId)
    .eq('status', 'pending')
    .maybeSingle()

  if (referral && referral.referrer_id !== userId) {
    const planVND = cost * 1000
    const commissionVND = Math.floor(planVND * 0.15)
    const commissionPoints = Math.floor(commissionVND / 1000)

    const { data: refWallet } = await supabase
      .from('wallets')
      .select('points')
      .eq('user_id', referral.referrer_id)
      .single()

    const refPoints = refWallet?.points ?? 0

    await supabase
      .from('wallets')
      .update({ points: refPoints + commissionPoints })
      .eq('user_id', referral.referrer_id)

    await supabase.from('point_transactions').insert({
      user_id: referral.referrer_id,
      amount: commissionPoints,
      type: 'commission',
      description: 'Hoa hồng giới thiệu 15%',
    })

    await supabase
      .from('affiliate_referrals')
      .update({
        status: 'commissioned',
        commission_amount: commissionVND,
        commission_points: commissionPoints,
      })
      .eq('id', referral.id)

    await supabase.from('notifications').insert({
      user_id: referral.referrer_id,
      title: 'Nhận hoa hồng giới thiệu!',
      content: `Bạn nhận được ${commissionPoints} điểm hoa hồng từ người bạn giới thiệu vừa nâng cấp VIP ${planName}.`,
      type: 'commission',
    })

    // ── Milestone check ───────────────────────────────────────────────────
    const { count: commissionsCount } = await supabase
      .from('affiliate_referrals')
      .select('*', { count: 'exact', head: true })
      .eq('referrer_id', referral.referrer_id)
      .eq('status', 'commissioned')

    const count = commissionsCount ?? 0

    if (count === 5) {
      const bonus = 69
      await supabase
        .from('wallets')
        .update({ points: refPoints + commissionPoints + bonus })
        .eq('user_id', referral.referrer_id)
      await supabase.from('point_transactions').insert({
        user_id: referral.referrer_id,
        amount: bonus,
        type: 'milestone',
        description: 'Thưởng milestone 5 người: +1 tháng VIP',
      })
      await supabase.from('notifications').insert({
        user_id: referral.referrer_id,
        title: 'Thành tích đặc biệt!',
        content: 'Bạn đã giới thiệu 5 người thành công! Nhận thêm 69 điểm (1 tháng VIP miễn phí).',
        type: 'milestone',
      })
    } else if (count === 12) {
      const bonus = 207
      await supabase
        .from('wallets')
        .update({ points: refPoints + commissionPoints + bonus })
        .eq('user_id', referral.referrer_id)
      await supabase.from('point_transactions').insert({
        user_id: referral.referrer_id,
        amount: bonus,
        type: 'milestone',
        description: 'Thưởng milestone 12 người: +3 tháng VIP',
      })
      await supabase.from('notifications').insert({
        user_id: referral.referrer_id,
        title: 'Thành tích siêu đặc biệt!',
        content: 'Bạn đã giới thiệu 12 người thành công! Nhận thêm 207 điểm (3 tháng VIP miễn phí).',
        type: 'milestone',
      })
    } else if (count === 20) {
      await supabase
        .from('users')
        .update({ is_vip: true, vip_expires_at: '2099-12-31T23:59:59Z' })
        .eq('id', referral.referrer_id)
      await supabase.from('notifications').insert({
        user_id: referral.referrer_id,
        title: 'VIP vĩnh viễn!',
        content: 'Chúc mừng! Bạn đã giới thiệu 20 người thành công và nhận được VIP vĩnh viễn.',
        type: 'milestone',
      })
    }
  }

  return NextResponse.json({
    success: true,
    vipExpiresAt: vipExpiresAt.toISOString(),
    pointsRemaining: currentPoints - cost,
  })
}
