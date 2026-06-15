import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'
import { VIP_PLANS } from '@/lib/plans'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const code = typeof body?.code === 'string' ? body.code.trim().toUpperCase() : ''
  if (!code) {
    return NextResponse.json({ error: 'Thiếu mã quà tặng' }, { status: 400 })
  }

  const userId = session.user.id
  const supabase = createAdminClient()

  const { data, error } = await supabase.rpc('redeem_gift_code', {
    uid: userId,
    code_text: code,
  })

  if (error) {
    console.error('redeem_gift_code RPC error:', error)
    return NextResponse.json({ error: 'Lỗi hệ thống, vui lòng thử lại.' }, { status: 500 })
  }

  if (data?.error) {
    return NextResponse.json({ error: data.error }, { status: 400 })
  }

  const planConfig = VIP_PLANS[data.vip_plan_id as keyof typeof VIP_PLANS]
  const planLabel = planConfig?.displayName ?? data.vip_plan_id

  await supabase.from('notifications').insert({
    user_id: userId,
    title: 'Đổi mã quà tặng thành công! 🎁',
    content: `Tài khoản đã kích hoạt ${planLabel}. Hiệu lực đến ${new Date(data.vip_expires_at).toLocaleDateString('vi-VN')}.`,
    type: 'payment',
  })

  return NextResponse.json({
    success: true,
    vipExpiresAt: data.vip_expires_at,
    planLabel,
  })
}
