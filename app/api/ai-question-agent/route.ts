import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAiCompletion, RouterMessage } from '@/lib/ai-router'

export const preferredRegion = ['sin1', 'hnd1']

type AgentMode = 'practice' | 'exam' | 'solve'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface QuestionContext {
  title?: string
  questionText: string
  type?: string | null
  topic?: string | null
  subtopic?: string | null
  difficulty?: string | null
  options?: Record<string, string | null>
  statements?: Array<{ label: string; text: string; answer?: boolean }>
  correctAnswer?: string | number | null
  numericAnswer?: number | null
  explanation?: string | null
  solutionSteps?: Array<{ step: number; title: string; content: string }>
  userAnswer?: string | null
  answered?: boolean
  imageUrl?: string | null
}

function trimText(value: unknown, max = 6000): string {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, max)
}

function normalizeMessages(messages: unknown): ChatMessage[] {
  if (!Array.isArray(messages)) return []
  return messages
    .slice(-8)
    .map((message) => {
      if (!message || typeof message !== 'object') return null
      const raw = message as Partial<ChatMessage>
      const role = raw.role === 'assistant' ? 'assistant' : raw.role === 'user' ? 'user' : null
      const content = trimText(raw.content, 1200)
      if (!role || !content) return null
      return { role, content }
    })
    .filter(Boolean) as ChatMessage[]
}

function buildModeInstruction(mode: AgentMode, context: QuestionContext): string {
  if (mode === 'exam') {
    return context.answered
      ? 'Người học đã submit câu này trong chế độ học tập. Có thể giải thích ngắn gọn vì sao hướng làm đúng/sai, nhưng vẫn không lan man.'
      : 'Đây là chế độ luyện đề học tập. Chỉ đưa gợi ý, lý thuyết nền hoặc cách loại trừ. Tuyệt đối không tiết lộ đáp án cuối cùng, không giải trọn bài, kể cả khi người học hỏi trực tiếp.'
  }

  if (mode === 'solve') {
    return 'Đây là màn giải bài AI. Có thể giải thích trực tiếp, soi từng bước lời giải, đưa cách khác, hoặc kiểm tra vì sao một bước đúng/sai.'
  }

  return context.answered
    ? 'Người học đã trả lời câu luyện tập. Có thể giải thích đáp án đúng, lỗi sai và cách nhớ dạng bài.'
    : 'Đây là chế độ luyện tập. Ưu tiên gợi ý và dẫn dắt; nếu người học hỏi đáp án thì được giải thích rõ nhưng vẫn nên kèm phương pháp.'
}

function stringifyContext(context: QuestionContext): string {
  return JSON.stringify({
    title: trimText(context.title, 300),
    questionText: trimText(context.questionText, 3000),
    type: context.type ?? null,
    topic: context.topic ?? null,
    subtopic: context.subtopic ?? null,
    difficulty: context.difficulty ?? null,
    options: context.options ?? null,
    statements: context.statements ?? null,
    correctAnswer: context.correctAnswer ?? null,
    numericAnswer: context.numericAnswer ?? null,
    explanation: trimText(context.explanation, 3000) || null,
    solutionSteps: context.solutionSteps ?? null,
    userAnswer: trimText(context.userAnswer, 500) || null,
    answered: Boolean(context.answered),
  })
}

function getTutorMaxTokens() {
  const value = Number(process.env.AI_TUTOR_MAX_TOKENS ?? 350)
  return Number.isFinite(value) ? Math.min(500, Math.max(150, Math.floor(value))) : 350
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: {
    mode?: AgentMode
    context?: QuestionContext
    messages?: ChatMessage[]
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Payload không hợp lệ' }, { status: 400 })
  }

  const mode: AgentMode = body.mode === 'exam' || body.mode === 'solve' ? body.mode : 'practice'
  const questionText = trimText(body.context?.questionText, 3000)
  if (!questionText) return NextResponse.json({ error: 'Thiếu nội dung câu hỏi' }, { status: 400 })

  const context: QuestionContext = { ...body.context, questionText }
  const messages = normalizeMessages(body.messages)
  if (!messages.length || messages[messages.length - 1].role !== 'user') {
    return NextResponse.json({ error: 'Thiếu câu hỏi của học sinh' }, { status: 400 })
  }

  const hasImage = !!(context.imageUrl)
  const model = hasImage
    ? (process.env.AI_VISION_MODEL ?? process.env.AI_TUTOR_MODEL ?? 'claude-haiku-4-5')
    : (process.env.AI_TUTOR_MODEL ?? 'claude-haiku-4-5')

  const routerMessages: RouterMessage[] = messages.map((message, i) => {
    if (i === messages.length - 1 && message.role === 'user' && context.imageUrl) {
      return {
        role: message.role,
        content: [
          { type: 'text' as const, text: message.content },
          { type: 'image' as const, source: { type: 'url' as const, url: context.imageUrl } },
        ],
      }
    }
    return { role: message.role, content: message.content }
  })

  try {
    const response = await createAiCompletion({
      model,
      maxTokens: getTutorMaxTokens(),
      temperature: 0.25,
      system: `Bạn là AI agent gia sư Toán cho học sinh Việt Nam.
Trả lời bằng tiếng Việt, thân thiện, cực ngắn gọn: tối đa 4 ý chính.
Luôn bám sát "câu hiện tại" trong CONTEXT, không tự bịa đề khác.
Khi có LaTeX, dùng cú pháp $...$ hoặc $$...$$.
Nếu dữ kiện trong câu chưa đủ, nói rõ cần thêm thông tin nào.
Nếu câu hỏi đang ở chế độ luyện đề học tập và chưa submit, chỉ gợi ý để học sinh tự làm; không nêu đáp án, không viết lời giải hoàn chỉnh.
${buildModeInstruction(mode, context)}

CONTEXT:
${stringifyContext(context)}`,
      messages: routerMessages,
    })

    const answer = response.text
    if (!answer.trim()) throw new Error('Empty tutor response')

    return NextResponse.json({ answer })
  } catch (error) {
    console.error('[ai-question-agent] error:', error)
    return NextResponse.json({ error: 'AI agent đang bận, vui lòng thử lại sau.' }, { status: 500 })
  }
}
