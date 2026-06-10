import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id
  const supabase = createAdminClient()

  // Fetch current user status
  const { data: user, error: fetchErr } = await supabase
    .from('users')
    .select('is_vip, vip_expires_at, last_free_vip_claimed_at')
    .eq('id', userId)
    .single()

  if (fetchErr || !user) {
    console.error('Fetch user error:', fetchErr)
    return NextResponse.json({ error: 'Không tìm thấy thông tin tài khoản' }, { status: 404 })
  }

  const lastClaimed = user.last_free_vip_claimed_at ? new Date(user.last_free_vip_claimed_at) : null
  const now = new Date()

  if (lastClaimed) {
    const diffTime = now.getTime() - lastClaimed.getTime()
    const diffDays = diffTime / (1000 * 60 * 60 * 24)
    if (diffDays < 30) {
      const remainingDays = Math.ceil(30 - diffDays)
      return NextResponse.json(
        {
          error: `Bạn đã nhận ngày VIP miễn phí của tháng này. Vui lòng quay lại sau ${remainingDays} ngày nữa.`,
          remainingDays,
        },
        { status: 400 }
      )
    }
  }

  // Calculate new expiry date (accumulation if current VIP is still active)
  const currentExpiry = user.vip_expires_at ? new Date(user.vip_expires_at) : null
  const baseDate = (currentExpiry && currentExpiry > now) ? currentExpiry : now
  const newExpiry = new Date(baseDate.getTime() + 24 * 60 * 60 * 1000) // +1 day

  // Update user
  const { error: updateErr } = await supabase
    .from('users')
    .update({
      is_vip: true,
      vip_expires_at: newExpiry.toISOString(),
      vip_plan: 'combo_vip', // Give them full access during the trial
      last_free_vip_claimed_at: now.toISOString(),
    })
    .eq('id', userId)

  if (updateErr) {
    console.error('Update user VIP status error:', updateErr)
    return NextResponse.json({ error: 'Không thể kích hoạt VIP miễn phí. Vui lòng thử lại sau.' }, { status: 500 })
  }

  // Create notification
  await supabase.from('notifications').insert({
    user_id: userId,
    title: 'Nhận ngày VIP miễn phí thành công! 🎉',
    content: `Tài khoản đã kích hoạt 1 ngày trải nghiệm Combo VIP (Toán + Anh). Hiệu lực đến ${newExpiry.toLocaleDateString('vi-VN')} ${newExpiry.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}.`,
    type: 'payment',
  })

  return NextResponse.json({
    success: true,
    vipExpiresAt: newExpiry.toISOString(),
    lastFreeVipClaimedAt: now.toISOString(),
  })
}
