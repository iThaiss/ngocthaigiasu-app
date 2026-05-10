import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { createAdminClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.res

  const { searchParams } = req.nextUrl
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = parseInt(searchParams.get('limit') ?? '20')
  const offset = (page - 1) * limit
  const status = searchParams.get('status') ?? ''
  const source = searchParams.get('source') ?? ''

  const supabase = createAdminClient()
  let query = supabase
    .from('raw_documents')
    .select('id, filename, source, total_pages, status, created_at', { count: 'exact' })

  if (status) query = query.eq('status', status)
  if (source) query = query.ilike('source', `%${source}%`)

  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1)

  const { data, count, error } = await query
  if (error) return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })

  return NextResponse.json({
    documents: data ?? [],
    total: count ?? 0,
    totalPages: Math.ceil((count ?? 0) / limit),
  })
}
