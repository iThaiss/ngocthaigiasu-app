import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { requireAdmin } from '@/lib/admin-guard'
import { createAdminClient } from '@/lib/supabase'
import { renderLessonHTML } from '@/lib/lesson-render'

const anthropic = new Anthropic()

function extractJSON(text: string): Record<string, unknown> {
  // Strip markdown code fences first (handles truncated fences too)
  text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) {
    throw new Error(`No JSON object found in response (length=${text.length})`)
  }
  return JSON.parse(text.substring(start, end + 1))
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.res

  const { lessonId, prompt, topic } = await req.json()
  if (!lessonId || !prompt) {
    return NextResponse.json({ error: 'Missing lessonId or prompt' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // 1. Lý thuyết liên quan
  let theoryData: { content: string; topic: string }[] = []
  try {
    const { data } = await supabase
      .from('theory_content')
      .select('content, topic')
      .ilike('topic', `%${topic}%`)
      .limit(5)
    theoryData = data ?? []
  } catch { /* bảng chưa tồn tại */ }

  // 2. Câu hỏi từ DB (80%)
  let dbQuestions: {
    question_text: string
    option_a: string | null; option_b: string | null
    option_c: string | null; option_d: string | null
    correct_answer: string | null; difficulty: string | null
  }[] = []
  try {
    const { data } = await supabase
      .from('questions')
      .select('question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty')
      .ilike('topic', `%${topic ?? ''}%`)
      .eq('is_published', true)
      .limit(10)
    dbQuestions = data ?? []
  } catch {
    try {
      const { data } = await supabase
        .from('questions')
        .select('question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty')
        .ilike('question_text', `%${topic ?? ''}%`)
        .limit(10)
      dbQuestions = data ?? []
    } catch { /* fallback to empty */ }
  }

  // 3. Gọi Claude API
  const systemPrompt = `Bạn là chuyên gia soạn giáo án Toán 12 theo chương trình THPTQG Việt Nam.
Tạo giáo án chi tiết, chuẩn format, dùng LaTeX cho công thức.
Trả về JSON thuần túy không có markdown.`

  const userPrompt = `${prompt}

Tài liệu tham khảo từ database:
${theoryData.map((t) => t.content).join('\n') || '(Chưa có tài liệu)'}

Câu hỏi có sẵn trong database (ưu tiên dùng):
${JSON.stringify(dbQuestions)}

Trả về JSON:
{
  "title": "tên bài học",
  "duration": 90,
  "objectives": ["mục tiêu 1", "mục tiêu 2"],
  "theory": {
    "definitions": [{"term": "...", "content": "...LaTeX..."}],
    "formulas": [{"name": "...", "formula": "$$...$$", "note": "..."}],
    "theorems": [{"name": "...", "content": "..."}]
  },
  "examples": [
    {
      "level": "Nhận biết|Thông hiểu|Vận dụng|Vận dụng cao",
      "problem": "...",
      "solution": "từng bước...",
      "tip": "mẹo giải..."
    }
  ],
  "exercises": [
    {
      "source": "ai",
      "question_text": "...",
      "option_a": "...", "option_b": "...", "option_c": "...", "option_d": "...",
      "correct_answer": "A|B|C|D",
      "difficulty": "...",
      "solution": "lời giải chi tiết"
    }
  ],
  "summary": "tổng kết bài học",
  "memory_tips": "mẹo nhớ công thức"
}`

  let rawText = ''
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    if (message.stop_reason === 'max_tokens') {
      console.warn('[generate-plan] Response was truncated by max_tokens')
    }

    rawText = message.content[0]?.type === 'text' ? message.content[0].text : ''
    if (!rawText) throw new Error('Empty response from Claude API')
  } catch (apiErr) {
    const msg = apiErr instanceof Error ? apiErr.message : String(apiErr)
    console.error('[generate-plan] Claude API error:', msg)
    return NextResponse.json({ error: `Claude API lỗi: ${msg}` }, { status: 502 })
  }

  let lessonPlan: Record<string, unknown>
  try {
    lessonPlan = extractJSON(rawText)
  } catch (parseErr) {
    const msg = parseErr instanceof Error ? parseErr.message : String(parseErr)
    console.error('[generate-plan] JSON parse error:', msg, '\nRaw (first 500):', rawText.slice(0, 500))
    return NextResponse.json(
      { error: `Không parse được JSON từ AI: ${msg}`, rawPreview: rawText.slice(0, 300) },
      { status: 500 }
    )
  }

  // 4. Gộp exercises: 80% từ DB, 20% từ AI
  const dbExercises = dbQuestions.slice(0, 8).map((q) => ({
    source: 'db',
    question_text: q.question_text,
    option_a: q.option_a,
    option_b: q.option_b,
    option_c: q.option_c,
    option_d: q.option_d,
    correct_answer: q.correct_answer,
    difficulty: q.difficulty,
    solution: '',
  }))

  const aiExercises = ((lessonPlan.exercises as { question_text?: string }[]) ?? []).slice(0, 2)

  // Insert câu hỏi AI vào DB
  for (const ex of aiExercises) {
    if (!ex.question_text) continue
    try {
      await supabase.from('questions').insert({
        question_text: (ex as { question_text: string }).question_text,
        option_a: (ex as { option_a?: string }).option_a ?? null,
        option_b: (ex as { option_b?: string }).option_b ?? null,
        option_c: (ex as { option_c?: string }).option_c ?? null,
        option_d: (ex as { option_d?: string }).option_d ?? null,
        correct_answer: (ex as { correct_answer?: string }).correct_answer ?? null,
        difficulty: (ex as { difficulty?: string }).difficulty ?? 'Vận dụng',
        source: 'AI_generated',
        question_type: 'multiple_choice',
      })
    } catch { /* ignore insert errors */ }
  }

  lessonPlan.exercises = [...dbExercises, ...aiExercises.map((e) => ({ ...e, source: 'ai' }))]

  // 5. Render HTML
  const lesson_plan_html = renderLessonHTML(lessonPlan as Parameters<typeof renderLessonHTML>[0])

  // 6. Lưu vào lesson
  await supabase
    .from('lessons')
    .update({ lesson_plan: lessonPlan, lesson_plan_html })
    .eq('id', lessonId)

  return NextResponse.json({ lessonPlan, htmlPreview: lesson_plan_html })
}
