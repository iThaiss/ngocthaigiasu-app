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
    { count: needsVisualCount },
    { data: revenueData },
    { data: recentDocs },
    { data: byGrade },
    { data: byDifficulty },
    { data: byType },
    { data: byTopic },
    { data: docStats },
  ] = await Promise.all([
    supabase.from('questions').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('questions').select('*', { count: 'exact', head: true })
      .eq('question_type', 'multiple_choice').is('correct_answer', null),
    supabase.from('raw_documents').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
    supabase.from('questions').select('*', { count: 'exact', head: true }).eq('needs_visual', true),
    supabase.from('transactions').select('amount').eq('status', 'completed').gte('created_at', monthStart),
    supabase.from('raw_documents').select('id, filename, source, total_pages, status, created_at')
      .order('created_at', { ascending: false }).limit(10),
    // Phân bổ theo lớp
    supabase.from('questions').select('grade').not('grade', 'is', null),
    // Phân bổ theo độ khó
    supabase.from('questions').select('difficulty').not('difficulty', 'is', null),
    // Phân bổ theo loại câu
    supabase.from('questions').select('question_type'),
    // Top 10 chủ đề nhiều nhất
    supabase.from('questions').select('topic').not('topic', 'is', null),
    // Trạng thái pipeline
    supabase.from('raw_documents').select('status'),
  ])

  const monthlyRevenue = (revenueData ?? []).reduce((sum, t) => sum + (t.amount ?? 0), 0)

  // Tính phân bổ theo lớp
  const gradeMap: Record<string, number> = {}
  for (const r of byGrade ?? []) {
    const k = String(r.grade)
    gradeMap[k] = (gradeMap[k] ?? 0) + 1
  }

  // Tính phân bổ theo độ khó
  const diffMap: Record<string, number> = {}
  for (const r of byDifficulty ?? []) {
    const k = r.difficulty as string
    diffMap[k] = (diffMap[k] ?? 0) + 1
  }

  // Tính phân bổ theo loại câu
  const typeMap: Record<string, number> = {}
  for (const r of byType ?? []) {
    const k = r.question_type as string
    typeMap[k] = (typeMap[k] ?? 0) + 1
  }

  // Top 10 chủ đề
  const topicMap: Record<string, number> = {}
  for (const r of byTopic ?? []) {
    const k = r.topic as string
    topicMap[k] = (topicMap[k] ?? 0) + 1
  }
  const topTopics = Object.entries(topicMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([topic, count]) => ({ topic, count }))

  // Trạng thái pipeline
  const pipelineMap: Record<string, number> = {}
  for (const r of docStats ?? []) {
    const k = r.status as string
    pipelineMap[k] = (pipelineMap[k] ?? 0) + 1
  }

  return NextResponse.json({
    totalQuestions: totalQuestions ?? 0,
    totalStudents: totalStudents ?? 0,
    noAnswerQuestions: noAnswerQuestions ?? 0,
    docsCompleted: docsCompleted ?? 0,
    needsVisualCount: needsVisualCount ?? 0,
    monthlyRevenue,
    recentDocs: recentDocs ?? [],
    charts: {
      byGrade: Object.entries(gradeMap).map(([grade, count]) => ({ grade: `Lớp ${grade}`, count })).sort((a, b) => a.grade.localeCompare(b.grade)),
      byDifficulty: Object.entries(diffMap).map(([difficulty, count]) => ({ difficulty, count })),
      byType: Object.entries(typeMap).map(([type, count]) => ({ type, count })),
      topTopics,
      pipeline: Object.entries(pipelineMap).map(([status, count]) => ({ status, count })),
    },
  })
}
