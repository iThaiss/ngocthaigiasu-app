import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'
import { findEventIdByMeetUrl, createCalendarEventAndMeet } from '@/lib/google-calendar'

// Helper to check admin role
async function checkAdmin() {
  const session = await getServerSession(authOptions)
  return session?.user?.role === 'admin'
}

export async function POST(req: NextRequest) {
  try {
    if (!(await checkAdmin())) {
      return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 })
    }

    const body = await req.json()
    const { title, teacher, start_time, end_time, status, subject, meet_url, external_event_id, recording_url, recording_url_2, document_url } = body

    if (!title || !teacher || !start_time || !end_time || !subject) {
      return NextResponse.json({ error: 'Thiếu thông tin bắt buộc' }, { status: 400 })
    }

    let finalMeetUrl = meet_url || null
    let resolvedEventId = external_event_id || null

    if (!finalMeetUrl) {
      try {
        const result = await createCalendarEventAndMeet(title, start_time, end_time)
        finalMeetUrl = result.meetUrl
        resolvedEventId = result.eventId
      } catch (err: any) {
        console.error('Failed to create calendar event automatically:', err)
        return NextResponse.json({
          error: `Không thể tạo phòng học Google Meet tự động: ${err.message || err}`
        }, { status: 500 })
      }
    } else if (!resolvedEventId) {
      resolvedEventId = await findEventIdByMeetUrl(finalMeetUrl)
    }

    const supabaseAdmin = createAdminClient()
    const { data, error } = await supabaseAdmin
      .from('live_sessions')
      .insert({
        title,
        teacher,
        start_time,
        end_time,
        status: status || 'upcoming',
        subject,
        meet_url: finalMeetUrl,
        external_event_id: resolvedEventId,
        recording_url: recording_url || null,
        recording_url_2: recording_url_2 || null,
        document_url: document_url || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Create live session error:', error)
      return NextResponse.json({ error: 'Lỗi khi tạo buổi học' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('Admin live POST error:', err)
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    if (!(await checkAdmin())) {
      return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 })
    }

    const body = await req.json()
    const { id, title, teacher, start_time, end_time, status, subject, meet_url, external_event_id, recording_url, recording_url_2, document_url } = body

    if (!id || !title || !teacher || !start_time || !end_time || !subject) {
      return NextResponse.json({ error: 'Thiếu thông tin bắt buộc' }, { status: 400 })
    }

    let finalMeetUrl = meet_url || null
    let resolvedEventId = external_event_id || null

    if (!finalMeetUrl) {
      try {
        const result = await createCalendarEventAndMeet(title, start_time, end_time)
        finalMeetUrl = result.meetUrl
        resolvedEventId = result.eventId
      } catch (err: any) {
        console.error('Failed to create calendar event automatically on edit:', err)
        return NextResponse.json({ 
          error: `Không thể tạo phòng học Google Meet tự động: ${err.message || err}`
        }, { status: 500 })
      }
    } else if (!resolvedEventId) {
      resolvedEventId = await findEventIdByMeetUrl(finalMeetUrl)
    }

    const supabaseAdmin = createAdminClient()
    const { data, error } = await supabaseAdmin
      .from('live_sessions')
      .update({
        title,
        teacher,
        start_time,
        end_time,
        status,
        subject,
        meet_url: finalMeetUrl,
        external_event_id: resolvedEventId,
        recording_url: recording_url || null,
        recording_url_2: recording_url_2 || null,
        document_url: document_url || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Update live session error:', error)
      return NextResponse.json({ error: 'Lỗi khi cập nhật buổi học' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('Admin live PUT error:', err)
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })
  }
}


export async function DELETE(req: NextRequest) {
  try {
    if (!(await checkAdmin())) {
      return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Thiếu ID buổi học' }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient()
    const { error } = await supabaseAdmin
      .from('live_sessions')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Delete live session error:', error)
      return NextResponse.json({ error: 'Lỗi khi xóa buổi học' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Admin live DELETE error:', err)
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })
  }
}
