import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'

export const maxDuration = 60

function getAiConfig() {
  const baseUrl = (
    process.env.AI_ROUTER_BASE_URL ??
    process.env.AI_BASE_URL ??
    process.env.OPENROUTER_BASE_URL
  )?.replace(/\/$/, '')

  const apiKey =
    process.env.AI_ROUTER_API_KEY ??
    process.env.AI_API_KEY ??
    process.env.OPENROUTER_API_KEY ??
    process.env.ANTHROPIC_API_KEY

  const model =
    process.env.AI_FEEDBACK_MODEL ??
    process.env.AI_TUTOR_MODEL ??
    process.env.AI_ROUTER_MODEL ??
    'google/gemini-2.0-flash:free'

  return { baseUrl, apiKey, model }
}

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const userId = session.user.id
  const supabase = createAdminClient()

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
    supabase.from('grammar_lessons').select('id, title, title_vi, topic_group, level'),
    supabase
      .from('reading_progress')
      .select('passage_id, completed, score, total, completed_at')
      .eq('user_id', userId)
      .eq('completed', true),
    supabase.from('reading_passages').select('id, title, topic, level'),
    supabase.from('vocab_progress').select('set_id, state, lapses, word').eq('user_id', userId),
    supabase.from('vocab_sets').select('id, name, topic'),
  ])

  const grammarProgress = grammarProgressRes.data ?? []
  const grammarLessons = grammarLessonsRes.data ?? []
  const readingProgress = readingProgressRes.data ?? []
  const readingPassages = readingPassagesRes.data ?? []
  const vocabProgress = vocabProgressRes.data ?? []
  const vocabSets = vocabSetsRes.data ?? []

  if (grammarProgress.length === 0 && readingProgress.length === 0 && vocabProgress.length === 0) {
    return new Response(
      JSON.stringify({ error: 'Chưa có đủ dữ liệu học để phân tích. Hãy thử làm một số bài tập trước!' }),
      { status: 400 }
    )
  }

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

  const setMap = new Map(vocabSets.map((s) => [s.id, s]))
  const setsStarted = new Set(vocabProgress.map((v) => v.set_id)).size
  const vocabMastered = vocabProgress.filter((v) => v.state === 'review').length
  const vocabDueToday = vocabProgress.filter((v) => v.state === 'learning' || v.state === 'relearning').length
  const highLapseWords = vocabProgress
    .filter((v) => v.lapses >= 2)
    .sort((a, b) => b.lapses - a.lapses)
    .slice(0, 8)
    .map((v) => {
      const setName = setMap.get(v.set_id)?.name ?? 'Unknown'
      return `"${v.word}" (${setName}, quên ${v.lapses} lần)`
    })

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

  const systemPrompt = 'Bạn là gia sư tiếng Anh AI thân thiện và chuyên nghiệp dành cho học sinh THPT Việt Nam. Bạn phân tích dữ liệu học và đưa ra nhận xét cá nhân hóa, động viên học sinh, và gợi ý bước tiếp theo thực tế.'

  const { baseUrl, apiKey, model } = getAiConfig()
  const enc = new TextEncoder()

  // Helper: stream from any OpenAI-compatible SSE endpoint, returns true if succeeded
  async function tryOpenAiStream(
    controller: ReadableStreamDefaultController,
    fetchUrl: string,
    fetchKey: string,
    fetchModel: string,
  ): Promise<boolean> {
    const res = await fetch(fetchUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${fetchKey}` },
      body: JSON.stringify({
        model: fetchModel,
        max_tokens: 1500,
        temperature: 0.7,
        stream: true,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    })
    if (!res.ok || !res.body) return false

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data: ')) continue
        const data = trimmed.slice(6)
        if (data === '[DONE]') continue
        try {
          const parsed = JSON.parse(data)
          const content = parsed.choices?.[0]?.delta?.content
          if (content) controller.enqueue(enc.encode(content))
        } catch { /* ignore malformed SSE */ }
      }
    }
    return true
  }

  const readableStream = new ReadableStream({
    async start(controller) {
      try {
        // 1. Try OpenRouter / custom router
        if (baseUrl && apiKey && !apiKey.startsWith('sk-ant-')) {
          const url = baseUrl.endsWith('/v1')
            ? `${baseUrl}/chat/completions`
            : `${baseUrl}/v1/chat/completions`
          const ok = await tryOpenAiStream(controller, url, apiKey, model)
          if (ok) return
          console.error('[english-feedback] OpenRouter failed, trying Gemini direct')
        }

        // 2. Gemini direct fallback (OpenAI-compatible endpoint)
        const geminiKeys = process.env.GEMINI_API_KEYS
          ?.split(',').map(k => k.trim()).filter(Boolean)
          ?? (process.env.GEMINI_API_KEY ? [process.env.GEMINI_API_KEY] : [])

        if (geminiKeys.length) {
          const geminiModel = (process.env.AI_FEEDBACK_MODEL ?? process.env.AI_TUTOR_MODEL ?? 'gemini-2.5-flash-lite').replace(/^google\//, '')
          const geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions'
          for (const gKey of geminiKeys) {
            const ok = await tryOpenAiStream(controller, geminiUrl, gKey, geminiModel)
            if (ok) return
          }
          console.error('[english-feedback] Gemini direct also failed')
        }

        // 3. Anthropic fallback
        const anthropicKey = process.env.ANTHROPIC_API_KEY
        if (anthropicKey) {
          const anthropicBase = (process.env.ANTHROPIC_BASE_URL ?? 'https://api.anthropic.com').replace(/\/$/, '')
          const res = await fetch(`${anthropicBase}/v1/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01' },
            body: JSON.stringify({
              model: process.env.AI_FEEDBACK_MODEL ?? 'claude-haiku-4-5',
              max_tokens: 1500,
              stream: true,
              system: systemPrompt,
              messages: [{ role: 'user', content: userPrompt }],
            }),
          })
          if (res.ok && res.body) {
            const reader = res.body.getReader()
            const decoder = new TextDecoder()
            let buffer = ''
            while (true) {
              const { done, value } = await reader.read()
              if (done) break
              buffer += decoder.decode(value, { stream: true })
              const lines = buffer.split('\n')
              buffer = lines.pop() ?? ''
              for (const line of lines) {
                const trimmed = line.trim()
                if (!trimmed.startsWith('data: ')) continue
                try {
                  const parsed = JSON.parse(trimmed.slice(6))
                  if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
                    controller.enqueue(enc.encode(parsed.delta.text))
                  }
                } catch { /* ignore */ }
              }
            }
            return
          }
        }

        controller.enqueue(enc.encode('❌ Không kết nối được AI. Vui lòng thử lại sau.'))
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Lỗi không xác định'
        controller.enqueue(enc.encode(`\n\n❌ Lỗi: ${msg}`))
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
