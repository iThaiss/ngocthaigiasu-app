type TextPart = { type: 'text'; text: string }
type ImagePart = {
  type: 'image'
  source: {
    type: 'base64'
    media_type: 'image/jpeg' | 'image/png' | 'image/webp'
    data: string
  }
}

export interface RouterMessage {
  role: 'user' | 'assistant'
  content: string | Array<TextPart | ImagePart>
}

interface AiCompletionParams {
  model: string
  system: string
  messages: RouterMessage[]
  maxTokens?: number
  temperature?: number
}

function getRouterConfig() {
  const baseUrl = process.env.AI_ROUTER_BASE_URL ?? process.env.NINE_ROUTER_BASE_URL ?? process.env.OPENROUTER_BASE_URL
  const apiKey = process.env.AI_ROUTER_API_KEY ?? process.env.NINE_ROUTER_API_KEY ?? process.env.OPENROUTER_API_KEY
  const model = process.env.AI_ROUTER_MODEL ?? process.env.NINE_ROUTER_MODEL
  return { baseUrl: baseUrl?.replace(/\/$/, ''), apiKey, model }
}

function getFallbackConfig() {
  return {
    baseUrl: (process.env.ANTHROPIC_BASE_URL ?? 'https://api.anthropic.com').replace(/\/$/, ''),
    apiKey: process.env.ANTHROPIC_API_KEY,
  }
}

function anthropicContentToOpenAi(content: RouterMessage['content']) {
  if (typeof content === 'string') return content
  return content.map((part) => {
    if (part.type === 'text') return { type: 'text', text: part.text }
    return {
      type: 'image_url',
      image_url: {
        url: `data:${part.source.media_type};base64,${part.source.data}`,
      },
    }
  })
}

function openAiContentToAnthropic(content: RouterMessage['content']) {
  if (typeof content === 'string') return content
  return content
}

async function callOpenAiCompatible(params: AiCompletionParams, config: { baseUrl: string; apiKey?: string; model?: string }) {
  const res = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
      ...(process.env.AI_ROUTER_APP_URL ? { 'HTTP-Referer': process.env.AI_ROUTER_APP_URL } : {}),
      ...(process.env.AI_ROUTER_APP_NAME ? { 'X-Title': process.env.AI_ROUTER_APP_NAME } : {}),
    },
    body: JSON.stringify({
      model: config.model ?? params.model,
      temperature: params.temperature ?? 0.2,
      max_tokens: params.maxTokens ?? 4000,
      messages: [
        { role: 'system', content: params.system },
        ...params.messages.map((message) => ({
          role: message.role,
          content: anthropicContentToOpenAi(message.content),
        })),
      ],
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Router API ${res.status}: ${text.slice(0, 300)}`)
  }

  const data = await res.json()
  return String(data.choices?.[0]?.message?.content ?? '').trim()
}

async function callAnthropicFallback(params: AiCompletionParams) {
  const config = getFallbackConfig()
  if (!config.apiKey) throw new Error('Missing ANTHROPIC_API_KEY')

  const res = await fetch(`${config.baseUrl}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: params.model,
      max_tokens: params.maxTokens ?? 4000,
      temperature: params.temperature ?? 0.2,
      system: params.system,
      messages: params.messages.map((message) => ({
        role: message.role,
        content: openAiContentToAnthropic(message.content),
      })),
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Anthropic API ${res.status}: ${text.slice(0, 300)}`)
  }

  const data = await res.json()
  return String(data.content?.find((part: { type?: string; text?: string }) => part.type === 'text')?.text ?? '').trim()
}

export async function createAiCompletion(params: AiCompletionParams) {
  const router = getRouterConfig()
  const preferRouter = process.env.AI_ROUTER_ENABLED === 'true' || Boolean(router.baseUrl)

  if (preferRouter && router.baseUrl) {
    try {
      const text = await callOpenAiCompatible(params, {
        baseUrl: router.baseUrl,
        apiKey: router.apiKey,
        model: router.model,
      })
      if (text) return { text, provider: 'router' as const, model: router.model ?? params.model }
    } catch (error) {
      console.error('[ai-router] router failed, falling back to Anthropic:', error)
    }
  }

  const text = await callAnthropicFallback(params)
  return { text, provider: 'anthropic' as const, model: params.model }
}
