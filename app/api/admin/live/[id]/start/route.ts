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

  const livekitHost = (process.env.LIVEKIT_URL ?? '').replace(/^﻿/, '').trim()
    .replace('wss://', 'https://')
    .replace('ws://', 'http://')
  const apiKey = (process.env.LIVEKIT_API_KEY ?? '').replace(/^﻿/, '').trim()
  const apiSecret = (process.env.LIVEKIT_API_SECRET ?? '').replace(/^﻿/, '').trim()

  if (!apiKey || !apiSecret) {
    return NextResponse.json({ error: 'Thiếu LiveKit API credentials' }, { status: 500 })
  }

  const roomService = new RoomServiceClient(livekitHost, apiKey, apiSecret)

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

  const rtmpBase = (process.env.MEDIAMTX_RTMP_URL ?? 'rtmp://localhost').replace(/^﻿/, '').trim()
  const hlsBase = (process.env.NEXT_PUBLIC_MEDIAMTX_HLS_BASE_URL ?? 'http://localhost:8888').replace(/^﻿/, '').trim().replace(/\/$/, '')
  const streamKey = process.env.STREAM_KEY ?? 'stream'

  return NextResponse.json({
    roomName,
    rtmpUrl: `${rtmpBase}/live`,
    streamKey,
    hlsUrl: `${hlsBase}/live/${streamKey}/index.m3u8`,
  })
}
