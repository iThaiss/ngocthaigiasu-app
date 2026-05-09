import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'

function normalizeName(name: string): string {
  return name.trim().split(' ')
    .filter(w => w.length > 0)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

function normalizeClass(input: string): string {
  return input.toUpperCase().replace(/\s+/g, '').replace(/^LOP/, '')
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const { name, phone, school, province, studentClass } = body

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Tên không được để trống' }, { status: 400 })
  }

  const cleanPhone = phone ? phone.replace(/\s/g, '') : ''
  if (cleanPhone && !/^0\d{9}$/.test(cleanPhone)) {
    return NextResponse.json(
      { error: 'Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0)' },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()

  const { data: updatedUser, error } = await supabase
    .from('users')
    .update({
      name: normalizeName(name),
      phone: cleanPhone || null,
      school: school?.trim() || null,
      province: province || null,
      profile_completed: true,
    })
    .eq('id', session.user.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }

  if (studentClass) {
    await supabase.from('profiles').upsert({
      id: session.user.id,
      class: normalizeClass(studentClass),
      updated_at: new Date().toISOString(),
    })
  }

  return NextResponse.json({ success: true, user: updatedUser })
}
