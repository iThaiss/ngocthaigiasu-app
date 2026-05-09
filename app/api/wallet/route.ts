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
  const { data } = await supabase
    .from('wallets')
    .select('points, balance')
    .eq('user_id', session.user.id)
    .single()

  return NextResponse.json({
    points: data?.points ?? 0,
    balance: data?.balance ?? 0,
  })
}
