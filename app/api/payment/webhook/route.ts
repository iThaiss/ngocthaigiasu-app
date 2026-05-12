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
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  console.log('[webhook] received:', JSON.stringify(body))

  const content = (body.content ?? body.code ?? '') as string
  const transferAmount = body.transferAmount as number

  const match = content.match(/NT\d{6}/)
  if (!match) {
    console.log('[webhook] No referenceCode in content, skipping')
    return NextResponse.json({ success: true })
  }
  const referenceCode = match[0]
  console.log('[webhook] referenceCode:', referenceCode)

  const supabase = createAdminClient()

  const { data: tx } = await supabase
    .from('transactions')
    .select('id, user_id, metadata, amount')
    .eq('metadata->>referenceCode', referenceCode)
    .eq('status', 'pending')
    .single()

  if (!tx) {
    console.log('[webhook] transaction not found for', referenceCode)
    return NextResponse.json({ success: true })
  }

  if (tx.amount !== transferAmount) {
    console.log('[webhook] amount mismatch: expected', tx.amount, 'got', transferAmount)
    return NextResponse.json({ success: true })
  }

  const pointsToAdd: number = tx.metadata?.pointsToAdd ?? Math.floor(tx.amount / 1000)

  // Credit points to user wallet (atomic — avoids race condition)
  const { error: walletErr } = await supabase.rpc('increment_points', { uid: tx.user_id, delta: pointsToAdd })
  console.log('[webhook] wallet update:', walletErr ? walletErr.message : `+${pointsToAdd} pts`)

  // Record point transaction
  await supabase.from('point_transactions').insert({
    user_id: tx.user_id,
    amount: pointsToAdd,
    type: 'topup',
    description: `Nạp tiền ${tx.amount.toLocaleString('vi-VN')}đ`,
    reference_id: tx.id,
  })

  // Mark transaction completed
  await supabase.from('transactions').update({ status: 'completed' }).eq('id', tx.id)

  // Notify user
  const notifTitle = 'Nạp điểm thành công 🎉'
  const notifContent = `+${pointsToAdd} điểm đã được cộng vào tài khoản của bạn`

  await supabase.from('notifications').insert({
    user_id: tx.user_id,
    title: notifTitle,
    content: notifContent,
    type: 'payment',
  })

  console.log('[webhook] topup complete: user', tx.user_id, '+', pointsToAdd, 'points')

  // Affiliate commission — only on first topup (pending referral)
  const { data: referral } = await supabase
    .from('affiliate_referrals')
    .select('id, referrer_id')
    .eq('referee_id', tx.user_id)
    .eq('status', 'pending')
    .single()

  if (referral && referral.referrer_id !== tx.user_id) {
    await supabase.rpc('increment_points', { uid: referral.referrer_id, delta: 10 })

    await supabase.from('point_transactions').insert({
      user_id: referral.referrer_id,
      amount: 10,
      type: 'commission',
      description: 'Hoa hồng giới thiệu bạn bè nạp tiền',
      reference_id: referral.id,
    })

    await supabase
      .from('affiliate_referrals')
      .update({ status: 'commissioned' })
      .eq('id', referral.id)

    await supabase.from('notifications').insert({
      user_id: referral.referrer_id,
      title: 'Nhận được 10 điểm hoa hồng!',
      content: 'Bạn nhận được 10 điểm hoa hồng từ người bạn giới thiệu vừa nạp tiền.',
      type: 'commission',
    })

    console.log('[webhook] affiliate commission: +10 pts for', referral.referrer_id)
  }

  return NextResponse.json({ success: true })
}
