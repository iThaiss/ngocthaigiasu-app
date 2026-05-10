import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = session.user as { id: string; isVip?: boolean }
  const isVip = user.isVip ?? false

  const supabase = createAdminClient()

  const { data: lesson, error } = await supabase
    .from('lessons')
    .select(`
      id, title, topic, video_url, video_source,
      lesson_plan_html, lesson_plan, order_index, created_at,
      chapters ( name, subject, course_id,
        courses ( name, slug )
      )
    `)
    .eq('id', params.id)
    .eq('is_published', true)
    .single()

  if (error || !lesson) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Không VIP → trả về nhưng bỏ nội dung
  if (!isVip) {
    return NextResponse.json({
      lesson: {
        ...lesson,
        lesson_plan_html: null,
        lesson_plan: null,
      },
      isVip: false,
    })
  }

  return NextResponse.json({ lesson, isVip: true })
}
