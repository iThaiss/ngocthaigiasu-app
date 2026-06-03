import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { createAdminClient } from '@/lib/supabase'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params

  const guard = await requireAdmin()
  if (!guard.ok) return guard.res

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('ai_jobs')
    .select('id, status, result, error, completed_at')
    .eq('id', jobId)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Job không tồn tại' }, { status: 404 })
  }

  return NextResponse.json({
    status: data.status,
    result: data.result,
    error: data.error,
    completedAt: data.completed_at,
  })
}
