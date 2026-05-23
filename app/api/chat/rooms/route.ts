import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const { data: rooms, error } = await supabase
    .from('chat_rooms')
    .select('id, slug, name, description, order_index')
    .eq('is_active', true)
    .order('order_index', { ascending: true })

  if (error) {
    console.error('[chat/rooms] SELECT error:', error)
    return NextResponse.json({ error: 'Không tải được phòng chat' }, { status: 500 })
  }

  const roomsWithMeta = await Promise.all(
    (rooms ?? []).map(async (room) => {
      const { data: latestMessage } = await supabase
        .from('chat_messages')
        .select('id, content, author_name, created_at')
        .eq('room_id', room.id)
        .eq('is_hidden', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      return {
        ...room,
        unread: 0,
        latestMessage: latestMessage
          ? {
            id: latestMessage.id,
            content: latestMessage.content,
            authorName: latestMessage.author_name,
            createdAt: latestMessage.created_at,
          }
          : null,
      }
    }),
  )

  return NextResponse.json({ rooms: roomsWithMeta })
}
