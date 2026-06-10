import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'
import { inviteVIPStudentToMeet, findEventIdByMeetUrl } from '@/lib/google-calendar'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    const isVip = session.user.isVip === true
    const isAdmin = session.user.role === 'admin'

    if (!isVip && !isAdmin) {
      return NextResponse.redirect(new URL('/payment', req.url))
    }

    const { searchParams } = new URL(req.url)
    const classId = searchParams.get('id')

    if (!classId) {
      return NextResponse.json({ error: 'Thiếu ID lớp học' }, { status: 400 })
    }

    // Fetch meeting details from Supabase using admin client to read meet_url
    const supabaseAdmin = createAdminClient()
    const { data: liveSession, error } = await supabaseAdmin
      .from('live_sessions')
      .select('meet_url, external_event_id')
      .eq('id', classId)
      .single()

    if (error || !liveSession) {
      console.error('Fetch live session details error:', error)
      return NextResponse.json({ error: 'Không tìm thấy lớp học' }, { status: 404 })
    }

    // Resolve event ID dynamically if it's missing in Supabase (on-the-fly fallback)
    let eventId = liveSession.external_event_id
    if (!eventId && liveSession.meet_url) {
      try {
        const resolvedId = await findEventIdByMeetUrl(liveSession.meet_url)
        if (resolvedId) {
          eventId = resolvedId
          // Update the database synchronously so we guarantee it saves
          const { error: updateErr } = await supabaseAdmin
            .from('live_sessions')
            .update({ external_event_id: resolvedId })
            .eq('id', classId)
          
          if (updateErr) {
            console.error('Failed to update resolved event ID in DB:', updateErr)
          }
        }
      } catch (lookupErr: any) {
        console.error('On-the-fly event lookup error:', lookupErr)
        return NextResponse.json({
          error: 'Lỗi tra cứu sự kiện Google Calendar',
          message: lookupErr.message || lookupErr
        }, { status: 500 })
      }
    }

    // Auto-approve: Invite VIP student or Admin email to the Google Calendar Event
    if (eventId && session.user.email) {
      try {
        await inviteVIPStudentToMeet(eventId, session.user.email)
      } catch (err: any) {
        console.error('Failed to invite user to calendar event:', err)
        return NextResponse.json({
          error: 'Lỗi đồng bộ Google Calendar',
          message: err.message || err,
          eventId: eventId,
          email: session.user.email
        }, { status: 500 })
      }
    }

    // Redirect user directly to the Google Meet URL
    return NextResponse.redirect(new URL(liveSession.meet_url))
  } catch (err) {
    console.error('API live join error:', err)
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })
  }
}
