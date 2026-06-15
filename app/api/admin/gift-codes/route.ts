import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { createAdminClient } from '@/lib/supabase'
import { VIP_PLANS, isPlanId } from '@/lib/plans'

export async function GET() {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.res

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('gift_codes')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  return NextResponse.json({ giftCodes: data ?? [] })
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.res

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const { code, vip_plan_id, max_uses, valid_until } = body
  if (!code?.trim()) return NextResponse.json({ error: 'Mã code là bắt buộc' }, { status: 400 })
  if (!isPlanId(vip_plan_id)) return NextResponse.json({ error: 'Gói VIP không hợp lệ' }, { status: 400 })

  const planConfig = VIP_PLANS[vip_plan_id]

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('gift_codes')
    .insert({
      code: code.trim().toUpperCase(),
      vip_plan_id,
      plan_subject: planConfig.vipPlanValue,
      duration_days: planConfig.durationDays,
      max_uses: parseInt(max_uses) || 1,
      valid_until: valid_until || null,
      is_active: true,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Mã code đã tồn tại' }, { status: 409 })
    return NextResponse.json({ error: 'Tạo mã thất bại' }, { status: 500 })
  }

  return NextResponse.json({ success: true, giftCode: data })
}
