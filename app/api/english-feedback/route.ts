import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import Anthropic from '@anthropic-ai/sdk'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'

const anthropic = new Anthropic({
  baseURL: process.env.ANTHROPIC_BASE_URL ?? 'https://api.anthropic.com',
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id
  const now = new Date().toISOString()
  const supabase = createAdminClient()

  // Fetch all learning data in parallel
  const [
    grammarProgressRes,
    grammarLessonsRes,
    readingProgressRes,
    readingPassagesRes,
    vocabProgressRes,
    vocabSetsRes,
  ] = await Promise.all([
    supabase
      .from('grammar_progress')
      .select('lesson_id, mastered, best_score, attempts, last_practiced')
      .eq('user_id', userId)
      .gt('attempts', 0),
    supabase
      .from('grammar_lessons')
      .select('id, title, title_vi, topic_group, level'),
    supabase
      .from('reading_progress')
      .select('passage_id, completed, score, total, completed_at')
      .eq('user_id', userId)
      .eq('completed', true),
    supabase
      .from('reading_passages')
      .select('id, title, topic, level'),
    supabase
      .from('vocab_progress')
      .select('set_id, state, lapses, word')
      .eq('user_id', userId),
    supabase
      .from('vocab_sets')
      .select('id, name, topic'),
  ])

  const grammarProgress = grammarProgressRes.data ?? []
  const grammarLessons = grammarLessonsRes.data ?? []
  const readingProgress = readingProgressRes.data ?? []
  const readingPassages = readingPassagesRes.data ?? []
  const vocabProgress = vocabProgressRes.data ?? []
  const vocabSets = vocabSetsRes.data ?? []

  // No data at all — skip AI call
  if (grammarProgress.length === 0 && readingProgress.length === 0 && vocabProgress.length === 0) {
    return NextResponse.json({ error: 'Chưa có đủ dữ liệu học để phân tích. Hãy thử làm một số bài tập trước!' }, { status: 400 })
  }

  // --- Build grammar summary ---
  const lessonMap = new Map(grammarLessons.map((l) => [l.id, l]))
  const grammarMastered = grammarProgress.filter((p) => p.mastered).length
  const grammarStruggling = grammarProgress
    .filter((p) => !p.mastered && p.attempts >= 1 && p.best_score < 70)
    .sort((a, b) => a.best_score - b.best_score)
    .slice(0, 6)
    .map((p) => {
      const lesson = lessonMap.get(p.lesson_id)
      return `  - ${lesson?.title ?? 'Unknown'} (${lesson?.level ?? ''}): điểm cao nhất ${p.best_score}%, thử ${p.attempts} lần`
    })

  const grammarGood = grammarProgress
    .filter((p) => p.mastered || p.best_score >= 80)
    .slice(0, 4)
    .map((p) => {
      const lesson = lessonMap.get(p.lesson_id)
      return `  - ${lesson?.title ?? 'Unknown'} (${lesson?.level ?? ''}): ${p.best_score}%`
    })

  // --- Build reading summary ---
  const passageMap = new Map(readingPassages.map((p) => [p.id, p]))
  const readingScored = readingProgress.map((p) => ({
    ...p,
    pct: p.total > 0 ? Math.round((p.score / p.total) * 100) : 0,
    passage: passageMap.get(p.passage_id),
  }))
  const readingAvg = readingScored.length
    ? Math.round(readingScored.reduce((s, r) => s + r.pct, 0) / readingScored.length)
    : 0
  const readingWeak = readingScored
    .filter((r) => r.pct < 60)
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 4)
    .map((r) => `  - ${r.passage?.title ?? 'Unknown'} (${r.passage?.topic ?? ''} - ${r.passage?.level ?? ''}): ${r.score}/${r.total} câu đúng`)
  const readingStrong = readingScored
    .filter((r) => r.pct >= 80)
    .slice(0, 3)
    .map((r) => `  - ${r.passage?.title ?? 'Unknown'} (${r.passage?.topic ?? ''}): ${r.pct}%`)

  // --- Build vocab summary ---
  const setMap = new Map(vocabSets.map((s) => [s.id, s]))
  const setsStarted = new Set(vocabProgress.map((v) => v.set_id)).size
  const vocabMastered = vocabProgress.filter((v) => v.state === 'review').length
  const vocabDueToday = vocabProgress.filter((v) => {
    // Rough estimate: state is 'learning' or 'relearning' with due <= now
    return v.state === 'learning' || v.state === 'relearning'
  }).length
  const highLapseWords = vocabProgress
    .filter((v) => v.lapses >= 2)
    .sort((a, b) => b.lapses - a.lapses)
    .slice(0, 8)
    .map((v) => {
      const setName = setMap.get(v.set_id)?.name ?? 'Unknown'
      return `"${v.word}" (${setName}, quên ${v.lapses} lần)`
    })

  // --- Compose prompt ---
  const userName = session.user.name?.split(' ').pop() ?? 'bạn'

  const dataBlock = `
=== TỪ VỰNG ===
- Bộ từ đang học: ${setsStarted}
- Số từ đã nắm vững (Review): ${vocabMastered}
- Số từ đang trong giai đoạn học lại (Relearning/Learning): ${vocabDueToday}
${highLapseWords.length > 0 ? `- Từ hay quên nhất:\n${highLapseWords.map((w) => `  - ${w}`).join('\n')}` : '- Chưa có từ nào bị quên nhiều lần.'}

=== NGỮ PHÁP ===
- Bài đã nắm vững (Mastered): ${grammarMastered}/50
- Tổng bài đã làm: ${grammarProgress.length}
${grammarGood.length > 0 ? `- Bài làm tốt:\n${grammarGood.join('\n')}` : ''}
${grammarStruggling.length > 0 ? `- Bài đang gặp khó khăn (điểm thấp):\n${grammarStruggling.join('\n')}` : '- Chưa có bài nào dưới 70% hoặc chưa làm bài.'}

=== ĐỌC HIỂU ===
- Số bài đã hoàn thành: ${readingProgress.length}
- Điểm trung bình: ${readingAvg}%
${readingStrong.length > 0 ? `- Bài làm tốt:\n${readingStrong.join('\n')}` : ''}
${readingWeak.length > 0 ? `- Bài điểm thấp (cần cải thiện):\n${readingWeak.join('\n')}` : readingProgress.length > 0 ? '- Tất cả bài đọc đều đạt >= 60%.' : '- Chưa hoàn thành bài đọc nào.'}
`.trim()

  const userPrompt = `Học sinh tên: ${userName}

Dữ liệu học tiếng Anh:
${dataBlock}

Hãy viết nhận xét cá nhân hóa bằng tiếng Việt theo cấu trúc:
1. **📊 Tổng quan tiến độ** (2-3 câu nhận xét khách quan về bức tranh tổng thể)
2. **✅ Điểm mạnh** (cụ thể từng module, dẫn chứng bằng con số từ dữ liệu)
3. **⚠️ Điểm cần cải thiện** (phân tích cụ thể lỗi, pattern hay gặp)
4. **🗓️ Kế hoạch tuần tới** (3-5 hành động cụ thể có thể thực hiện ngay trên app)
5. **💪 Lời động viên** (1-2 câu cá nhân hóa, có tên học sinh)

Yêu cầu: thân thiện như gia sư, cụ thể (có số liệu), không nói chung chung, tổng cộng khoảng 400-500 từ.`

  // Stream response
  const stream = anthropic.messages.stream({
    model: 'claude-haiku-4-5',
    max_tokens: 1500,
    system: 'Bạn là gia sư tiếng Anh AI thân thiện và chuyên nghiệp dành cho học sinh THPT Việt Nam. Bạn phân tích dữ liệu học và đưa ra nhận xét cá nhân hóa, động viên học sinh, và gợi ý bước tiếp theo thực tế.',
    messages: [{ role: 'user', content: userPrompt }],
  })

  const readableStream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            controller.enqueue(new TextEncoder().encode(chunk.delta.text))
          }
        }
      } finally {
        controller.close()
      }
    },
  })

  return new Response(readableStream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
