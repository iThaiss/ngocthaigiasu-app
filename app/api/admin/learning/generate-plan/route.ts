import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { createAdminClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.res

  const { lessonId, prompt, topic } = await req.json()
  if (!lessonId || !prompt) {
    return NextResponse.json({ error: 'Missing lessonId or prompt' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const userId = (guard.session.user as { id: string }).id

  const { data: job, error } = await supabase
    .from('ai_jobs')
    .insert({
      type: 'generate_lesson_plan',
      status: 'pending',
      input: { lessonId, prompt, topic },
      user_id: userId,
    })
    .select('id')
    .single()

  if (error || !job) {
    return NextResponse.json({ error: 'Không thể tạo job' }, { status: 500 })
  }

  fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/process-ai-job`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ jobId: job.id }),
  }).catch((err) => console.error('[generate-plan] Edge Function trigger failed:', err))

  return NextResponse.json({
    jobId: job.id,
    status: 'pending',
    message: 'Đang tạo giáo án...',
  })
}
