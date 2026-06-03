import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createAdminClient()

  const { data: course, error } = await supabase
    .from('courses')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error || !course) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: chapters } = await supabase
    .from('chapters')
    .select('*')
    .eq('course_id', course.id)
    .order('order_index')

  const chaptersWithLessons = await Promise.all(
    (chapters ?? []).map(async (ch) => {
      const { data: lessons } = await supabase
        .from('lessons')
        .select('id, title, topic, video_url, lesson_plan, order_index, created_at')
        .eq('chapter_id', ch.id)
        .eq('is_published', true)
        .order('order_index')
      return { ...ch, lessons: lessons ?? [] }
    })
  )

  return NextResponse.json({ course, chapters: chaptersWithLessons })
}
