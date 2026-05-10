import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { createAdminClient } from '@/lib/supabase'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.res

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const points = parseInt(body.points)
  const reason = body.reason?.trim() ?? ''

  if (!points || points <= 0) {
    return NextResponse.json({ error: 'Số điểm phải lớn hơn 0' }, { status: 400 })
  }
  if (!reason) {
    return NextResponse.json({ error: 'Lý do không được để trống' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const studentId = params.id

  const { data: wallet } = await supabase
    .from('wallets')
    .select('points')
    .eq('user_id', studentId)
    .single()

  if (!wallet) return NextResponse.json({ error: 'Wallet not found' }, { status: 404 })

  const newPoints = (wallet.points ?? 0) + points

  const [{ error: walletErr }, { error: txErr }, { error: notifErr }] = await Promise.all([
    supabase.from('wallets').update({ points: newPoints }).eq('user_id', studentId),
    supabase.from('point_transactions').insert({
      user_id: studentId,
      amount: points,
      type: 'gift',
      description: reason,
    }),
    supabase.from('notifications').insert({
      user_id: studentId,
      title: 'Bạn vừa nhận được điểm thưởng!',
      content: `Admin đã tặng bạn ${points} điểm. Lý do: ${reason}`,
      type: 'system',
    }),
  ])

  if (walletErr || txErr) return NextResponse.json({ error: 'Failed to gift points' }, { status: 500 })
  if (notifErr) console.error('Notification insert failed:', notifErr)

  return NextResponse.json({ success: true, newPoints })
}
