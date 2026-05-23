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

let routerKeyCursor = 0
let anthropicKeyCursor = 0

class AiRouterError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'AiRouterError'
    this.status = status
  }
}

function getRouterApiKeys() {
  const apiKeys = process.env.AI_ROUTER_API_KEYS
    ?.split(',')
    .map((key) => key.trim())
    .filter(Boolean)

  return apiKeys?.length ? apiKeys : undefined
}

function getEnvList(name: string) {
  return process.env[name]
    ?.split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function shouldTryNextRouterKey(error: unknown) {
  if (!(error instanceof AiRouterError)) return false
  return error.status === 401 || error.status === 429 || error.status >= 500
}

function getRouterConfig() {
  const baseUrl =
    process.env.AI_ROUTER_BASE_URL ??
    process.env.AI_BASE_URL ??
    process.env.NINE_ROUTER_BASE_URL ??
    process.env.ROUTER9_BASE_URL ??
    process.env['9ROUTER_BASE_URL'] ??
    process.env.OPENROUTER_BASE_URL
  const apiKey =
    process.env.AI_ROUTER_API_KEY ??
    process.env.AI_API_KEY ??
    process.env.NINE_ROUTER_API_KEY ??
    process.env.ROUTER9_API_KEY ??
    process.env['9ROUTER_API_KEY'] ??
    process.env.OPENROUTER_API_KEY
  const model =
    process.env.AI_ROUTER_MODEL ??
    process.env.AI_MODEL ??
    process.env.NINE_ROUTER_MODEL ??
    process.env.ROUTER9_MODEL ??
    process.env['9ROUTER_MODEL'] ??
    process.env.OPENROUTER_MODEL
  const chatCompletionsUrl =
    process.env.AI_ROUTER_CHAT_COMPLETIONS_URL ??
    process.env.AI_CHAT_COMPLETIONS_URL ??
    process.env.NINE_ROUTER_CHAT_COMPLETIONS_URL ??
    process.env.ROUTER9_CHAT_COMPLETIONS_URL ??
    process.env['9ROUTER_CHAT_COMPLETIONS_URL'] ??
    process.env.OPENROUTER_CHAT_COMPLETIONS_URL

  return {
    baseUrl: baseUrl?.replace(/\/$/, ''),
    apiKey,
    apiKeys: getRouterApiKeys(),
    model,
    protocol: process.env.AI_ROUTER_PROTOCOL,
    chatCompletionsUrl: chatCompletionsUrl?.replace(/\/$/, ''),
  }
}

function getFallbackConfig() {
  const apiKeys = getEnvList('ANTHROPIC_API_KEYS')
  return {
    baseUrl: (process.env.ANTHROPIC_BASE_URL ?? 'https://api.anthropic.com').replace(/\/$/, ''),
    apiKey: process.env.ANTHROPIC_API_KEY,
    apiKeys: apiKeys?.length ? apiKeys : undefined,
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

function getChatCompletionsUrls(config: { baseUrl: string; chatCompletionsUrl?: string }) {
  if (config.chatCompletionsUrl) return config.chatCompletionsUrl
  if (config.baseUrl.endsWith('/chat/completions')) return config.baseUrl
  if (config.baseUrl.endsWith('/v1')) return `${config.baseUrl}/chat/completions`
  return [`${config.baseUrl}/chat/completions`, `${config.baseUrl}/v1/chat/completions`]
}

async function callOpenAiCompatible(params: AiCompletionParams, config: { baseUrl: string; apiKey?: string; model?: string; chatCompletionsUrl?: string }) {
  if (!config.apiKey) throw new Error('Missing AI router API key')

  const urls = Array.isArray(getChatCompletionsUrls(config)) ? getChatCompletionsUrls(config) as string[] : [getChatCompletionsUrls(config) as string]
  let lastError: AiRouterError | null = null

  for (const url of urls) {
    const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (compatible; ngocthaigiasu-ai/1.0)',
      Authorization: `Bearer ${config.apiKey}`,
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

    if (res.ok) {
      const data = await res.json()
      return String(data.choices?.[0]?.message?.content ?? '').trim()
    }

    const text = await res.text().catch(() => '')
    lastError = new AiRouterError(res.status, `Router API ${res.status}: ${text.slice(0, 300)}`)
    if (res.status !== 404) throw lastError
  }

  throw lastError ?? new Error('Router API failed')
}

async function callAnthropicWithKey(params: AiCompletionParams, config: { baseUrl: string; apiKey: string }) {
  const res = await fetch(`${config.baseUrl}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (compatible; ngocthaigiasu-ai/1.0)',
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
    throw new AiRouterError(res.status, `Anthropic API ${res.status}: ${text.slice(0, 300)}`)
  }

  const data = await res.json()
  return String(data.content?.find((part: { type?: string; text?: string }) => part.type === 'text')?.text ?? '').trim()
}

function shouldUseAnthropicRouter(protocol: string | undefined, apiKey: string) {
  return protocol === 'anthropic' || apiKey.startsWith('sk-ant-')
}

async function callAnthropicFallback(params: AiCompletionParams) {
  const config = getFallbackConfig()
  const apiKeys = config.apiKeys ?? (config.apiKey ? [config.apiKey] : [])
  if (!apiKeys.length) throw new Error('Missing ANTHROPIC_API_KEY')

  const start = anthropicKeyCursor % apiKeys.length
  const orderedKeys = [...apiKeys.slice(start), ...apiKeys.slice(0, start)]
  let lastError: unknown = null

  for (let index = 0; index < orderedKeys.length; index += 1) {
    try {
      const text = await callAnthropicWithKey(params, { baseUrl: config.baseUrl, apiKey: orderedKeys[index] })
      anthropicKeyCursor = (start + index + 1) % apiKeys.length
      return text
    } catch (error) {
      lastError = error
      if (!shouldTryNextRouterKey(error)) break
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Anthropic fallback failed')
}

export async function createAiCompletion(params: AiCompletionParams) {
  const router = getRouterConfig()
  const preferRouter = process.env.AI_ROUTER_ENABLED === 'true' || Boolean(router.baseUrl)

  if (preferRouter && router.baseUrl) {
    const apiKeys = router.apiKeys ?? (router.apiKey ? [router.apiKey] : [])
    if (!apiKeys.length) {
      console.error('[ai-router] router configured without API key')
    } else {
      const start = routerKeyCursor % apiKeys.length
      const orderedKeys = [...apiKeys.slice(start), ...apiKeys.slice(0, start)]
      let lastError: unknown = null

      for (let index = 0; index < orderedKeys.length; index += 1) {
        try {
          const text = shouldUseAnthropicRouter(router.protocol, orderedKeys[index])
            ? await callAnthropicWithKey(params, {
              baseUrl: router.baseUrl,
              apiKey: orderedKeys[index],
            })
            : await callOpenAiCompatible(params, {
              baseUrl: router.baseUrl,
              apiKey: orderedKeys[index],
              model: router.model,
              chatCompletionsUrl: router.chatCompletionsUrl,
            })
          routerKeyCursor = (start + index + 1) % apiKeys.length
          if (text) return { text, provider: 'router' as const, model: router.model ?? params.model }
        } catch (error) {
          lastError = error
          if (!shouldTryNextRouterKey(error)) break
        }
      }

      console.error('[ai-router] router failed, falling back to Anthropic:', lastError)
    }
  }

  const text = await callAnthropicFallback(params)
  return { text, provider: 'anthropic' as const, model: params.model }
}
