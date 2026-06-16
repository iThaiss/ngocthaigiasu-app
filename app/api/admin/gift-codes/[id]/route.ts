import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { createAdminClient } from '@/lib/supabase'

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.res

  const { id } = await context.params
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const update: Record<string, unknown> = {}
  if (typeof body.is_active === 'boolean') update.is_active = body.is_active
  if (body.max_uses !== undefined) {
    const n = parseInt(body.max_uses, 10)
    if (!Number.isFinite(n) || n < 1) {
      return NextResponse.json({ error: 'Số lượt không hợp lệ' }, { status: 400 })
    }
    update.max_uses = n
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Không có trường hợp lệ để cập nhật' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('gift_codes')
    .update(update)
    .eq('id', id)

  if (error) return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.res

  const { id } = await context.params
  const supabase = createAdminClient()
  const { error } = await supabase.from('gift_codes').delete().eq('id', id)

  if (error) return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  return NextResponse.json({ success: true })
}
