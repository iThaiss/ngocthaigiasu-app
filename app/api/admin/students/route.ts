import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { createAdminClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.res

  const { searchParams } = req.nextUrl
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = 20
  const offset = (page - 1) * limit
  const search = searchParams.get('search') ?? ''
  const vipFilter = searchParams.get('vip') ?? ''
  const province = searchParams.get('province') ?? ''

  const supabase = createAdminClient()
  let query = supabase
    .from('users')
    .select('id, name, email, province, school, is_vip, vip_expires_at, created_at, phone', { count: 'exact' })
    .eq('role', 'student')

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
  }
  if (vipFilter === 'vip') query = query.eq('is_vip', true)
  if (vipFilter === 'nonvip') query = query.eq('is_vip', false)
  if (province) query = query.eq('province', province)

  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1)

  const { data, count, error } = await query
  if (error) return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })

  // Fetch wallet points for each student
  const userIds = (data ?? []).map((u) => u.id)
  let wallets: { user_id: string; points: number }[] = []
  if (userIds.length > 0) {
    const { data: walletData } = await supabase
      .from('wallets')
      .select('user_id, points')
      .in('user_id', userIds)
    wallets = walletData ?? []
  }

  const walletMap = Object.fromEntries(wallets.map((w) => [w.user_id, w.points]))
  const students = (data ?? []).map((u) => ({ ...u, points: walletMap[u.id] ?? 0 }))

  return NextResponse.json({
    students,
    total: count ?? 0,
    totalPages: Math.ceil((count ?? 0) / limit),
  })
}
