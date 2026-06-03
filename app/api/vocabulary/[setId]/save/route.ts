import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'

export async function POST(req: NextRequest, { params }: { params: Promise<{ setId: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { setId } = await params
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('vocab_set_saves')
    .upsert({ user_id: session.user.id, set_id: setId }, { onConflict: 'user_id,set_id', ignoreDuplicates: true })
  if (error) return NextResponse.json({ error: 'Failed' }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ setId: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { setId } = await params
  const supabase = createAdminClient()
  await supabase.from('vocab_set_saves').delete()
    .eq('user_id', session.user.id).eq('set_id', setId)
  return NextResponse.json({ success: true })
}
