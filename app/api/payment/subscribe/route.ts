import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'

const PLAN_COSTS = { monthly: 69, yearly: 699 } as const

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
  const supabase = createAdminClient()

  const { data: wallet } = await supabase
    .from('wallets')
    .select('points')
    .eq('user_id', session.user.id)
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
    .eq('user_id', session.user.id)

  if (deductErr) {
    return NextResponse.json({ error: 'Failed to deduct points' }, { status: 500 })
  }

  await supabase.from('point_transactions').insert({
    user_id: session.user.id,
    amount: -cost,
    type: 'subscribe',
    description: `Đăng ký gói VIP ${planId === 'yearly' ? 'Full Khóa Học' : 'Tháng'}`,
  })

  const now = new Date()
  const vipExpiresAt = new Date(now)
  if (planId === 'yearly') {
    vipExpiresAt.setFullYear(vipExpiresAt.getFullYear() + 1)
  } else {
    vipExpiresAt.setMonth(vipExpiresAt.getMonth() + 1)
  }

  const { error: vipErr } = await supabase
    .from('users')
    .update({ is_vip: true, vip_expires_at: vipExpiresAt.toISOString() })
    .eq('id', session.user.id)

  if (vipErr) {
    // Rollback points
    await supabase
      .from('wallets')
      .update({ points: currentPoints })
      .eq('user_id', session.user.id)
    return NextResponse.json({ error: 'Failed to activate VIP' }, { status: 500 })
  }

  await supabase.from('notifications').insert({
    user_id: session.user.id,
    title: 'Đăng ký VIP thành công!',
    content: `Tài khoản đã kích hoạt VIP Gói ${planId === 'yearly' ? 'Full Khóa Học' : 'Tháng'}. Hiệu lực đến ${vipExpiresAt.toLocaleDateString('vi-VN')}.`,
    type: 'payment',
  })

  return NextResponse.json({
    success: true,
    vipExpiresAt: vipExpiresAt.toISOString(),
    pointsRemaining: currentPoints - cost,
  })
}
