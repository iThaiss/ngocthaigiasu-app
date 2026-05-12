import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: process.env.ANTHROPIC_BASE_URL,
})

interface ModelConfig {
  model: string
  limit: number
  label: string
}

function getModelConfig(isVip: boolean, vipExpiresAt: string | null): ModelConfig {
  if (!isVip) return { model: 'claude-haiku-4-5', limit: 3, label: 'Claude Haiku' }
  const expiresAt = vipExpiresAt ? new Date(vipExpiresAt) : null
  const daysLeft = expiresAt ? (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24) : 0
  if (daysLeft > 200) return { model: 'claude-sonnet-4-6', limit: 50, label: 'Claude Sonnet (VIP Năm)' }
  return { model: 'claude-sonnet-4-6', limit: 20, label: 'Claude Sonnet (VIP Tháng)' }
}

const SOLVE_PROMPT = `Bạn là gia sư Toán chuyên nghiệp tại Việt Nam.
Đọc bài toán trong ảnh và giải chi tiết từng bước bằng tiếng Việt.

Xác định question_type:
- "multiple_choice": đề có lựa chọn A., B., C., D. hoặc A), B), C), D)
- "true_false": đề có mệnh đề a), b), c), d) yêu cầu xác định Đúng/Sai
- "short_answer": đề yêu cầu tính/tìm một số cụ thể

Xác định needs_visual = true nếu đề có: "hình vẽ bên", "như hình", "hình bên", "đồ thị bên", "bảng biến thiên", "theo đồ thị", "bảng số liệu"

Trả về JSON thuần túy (KHÔNG markdown, KHÔNG \`\`\`):
{
  "problem": "nội dung bài toán đọc được",
  "topic": "chủ đề chính (Đạo hàm/Tích phân/Xác suất/...)",
  "subtopic": "chủ đề phụ cụ thể",
  "difficulty": "Nhận biết | Thông hiểu | Vận dụng | Vận dụng cao",
  "question_type": "multiple_choice | true_false | short_answer",
  "option_a": "nội dung đáp án A (null nếu không phải multiple_choice)",
  "option_b": "nội dung đáp án B (null nếu không phải multiple_choice)",
  "option_c": "nội dung đáp án C (null nếu không phải multiple_choice)",
  "option_d": "nội dung đáp án D (null nếu không phải multiple_choice)",
  "correct_answer": "A | B | C | D (null nếu không phải multiple_choice)",
  "statements": [
    {"label": "a", "text": "mệnh đề a", "answer": true},
    {"label": "b", "text": "mệnh đề b", "answer": false},
    {"label": "c", "text": "mệnh đề c", "answer": true},
    {"label": "d", "text": "mệnh đề d", "answer": false}
  ],
  "numeric_answer": null,
  "needs_visual": false,
  "visual_description": null,
  "steps": [
    {"step": 1, "title": "Phân tích đề", "content": "...LaTeX: $x^2$..."},
    {"step": 2, "title": "Lời giải", "content": "..."},
    {"step": 3, "title": "Kết luận", "content": "..."}
  ],
  "answer": "Đáp án: ...",
  "tips": "Mẹo giải nhanh nếu có, null nếu không",
  "is_math": true
}`

function extractJSON(text: string): unknown {
  // Strip markdown code fences (any variant)
  text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

  // Find outermost JSON object
  const start = text.indexOf('{')
  const end   = text.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('No JSON object found in response')

  return JSON.parse(text.substring(start, end + 1))
}

async function callClaudeWithRetry(
  client: Anthropic,
  params: Anthropic.MessageCreateParamsNonStreaming,
  maxRetries = 3
): Promise<string> {
  for (let i = 0; i < maxRetries; i++) {
    const response = await client.messages.create(params)
    const text = response.content[0]?.type === 'text' ? response.content[0].text : ''
    if (text.trim().length > 0) return text
    console.log(`[solve] empty response, retry ${i + 1}/${maxRetries}`)
  }
  throw new Error('Claude returned empty response after retries')
}

interface Solution {
  problem: string
  topic: string
  subtopic: string
  difficulty: string
  question_type: 'multiple_choice' | 'true_false' | 'short_answer'
  option_a: string | null
  option_b: string | null
  option_c: string | null
  option_d: string | null
  correct_answer: string | null
  statements: { label: string; text: string; answer: boolean }[] | null
  numeric_answer: number | null
  needs_visual: boolean
  visual_description: string | null
  steps: { step: number; title: string; content: string }[]
  answer: string
  tips: string | null
  is_math: boolean
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id
  const modelConfig = getModelConfig(session.user.isVip, session.user.vipExpiresAt)
  const today = new Date().toISOString().slice(0, 10)
  const supabase = createAdminClient()

