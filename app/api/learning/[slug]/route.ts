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

  const chapterIds = (chapters ?? []).map((ch) => ch.id)
  const { count: activeMathLessonCount } = chapterIds.length > 0
    ? await supabase
        .from('math_lessons')
        .select('id', { count: 'exact', head: true })
        .in('chapter_id', chapterIds)
        .eq('is_active', true)
    : { count: 0 }
  const useMathSyllabus = (activeMathLessonCount ?? 0) > 0

  const chaptersWithLessons = await Promise.all(
    (chapters ?? []).map(async (ch) => {
      // Try to load math_lessons
      const { data: mathLessons } = await supabase
        .from('math_lessons')
        .select('id, title, topic, video_url, order_index, created_at, exercise_count, key_rules, common_mistakes')
        .eq('chapter_id', ch.id)
        .eq('is_active', true)
        .order('order_index')

      if (mathLessons && mathLessons.length > 0) {
        // Fetch progress for these lessons
        const lessonIds = mathLessons.map((l) => l.id)
        const { data: progress } = await supabase
          .from('math_progress')
          .select('lesson_id, mastered')
          .eq('user_id', session.user.id)
          .in('lesson_id', lessonIds)

        const progressMap = new Map((progress ?? []).map((p) => [p.lesson_id, p.mastered]))
        
        const mappedLessons = mathLessons.map((l) => ({
          ...l,
          completed: progressMap.get(l.id) ?? false,
          // map content flags for compatibility
          lesson_plan: l.exercise_count > 0 ? { has_exercises: true } : null,
        }))

        return { ...ch, lessons: mappedLessons }
      }

      if (useMathSyllabus) {
        return { ...ch, lessons: [] }
      }

      // Fallback to legacy lessons
      const { data: lessons } = await supabase
        .from('lessons')
        .select('id, title, topic, video_url, lesson_plan, order_index, created_at')
        .eq('chapter_id', ch.id)
        .eq('is_published', true)
        .order('order_index')

      const mappedLessons = (lessons ?? []).map((l) => ({
        ...l,
        completed: false,
      }))

      return { ...ch, lessons: mappedLessons }
    })
  )

  return NextResponse.json({
    course,
    chapters: useMathSyllabus
      ? chaptersWithLessons.filter((chapter) => chapter.lessons.length > 0)
      : chaptersWithLessons,
  })
}
