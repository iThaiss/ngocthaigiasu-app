import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('X-SePay-Signature') ?? ''
  const timestamp = req.headers.get('X-SePay-Timestamp') ?? ''

  const now = Math.floor(Date.now() / 1000)
  if (Math.abs(now - parseInt(timestamp)) > 300) {
    console.log('[webhook] Request expired, timestamp:', timestamp)
    return NextResponse.json({ error: 'Request expired' }, { status: 401 })
  }

  const expected = 'sha256=' + crypto
    .createHmac('sha256', process.env.SEPAY_WEBHOOK_SECRET!)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex')

  if (signature !== expected) {
    console.log('[webhook] Signature mismatch')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = JSON.parse(rawBody)
  } catch {
    console.log('[webhook] Invalid JSON body')
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  console.log('[webhook] Body received:', JSON.stringify(body))

  // SePay gửi nội dung CK trong field "content" hoặc "code"
  const content = (body.content ?? body.code ?? '') as string
  const transferAmount = body.transferAmount as number

  console.log('[webhook] content:', content, '| amount:', transferAmount)

  const match = content.match(/NT\d{6}/)
  if (!match) {
    console.log('[webhook] No referenceCode found in content, skipping')
    return NextResponse.json({ success: true })
  }
  const referenceCode = match[0]
  console.log('[webhook] referenceCode:', referenceCode)

  const supabase = createAdminClient()

  const { data: tx, error: txError } = await supabase
    .from('transactions')
    .select('id, user_id, metadata, amount')
    .eq('metadata->>referenceCode', referenceCode)
    .eq('status', 'pending')
    .single()

  console.log('[webhook] transaction lookup:', tx ? `found id=${tx.id}` : 'not found', txError?.message ?? '')

  if (!tx) {
    return NextResponse.json({ success: true })
  }

  if (tx.amount !== transferAmount) {
    console.log('[webhook] Amount mismatch: expected', tx.amount, 'got', transferAmount)
    return NextResponse.json({ success: true })
  }

  const planId: string = tx.metadata?.planId ?? 'monthly'
  const days = planId === 'yearly' ? 365 : 30
  const vipExpiresAt = new Date()
  vipExpiresAt.setDate(vipExpiresAt.getDate() + days)
  console.log('[webhook] planId:', planId, '| vip_expires_at:', vipExpiresAt.toISOString())

  // Update transaction
  const { error: txUpdateError } = await supabase
    .from('transactions')
    .update({ status: 'completed' })
    .eq('id', tx.id)
  console.log('[webhook] transaction update:', txUpdateError ? txUpdateError.message : 'ok')

  // Update user VIP — chạy riêng để dễ debug
  const { error: userUpdateError } = await supabase
    .from('users')
    .update({ is_vip: true, vip_expires_at: vipExpiresAt.toISOString() })
    .eq('id', tx.user_id)
  console.log('[webhook] user update:', userUpdateError ? userUpdateError.message : 'ok', '| user_id:', tx.user_id)

  // Insert notification
  const { error: notifError } = await supabase.from('notifications').insert({
    user_id: tx.user_id,
    title: 'Nâng cấp VIP thành công',
    content: `Tài khoản đã được nâng cấp VIP Gói ${planId === 'yearly' ? 'Năm' : 'Tháng'}.`,
    type: 'payment',
  })
  console.log('[webhook] notification insert:', notifError ? notifError.message : 'ok')

  // Affiliate commission: tìm referral pending cho user này
  const { data: referral } = await supabase
    .from('affiliate_referrals')
    .select('id, referrer_id')
    .eq('referee_id', tx.user_id)
    .eq('status', 'pending')
    .single()

  if (referral) {
    console.log('[webhook] affiliate referral found:', referral.id, 'referrer:', referral.referrer_id)

    // Cộng 10 điểm vào wallet của referrer
    const { error: walletErr } = await supabase.rpc('increment_wallet_points', {
      p_user_id: referral.referrer_id,
      p_points: 10,
    }).single()

    if (walletErr) {
      // Fallback: update trực tiếp nếu RPC chưa tồn tại
      await supabase
        .from('wallets')
        .update({ points: supabase.rpc('wallets.points + 10' as never) })
        .eq('user_id', referral.referrer_id)
      console.log('[webhook] wallet rpc unavailable, skip points update')
    } else {
      console.log('[webhook] wallet points +10 for referrer:', referral.referrer_id)
    }

    // Insert point_transactions cho referrer
    const { error: ptErr } = await supabase.from('point_transactions').insert({
      user_id: referral.referrer_id,
      amount: 10,
      type: 'commission',
      description: 'Hoa hồng giới thiệu bạn bè nâng cấp VIP',
      reference_id: referral.id,
    })
    console.log('[webhook] point_transaction insert:', ptErr ? ptErr.message : 'ok')

    // Update affiliate_referrals status
    const { error: refUpdateErr } = await supabase
      .from('affiliate_referrals')
      .update({ status: 'commissioned' })
      .eq('id', referral.id)
    console.log('[webhook] referral status update:', refUpdateErr ? refUpdateErr.message : 'ok')

    // Notification cho referrer
    const { error: refNotifErr } = await supabase.from('notifications').insert({
      user_id: referral.referrer_id,
      title: 'Nhận được hoa hồng!',
      content: 'Bạn nhận được 10 điểm hoa hồng từ người bạn giới thiệu vừa nâng cấp VIP.',
      type: 'commission',
    })
    console.log('[webhook] referrer notification insert:', refNotifErr ? refNotifErr.message : 'ok')
  }

  return NextResponse.json({ success: true })
}
