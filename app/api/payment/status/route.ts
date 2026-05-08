import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const ref = req.nextUrl.searchParams.get('ref')
  if (!ref) {
    return NextResponse.json({ error: 'Missing ref' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data } = await supabase
    .from('transactions')
    .select('status')
    .eq('user_id', session.user.id)
    .eq('metadata->>ref', ref)
    .single()

  return NextResponse.json({ status: data?.status ?? 'not_found' })
}
