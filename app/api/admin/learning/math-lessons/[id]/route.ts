import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { createAdminClient } from '@/lib/supabase'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const guard = await requireAdmin()
  if (!guard.ok) return guard.res

  const body = await req.json()
  const allowed = ['video_url', 'video_source', 'title', 'topic', 'is_active', 'view_count_base']
  const update: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) update[key] = body[key]
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('math_lessons')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  return NextResponse.json({ lesson: data })
}
