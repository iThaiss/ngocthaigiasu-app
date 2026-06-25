import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'
import { AccessToken } from 'livekit-server-sdk'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
  }

  const isVip = session.user.isVip === true
  const isAdmin = session.user.role === 'admin'
  if (!isVip && !isAdmin) {
    return NextResponse.json({ error: 'Yêu cầu tài khoản VIP' }, { status: 403 })
  }

  const supabase = createAdminClient()
  const { data: liveSession } = await supabase
    .from('live_sessions')
    .select('id, title, status, livekit_room_name')
    .eq('id', params.id)
    .single()

  if (!liveSession) {
    return NextResponse.json({ error: 'Không tìm thấy buổi học' }, { status: 404 })
  }

  if (liveSession.status !== 'live' && !isAdmin) {
    return NextResponse.json({ error: 'Buổi học chưa bắt đầu' }, { status: 400 })
  }

  const roomName = liveSession.livekit_room_name ?? `session-${params.id.slice(0, 8)}`

  const { data: userData } = await supabase
    .from('users')
    .select('name, avatar_url')
    .eq('id', session.user.id)
    .single()
  const displayName = userData?.name ?? session.user.name ?? 'Học sinh'
  const avatarUrl = userData?.avatar_url ?? session.user.image ?? ''

  const apiKey = (process.env.LIVEKIT_API_KEY ?? '').replace(/^﻿/, '').trim()
  const apiSecret = (process.env.LIVEKIT_API_SECRET ?? '').replace(/^﻿/, '').trim()

  const at = new AccessToken(apiKey, apiSecret, {
    identity: session.user.id,
    name: displayName,
    metadata: JSON.stringify({ avatar: avatarUrl }),
    ttl: '4h',
  })

  at.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: isAdmin,
    canSubscribe: true,
    canPublishData: true,
    roomAdmin: isAdmin,
  })

  const token = await at.toJwt()
  const hlsBase = (process.env.NEXT_PUBLIC_MEDIAMTX_HLS_BASE_URL ?? '')
    .replace(/^﻿/, '').trim().replace(/\/$/, '')
  const livekitUrl = (process.env.NEXT_PUBLIC_LIVEKIT_URL ?? '')
    .replace(/^﻿/, '').trim()
  const streamKey = (process.env.STREAM_KEY ?? 'stream').trim()
  const hlsUrl = `${hlsBase}/live/${streamKey}/index.m3u8`

  return NextResponse.json({
    token,
    livekitUrl,
    hlsUrl,
    roomName,
    sessionTitle: liveSession.title,
    sessionStatus: liveSession.status,
    isAdmin,
  })
}
