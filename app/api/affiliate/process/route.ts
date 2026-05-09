import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const refCode: string = body.refCode ?? ''

  if (!refCode) return NextResponse.json({ success: false, reason: 'no_ref' })

  const supabase = createAdminClient()
  const userId = session.user.id

  // Find referrer by referral_code
  const { data: referrer } = await supabase
    .from('users')
    .select('id')
    .eq('referral_code', refCode)
    .single()

  if (!referrer || referrer.id === userId) {
    return NextResponse.json({ success: false, reason: 'invalid_ref' })
  }

  // Check if already has a referral record
  const { data: existing } = await supabase
    .from('affiliate_referrals')
    .select('id')
    .eq('referee_id', userId)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ success: false, reason: 'already_registered' })
  }

  await supabase.from('affiliate_referrals').insert({
    referrer_id: referrer.id,
    referee_id: userId,
    status: 'pending',
  })

  return NextResponse.json({ success: true })
}
