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

  // Credit points and mark transaction as completed atomically using RPC
  const { data: topupResult, error: topupError } = await supabase.rpc('complete_pending_topup', {
    txid: tx.id,
    transfer_amount: transferAmount
  })

  if (topupError || !topupResult || !topupResult[0]?.success) {
    console.error('[webhook] complete_pending_topup RPC error:', topupError || topupResult)
    return NextResponse.json({ error: 'Topup transaction processing failed' }, { status: 500 })
  }

  const resultData = topupResult[0] as { success: boolean; transaction_id: string; user_id: string; amount: number; points_added: number }
  const pointsAdded = resultData.points_added

  // Notify user
  const notifTitle = 'Nạp điểm thành công 🎉'
  const notifContent = `+${pointsAdded} điểm đã được cộng vào tài khoản của bạn`

  await supabase.from('notifications').insert({
    user_id: tx.user_id,
    title: notifTitle,
    content: notifContent,
    type: 'payment',
  })

  console.log('[webhook] topup complete: user', tx.user_id, '+', pointsAdded, 'points')

  return NextResponse.json({ success: true })
}

