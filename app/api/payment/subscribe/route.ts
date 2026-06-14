import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'
import { getPlanCost, getPlanName, isPlanId, VIP_PLANS } from '@/lib/plans'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let planId: string
  let couponCode: string | undefined
  try {
    const body = await req.json()
    planId = body.planId
    couponCode = body.couponCode?.trim()?.toUpperCase() || undefined
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  if (!isPlanId(planId)) {
    return NextResponse.json({ error: 'Invalid planId' }, { status: 400 })
  }

  const baseCost = getPlanCost(planId)
  let cost = baseCost
  let couponId: string | null = null
  const planName = getPlanName(planId)
  const supabase = createAdminClient()
  const userId = session.user.id

  // Apply coupon if provided
  if (couponCode) {
    const { data: coupon } = await supabase
      .from('coupons')
      .select('id, discount_percent, max_uses, used_count, valid_until, is_active')
      .eq('code', couponCode)
      .single()

    if (coupon && coupon.is_active &&
      (!coupon.valid_until || new Date(coupon.valid_until) >= new Date()) &&
      coupon.used_count < coupon.max_uses) {
      const { data: alreadyUsed } = await supabase
        .from('coupon_uses')
        .select('id').eq('coupon_id', coupon.id).eq('user_id', userId).maybeSingle()
      if (!alreadyUsed) {
        cost = Math.floor(baseCost * (1 - coupon.discount_percent / 100))
        couponId = coupon.id
      }
    }
  }

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

  const vipExpiresAt = new Date(baseDate.getTime() + VIP_PLANS[planId].durationDays * 24 * 60 * 60 * 1000)

  // Call the atomic purchase_vip_plan function
  // plan_id = granular (math_monthly...) -> users.vip_plan; plan_subject = môn -> users.plan
  const { data: purchaseResult, error: purchaseError } = await supabase.rpc('purchase_vip_plan', {
    uid: userId,
    plan_id: planId,
    cost_points: cost,
    expires_at: vipExpiresAt.toISOString(),
    coupon_id: couponId || null,
    tx_description: `Đăng ký gói VIP ${planName}`,
    plan_subject: VIP_PLANS[planId].vipPlanValue,
  })

  if (purchaseError || !purchaseResult) {
    console.error('Purchase VIP RPC error:', purchaseError)
    return NextResponse.json({ error: 'Không thể xử lý giao dịch đăng ký. Vui lòng thử lại.' }, { status: 500 })
  }

  // Parse result from RPC (returns {success, reason, points_remaining})
  interface PurchaseRpcResult {
    success: boolean
    reason: string | null
    points_remaining: number | null
  }
  const resultObj = purchaseResult as unknown as PurchaseRpcResult

  if (!resultObj.success) {
    if (resultObj.reason === 'insufficient_points') {
      return NextResponse.json(
        { error: 'Không đủ điểm', needed: cost },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: resultObj.reason || 'Transaction failed' }, { status: 400 })
  }

  await supabase.from('notifications').insert({
    user_id: userId,
    title: 'Đăng ký VIP thành công!',
    content: `Tài khoản đã kích hoạt VIP Gói ${planName}. Hiệu lực đến ${vipExpiresAt.toLocaleDateString('vi-VN')}.`,
    type: 'payment',
  })

  // Set currentPoints to remaining points for response metadata
  const currentPoints = resultObj.points_remaining ?? 0

  // ── Coupon tracking ───────────────────────────────────────────────────────
  if (couponId) {
    const { data: couponRow } = await supabase
      .from('coupons').select('used_count').eq('id', couponId).single()
    await Promise.all([
      supabase.from('coupons')
        .update({ used_count: (couponRow?.used_count ?? 0) + 1 })
        .eq('id', couponId),
      supabase.from('coupon_uses').insert({ coupon_id: couponId, user_id: userId }),
    ])
  }

  // ── Affiliate commission ──────────────────────────────────────────────────
  const { data: referral } = await supabase
    .from('affiliate_referrals')
    .select('id, referrer_id, status')
    .eq('referee_id', userId)
    .maybeSingle()

  if (referral && referral.referrer_id !== userId) {
    const planVND = cost * 1000
    const commissionVND = Math.floor(planVND * 0.15)
    const commissionPoints = Math.floor(commissionVND / 1000)

    if (commissionPoints > 0) {
      const { data: refWallet } = await supabase
        .from('wallets')
        .select('points')
        .eq('user_id', referral.referrer_id)
        .single()

      const refPoints = refWallet?.points ?? 0

      // Add commission points to referrer's wallet
      await supabase
        .from('wallets')
        .update({ points: refPoints + commissionPoints })
        .eq('user_id', referral.referrer_id)

      await supabase.from('point_transactions').insert({
        user_id: referral.referrer_id,
        amount: commissionPoints,
        type: 'commission',
        description: `Hoa hồng 15% gói ${planName}`,
      })

      await supabase.from('notifications').insert({
        user_id: referral.referrer_id,
        title: 'Nhận hoa hồng giới thiệu!',
        content: `Bạn nhận được ${commissionPoints} điểm hoa hồng từ người bạn giới thiệu vừa mua gói VIP ${planName}.`,
        type: 'commission',
      })
    }

    // Milestone logic is only triggered on the FIRST purchase (when status changes from pending to commissioned)
    if (referral.status === 'pending') {
      await supabase
        .from('affiliate_referrals')
        .update({
          status: 'commissioned',
          commission_amount: commissionVND,
          commission_points: commissionPoints,
        })
        .eq('id', referral.id)

      // Milestone check
      const { count: commissionsCount } = await supabase
        .from('affiliate_referrals')
        .select('*', { count: 'exact', head: true })
        .eq('referrer_id', referral.referrer_id)
        .eq('status', 'commissioned')

      const count = commissionsCount ?? 0

      // Fetch referrer's current VIP status
      const { data: refUser } = await supabase
        .from('users')
        .select('is_vip, vip_expires_at, vip_plan')
        .eq('id', referral.referrer_id)
        .single()

      const refCurrentExpiry = refUser?.vip_expires_at
      const refBaseDate = (refCurrentExpiry && new Date(refCurrentExpiry) > new Date())
        ? new Date(refCurrentExpiry)
        : new Date()

      // Thưởng mốc theo đúng môn người được giới thiệu vừa mua (quyết định #4)
      const rewardSubject = VIP_PLANS[planId].vipPlanValue // 'math_vip' | 'english_vip' | 'combo_vip'
      const subjectPrefix = rewardSubject === 'math_vip' ? 'math' : rewardSubject === 'english_vip' ? 'english' : 'combo'
      const subjectLabel = rewardSubject === 'math_vip' ? 'Toán' : rewardSubject === 'english_vip' ? 'Anh' : 'Combo Toán + Anh'

      if (count === 5) {
        const newRefExpiry = new Date(refBaseDate.getTime() + 30 * 24 * 60 * 60 * 1000)
        await supabase
          .from('users')
          .update({ is_vip: true, vip_expires_at: newRefExpiry.toISOString(), plan: rewardSubject, vip_plan: `${subjectPrefix}_monthly` })
          .eq('id', referral.referrer_id)

        await supabase.from('notifications').insert({
          user_id: referral.referrer_id,
          title: 'Mốc giới thiệu 5 người! 🎁',
          content: `Chúc mừng! Bạn đã giới thiệu 5 người thành công. Nhận ngay 30 ngày VIP ${subjectLabel} miễn phí.`,
          type: 'milestone',
        })
      } else if (count === 12) {
        const newRefExpiry = new Date(refBaseDate.getTime() + 90 * 24 * 60 * 60 * 1000)
        await supabase
          .from('users')
          .update({ is_vip: true, vip_expires_at: newRefExpiry.toISOString(), plan: rewardSubject, vip_plan: `${subjectPrefix}_3months` })
          .eq('id', referral.referrer_id)

        await supabase.from('notifications').insert({
          user_id: referral.referrer_id,
          title: 'Mốc giới thiệu 12 người! 🎉',
          content: `Chúc mừng! Bạn đã giới thiệu 12 người thành công. Nhận ngay 90 ngày VIP ${subjectLabel} miễn phí.`,
          type: 'milestone',
        })
      } else if (count === 20) {
        await supabase
          .from('users')
          .update({ is_vip: true, vip_expires_at: '2099-12-31T23:59:59Z', plan: rewardSubject, vip_plan: `${subjectPrefix}_yearly` })
          .eq('id', referral.referrer_id)

        await supabase.from('notifications').insert({
          user_id: referral.referrer_id,
          title: 'VIP Vĩnh Viễn! 👑',
          content: `Thành tích tối cao! Bạn đã giới thiệu 20 người thành công. Kích hoạt VIP ${subjectLabel} vĩnh viễn.`,
          type: 'milestone',
        })
      }
    }
  }

  return NextResponse.json({
    success: true,
    vipExpiresAt: vipExpiresAt.toISOString(),
    pointsRemaining: currentPoints - cost,
  })
}
