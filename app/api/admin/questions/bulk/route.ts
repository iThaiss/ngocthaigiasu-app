import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { createAdminClient } from '@/lib/supabase'

export async function PUT(req: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.res

  const body = await req.json().catch(() => null)
  if (!body || !Array.isArray(body.ids) || !body.ids.length) {
    return NextResponse.json({ error: 'ids array required' }, { status: 400 })
  }

  const { ids, difficulty, topic, subtopic, source, grade, part } = body
  const supabase = createAdminClient()

  const updates: Record<string, unknown> = {}
  if (difficulty !== undefined) updates.difficulty = difficulty || null
  if (topic !== undefined) updates.topic = topic || null
  if (subtopic !== undefined) updates.subtopic = subtopic || null
  if (source !== undefined) updates.source = source || null
  if (grade !== undefined) updates.grade = grade || null
  if (part !== undefined) updates.part = part || null

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const { error } = await supabase
    .from('questions')
    .update(updates)
    .in('id', ids)

  if (error) return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  return NextResponse.json({ success: true, updated: ids.length })
}
