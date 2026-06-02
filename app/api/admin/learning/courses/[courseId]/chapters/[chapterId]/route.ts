import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { createAdminClient } from '@/lib/supabase'

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ courseId: string; chapterId: string }> }
) {
  const params = await context.params
  const guard = await requireAdmin()
  if (!guard.ok) return guard.res

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('chapters')
    .delete()
    .eq('id', params.chapterId)
    .eq('course_id', params.courseId)

  if (error) return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
