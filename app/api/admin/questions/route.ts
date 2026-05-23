import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { createAdminClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.res

  const { searchParams } = req.nextUrl
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = 20
  const offset = (page - 1) * limit
  const type = searchParams.get('type') ?? ''
  const difficulty = searchParams.get('difficulty') ?? ''
  const source = searchParams.get('source') ?? ''
  const search = searchParams.get('search') ?? ''
  const noAnswer = searchParams.get('noAnswer') === 'true'
  const grade = searchParams.get('grade') ?? ''
  const subtopic = searchParams.get('subtopic') ?? ''
  const part = searchParams.get('part') ?? ''
  const needsVisual = searchParams.get('needsVisual') ?? ''
  const visualType = searchParams.get('visualType') ?? ''
  const needsReview = searchParams.get('needsReview') ?? ''
  const answerSource = searchParams.get('answerSource') ?? ''
  const published = searchParams.get('published') ?? ''

  const supabase = createAdminClient()
  let query = supabase.from('questions').select('*', { count: 'exact' })

  if (type) query = query.eq('question_type', type)
  if (difficulty) query = query.eq('difficulty', difficulty)
  if (source) query = query.ilike('source', `%${source}%`)
  if (search) query = query.ilike('question_text', `%${search}%`)
  if (noAnswer) query = query.is('correct_answer', null).eq('question_type', 'multiple_choice')
  if (grade) query = query.eq('grade', parseInt(grade))
  if (subtopic) query = query.ilike('subtopic', `%${subtopic}%`)
  if (part) query = query.eq('part', part)
  if (needsVisual === 'true') query = query.eq('needs_visual', true)
  if (needsVisual === 'false') query = query.eq('needs_visual', false)
  if (visualType) query = query.eq('visual_type', visualType)
  if (needsReview === 'true') query = query.eq('needs_review', true)
  if (needsReview === 'false') query = query.eq('needs_review', false)
  if (answerSource) query = query.eq('answer_source', answerSource)
  if (published === 'true') query = query.eq('is_published', true)
  if (published === 'false') query = query.eq('is_published', false)

  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1)

  const { data, count, error } = await query
  if (error) return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })

  return NextResponse.json({
    questions: data ?? [],
    total: count ?? 0,
    totalPages: Math.ceil((count ?? 0) / limit),
  })
}
