import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const supabase = createAdminClient()
  const { data } = await supabase
    .from('live_sessions')
    .select('view_count')
    .eq('id', id)
    .single()

  if (data) {
    await supabase
      .from('live_sessions')
      .update({ view_count: (data.view_count ?? 0) + 1 })
      .eq('id', id)
  }

  return NextResponse.json({ ok: true })
}
