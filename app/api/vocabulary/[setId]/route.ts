import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'

// GET /api/vocabulary/[setId]
// Returns set details, words, questions, and user progress
export async function GET(
  req: NextRequest,
  { params }: { params: { setId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createAdminClient()
  const userId = session.user.id
  const { setId } = params

  // Fetch set metadata
  const { data: set, error: setError } = await supabase
    .from('vocab_sets')
    .select('*')
    .eq('id', setId)
    .single()

  if (setError || !set) {
    return NextResponse.json({ error: 'Vocab set not found' }, { status: 404 })
  }

  // Check access: must be public, system, or owned by user
  if (!set.is_public && !set.is_system && set.created_by !== userId) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  // Fetch words
  const { data: words } = await supabase
    .from('vocab_set_words')
    .select('*')
    .eq('set_id', setId)
    .order('order_index', { ascending: true })

  // Fetch questions
  const { data: questions } = await supabase
    .from('vocab_questions')
    .select('*')
    .eq('set_id', setId)
    .order('created_at', { ascending: true })

  // Fetch user's progress for this set
  const { data: progress } = await supabase
    .from('vocab_progress')
    .select('word, state, due, stability, reps, lapses, last_review')
    .eq('user_id', userId)
    .eq('set_id', setId)

  // Check if user has liked / saved
  const [{ data: likeData }, { data: saveData }] = await Promise.all([
    supabase
      .from('vocab_set_likes')
      .select('set_id')
      .eq('user_id', userId)
      .eq('set_id', setId)
      .maybeSingle(),
    supabase
      .from('vocab_set_saves')
      .select('set_id')
      .eq('user_id', userId)
      .eq('set_id', setId)
      .maybeSingle(),
  ])

  return NextResponse.json({
    set,
    words: words ?? [],
    questions: questions ?? [],
    progress: progress ?? [],
    user_has_liked: !!likeData,
    user_has_saved: !!saveData,
  })
}

// PATCH /api/vocabulary/[setId] — toggle public, update metadata
export async function PATCH(
  req: NextRequest,
  { params }: { params: { setId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createAdminClient()
  const userId = session.user.id
  const { setId } = params
  const body = await req.json()

  const { data: set } = await supabase
    .from('vocab_sets')
    .select('created_by, is_system')
    .eq('id', setId)
    .single()

  if (!set) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (set.is_system || set.created_by !== userId) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  const allowed: Record<string, unknown> = {}
  if ('is_public' in body) allowed.is_public = Boolean(body.is_public)
  if ('name' in body) allowed.name = String(body.name).trim().slice(0, 100)
  if ('description' in body) allowed.description = String(body.description).slice(0, 500)

  const { data, error } = await supabase
    .from('vocab_sets')
    .update({ ...allowed, updated_at: new Date().toISOString() })
    .eq('id', setId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  return NextResponse.json({ set: data })
}

// POST /api/vocabulary/[setId]/like  — handled via query param
// DELETE /api/vocabulary/[setId] — delete own set
export async function DELETE(
  req: NextRequest,
  { params }: { params: { setId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createAdminClient()
  const userId = session.user.id
  const { setId } = params

  const { data: set } = await supabase
    .from('vocab_sets')
    .select('created_by, is_system')
    .eq('id', setId)
    .single()

  if (!set) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (set.is_system || set.created_by !== userId) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  const { error } = await supabase.from('vocab_sets').delete().eq('id', setId)
  if (error) return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  return NextResponse.json({ success: true })
}
