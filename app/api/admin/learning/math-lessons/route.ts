import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { createAdminClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.res

  const chapterId = req.nextUrl.searchParams.get('chapterId')
  if (!chapterId) return NextResponse.json({ error: 'Missing chapterId' }, { status: 400 })

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('math_lessons')
    .select('id, title, topic, video_url, video_source, order_index, is_active')
    .eq('chapter_id', chapterId)
    .order('order_index')

  if (error) return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  return NextResponse.json({ lessons: data ?? [] })
}
