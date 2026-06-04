import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'
import { getPlanLimits } from '@/lib/plans'
import { createAiCompletion } from '@/lib/ai-router'

const SYSTEM_PROMPT = `Bạn là chuyên gia từ vựng tiếng Anh dành cho học sinh THPT Việt Nam luyện thi.
Hãy tạo bộ từ vựng theo yêu cầu của học sinh và trả về ĐÚNG định dạng JSON sau (không thêm markdown hay text khác):

{
  "set_name": "Tên bộ từ vựng (ngắn gọn, tiếng Việt/Anh)",
  "description": "Mô tả ngắn về bộ từ này",
  "topic": "Chủ đề chính (1 cụm từ tiếng Anh, ví dụ: Environment, Technology, Health)",
  "words": [
    {
      "word": "từ tiếng Anh",
      "pronunciation": "/phiên âm IPA/",
      "part_of_speech": "n/v/adj/adv/phrase",
      "definition_vi": "nghĩa tiếng Việt ngắn gọn",
      "definition_en": "short English definition",
      "level": "A2/B1/B2/C1/C2",
      "synonyms": ["syn1", "syn2"],
      "antonyms": ["ant1"],
      "example_sentence": "Câu ví dụ sử dụng từ này."
    }
  ],
  "questions": [
    {
      "question_text": "Nội dung câu hỏi",
      "option_a": "...",
      "option_b": "...",
      "option_c": "...",
      "option_d": "...",
      "correct_answer": "A/B/C/D",
      "question_type": "synonym/antonym/fill_blank/meaning/collocation",
      "difficulty": "basic/intermediate/advanced",
      "explanation": "Giải thích tại sao đáp án đúng"
    }
  ]
}

Yêu cầu:
- Mỗi từ phải có phiên âm IPA chính xác
- Nghĩa tiếng Việt phải tự nhiên, dùng trong văn nói/viết học thuật
- Câu ví dụ phải sát với ngữ cảnh thi THPT/HSA
- Câu hỏi đa dạng: synonym, antonym, fill_blank, meaning
- Độ khó phân bổ hợp lý (khoảng 40% basic, 40% intermediate, 20% advanced)`

// Rate limit: check AI requests today
async function checkRateLimit(supabase: ReturnType<typeof createAdminClient>, userId: string, planLimits: ReturnType<typeof getPlanLimits>): Promise<boolean> {
  const limit = planLimits.aiVocabPerMonth
  if (limit === -1) return true // unlimited

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { count } = await supabase
    .from('vocab_ai_requests')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'completed')
    .gte('created_at', startOfMonth.toISOString())

  return (count ?? 0) < limit
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createAdminClient()
  const userId = session.user.id

  // Get user plan
  const { data: userData } = await supabase
    .from('users')
    .select('plan')
    .eq('id', userId)
    .single()

  const planLimits = getPlanLimits(userData?.plan)

  // Rate limit check
  const withinLimit = await checkRateLimit(supabase, userId, planLimits)
  if (!withinLimit) {
    return NextResponse.json(
      { error: 'Đã hết lượt tạo từ vựng AI trong tháng này. Nâng cấp gói để dùng thêm.' },
      { status: 429 }
    )
  }

  const body = await req.json()
  const { prompt, wordCount = 15 } = body as { prompt: string; wordCount?: number }

  if (!prompt?.trim()) {
    return NextResponse.json({ error: 'Prompt không được để trống' }, { status: 400 })
  }

  const safeWordCount = Math.min(Math.max(5, wordCount), 30)

  // Create pending request log
  const { data: requestLog } = await supabase
    .from('vocab_ai_requests')
    .insert({ user_id: userId, prompt: prompt.trim(), status: 'pending' })
    .select('id')
    .single()

  const requestId = requestLog?.id

  try {
    const response = await createAiCompletion({
      model: process.env.AI_VOCAB_MODEL ?? 'claude-haiku-4-5',
      maxTokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `Tạo ${safeWordCount} từ vựng: ${prompt.trim()}` }],
    })

    const rawContent = response.text

    // Parse JSON — AI should return pure JSON per system prompt
    let parsed: {
      set_name: string
      description: string
      topic: string
      words: Array<Record<string, unknown>>
      questions: Array<Record<string, unknown>>
    }

    try {
      // Strip potential markdown code blocks
      const jsonText = rawContent.replace(/```json?\n?/g, '').replace(/```\n?/g, '').trim()
      parsed = JSON.parse(jsonText)
    } catch {
      throw new Error('Claude không trả về JSON hợp lệ')
    }

    if (!parsed.words?.length) {
      throw new Error('Không có từ vựng trong kết quả')
    }

    // Insert vocab set
    const { data: newSet, error: setError } = await supabase
      .from('vocab_sets')
      .insert({
        name: (parsed.set_name ?? prompt.slice(0, 80)).trim(),
        description: parsed.description ?? '',
        topic: parsed.topic ?? '',
        is_ai_generated: true,
        is_public: false,
        created_by: userId,
      })
      .select('id')
      .single()

    if (setError || !newSet) throw new Error('Không thể tạo bộ từ')

    const setId = newSet.id

    // Insert words
    const wordsToInsert = parsed.words.map((w, i) => ({
      set_id: setId,
      word: String(w.word ?? '').toLowerCase().trim(),
      pronunciation: String(w.pronunciation ?? ''),
      part_of_speech: String(w.part_of_speech ?? ''),
      definition_vi: String(w.definition_vi ?? ''),
      definition_en: String(w.definition_en ?? ''),
      level: String(w.level ?? 'B1'),
      synonyms: Array.isArray(w.synonyms) ? w.synonyms.map(String) : [],
      antonyms: Array.isArray(w.antonyms) ? w.antonyms.map(String) : [],
      example_sentence: String(w.example_sentence ?? ''),
      order_index: i,
    }))

    await supabase.from('vocab_set_words').insert(wordsToInsert)

    // Insert questions
    if (parsed.questions?.length) {
      const questionsToInsert = (parsed.questions as Array<Record<string, unknown>>).map((q) => ({
        set_id: setId,
        question_text: String(q.question_text ?? ''),
        option_a: String(q.option_a ?? ''),
        option_b: String(q.option_b ?? ''),
        option_c: String(q.option_c ?? ''),
        option_d: String(q.option_d ?? ''),
        correct_answer: String(q.correct_answer ?? 'A').toUpperCase(),
        explanation: String(q.explanation ?? ''),
        question_type: String(q.question_type ?? 'fill_blank'),
        difficulty: String(q.difficulty ?? 'basic'),
      }))
      await supabase.from('vocab_questions').insert(questionsToInsert)
    }

    // Update request log as completed
    if (requestId) {
      await supabase
        .from('vocab_ai_requests')
        .update({ status: 'completed', result_set_id: setId })
        .eq('id', requestId)
    }

    return NextResponse.json({
      success: true,
      set_id: setId,
      word_count: wordsToInsert.length,
      question_count: parsed.questions?.length ?? 0,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'

    if (requestId) {
      await supabase
        .from('vocab_ai_requests')
        .update({ status: 'failed', error_message: message })
        .eq('id', requestId)
    }

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
