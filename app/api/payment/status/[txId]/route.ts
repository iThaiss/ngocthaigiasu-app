import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'

export async function GET(
  _req: NextRequest,
  { params }: { params: { txId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { txId } = params

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('transactions')
    .select('status')
    .eq('id', txId)
    .eq('user_id', session.user.id)
    .single()

  if (error || !data) {
    return NextResponse.json({ status: 'not_found' })
  }

  return NextResponse.json({ status: data.status })
}
