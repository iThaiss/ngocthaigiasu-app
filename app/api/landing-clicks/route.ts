import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

const ALLOWED_LINK_KEYS = new Set([
  'zalo_group',
  'youtube',
  'facebook',
  'learning_website',
  'personal_zalo_qr',
  'share',
])

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const linkKey = typeof body?.linkKey === 'string' ? body.linkKey : ''

    if (!ALLOWED_LINK_KEYS.has(linkKey)) {
      return NextResponse.json({ error: 'Invalid link key' }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient()
    const { error } = await supabaseAdmin.from('landing_link_clicks').insert({
      page_key: 'ngocthaigiasu',
      link_key: linkKey,
    })

    if (error) {
      console.error('Unable to record landing link click:', error.message)
      return NextResponse.json({ ok: false }, { status: 503 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
