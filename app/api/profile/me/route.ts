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
  const userId = session.user.id

  const [userRes, profileRes] = await Promise.all([
    supabase
      .from('users')
      .select('name, email, phone, school, province, is_vip, vip_expires_at')
      .eq('id', userId)
      .single(),
    supabase
      .from('profiles')
      .select('class')
      .eq('id', userId)
      .maybeSingle(),
  ])

  return NextResponse.json({
    name: userRes.data?.name ?? null,
    email: userRes.data?.email ?? null,
    phone: userRes.data?.phone ?? null,
    school: userRes.data?.school ?? null,
    province: userRes.data?.province ?? null,
    isVip: userRes.data?.is_vip ?? false,
    vipExpiresAt: userRes.data?.vip_expires_at ?? null,
    studentClass: profileRes.data?.class ?? null,
  })
}
