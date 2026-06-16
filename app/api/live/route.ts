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
      if (isAdmin || isVip) {
        return s
      }
      // Ẩn link Meet + record + tài liệu khỏi học sinh chưa VIP
      const { meet_url, external_event_id, recording_url, document_url, ...rest } = s
      return rest
    })

    return NextResponse.json(sanitizedSessions)
  } catch (err) {
    console.error('API live GET error:', err)
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })
  }
}
