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

Trả về JSON thuần túy (KHÔNG markdown, KHÔNG \`\`\`):
{
  "problem": "nội dung bài toán đọc được",
  "topic": "chủ đề chính (Đạo hàm/Tích phân/Xác suất/...)",
  "subtopic": "chủ đề phụ cụ thể",
  "difficulty": "Nhận biết | Thông hiểu | Vận dụng | Vận dụng cao",
  "steps": [
    {"step": 1, "title": "Phân tích đề", "content": "...LaTeX: $x^2$..."},
    {"step": 2, "title": "Lời giải", "content": "..."},
    {"step": 3, "title": "Kết luận", "content": "..."}
  ],
  "answer": "Đáp án: ...",
  "tips": "Mẹo giải nhanh nếu có, null nếu không",
  "is_math": true
}`

interface Solution {
  problem: string
  topic: string
  subtopic: string
  difficulty: string
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

  const usedToday = dailyRow?.count ?? 0

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

  // Step 1: Check daily limit
  const { data: dailyRow } = await supabase
    .from('daily_solve_count')
    .select('count')
    .eq('user_id', userId)
    .eq('date', today)
    .single()

  const currentCount = dailyRow?.count ?? 0
  if (currentCount >= modelConfig.limit) {
    return NextResponse.json(
      { error: 'Hết lượt', limit: modelConfig.limit, used: currentCount, isVip: session.user.isVip },
      { status: 429 }
    )
  }

  // Parse form data
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

  // Step 2: Call Claude API with image
  const imageData = await file.arrayBuffer()
  const base64Image = Buffer.from(imageData).toString('base64')
  const mediaType = file.type as 'image/jpeg' | 'image/png' | 'image/webp'

  let solution: Solution
  try {
    const response = await anthropic.messages.create({
      model: modelConfig.model,
      max_tokens: 4000,
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

    const rawText = response.content[0].type === 'text' ? response.content[0].text : ''
    const cleaned = rawText
      .replace(/^```json\s*/m, '')
      .replace(/^```\s*/m, '')
      .replace(/\s*```$/m, '')
      .trim()
    solution = JSON.parse(cleaned)
  } catch (err) {
    console.error('Claude API error:', err)
    return NextResponse.json({ error: 'Lỗi phân tích ảnh, vui lòng thử lại' }, { status: 500 })
  }

  if (!solution.is_math) {
    return NextResponse.json({ error: 'Không phải bài toán' }, { status: 400 })
  }

  // Step 3: Insert question (non-blocking)
  supabase.from('questions').insert({
    question_type: 'short_answer',
    topic: solution.topic,
    subtopic: solution.subtopic,
    question_text: solution.problem,
    explanation: JSON.stringify(solution.steps),
    answer_source: 'AI_generated',
    is_published: false,
    needs_review: true,
  }).then(({ error }) => {
    if (error) console.error('Question insert error:', error)
  })

  // Step 4 + 5: Upload image & find related questions in parallel
  console.log('[solve] topic detected:', solution.topic, '| subtopic:', solution.subtopic)

  const [imageUrl, { data: topicData }] = await Promise.all([
    (async (): Promise<string | null> => {
      try {
        const { error: bucketError } = await supabase.storage.getBucket('solve-images')
        if (bucketError) {
          console.error('[solve] bucket solve-images not found:', bucketError.message)
          return null
        }
        const ext = file!.type === 'image/png' ? 'png' : file!.type === 'image/webp' ? 'webp' : 'jpg'
        const path = `${userId}/${Date.now()}.${ext}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('solve-images')
          .upload(path, Buffer.from(imageData), { contentType: file!.type, upsert: false })
        if (uploadData && !uploadError) {
          const { data: urlData } = supabase.storage.from('solve-images').getPublicUrl(path)
          return urlData.publicUrl
        }
        if (uploadError) console.error('[solve] upload error:', uploadError.message)
      } catch (err) {
        console.error('[solve] storage exception:', err)
      }
      return null
    })(),
    supabase
      .from('questions')
      .select('id, question_text, question_type, difficulty, topic, correct_answer, option_a, option_b, option_c, option_d, numeric_answer, explanation, statement_a, statement_b, statement_c, statement_d, answer_a, answer_b, answer_c, answer_d')
      .eq('is_published', true)
      .or(`topic.ilike.%${solution.topic}%,subtopic.ilike.%${solution.subtopic}%`)
      .neq('answer_source', 'AI_generated')
      .limit(5),
  ])

  // Fallback: nếu không tìm được theo topic → lấy 5 câu multiple_choice ngẫu nhiên
  let relatedQuestions = topicData ?? []
  if (relatedQuestions.length === 0) {
    console.log('[solve] no topic-match found, fallback to random questions')
    const { data: fallbackData } = await supabase
      .from('questions')
      .select('id, question_text, question_type, difficulty, topic, correct_answer, option_a, option_b, option_c, option_d, numeric_answer, explanation, statement_a, statement_b, statement_c, statement_d, answer_a, answer_b, answer_c, answer_d')
      .eq('is_published', true)
      .eq('question_type', 'multiple_choice')
      .limit(5)
    relatedQuestions = fallbackData ?? []
  }
  console.log('[solve] related questions count:', relatedQuestions.length)

  // Step 6: Save solve_history — try/catch riêng, không làm crash response
  try {
    const { error: historyError } = await supabase.from('solve_history').insert({
      user_id: userId,
      image_url: imageUrl,
      problem_text: solution.problem,
      solution,
      topic: solution.topic,
      difficulty: solution.difficulty,
      model_used: modelConfig.model,
    })
    if (historyError) {
      console.error('[solve] solve_history INSERT error:', historyError)
    } else {
      console.log('[solve] solve_history INSERT success, user:', userId)
    }
  } catch (err) {
    console.error('[solve] solve_history INSERT exception:', err)
  }

  // Upsert daily count
  await supabase.from('daily_solve_count').upsert(
    { user_id: userId, date: today, count: currentCount + 1 },
    { onConflict: 'user_id,date' }
  )

  // Step 7: Response
  return NextResponse.json({
    solution,
    relatedQuestions,
    remainingToday: Math.max(0, modelConfig.limit - (currentCount + 1)),
    limit: modelConfig.limit,
    modelUsed: modelConfig.model,
    modelLabel: modelConfig.label,
  })
}