  const [{ data: dailyRow }, { data: history }] = await Promise.all([
    supabase
      .from('daily_solve_count')
      .select('count')
      .eq('user_id', userId)
      .eq('date', today)
      .single(),
    supabase
      .from('solve_history')
      .select('id, problem_text, topic, difficulty, model_used, image_url, solution, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  let usedToday = dailyRow?.count ?? 0

  // Reset daily count if user upgraded to VIP today (so Free uses don't eat into VIP quota)
  if (session.user.isVip && usedToday > 0) {
    const { data: vipTx } = await supabase
      .from('transactions')
      .select('created_at')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('created_at', today)
      .limit(1)
      .single()
    if (vipTx) {
      await supabase.from('daily_solve_count').upsert(
        { user_id: userId, date: today, count: 0 },
        { onConflict: 'user_id,date' }
      )
      usedToday = 0
    }
  }

  return NextResponse.json({
    usedToday,
    limit: modelConfig.limit,
    remaining: Math.max(0, modelConfig.limit - usedToday),
    model: modelConfig.model,
    modelLabel: modelConfig.label,
    isVip: session.user.isVip,
    history: history ?? [],
  })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id
  const modelConfig = getModelConfig(session.user.isVip, session.user.vipExpiresAt)
  const today = new Date().toISOString().slice(0, 10)
  const supabase = createAdminClient()

  // === STEP 1: validate + check limit ===
  console.log('=== STEP 1: validate + check limit ===')
  const { data: dailyRow } = await supabase
    .from('daily_solve_count')
    .select('count')
    .eq('user_id', userId)
    .eq('date', today)
    .single()

  let currentCount = dailyRow?.count ?? 0

  // Reset daily count if user upgraded to VIP today
  if (session.user.isVip && currentCount > 0) {
    const { data: vipTx } = await supabase
      .from('transactions')
      .select('created_at')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('created_at', today)
      .limit(1)
      .single()
    if (vipTx) {
      await supabase.from('daily_solve_count').upsert(
        { user_id: userId, date: today, count: 0 },
        { onConflict: 'user_id,date' }
      )
      currentCount = 0
    }
  }

  if (currentCount >= modelConfig.limit) {
    return NextResponse.json(
      { error: 'Hết lượt', limit: modelConfig.limit, used: currentCount, isVip: session.user.isVip },
      { status: 429 }
    )
  }

  let file: File | null = null
  try {
    const formData = await req.formData()
    file = formData.get('image') as File | null
  } catch {
    return NextResponse.json({ error: 'Lỗi đọc form data' }, { status: 400 })
  }

  if (!file) return NextResponse.json({ error: 'Không có ảnh' }, { status: 400 })

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Chỉ chấp nhận JPG, PNG, WEBP' }, { status: 400 })
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'File quá lớn, tối đa 10MB' }, { status: 400 })
  }

  // === STEP 2: Call Claude API + parse JSON ===
  console.log('=== STEP 2: Call Claude API ===')
  const imageData = await file.arrayBuffer()
  const base64Image = Buffer.from(imageData).toString('base64')
  const mediaType = file.type as 'image/jpeg' | 'image/png' | 'image/webp'

