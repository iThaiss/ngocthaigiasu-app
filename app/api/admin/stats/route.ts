import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { createAdminClient } from '@/lib/supabase'

export async function GET() {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.res

  const supabase = createAdminClient()
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [
    { count: totalQuestions },
    { count: totalStudents },
    { count: noAnswerQuestions },
    { count: docsCompleted },
    { data: revenueData },
    { data: recentDocs },
  ] = await Promise.all([
    supabase.from('questions').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('questions').select('*', { count: 'exact', head: true })
      .eq('question_type', 'multiple_choice').is('correct_answer', null),
    supabase.from('raw_documents').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
    supabase.from('transactions').select('amount').eq('status', 'completed').gte('created_at', monthStart),
    supabase.from('raw_documents').select('id, filename, source, total_pages, status, created_at')
      .order('created_at', { ascending: false }).limit(10),
  ])

  const monthlyRevenue = (revenueData ?? []).reduce((sum, t) => sum + (t.amount ?? 0), 0)

  return NextResponse.json({
    totalQuestions: totalQuestions ?? 0,
    totalStudents: totalStudents ?? 0,
    noAnswerQuestions: noAnswerQuestions ?? 0,
    docsCompleted: docsCompleted ?? 0,
    monthlyRevenue,
    recentDocs: recentDocs ?? [],
  })
}
