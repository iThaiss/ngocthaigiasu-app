import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('X-SePay-Signature') ?? ''
  const timestamp = req.headers.get('X-SePay-Timestamp') ?? ''

  const now = Math.floor(Date.now() / 1000)
  if (Math.abs(now - parseInt(timestamp)) > 300) {
    return NextResponse.json({ error: 'Request expired' }, { status: 401 })
  }

  const expected = 'sha256=' + crypto
    .createHmac('sha256', process.env.SEPAY_WEBHOOK_SECRET!)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex')

  if (signature !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const transferContent = (body.transferContent ?? body.content ?? '') as string
  const transferAmount = body.transferAmount as number

  const match = transferContent.match(/NT\d{6}/)
  if (!match) {
    return NextResponse.json({ success: true })
  }
  const referenceCode = match[0]

  const supabase = createAdminClient()

  const { data: tx } = await supabase
    .from('transactions')
    .select('id, user_id, metadata, amount')
    .eq('metadata->>referenceCode', referenceCode)
    .eq('status', 'pending')
    .single()

  if (!tx || tx.amount !== transferAmount) {
    return NextResponse.json({ success: true })
  }

  const planId: string = tx.metadata?.planId ?? 'monthly'
  const days = planId === 'yearly' ? 365 : 30
  const vipExpiresAt = new Date()
  vipExpiresAt.setDate(vipExpiresAt.getDate() + days)

  await Promise.all([
    supabase
      .from('transactions')
      .update({ status: 'completed' })
      .eq('id', tx.id),
    supabase
      .from('users')
      .update({ is_vip: true, vip_expires_at: vipExpiresAt.toISOString() })
      .eq('id', tx.user_id),
    supabase.from('notifications').insert({
      user_id: tx.user_id,
      title: 'Nâng cấp VIP thành công',
      content: `Tài khoản đã được nâng cấp VIP Gói ${planId === 'yearly' ? 'Năm' : 'Tháng'}.`,
      type: 'payment',
    }),
  ])

  return NextResponse.json({ success: true })
}
