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

  const livekitHost = (process.env.LIVEKIT_URL ?? '').trim()
    .replace('wss://', 'https://')
    .replace('ws://', 'http://')

  if (!livekitHost) {
    return NextResponse.json({ error: 'LIVEKIT_URL chưa được cấu hình' }, { status: 500 })
  }

  const roomService = new RoomServiceClient(
    livekitHost,
    process.env.LIVEKIT_API_KEY!,
    process.env.LIVEKIT_API_SECRET!
  )

  const roomName = `live-${params.id.slice(0, 8)}`

  try {
    await roomService.createRoom({
      name: roomName,
      emptyTimeout: 3600,
      maxParticipants: 1000,
    })
  } catch (err: any) {
    if (!err.message?.includes('already exists')) {
      return NextResponse.json({ error: err.message }, { status: 500 })
    }
  }

  const supabase = createAdminClient()
  await supabase
    .from('live_sessions')
    .update({ livekit_room_name: roomName, status: 'live' })
    .eq('id', params.id)

  const rtmpBase = process.env.MEDIAMTX_RTMP_URL ?? 'rtmp://localhost'
  const hlsBase = process.env.NEXT_PUBLIC_MEDIAMTX_HLS_BASE_URL ?? 'http://localhost:8888'

  return NextResponse.json({
    roomName,
    rtmpUrl: `${rtmpBase}/live/${roomName}`,
    hlsUrl: `${hlsBase}/live/${roomName}/index.m3u8`,
  })
}