  let solution: Solution
  try {
    const rawText = await callClaudeWithRetry(anthropic, {
      model: modelConfig.model,
      max_tokens: 4000,
      system: "Bạn là gia sư Toán chuyên nghiệp tại Việt Nam. Nhiệm vụ duy nhất là đọc bài toán từ ảnh và trả về JSON giải toán. KHÔNG chào hỏi, KHÔNG giải thích thêm, CHỈ trả về JSON thuần túy. Nếu ảnh không phải bài toán, trả về {\"is_math\": false}.",
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64Image },
          },
          { type: 'text', text: SOLVE_PROMPT },
        ],
      }],
    })
    try {
      solution = extractJSON(rawText) as Solution
    } catch (parseErr) {
      console.error('[solve] JSON parse error:', parseErr)
      console.error('[solve] raw response:', rawText)
      throw parseErr
    }
  } catch (err) {
    console.error('[solve] Claude API error:', err)
    return NextResponse.json({ error: 'Lỗi phân tích ảnh, vui lòng thử lại' }, { status: 500 })
  }

  if (!solution.is_math) {
    return NextResponse.json({ error: 'Không phải bài toán' }, { status: 400 })
  }

  // Insert question (non-blocking, fire-and-forget)
  ;(async () => {
    const questionData: Record<string, unknown> = {
      question_type: solution.question_type || 'short_answer',
      topic: solution.topic,
      subtopic: solution.subtopic,
      question_text: solution.problem,
      difficulty: solution.difficulty,
      explanation: JSON.stringify(solution.steps),
      answer_source: 'AI_generated',
      is_published: false,
      needs_review: true,
      needs_visual: solution.needs_visual || false,
      visual_description: solution.visual_description || null,
    }
    if (solution.question_type === 'multiple_choice') {
      questionData.option_a = solution.option_a
      questionData.option_b = solution.option_b
      questionData.option_c = solution.option_c
      questionData.option_d = solution.option_d
      questionData.correct_answer = solution.correct_answer
    } else if (solution.question_type === 'true_false') {
      questionData.statements = JSON.stringify(solution.statements)
    } else {
      questionData.numeric_answer = solution.numeric_answer
    }
    const { error } = await supabase.from('questions').insert(questionData)
    if (error) console.error('Question insert error:', error)
  })()

  // === STEP 3: Upload ảnh (fail cũng không sao) ===
  console.log('=== STEP 3: Upload image ===')
  let imageUrl: string | null = null
  try {
    const { error: bucketError } = await supabase.storage.getBucket('solve-images')
    if (bucketError) {
      console.error('[solve] bucket solve-images not found:', bucketError.message)
    } else {
      const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
      const path = `${userId}/${Date.now()}.${ext}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('solve-images')
        .upload(path, Buffer.from(imageData), { contentType: file.type, upsert: false })
      if (uploadData && !uploadError) {
        const { data: urlData } = supabase.storage.from('solve-images').getPublicUrl(path)
        imageUrl = urlData.publicUrl
        console.log('[solve] image uploaded:', imageUrl)
      }
      if (uploadError) console.error('[solve] upload error:', uploadError.message)
    }
  } catch (err) {
    console.error('[solve] storage exception:', err)
  }

  // === STEP 4: INSERT solve_history ===
  console.log('=== STEP 4: INSERT solve_history ===')
  try {
    console.log('Attempting to insert solve_history...')
    console.log('user_id:', userId)
    console.log('solution snippet:', JSON.stringify(solution).substring(0, 100))
    const { data: historyData, error: historyError } = await supabase.from('solve_history').insert({
      user_id: userId,
      image_url: imageUrl,
      problem_text: solution.problem,
      solution,
      topic: solution.topic,
      difficulty: solution.difficulty,
      model_used: modelConfig.model,
    })
    if (historyError) {
      console.error('solve_history INSERT error:', JSON.stringify(historyError))
    } else {
      console.log('solve_history INSERT success:', historyData)
    }
  } catch (err) {
    console.error('[solve] solve_history INSERT exception:', err)
  }

  // === STEP 5: Find related questions ===
  console.log('=== STEP 5: Find related questions ===')
  console.log('[solve] topic:', solution.topic, '| subtopic:', solution.subtopic)

  const QUESTION_FIELDS = 'id, question_text, difficulty, topic, correct_answer, option_a, option_b, option_c, option_d, question_type, statements, numeric_answer'

  let relatedQuestions: unknown[] = []
  try {
    const { data: topicData } = await supabase
      .from('questions')
      .select(QUESTION_FIELDS)
      .eq('is_published', true)
      .or(`topic.ilike.%${solution.topic}%,subtopic.ilike.%${solution.subtopic}%`)
      .neq('answer_source', 'AI_generated')
      .limit(5)
    relatedQuestions = topicData ?? []
    console.log('[solve] topic-match count:', relatedQuestions.length)
  } catch (err) {
    console.error('[solve] related questions query error:', err)
  }

  if (relatedQuestions.length === 0) {
    console.log('[solve] no topic-match, fallback to random multiple_choice')
    try {
      const { data: fallbackData } = await supabase
        .from('questions')
        .select(QUESTION_FIELDS)
        .eq('is_published', true)
        .eq('question_type', 'multiple_choice')
        .neq('answer_source', 'AI_generated')
        .limit(5)
      relatedQuestions = fallbackData ?? []
    } catch (err) {
      console.error('[solve] fallback query error:', err)
    }
  }
  console.log('[solve] related questions count:', relatedQuestions.length)

  // Upsert daily count
  await supabase.from('daily_solve_count').upsert(
    { user_id: userId, date: today, count: currentCount + 1 },
    { onConflict: 'user_id,date' }
  )

  // === STEP 6: Return response ===
  console.log('=== STEP 6: Return response ===')
  return NextResponse.json({
    solution,
    relatedQuestions,
    remainingToday: Math.max(0, modelConfig.limit - (currentCount + 1)),
    limit: modelConfig.limit,
    modelUsed: modelConfig.model,
    modelLabel: modelConfig.label,
  })
}
