import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createAdminClient()

  const { data: courses, error } = await supabase
    .from('courses')
    .select('*')
    .eq('is_active', true)
    .order('order_index')

  if (error) return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })

  const result = await Promise.all(
    (courses ?? []).map(async (course) => {
      const { data: chapters } = await supabase
        .from('chapters')
        .select('id')
        .eq('course_id', course.id)

      const chapterIds = (chapters ?? []).map((c) => c.id)

      let totalLessons = 0
      let completedLessons = 0
      if (chapterIds.length > 0) {
        const { count: mathCount } = await supabase
          .from('math_lessons')
          .select('id', { count: 'exact', head: true })
          .in('chapter_id', chapterIds)
          .eq('is_active', true)
        totalLessons = mathCount ?? 0

        if (totalLessons > 0) {
          // Get math_lessons IDs to fetch progress
          const { data: mathLessonsList } = await supabase
            .from('math_lessons')
            .select('id')
            .in('chapter_id', chapterIds)
            .eq('is_active', true)

          const ids = (mathLessonsList ?? []).map((l) => l.id)
          if (ids.length > 0) {
            const { count: completedCount } = await supabase
              .from('math_progress')
              .select('lesson_id', { count: 'exact', head: true })
              .eq('user_id', session.user.id)
              .in('lesson_id', ids)
              .eq('mastered', true)
            completedLessons = completedCount ?? 0
          }
        } else {
          // Fallback to legacy lessons
          const { count } = await supabase
            .from('lessons')
            .select('id', { count: 'exact', head: true })
            .in('chapter_id', chapterIds)
            .eq('is_published', true)
          totalLessons = count ?? 0
        }
      }

      return {
        ...course,
        chapter_count: chapterIds.length,
        lesson_count: totalLessons,
        completed: completedLessons,
      }
    })
  )

  return NextResponse.json({ courses: result })
}
