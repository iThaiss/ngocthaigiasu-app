import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { createAdminClient } from '@/lib/supabase'

export async function PUT(req: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.res

  const body = await req.json().catch(() => null)
  if (!body || !Array.isArray(body.ids) || !body.ids.length) {
    return NextResponse.json({ error: 'ids array required' }, { status: 400 })
  }

  const { ids, difficulty } = body
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('questions')
    .update({ difficulty: difficulty || null })
    .in('id', ids)

  if (error) return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  return NextResponse.json({ success: true, updated: ids.length })
}
