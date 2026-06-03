import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { createAdminClient } from '@/lib/supabase'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ courseId: string; chapterId: string }> }
) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.res

  const { courseId, chapterId } = await params
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('chapters')
    .delete()
    .eq('id', chapterId)
    .eq('course_id', courseId)

  if (error) return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
