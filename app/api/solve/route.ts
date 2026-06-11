import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'
import { createAiCompletion, type RouterMessage } from '@/lib/ai-router'
import { isQuestionStudentReady } from '@/lib/question-readiness'
import { getModelConfig } from '@/lib/plans'

const SOLVE_PROMPT = `Bạn là gia sư Toán chuyên nghiệp tại Việt Nam.
Nhiệm vụ của bạn là đọc bài toán trong ảnh, giải chi tiết từng bước bằng tiếng Việt theo phong cách sư phạm dễ hiểu, bám sát chương trình THPT Quốc gia.

YÊU CẦU ĐỊNH DẠNG CÔNG THỨC TOÁN (LATEX) VÀ TRÁNH LỖI CÚ PHÁP JSON:
- Dùng ký hiệu đô la đơn $...$ cho các công thức inline (nằm trong dòng văn bản), ví dụ: tập xác định \\\\mathcal{D} = \\\\mathbb{R}$, biến $x$, hàm số $f(x)$.
- BẮT BUỘC dùng ký hiệu đô la kép $$...$$ cho các phương trình lớn, hệ phương trình, giới hạn (lim), tích phân, đạo hàm phức tạp, phân số lớn hoặc ma trận để căn giữa tự động và tránh tràn giao diện trên điện thoại di động. Ví dụ:
  $$f'(x) = x^2 - 10x + 9$$
- QUAN TRỌNG VỀ ESCAPE JSON: Vì kết quả trả về là JSON, tất cả dấu gạch chéo ngược (backslash) của LaTeX trong chuỗi BẮT BUỘC phải được viết dưới dạng double-escaped (gõ hai dấu gạch chéo ngược \\\\).
  Ví dụ: viết \\\\frac{1}{3} (không viết \\frac{1}{3}), viết \\\\{1; 9\\\\} (không viết \\{1; 9\\}), viết \\\\mathbb{R} (không viết \\mathbb{R}). Bất kỳ ký tự gạch chéo ngược đơn nào đứng trước chữ cái hoặc ký tự đặc biệt (như \\{ ) đều gây lỗi cú pháp JSON và làm hỏng ứng dụng.

YÊU CẦU VỀ MẸO GIẢI NHANH (TIPS):
- Chỉ cung cấp mẹo thực tế và hữu dụng, cụ thể là:
  1. Hướng dẫn bấm máy tính Casio fx-580VN X chuẩn xác (Ví dụ: Nhấn MENU 9 -> 2 -> 3 để tìm cực trị hàm số bậc 3; Nhấn MENU 8 để lập bảng giá trị kiểm tra tính đơn điệu; Nhấn SHIFT ∫ (d/dx) để tính đạo hàm tại điểm). Viết rõ từng phím bấm và kết quả hiển thị tiếng Việt trên màn hình máy (như "Cực đại x =", "Cực đại y =").
  2. Công thức giải nhanh chính thức của chương trình thi trắc nghiệm.
  3. Kỹ thuật nhẩm nhanh hoặc loại trừ đáp án nhiễu trực quan.
- TUYỆT ĐỐI không viết mẹo chung chung mang tính sáo rỗng (như "Đọc kỹ đề bài", "Tính toán cẩn thận").
- Nếu bài toán tự luận hoặc không thể áp dụng bất kỳ mẹo thực tế nào, hãy gán giá trị "tips": null.

Xác định question_type:
- "multiple_choice": đề có lựa chọn A., B., C., D. hoặc A), B), C), D)
- "true_false": đề có mệnh đề a), b), c), d) yêu cầu xác định Đúng/Sai
- "short_answer": đề yêu cầu tính/tìm một số cụ thể

Xác định needs_visual = true nếu đề có hình vẽ bên, đồ thị bên, bảng biến thiên, hoặc bảng số liệu.

Đầu ra bắt buộc là một đối tượng JSON chuẩn khớp hoàn toàn với cấu trúc sau:
{
  "problem": "nội dung bài toán đọc được (sử dụng LaTeX $ cho các biểu thức toán)",
  "topic": "chủ đề chính (Đạo hàm | Tích phân | Xác suất | Oxyz |...)",
  "subtopic": "chủ đề phụ cụ thể",
  "difficulty": "Nhận biết | Thông hiểu | Vận dụng | Vận dụng cao",
  "question_type": "multiple_choice | true_false | short_answer",
  "option_a": "nội dung đáp án A (null nếu không phải multiple_choice)",
  "option_b": "nội dung đáp án B (null nếu không phải multiple_choice)",
  "option_c": "nội dung đáp án C (null nếu không phải multiple_choice)",
  "option_d": "nội dung đáp án D (null nếu không phải multiple_choice)",
  "correct_answer": "A | B | C | D (null nếu không phải multiple_choice)",
  "statements": [
    {"label": "a", "text": "nội dung mệnh đề a", "answer": true},
    {"label": "b", "text": "nội dung mệnh đề b", "answer": false},
    {"label": "c", "text": "nội dung mệnh đề c", "answer": true},
    {"label": "d", "text": "nội dung mệnh đề d", "answer": false}
  ],
  "numeric_answer": null,
  "needs_visual": false,
  "visual_description": "mô tả hình vẽ/đồ thị nếu cần thiết, null nếu không",
  "steps": [
    {"step": 1, "title": "Tên bước 1", "content": "Nội dung giải thích chi tiết bước 1..."},
    {"step": 2, "title": "Tên bước 2", "content": "Nội dung giải thích chi tiết bước 2..."}
  ],
  "answer": "Kết luận/Đáp án ngắn gọn",
  "tips": "Nội dung mẹo bấm máy Casio hoặc công thức giải nhanh cụ thể theo yêu cầu trên, hoặc null",
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

async function callAiWithRetry(
  params: {
    model: string
    system: string
    messages: RouterMessage[]
    maxTokens: number
    temperature?: number
    responseFormat?: { type: 'json_object' }
  },
  maxRetries = 3
): Promise<{ text: string; provider: string; model: string }> {
  for (let i = 0; i < maxRetries; i++) {
    const response = await createAiCompletion(params)
    if (response.text.trim().length > 0) return response
    console.log(`[solve] empty AI response, retry ${i + 1}/${maxRetries}`)
  }
  throw new Error('AI provider returned empty response after retries')
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

  // Check if user upgraded to VIP today to reset daily count (non-atomic for count reset only, can be async)
  const { data: vipTx } = await supabase
    .from('transactions')
    .select('created_at')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .gte('created_at', today)
    .limit(1)
    .single()

  const resetFirst = !!vipTx

  // Reserve usage atomically using RPC
  const { data: reserveResult, error: reserveError } = await supabase.rpc('reserve_solve_usage', {
    uid: userId,
    solve_date: today,
    solve_limit: modelConfig.limit,
    reset_first: resetFirst
  })

  if (reserveError || !reserveResult || !reserveResult[0]) {
    console.error('[solve] reserve_solve_usage RPC error:', reserveError || reserveResult)
    return NextResponse.json({ error: 'Không thể kiểm tra hạn mức giải bài. Vui lòng thử lại.' }, { status: 500 })
  }

  const reservation = reserveResult[0] as { allowed: boolean; used: number; remaining: number }

  if (!reservation.allowed) {
    return NextResponse.json(
      { error: 'Hết lượt', limit: modelConfig.limit, used: reservation.used, isVip: session.user.isVip },
      { status: 429 }
    )
  }

  const currentCount = reservation.used - 1

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
    const aiResponse = await callAiWithRetry({
      model: modelConfig.model,
      maxTokens: 4000,
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
      responseFormat: { type: 'json_object' },
    })
    const rawText = aiResponse.text
    modelConfig.model = aiResponse.model
    modelConfig.label = aiResponse.provider === 'router' ? 'AI Router' : modelConfig.label
    try {
      solution = extractJSON(rawText) as Solution
    } catch (parseErr) {
      console.error('[solve] JSON parse error:', parseErr)
      console.error('[solve] raw response:', rawText)
      throw parseErr
    }
  } catch (err) {
    console.error('[solve] Claude API error:', err)
    // Rollback reserved count on AI failure
    await supabase.rpc('release_solve_usage', { uid: userId, solve_date: today })
    return NextResponse.json({ error: 'Lỗi phân tích ảnh, vui lòng thử lại' }, { status: 500 })
  }

  if (!solution.is_math) {
    // Rollback reserved count if it is not a math problem
    await supabase.rpc('release_solve_usage', { uid: userId, solve_date: today })
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

  const QUESTION_FIELDS = 'id, question_text, difficulty, topic, subtopic, question_type, correct_answer, option_a, option_b, option_c, option_d, statements, numeric_answer, explanation, needs_visual, visual_image_url, image_url'

  let relatedQuestions: unknown[] = []
  try {
    // Priority: subtopic match
    const { data: bySubtopic } = await supabase
      .from('questions')
      .select(QUESTION_FIELDS)
      .eq('is_published', true)
      .ilike('subtopic', `%${solution.subtopic}%`)
      .or('needs_visual.is.null,needs_visual.eq.false,visual_image_url.not.is.null,image_url.not.is.null')
      .neq('answer_source', 'AI_generated')
      .order('difficulty', { ascending: true })
      .limit(20)

    const readyBySubtopic = (bySubtopic ?? []).filter((question) => isQuestionStudentReady(question))
    if (readyBySubtopic.length >= 3) {
      relatedQuestions = readyBySubtopic.slice(0, 5)
    } else {
      // Fallback: topic match
      const { data: byTopic } = await supabase
        .from('questions')
        .select(QUESTION_FIELDS)
        .eq('is_published', true)
        .ilike('topic', `%${solution.topic}%`)
        .or('needs_visual.is.null,needs_visual.eq.false,visual_image_url.not.is.null,image_url.not.is.null')
        .neq('answer_source', 'AI_generated')
        .order('difficulty', { ascending: true })
        .limit(20)
      const readyByTopic = (byTopic ?? []).filter((question) => isQuestionStudentReady(question))
      relatedQuestions = (readyByTopic.length ? readyByTopic : readyBySubtopic).slice(0, 5)
    }
    console.log('[solve] related questions count:', relatedQuestions.length)
  } catch (err) {
    console.error('[solve] related questions query error:', err)
  }

  // === STEP 6: Return response ===
  console.log('=== STEP 6: Return response ===')
  return NextResponse.json({
    solution,
    relatedQuestions,
    remainingToday: reservation.remaining < 0 ? -1 : reservation.remaining,
    limit: modelConfig.limit,
    modelUsed: modelConfig.model,
    modelLabel: modelConfig.label,
  })
}
