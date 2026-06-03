import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { createAdminClient } from '@/lib/supabase'

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const guard = await requireAdmin()
  if (!guard.ok) return guard.res

  const messageId = id?.trim()
  if (!messageId) return NextResponse.json({ error: 'Missing message id' }, { status: 400 })

  const { error } = await createAdminClient()
    .from('chat_messages')
    .update({ is_hidden: true })
    .eq('id', messageId)

  if (error) {
    console.error('[chat/messages/:id] hide error:', error)
    return NextResponse.json({ error: 'Không ẩn được tin nhắn' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
