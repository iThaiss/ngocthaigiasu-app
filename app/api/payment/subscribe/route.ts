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

  // ── Affiliate commission — chỉ lần mua đầu tiên ─────────────────────────
  // commission_pending_referral RPC: atomic — update status + increment wallet + log tx
  // Chỉ xử lý nếu referral.status = 'pending'; trả về success=false nếu đã commissioned
  const commissionVND = Math.floor(cost * 1000 * 0.15)
  const commissionPoints = Math.floor(commissionVND / 1000)

  if (commissionPoints > 0) {
    interface CommissionResult {
      success: boolean
      referral_id: string | null
      referrer_id: string | null
      points_added: number
      commissioned_count: number
    }

    const { data: commResult } = await supabase.rpc('commission_pending_referral', {
      referee: userId,
      commission_points: commissionPoints,
      commission_amount: commissionVND,
      tx_description: `Hoa hồng 15% gói ${planName}`,
    }) as { data: CommissionResult | null }

    if (commResult?.success && commResult.referrer_id) {
      const referrerId = commResult.referrer_id
      const commissionedCount = Number(commResult.commissioned_count)

      await supabase.from('notifications').insert({
        user_id: referrerId,
        title: 'Nhận hoa hồng giới thiệu!',
        content: `Bạn nhận được ${commissionPoints} điểm hoa hồng từ người bạn giới thiệu vừa mua gói VIP ${planName}.`,
        type: 'commission',
      })

      // Milestone VIP bonus
      const rewardSubject = VIP_PLANS[planId].vipPlanValue
      const subjectPrefix = rewardSubject === 'math_vip' ? 'math' : rewardSubject === 'english_vip' ? 'english' : 'combo'
      const subjectLabel = rewardSubject === 'math_vip' ? 'Toán' : rewardSubject === 'english_vip' ? 'Anh' : 'Combo Toán + Anh'

      const { data: refUser } = await supabase.from('users').select('vip_expires_at').eq('id', referrerId).single()
      const refBaseDate = (refUser?.vip_expires_at && new Date(refUser.vip_expires_at) > new Date())
        ? new Date(refUser.vip_expires_at)
        : new Date()

      if (commissionedCount === 5) {
        const newExpiry = new Date(refBaseDate.getTime() + 30 * 24 * 60 * 60 * 1000)
        await supabase.from('users')
          .update({ is_vip: true, vip_expires_at: newExpiry.toISOString(), plan: rewardSubject, vip_plan: `${subjectPrefix}_monthly` })
          .eq('id', referrerId)
        await supabase.from('notifications').insert({
          user_id: referrerId,
          title: 'Mốc giới thiệu 5 người! 🎁',
          content: `Chúc mừng! Bạn đã giới thiệu 5 người thành công. Nhận ngay 30 ngày VIP ${subjectLabel} miễn phí.`,
          type: 'milestone',
        })
      } else if (commissionedCount === 12) {
        const newExpiry = new Date(refBaseDate.getTime() + 90 * 24 * 60 * 60 * 1000)
        await supabase.from('users')
          .update({ is_vip: true, vip_expires_at: newExpiry.toISOString(), plan: rewardSubject, vip_plan: `${subjectPrefix}_3months` })
          .eq('id', referrerId)
        await supabase.from('notifications').insert({
          user_id: referrerId,
          title: 'Mốc giới thiệu 12 người! 🎉',
          content: `Chúc mừng! Bạn đã giới thiệu 12 người thành công. Nhận ngay 90 ngày VIP ${subjectLabel} miễn phí.`,
          type: 'milestone',
        })
      } else if (commissionedCount === 20) {
        await supabase.from('users')
          .update({ is_vip: true, vip_expires_at: '2099-12-31T23:59:59Z', plan: rewardSubject, vip_plan: `${subjectPrefix}_yearly` })
          .eq('id', referrerId)
        await supabase.from('notifications').insert({
          user_id: referrerId,
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
    pointsRemaining: currentPoints,
  })
}
