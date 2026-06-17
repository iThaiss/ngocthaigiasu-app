import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export const revalidate = 3600 // cache 1 giờ

export async function GET() {
  const supabase = createAdminClient()
  const { count } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })

  const total = count ?? 0
  // Làm tròn xuống bội số 50 rồi cộng '+' cho đẹp
  const rounded = Math.max(Math.floor(total / 50) * 50, 100)

  return NextResponse.json({ total_users: total, display: `${rounded.toLocaleString('vi-VN')}+` })
}
