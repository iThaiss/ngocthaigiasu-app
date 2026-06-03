import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { createAdminClient } from '@/lib/supabase'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params

  const guard = await requireAdmin()
  if (!guard.ok) return guard.res

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('chapters')
    .select('*')
    .eq('course_id', courseId)
    .order('order_index')

  if (error) return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })

  const result = await Promise.all(
    (data ?? []).map(async (ch) => {
      const { count } = await supabase
        .from('lessons')
        .select('id', { count: 'exact', head: true })
        .eq('chapter_id', ch.id)
      return { ...ch, lesson_count: count ?? 0 }
    })
  )

  return NextResponse.json({ chapters: result })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params

  const guard = await requireAdmin()
  if (!guard.ok) return guard.res

  const { name, subject, description } = await req.json()
  if (!name || !subject) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const supabase = createAdminClient()

  const { count } = await supabase
    .from('chapters')
    .select('id', { count: 'exact', head: true })
    .eq('course_id', courseId)

  const { data, error } = await supabase
    .from('chapters')
    .insert({ course_id: courseId, name, subject, description, order_index: (count ?? 0) + 1 })
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Failed to create' }, { status: 500 })
  return NextResponse.json({ chapter: data })
}
