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
    .from('lessons')
    .select('id, title, topic, video_url, is_published, lesson_plan, order_index, created_at')
    .eq('chapter_id', chapterId)
    .order('order_index')

  if (error) return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  return NextResponse.json({ lessons: data ?? [] })
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.res

  const { chapterId, title, topic, video_url, is_published } = await req.json()
  if (!chapterId || !title) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const supabase = createAdminClient()

  const { count } = await supabase
    .from('lessons')
    .select('id', { count: 'exact', head: true })
    .eq('chapter_id', chapterId)

  const { data, error } = await supabase
    .from('lessons')
    .insert({
      chapter_id: chapterId,
      title,
      topic: topic || null,
      video_url: video_url || null,
      is_published: is_published ?? false,
      order_index: (count ?? 0) + 1,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Failed to create' }, { status: 500 })
  return NextResponse.json({ lesson: data })
}
