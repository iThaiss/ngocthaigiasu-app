import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { subjectName } = await req.json()
    if (!subjectName || typeof subjectName !== 'string' || !subjectName.trim()) {
      return NextResponse.json({ error: 'Tên môn học không hợp lệ' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { error } = await supabase.from('subject_votes').insert({
      user_id: session.user.id,
      subject_name: subjectName.trim(),
    })

    if (error) {
      console.error('[subject-vote] DB Error:', error)
      return NextResponse.json({ error: 'Không thể lưu bình chọn vào cơ sở dữ liệu' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[subject-vote] Error:', err)
    return NextResponse.json({ error: 'Lỗi máy chủ nội bộ' }, { status: 500 })
  }
}
