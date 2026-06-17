import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const { lessonId } = await params
  if (!lessonId) return NextResponse.json({ error: 'Missing lessonId' }, { status: 400 })

  const supabase = createAdminClient()
  const { data } = await supabase
    .from('math_lessons')
    .select('view_count')
    .eq('id', lessonId)
    .single()

  if (data) {
    await supabase
      .from('math_lessons')
      .update({ view_count: (data.view_count ?? 0) + 1 })
      .eq('id', lessonId)
  }

  return NextResponse.json({ ok: true })
}
