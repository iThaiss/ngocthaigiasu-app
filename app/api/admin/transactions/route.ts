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
  const status = searchParams.get('status') ?? ''
  const type = searchParams.get('type') ?? ''
  const month = searchParams.get('month') ?? ''

  const supabase = createAdminClient()
  let query = supabase
    .from('transactions')
    .select('id, user_id, amount, type, status, reference_code, created_at, users(email, name)', { count: 'exact' })

  if (status) query = query.eq('status', status)
  if (type) query = query.eq('type', type)
  if (month) {
    const [y, m] = month.split('-').map(Number)
    const from = new Date(y, m - 1, 1).toISOString()
    const to = new Date(y, m, 1).toISOString()
    query = query.gte('created_at', from).lt('created_at', to)
  }

  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1)

  const { data, count, error } = await query
  if (error) return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })

  // Monthly revenue stats
  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()

  const [{ data: thisMonth }, { data: lastMonth }] = await Promise.all([
    supabase.from('transactions').select('amount').eq('status', 'completed').gte('created_at', thisMonthStart),
    supabase.from('transactions').select('amount').eq('status', 'completed')
      .gte('created_at', lastMonthStart).lt('created_at', thisMonthStart),
  ])

  const thisRevenue = (thisMonth ?? []).reduce((s, t) => s + (t.amount ?? 0), 0)
  const lastRevenue = (lastMonth ?? []).reduce((s, t) => s + (t.amount ?? 0), 0)

  return NextResponse.json({
    transactions: data ?? [],
    total: count ?? 0,
    totalPages: Math.ceil((count ?? 0) / limit),
    thisMonthRevenue: thisRevenue,
    lastMonthRevenue: lastRevenue,
  })
}
