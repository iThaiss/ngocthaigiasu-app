import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Fetch live sessions from Supabase
    const supabaseAdmin = createAdminClient()
    const { data: sessions, error } = await supabaseAdmin
      .from('live_sessions')
      .select('*')
      .order('start_time', { ascending: true })

    if (error) {
      console.error('Fetch live sessions error:', error)
      return NextResponse.json({ error: 'Không thể tải lịch học' }, { status: 500 })
    }

    const isVip = session?.user?.isVip === true
    const isAdmin = session?.user?.role === 'admin'

    // Security check: Hide raw meet_url from non-VIP users to prevent link sharing
    const sanitizedSessions = sessions.map((s) => {
      // Đáp án BTVN chỉ admin được thấy (tránh lộ đáp án qua payload chung)
      if (isAdmin) {
        return s
      }
      if (isVip) {
        const { homework_answer_key, ...rest } = s
        return rest
      }
      // Ẩn link Meet + record + tài liệu + BTVN khỏi học sinh chưa VIP
      const { meet_url, external_event_id, recording_url, recording_url_2, document_url, homework_file_url, homework_title, homework_answer_key, ...rest } = s
      return rest
    })

    return NextResponse.json(sanitizedSessions)
  } catch (err) {
    console.error('API live GET error:', err)
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })
  }
}
