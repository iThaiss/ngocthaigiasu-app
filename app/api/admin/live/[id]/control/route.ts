import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'
import { RoomServiceClient } from 'livekit-server-sdk'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { action, participantIdentity } = await req.json()

  const supabase = createAdminClient()
  const { data: liveSession } = await supabase
    .from('live_sessions')
    .select('livekit_room_name')
    .eq('id', params.id)
    .single()

  if (!liveSession?.livekit_room_name) {
    return NextResponse.json({ error: 'Phòng học chưa được tạo' }, { status: 404 })
  }

  const livekitHost = process.env.LIVEKIT_URL!
    .replace('wss://', 'https://')
    .replace('ws://', 'http://')

  const roomService = new RoomServiceClient(
    livekitHost,
    process.env.LIVEKIT_API_KEY!,
    process.env.LIVEKIT_API_SECRET!
  )

  const roomName = liveSession.livekit_room_name

  switch (action) {
    case 'kick':
      await roomService.removeParticipant(roomName, participantIdentity)
      break

    case 'approve_mic':
      await roomService.updateParticipant(roomName, participantIdentity, undefined, {
        canPublish: true,
        canSubscribe: true,
        canPublishData: true,
      })
      break

    case 'revoke_mic':
      await roomService.updateParticipant(roomName, participantIdentity, undefined, {
        canPublish: false,
        canSubscribe: true,
        canPublishData: true,
      })
      break

    case 'end_session':
      await roomService.deleteRoom(roomName)
      await supabase.from('live_sessions').update({ status: 'ended' }).eq('id', params.id)
      break

    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
