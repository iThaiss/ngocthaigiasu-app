import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { requireAdmin } from '@/lib/admin-guard'
import { createAdminClient } from '@/lib/supabase'

// GET — danh sách tài liệu (mọi người đã đăng nhập)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
  }

  const subject = req.nextUrl.searchParams.get('subject') ?? 'math'
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('study_documents')
    .select('id, title, subject, drive_url, folder_label, view_count, view_count_base, created_at')
    .eq('subject', subject)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ documents: [] })
  return NextResponse.json({ documents: data ?? [] })
}

// POST — thêm tài liệu (admin)
export async function POST(req: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.res

  const body = await req.json().catch(() => null)
  const title = (body?.title ?? '').toString().trim()
  const drive_url = (body?.drive_url ?? '').toString().trim()
  if (!title || !drive_url) {
    return NextResponse.json({ error: 'Thiếu tiêu đề hoặc link Drive' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('study_documents')
    .insert({
      title,
      subject: body?.subject ?? 'math',
      drive_url,
      folder_label: (body?.folder_label ?? '').toString().trim() || null,
      view_count_base: Math.max(0, parseInt(body?.view_count_base) || 0),
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data?.id })
}

// PUT — sửa tài liệu (admin)
export async function PUT(req: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.res

  const body = await req.json().catch(() => null)
  if (!body?.id) return NextResponse.json({ error: 'Thiếu id' }, { status: 400 })

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('study_documents')
    .update({
      title: (body.title ?? '').toString().trim(),
      drive_url: (body.drive_url ?? '').toString().trim(),
      folder_label: (body.folder_label ?? '').toString().trim() || null,
      view_count_base: Math.max(0, parseInt(body.view_count_base) || 0),
    })
    .eq('id', body.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// DELETE — xóa tài liệu (admin)
export async function DELETE(req: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.res

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Thiếu id' }, { status: 400 })

  const supabase = createAdminClient()
  const { error } = await supabase.from('study_documents').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
