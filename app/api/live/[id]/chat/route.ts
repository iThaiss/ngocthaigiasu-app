import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'

// Tải 100 tin nhắn gần nhất của buổi học (cho người vào trễ / đổi máy)
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
  const { data, error } = await supabase
    .from('live_chat_messages')
    .select('id, user_id, user_name, user_avatar, text, created_at')
    .eq('session_id', params.id)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    return NextResponse.json({ messages: [] })
  }

  // Trả về theo thứ tự cũ → mới
  const messages = (data ?? []).reverse().map(m => ({
    id: m.id,
    userId: m.user_id,
    userName: m.user_name ?? 'Học sinh',
    userAvatar: m.user_avatar ?? '',
    text: m.text,
    time: new Date(m.created_at).getTime(),
  }))

  return NextResponse.json({ messages })
}

// Lưu 1 tin nhắn
export async function POST(
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

  const body = await req.json().catch(() => null)
  const text = (body?.text ?? '').toString().trim().slice(0, 1000)
  if (!text) {
    return NextResponse.json({ error: 'Tin nhắn rỗng' }, { status: 400 })
  }

  const id = `${session.user.id}-${body?.time ?? Date.now()}`
  const supabase = createAdminClient()
  await supabase.from('live_chat_messages').insert({
    id,
    session_id: params.id,
    user_id: session.user.id,
    user_name: body?.userName ?? session.user.name ?? 'Học sinh',
    user_avatar: body?.userAvatar ?? '',
    text,
  })

  return NextResponse.json({ success: true, id })
}
