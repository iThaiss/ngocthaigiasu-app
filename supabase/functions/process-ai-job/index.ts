import Anthropic from 'npm:@anthropic-ai/sdk'
import { createClient } from 'npm:@supabase/supabase-js'

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') })
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

function parseResponse(text: string) {
  const getSection = (tag: string) => {
    const regex = new RegExp(`###${tag}###\\n([\\s\\S]*?)(?=###|$)`)
    const match = text.match(regex)
    return match ? match[1].trim() : ''
  }

  return {
    title: getSection('TITLE'),
    objectives: getSection('OBJECTIVES').split('\n').filter(Boolean),
    theory: getSection('THEORY'),
    examples: getSection('EXAMPLES'),
    exercises: getSection('EXERCISES'),
    summary: getSection('SUMMARY'),
    tips: getSection('TIPS'),
  }
}

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
      .select('question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty')
      .ilike('topic', `%${topic}%`)
      .eq('is_published', true)
      .limit(12)

    const dbQuestionsText = (dbQuestions ?? []).map((q, i) =>
      `CÂU ${i + 1} (${q.difficulty ?? 'Vận dụng'}):\nĐề: ${q.question_text}\nA. ${q.option_a}\nB. ${q.option_b}\nC. ${q.option_c}\nD. ${q.option_d}\nĐáp án: ${q.correct_answer}\nLời giải: (từ database)`
    ).join('\n\n')

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 8000,
      system: 'Bạn là chuyên gia soạn giáo án Toán 12. Trả lời theo đúng format được yêu cầu.',
      messages: [{
        role: 'user',
        content: `Tạo giáo án: ${prompt}

Tài liệu tham khảo:
${theoryData?.map((t: { content: string }) => t.content).join('\n') || 'Không có'}

Câu hỏi có sẵn (ưu tiên dùng 80%):
${dbQuestionsText || 'Không có, tự tạo câu hỏi mới'}

Trả về theo format sau, giữ đúng các delimiter:

###TITLE###
[tên bài học]

###OBJECTIVES###
[mục tiêu 1]
[mục tiêu 2]
[mục tiêu 3]

###THEORY###
[nội dung lý thuyết, công thức, định nghĩa - viết tự do bằng tiếng Việt, dùng LaTeX thoải mái]

###EXAMPLES###
VÍ DỤ 1 (Nhận biết):
Bài toán: [đề bài]
Lời giải: [lời giải từng bước]
Mẹo: [mẹo giải nếu có]

VÍ DỤ 2 (Thông hiểu):
Bài toán: [đề bài]
Lời giải: [lời giải]
Mẹo: [mẹo]

VÍ DỤ 3 (Vận dụng):
Bài toán: [đề bài]
Lời giải: [lời giải]
Mẹo: [mẹo]

###EXERCISES###
CÂU 1 ([độ khó]):
Đề: [nội dung câu hỏi]
A. [đáp án A]
B. [đáp án B]
C. [đáp án C]
D. [đáp án D]
Đáp án: [A/B/C/D]
Lời giải: [lời giải]

CÂU 2 ([độ khó]):
Đề: [nội dung câu hỏi]
A. [đáp án A]
B. [đáp án B]
C. [đáp án C]
D. [đáp án D]
Đáp án: [A/B/C/D]
Lời giải: [lời giải]

###SUMMARY###
[tổng kết bài học]

###TIPS###
[mẹo nhớ công thức]`,
      }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    if (!text) throw new Error('Empty response from Claude API')

    const lessonPlan = parseResponse(text)

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
