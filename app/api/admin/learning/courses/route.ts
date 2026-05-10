import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { createAdminClient } from '@/lib/supabase'

export async function GET() {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.res

  const supabase = createAdminClient()

  const { data: courses, error } = await supabase
    .from('courses')
    .select('*')
    .order('order_index')

  if (error) return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 })

  const result = await Promise.all(
    (courses ?? []).map(async (course) => {
      const { data: chapters } = await supabase
        .from('chapters')
        .select('id')
        .eq('course_id', course.id)

      const chapterIds = (chapters ?? []).map((c) => c.id)

      let lessonCount = 0
      if (chapterIds.length > 0) {
        const { count } = await supabase
          .from('lessons')
          .select('id', { count: 'exact', head: true })
          .in('chapter_id', chapterIds)
        lessonCount = count ?? 0
      }

      return { ...course, chapter_count: chapterIds.length, lesson_count: lessonCount }
    })
  )

  return NextResponse.json({ courses: result })
}
