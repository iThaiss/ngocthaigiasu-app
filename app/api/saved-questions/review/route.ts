import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'
import { createAiCompletion } from '@/lib/ai-router'
import { isQuestionStudentReady } from '@/lib/question-readiness'

function trimText(value: unknown, max = 1200) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createAdminClient()
  const { data: saved, error } = await supabase
    .from('saved_questions')
    .select('id, question_id, note, created_at')
    .eq('user_id', session.user.id)
    .eq('source', 'standard_exam')
    .order('created_at', { ascending: false })
    .limit(40)

  if (error) {
    console.error('[saved-questions/review] saved error:', error)
    return NextResponse.json({ error: 'Không tải được câu đã lưu' }, { status: 500 })
  }

  if (!saved?.length) {
    return NextResponse.json({
      review: 'Bạn chưa lưu câu nào. Hãy lưu các câu còn vướng khi luyện đề, rồi quay lại để AI gợi ý kế hoạch ôn tập.',
    })
  }

  const questionIds = saved.map((item) => item.question_id)
  const { data: questions, error: questionsError } = await supabase
    .schema('standard_exam')
    .from('questions')
    .select('id, question_type, question_text, topic, subtopic, canonical_topic_title, canonical_subtopic_title, difficulty, correct_answer, numeric_answer, needs_visual, image_url, visual_image_url')
    .in('id', questionIds)

  if (questionsError) {
    console.error('[saved-questions/review] questions error:', questionsError)
    return NextResponse.json({ error: 'Không tải được nội dung câu đã lưu' }, { status: 500 })
  }

  const questionMap = new Map((questions ?? []).filter((question) => isQuestionStudentReady(question)).map((question) => [question.id, question]))
  const compact = saved.map((item, index) => {
    const question = questionMap.get(item.question_id) as Record<string, unknown> | undefined
    if (!question) return null
    return {
      index: index + 1,
      type: question?.question_type ?? null,
      topic: question?.canonical_topic_title ?? question?.topic ?? null,
      subtopic: question?.canonical_subtopic_title ?? question?.subtopic ?? null,
      difficulty: question?.difficulty ?? null,
      note: item.note ?? null,
      question: trimText(question?.question_text, 500),
    }
  }).filter(Boolean)

  if (!compact.length) {
    return NextResponse.json({
      review: 'Các câu bạn đã lưu hiện chưa đủ hình hoặc đáp án để AI review an toàn. Hãy quay lại sau khi admin hoàn thiện dữ liệu.',
    })
  }

  try {
    const response = await createAiCompletion({
      model: process.env.AI_TUTOR_MODEL ?? 'claude-haiku-4-5',
      maxTokens: 450,
      temperature: 0.2,
      system: `Bạn là gia sư Toán. Hãy review danh sách câu học sinh đã lưu để ôn tập.
Trả lời bằng tiếng Việt, ngắn gọn, thực dụng.
Không giải từng câu. Không nêu đáp án. Chỉ chỉ ra nhóm kiến thức yếu, thứ tự ôn, và 3-5 việc cần làm tiếp theo.`,
      messages: [
        {
          role: 'user',
          content: `Đây là danh sách câu em đã lưu để ôn thêm:\n${JSON.stringify(compact, null, 2)}\n\nHãy cho em kế hoạch ôn tập ngắn gọn.`,
        },
      ],
    })

    return NextResponse.json({ review: response.text })
  } catch (reviewError) {
    console.error('[saved-questions/review] ai error:', reviewError)
    return NextResponse.json({ error: 'AI review đang bận, vui lòng thử lại sau.' }, { status: 500 })
  }
}
