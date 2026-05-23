import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'

const MESSAGE_LIMIT = 50
const MAX_CONTENT_LENGTH = 1000

function cleanText(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function mapMessage(message: Record<string, unknown>) {
  return {
    id: message.id,
    roomId: message.room_id,
    userId: message.user_id,
    authorName: message.author_name,
    authorAvatarUrl: message.author_avatar_url,
    content: message.content,
    isHidden: message.is_hidden,
    createdAt: message.created_at,
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const roomId = cleanText(req.nextUrl.searchParams.get('roomId'), 80)
  if (!roomId) return NextResponse.json({ error: 'Missing roomId' }, { status: 400 })

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('chat_messages')
    .select('id, room_id, user_id, author_name, author_avatar_url, content, is_hidden, created_at')
    .eq('room_id', roomId)
    .eq('is_hidden', false)
    .order('created_at', { ascending: false })
    .limit(MESSAGE_LIMIT)

  if (error) {
    console.error('[chat/messages] SELECT error:', error)
    return NextResponse.json({ error: 'Không tải được tin nhắn' }, { status: 500 })
  }

  return NextResponse.json({
    messages: (data ?? []).reverse().map((message) => mapMessage(message as Record<string, unknown>)),
  })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const roomId = cleanText((body as Record<string, unknown>).roomId, 80)
  const content = cleanText((body as Record<string, unknown>).content, MAX_CONTENT_LENGTH)
  if (!roomId) return NextResponse.json({ error: 'Missing roomId' }, { status: 400 })
  if (!content) return NextResponse.json({ error: 'Tin nhắn không được để trống' }, { status: 400 })

  const supabase = createAdminClient()
  const { data: room, error: roomError } = await supabase
    .from('chat_rooms')
    .select('id')
    .eq('id', roomId)
    .eq('is_active', true)
    .maybeSingle()

  if (roomError || !room) {
    return NextResponse.json({ error: 'Phòng chat không tồn tại' }, { status: 404 })
  }

  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      room_id: room.id,
      user_id: session.user.id,
      author_name: session.user.name ?? 'Học sinh',
      author_avatar_url: session.user.image ?? null,
      content,
    })
    .select('id, room_id, user_id, author_name, author_avatar_url, content, is_hidden, created_at')
    .single()

  if (error || !data) {
    console.error('[chat/messages] INSERT error:', error)
    return NextResponse.json({ error: 'Không gửi được tin nhắn' }, { status: 500 })
  }

  return NextResponse.json({ message: mapMessage(data as Record<string, unknown>) })
}
