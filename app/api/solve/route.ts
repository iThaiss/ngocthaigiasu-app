import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'
import { GoogleGenerativeAI } from '@google/generative-ai'

interface ModelConfig {
  model: string
  limit: number
  label: string
}

function getModelConfig(isVip: boolean, vipExpiresAt: string | null): ModelConfig {
  if (!isVip) return { model: 'gemini-2.5-flash-lite-preview-06-17', limit: 3, label: 'Gemini 2.5 Flash-Lite' }
  const expiresAt = vipExpiresAt ? new Date(vipExpiresAt) : null
  const daysLeft = expiresAt
    ? (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    : 0
  if (daysLeft > 200 || (expiresAt && expiresAt.getFullYear() > 2050)) {
    return { model: 'gemini-2.5-pro', limit: 50, label: 'Gemini 2.5 Pro' }
  }
  return { model: 'gemini-2.5-flash', limit: 20, label: 'Gemini 2.5 Flash' }
}

const SOLVE_PROMPT = `Bạn là gia sư Toán 12 chuyên nghiệp tại Việt Nam.
Hãy đọc ảnh bài toán và giải chi tiết bằng tiếng Việt.

Trả về JSON với format sau (KHÔNG có markdown, KHÔNG có \`\`\`):
{
  "problem": "nội dung bài toán đã đọc được từ ảnh",
  "steps": [
    {"step": 1, "title": "Phân tích đề bài", "content": "nội dung chi tiết, dùng LaTeX: $x^2+1$"},
    {"step": 2, "title": "Lời giải", "content": "..."},
    {"step": 3, "title": "Kết luận", "content": "..."}
  ],
  "answer": "Đáp án: A (hoặc kết quả số)",
  "tips": "Mẹo giải nhanh nếu có, để null nếu không có",
  "topics": ["Tích phân", "Nguyên hàm"],
  "difficulty": "Nhận biết | Thông hiểu | Vận dụng | Vận dụng cao",
  "is_math": true
}`

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
      .select('id, problem_text, topics, difficulty, model_used, image_url, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5),
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

  // Check daily limit
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

  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Chỉ chấp nhận JPG, PNG, PDF' }, { status: 400 })
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'File quá lớn, tối đa 10MB' }, { status: 400 })
  }

  const arrayBuffer = await file.arrayBuffer()
  const base64 = Buffer.from(arrayBuffer).toString('base64')

  // Call Gemini API
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  const geminiModel = genAI.getGenerativeModel({ model: modelConfig.model })

  let solution: {
    problem: string
    steps: { step: number; title: string; content: string }[]
    answer: string
    tips: string | null
    topics: string[]
    difficulty: string
    is_math: boolean
  }

  try {
    const result = await geminiModel.generateContent([
      { inlineData: { mimeType: file.type as 'image/jpeg' | 'image/png' | 'application/pdf', data: base64 } },
      SOLVE_PROMPT,
    ])
    const rawText = result.response.text()
    const cleaned = rawText
      .replace(/^```json\s*/m, '')
      .replace(/\s*```$/m, '')
      .trim()
    solution = JSON.parse(cleaned)
  } catch (err) {
    console.error('Gemini error:', err)
    return NextResponse.json({ error: 'Lỗi phân tích ảnh, vui lòng thử lại' }, { status: 500 })
  }

  if (!solution.is_math) {
    return NextResponse.json({ error: 'Không phải bài toán' }, { status: 400 })
  }

  // Find related questions
  const topics = solution.topics ?? []
  let relatedQuestions: { id: string; question_text: string; difficulty: string | null; correct_answer: string | null }[] = []
  if (topics.length > 0) {
    const { data } = await supabase
      .from('questions')
      .select('id, question_text, difficulty, correct_answer')
      .eq('question_type', 'multiple_choice')
      .ilike('question_text', `%${topics[0]}%`)
      .limit(5)
    relatedQuestions = data ?? []
  }

  // Upload image to Storage
  let imageUrl: string | null = null
  try {
    const ext = file.type === 'application/pdf' ? 'pdf' : file.type === 'image/png' ? 'png' : 'jpg'
    const path = `${userId}/${Date.now()}.${ext}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('solve-images')
      .upload(path, Buffer.from(arrayBuffer), { contentType: file.type, upsert: false })
    if (uploadData && !uploadError) {
      const { data: urlData } = supabase.storage.from('solve-images').getPublicUrl(path)
      imageUrl = urlData.publicUrl
    }
  } catch (err) {
    console.error('Storage upload error:', err)
  }

  // Save solve_history
  await supabase.from('solve_history').insert({
    user_id: userId,
    image_url: imageUrl,
    problem_text: solution.problem,
    solution,
    topics: solution.topics,
    difficulty: solution.difficulty,
    model_used: modelConfig.model,
  })

  // Update daily count
  if (dailyRow) {
    await supabase
      .from('daily_solve_count')
      .update({ count: currentCount + 1 })
      .eq('user_id', userId)
      .eq('date', today)
  } else {
    await supabase
      .from('daily_solve_count')
      .insert({ user_id: userId, date: today, count: 1 })
  }

  return NextResponse.json({
    solution,
    relatedQuestions,
    modelUsed: modelConfig.model,
    modelLabel: modelConfig.label,
    remainingToday: Math.max(0, modelConfig.limit - (currentCount + 1)),
    limit: modelConfig.limit,
  })
}
