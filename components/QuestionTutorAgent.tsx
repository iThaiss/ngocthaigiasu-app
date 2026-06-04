'use client'

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { Bot, Loader2, RotateCcw, Send, Sparkles, UserRound } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

export type TutorMode = 'practice' | 'exam' | 'solve'

export interface TutorMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface TutorQuestionContext {
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

interface QuestionTutorAgentProps {
  mode: TutorMode
  contextKey: string
  context: TutorQuestionContext
  messages?: TutorMessage[]
  onMessagesChange?: (messages: TutorMessage[]) => void
  title?: string
  compact?: boolean
  className?: string
}

const QUICK_PROMPTS: Record<TutorMode, string[]> = {
  practice: ['Gợi ý bước đầu', 'Vì sao em sai?', 'Tóm tắt dạng bài'],
  exam: ['Lý thuyết cơ bản của câu này là gì?', 'Gợi ý câu này', 'Loại đáp án nào trước?'],
  solve: ['Giải thích bước khó nhất', 'Có cách khác không?', 'Em chưa hiểu đáp án'],
}

export default function QuestionTutorAgent({
  mode,
  contextKey,
  context,
  messages: controlledMessages,
  onMessagesChange,
  title = 'AI hỏi đáp câu hiện tại',
  compact = false,
  className,
}: QuestionTutorAgentProps) {
  const [localMessages, setLocalMessages] = useState<TutorMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const messages = controlledMessages ?? localMessages
  const setMessages = (next: TutorMessage[] | ((prev: TutorMessage[]) => TutorMessage[])) => {
    const value = typeof next === 'function' ? next(messages) : next
    if (controlledMessages === undefined) setLocalMessages(value)
    onMessagesChange?.(value)
  }

  useEffect(() => {
    setLocalMessages([])
    setInput('')
    setError(null)
  }, [contextKey])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, loading])

  const placeholder = useMemo(() => {
    if (mode === 'exam') return 'Hỏi gợi ý cho câu này...'
    if (mode === 'solve') return 'Hỏi thêm về lời giải này...'
    return 'Hỏi AI về câu đang làm...'
  }, [mode])

  const sendMessage = async (content: string) => {
    const trimmed = content.trim()
    if (!trimmed || loading) return

    const nextMessages: TutorMessage[] = [...messages, { role: 'user', content: trimmed }]
    setMessages(nextMessages)
    setInput('')
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/ai-question-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          context,
          messages: nextMessages,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Không gửi được câu hỏi')
      setMessages((prev) => [...prev, { role: 'assistant', content: data.answer }])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI agent đang bận, vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    sendMessage(input)
  }

  return (
    <section className={cn('min-w-0 overflow-hidden rounded-lg border bg-background', className)}>
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Bot className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold">{title}</h2>
            <p className="truncate text-xs text-muted-foreground">
              {mode === 'exam' ? 'Gợi ý theo câu đang chọn' : 'Bám sát nội dung câu hiện tại'}
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8 shrink-0"
            onClick={() => {
              setMessages([])
              setError(null)
            }}
            title="Xóa hội thoại"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        )}
      </div>

      {messages.length === 0 ? (
        <div className={cn('space-y-3 p-4', compact ? 'py-3' : 'py-4')}>
          <div className="flex items-start gap-2 rounded-md bg-muted/40 p-3 text-sm text-muted-foreground">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p>
              {mode === 'exam'
                ? 'Hỏi để nhận gợi ý từng bước mà vẫn tự giữ nhịp làm đề.'
                : 'Hỏi bất kỳ điểm nào chưa rõ trong câu này, AI sẽ giải thích theo đúng dữ kiện đang hiển thị.'}
            </p>
          </div>
          <div className="grid gap-2">
            {QUICK_PROMPTS[mode].map((prompt) => (
              <Button
                key={prompt}
                type="button"
                variant="outline"
                size="sm"
                disabled={loading}
                className="h-auto min-h-9 w-full justify-start whitespace-normal break-words px-3 py-2 text-left leading-snug"
                onClick={() => sendMessage(prompt)}
              >
                {prompt}
              </Button>
            ))}
          </div>
        </div>
      ) : (
        <ScrollArea className={cn(compact ? 'h-56' : 'h-72')}>
          <div className="space-y-3 p-4">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={cn(
                  'flex gap-2',
                  message.role === 'user' ? 'justify-end' : 'justify-start',
                )}
              >
                {message.role === 'assistant' && (
                  <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[86%] rounded-lg px-3 py-2 text-sm leading-relaxed',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground',
                  )}
                >
                  {message.role === 'assistant' ? (
                    <div className="space-y-2">
                      <ReactMarkdown
                        remarkPlugins={[remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    message.content
                  )}
                </div>
                {message.role === 'user' && (
                  <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    <UserRound className="h-3.5 w-3.5" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                AI đang suy nghĩ...
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>
      )}

      {error && <p className="px-4 pb-2 text-sm text-destructive">{error}</p>}

      <form onSubmit={handleSubmit} className="border-t p-3">
        <div className="flex min-w-0 gap-2">
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                sendMessage(input)
              }
            }}
            placeholder={placeholder}
            disabled={loading}
            className="min-h-10 min-w-0 resize-none"
          />
          <Button type="submit" size="icon" disabled={loading || !input.trim()} className="h-10 w-10 shrink-0">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </form>
    </section>
  )
}
