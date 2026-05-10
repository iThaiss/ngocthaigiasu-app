import Anthropic from 'npm:@anthropic-ai/sdk'
import { createClient } from 'npm:@supabase/supabase-js'

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') })
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req) => {
  const { jobId } = await req.json()

  await supabase.from('ai_jobs').update({ status: 'processing' }).eq('id', jobId)

  const { data: job } = await supabase.from('ai_jobs').select('*').eq('id', jobId).single()
  const { lessonId, prompt, topic } = job.input

  try {
    const { data: theoryData } = await supabase
      .from('theory_content')
      .select('content, topic')
      .ilike('topic', `%${topic}%`)
      .limit(5)

    const { data: dbQuestions } = await supabase
      .from('questions')
      .select('question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty, topic')
      .ilike('topic', `%${topic}%`)
      .eq('is_published', true)
      .limit(12)

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 8000,
      system: `Bạn là chuyên gia soạn giáo án Toán 12 theo chương trình THPTQG Việt Nam.
Tạo giáo án chi tiết, đầy đủ, chuẩn format, dùng LaTeX cho công thức toán học.
Trả về JSON thuần túy, KHÔNG có markdown, KHÔNG có \`\`\`json.`,
      messages: [{
        role: 'user',
        content: `${prompt}

Tài liệu tham khảo từ database:
${theoryData?.map((t: { content: string }) => t.content).join('\n') || 'Không có'}

Câu hỏi có sẵn trong database (ưu tiên dùng 80%):
${JSON.stringify(dbQuestions || [])}

Trả về JSON với cấu trúc đầy đủ:
{
  "title": "tên bài học",
  "duration": 90,
  "objectives": ["mục tiêu 1", "mục tiêu 2", "mục tiêu 3"],
  "theory": {
    "definitions": [{"term": "...", "content": "...LaTeX..."}],
    "formulas": [{"name": "...", "formula": "$$...$$", "note": "..."}],
    "theorems": [{"name": "...", "content": "..."}]
  },
  "examples": [
    {
      "level": "Nhận biết",
      "problem": "...",
      "solution": "bước 1:... bước 2:...",
      "tip": "mẹo giải..."
    },
    {
      "level": "Thông hiểu",
      "problem": "...",
      "solution": "...",
      "tip": "..."
    },
    {
      "level": "Vận dụng",
      "problem": "...",
      "solution": "...",
      "tip": "..."
    }
  ],
  "exercises": [
    {
      "source": "db hoặc ai",
      "question_text": "...",
      "option_a": "...",
      "option_b": "...",
      "option_c": "...",
      "option_d": "...",
      "correct_answer": "A|B|C|D",
      "difficulty": "Nhận biết|Thông hiểu|Vận dụng|Vận dụng cao",
      "solution": "lời giải chi tiết từng bước"
    }
  ],
  "summary": "tổng kết bài học ngắn gọn",
  "memory_tips": "mẹo nhớ công thức"
}`
      }]
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const start = clean.indexOf('{')
    const end = clean.lastIndexOf('}')
    const lessonPlan = JSON.parse(clean.substring(start, end + 1))

    for (const ex of (lessonPlan.exercises ?? [])) {
      if (ex.source === 'ai' && ex.question_text) {
        await supabase.from('questions').insert({
          topic: topic,
          question_type: 'multiple_choice',
          question_text: ex.question_text,
          option_a: ex.option_a ?? null,
          option_b: ex.option_b ?? null,
          option_c: ex.option_c ?? null,
          option_d: ex.option_d ?? null,
          correct_answer: ex.correct_answer ?? null,
          difficulty: ex.difficulty ?? 'Vận dụng',
          explanation: ex.solution ?? null,
          is_published: true,
          raw_text: JSON.stringify(ex),
        })
      }
    }

    await supabase.from('lessons').update({ lesson_plan: lessonPlan }).eq('id', lessonId)

    await supabase.from('ai_jobs').update({
      status: 'completed',
      result: lessonPlan,
      completed_at: new Date().toISOString(),
    }).eq('id', jobId)

    const { data: lesson } = await supabase
      .from('lessons')
      .select('title')
      .eq('id', lessonId)
      .single()

    await supabase.from('notifications').insert({
      user_id: job.user_id,
      title: 'Giáo án đã tạo xong!',
      content: `Giáo án "${lesson?.title}" đã được tạo thành công.`,
      type: 'system',
      is_read: false,
    })

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    await supabase.from('ai_jobs').update({
      status: 'failed',
      error: (error as Error).message,
      completed_at: new Date().toISOString(),
    }).eq('id', jobId)

    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
