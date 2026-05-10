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

  const supabase = createAdminClient()
  let query = supabase.from('questions').select('*', { count: 'exact' })

  if (type) query = query.eq('question_type', type)
  if (difficulty) query = query.eq('difficulty', difficulty)
  if (source) query = query.ilike('source', `%${source}%`)
  if (search) query = query.ilike('question_text', `%${search}%`)
  if (noAnswer) query = query.is('correct_answer', null).eq('question_type', 'multiple_choice')

  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1)

  const { data, count, error } = await query
  if (error) return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })

  return NextResponse.json({
    questions: data ?? [],
    total: count ?? 0,
    totalPages: Math.ceil((count ?? 0) / limit),
  })
}
