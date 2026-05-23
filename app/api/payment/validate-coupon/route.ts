import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'
import { getPlanCost, isPlanId } from '@/lib/plans'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  if (!body?.code || !body?.planId) {
    return NextResponse.json({ error: 'code and planId required' }, { status: 400 })
  }

  if (!isPlanId(body.planId)) return NextResponse.json({ error: 'Invalid planId' }, { status: 400 })
  const baseCost = getPlanCost(body.planId)

  const supabase = createAdminClient()
  const code = body.code.trim().toUpperCase()

  const { data: coupon } = await supabase
    .from('coupons')
    .select('id, discount_percent, max_uses, used_count, valid_until, is_active')
    .eq('code', code)
    .single()

  if (!coupon) return NextResponse.json({ valid: false, error: 'Mã không tồn tại' })
  if (!coupon.is_active) return NextResponse.json({ valid: false, error: 'Mã đã bị vô hiệu hóa' })
  if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
    return NextResponse.json({ valid: false, error: 'Mã đã hết hạn' })
  }
  if (coupon.used_count >= coupon.max_uses) {
    return NextResponse.json({ valid: false, error: 'Mã đã hết lượt sử dụng' })
  }

  const { data: alreadyUsed } = await supabase
    .from('coupon_uses')
    .select('id')
    .eq('coupon_id', coupon.id)
    .eq('user_id', session.user.id)
    .maybeSingle()

  if (alreadyUsed) return NextResponse.json({ valid: false, error: 'Bạn đã sử dụng mã này rồi' })

  const finalPoints = Math.floor(baseCost * (1 - coupon.discount_percent / 100))
  return NextResponse.json({
    valid: true,
    discountPercent: coupon.discount_percent,
    finalPoints,
    couponId: coupon.id,
  })
}
