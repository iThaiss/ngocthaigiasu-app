import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'
import { publicSlots, type HomeworkSlot } from '@/lib/homework-grading'

// GET /api/live/homework?sessionId=  → đề + slots (đã bỏ đáp án)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const isVip = session.user.isVip === true
  const isAdmin = session.user.role === 'admin'
  if (!isVip && !isAdmin) return NextResponse.json({ error: 'Yêu cầu tài khoản VIP' }, { status: 403 })

  const sessionId = req.nextUrl.searchParams.get('sessionId')
  if (!sessionId) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('live_sessions')
    .select('homework_title, homework_file_url, homework_answer_key, homework_recording_url, homework_document_url')
    .eq('id', sessionId)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Không tìm thấy buổi học' }, { status: 404 })
  if (!data.homework_file_url) {
    return NextResponse.json({ error: 'Buổi học chưa có BTVN' }, { status: 404 })
  }

  const answerKey = Array.isArray(data.homework_answer_key) ? data.homework_answer_key as HomeworkSlot[] : []

  return NextResponse.json({
    title: data.homework_title ?? 'Bài tập về nhà',
    file_url: data.homework_file_url,
    slots: publicSlots(answerKey),
    has_answer_key: answerKey.length > 0,
    homework_recording_url: data.homework_recording_url ?? null,
    homework_document_url: data.homework_document_url ?? null,
  })
}
