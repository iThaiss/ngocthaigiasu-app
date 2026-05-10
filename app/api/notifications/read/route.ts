import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const supabase = createAdminClient()
  const userId = session.user.id

  if (body.all === true) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    if (error) return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  } else if (body.notificationId) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', body.notificationId)
      .eq('user_id', userId)

    if (error) return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  } else {
    return NextResponse.json({ error: 'Missing notificationId or all' }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
