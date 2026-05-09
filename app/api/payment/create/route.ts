import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'

const MIN_AMOUNT = 10000

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let amount: number
  try {
    const body = await req.json()
    amount = Math.floor(Number(body.amount))
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  if (!amount || amount < MIN_AMOUNT) {
    return NextResponse.json(
      { error: `Số tiền tối thiểu ${MIN_AMOUNT.toLocaleString('vi-VN')}đ` },
      { status: 400 }
    )
  }

  const pointsToAdd = Math.floor(amount / 1000)
  const referenceCode = 'NT' + Math.floor(100000 + Math.random() * 900000)
  const bankAccount = process.env.NEXT_PUBLIC_BANK_ACCOUNT!
  const accountName = process.env.NEXT_PUBLIC_ACCOUNT_NAME!

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      user_id: session.user.id,
      amount,
      type: 'topup',
      status: 'pending',
      metadata: { referenceCode, pointsToAdd },
    })
    .select('id')
    .single()

  if (error || !data) {
    console.error('Insert transaction error:', error)
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 })
  }

  const encodedAccountName = encodeURIComponent(accountName)
  const qrUrl = `https://img.vietqr.io/image/TPB-${bankAccount}-compact2.png?amount=${amount}&addInfo=${referenceCode}&accountName=${encodedAccountName}`

  return NextResponse.json({
    txId: data.id,
    referenceCode,
    amount,
    pointsToAdd,
    qrUrl,
    bankAccount,
    accountName,
    bankName: 'TPBank',
  })
}
