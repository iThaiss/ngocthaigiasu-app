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

  return NextResponse.json({ success: true })
}
