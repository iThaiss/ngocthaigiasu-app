import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { createAdminClient } from '@/lib/supabase'
import { generateQuestionsFromPreset, THPT_2025_MATH_PRESET } from '@/lib/public-exam-scoring'

export async function POST(req: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.res

  const body = await req.json().catch(() => null)
  if (!body?.title) return NextResponse.json({ error: 'title required' }, { status: 400 })

  const supabase = createAdminClient()

  const { data: exam, error } = await supabase
    .from('public_exams')
    .insert({
      title: body.title,
      year: body.year ?? null,
      subject: body.subject ?? 'math',
      time_limit_minutes: body.time_limit_minutes ?? 90,
      question_count: body.question_count ?? 22,
      max_score: body.max_score ?? 10,
      pdf_url: body.pdf_url ?? null,
      status: 'draft',
      created_by: guard.session.user.id,
    })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Tự động tạo skeleton câu hỏi theo preset THPT 2025
  if (body.use_preset !== false) {
    const preset = THPT_2025_MATH_PRESET
    const questions = generateQuestionsFromPreset(preset)
    const rows = questions.map((q) => ({
      exam_id: exam.id,
      question_number: q.question_number,
      part: q.part,
      question_type: q.question_type,
      correct_answer: null,
      max_score: q.max_score,
      scoring_rule: q.scoring_rule,
    }))
    await supabase.from('public_exam_questions').insert(rows)
  }

  return NextResponse.json({ exam })
}
