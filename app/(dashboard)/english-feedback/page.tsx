'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  ArrowLeft, Sparkles, Loader2, AlertCircle, RefreshCw,
  BookOpen, Languages, Headphones, RotateCcw,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth-context'

type FeedbackState = 'idle' | 'loading' | 'streaming' | 'done' | 'error'

const MODULE_LINKS = [
  { href: '/vocabulary', icon: Languages, label: 'Từ vựng', color: 'text-rose-500 bg-rose-500/10' },
  { href: '/grammar', icon: BookOpen, label: 'Ngữ pháp', color: 'text-violet-500 bg-violet-500/10' },
  { href: '/reading', icon: Headphones, label: 'Đọc hiểu', color: 'text-sky-500 bg-sky-500/10' },
]

export default function EnglishFeedbackPage() {
  const { user } = useAuth()
  const [state, setState] = useState<FeedbackState>('idle')
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null)

  async function generateFeedback() {
    setState('loading')
    setFeedback('')
    setError('')

    try {
      const res = await fetch('/api/english-feedback', { method: 'POST' })

      if (!res.ok) {
        const json = await res.json().catch(() => ({ error: 'Lỗi không xác định' }))
        throw new Error(json.error ?? 'Không thể tạo nhận xét')
      }

      setState('streaming')
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) throw new Error('Không đọc được phản hồi')

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        setFeedback((prev) => prev + decoder.decode(value, { stream: true }))
      }

      setState('done')
      setGeneratedAt(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi không xác định')
      setState('error')
    }
  }

  const firstName = user?.name?.split(' ').pop() ?? 'bạn'

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-rose-500" />
            Nhận xét AI
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Phân tích dữ liệu học và gợi ý cải thiện cá nhân hóa
          </p>
        </div>
      </div>

      {/* Info card */}
      <Card className="border-rose-500/20 bg-rose-500/5">
        <CardContent className="pt-4 pb-4">
          <p className="text-sm text-muted-foreground">
            AI sẽ phân tích toàn bộ dữ liệu bạn đã học — từ vựng, ngữ pháp, đọc hiểu — rồi đưa ra nhận xét và kế hoạch học tập cá nhân hóa cho <strong>{firstName}</strong>.
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            {MODULE_LINKS.map((m) => (
              <Link key={m.href} href={m.href}>
                <Badge variant="outline" className="gap-1.5 cursor-pointer hover:bg-accent transition-colors">
                  <m.icon className={`h-3 w-3 ${m.color.split(' ')[0]}`} />
                  {m.label}
                </Badge>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Generate button */}
      <div className="flex items-center gap-3">
        <Button
          onClick={generateFeedback}
          disabled={state === 'loading' || state === 'streaming'}
          className="gap-2 bg-rose-500 hover:bg-rose-600 text-white"
        >
          {state === 'loading' || state === 'streaming' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : state === 'done' ? (
            <RefreshCw className="h-4 w-4" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {state === 'loading'
            ? 'Đang phân tích...'
            : state === 'streaming'
              ? 'Đang viết...'
              : state === 'done'
                ? 'Phân tích lại'
                : 'Phân tích ngay'}
        </Button>
        {generatedAt && state === 'done' && (
          <p className="text-xs text-muted-foreground">
            Cập nhật lúc {generatedAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>

      {/* Error */}
      <AnimatePresence>
        {state === 'error' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="flex items-start gap-3 pt-4 pb-4">
                <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-destructive">Không thể tạo nhận xét</p>
                  <p className="text-sm text-muted-foreground mt-1">{error}</p>
                  {error.includes('Chưa có đủ dữ liệu') && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {MODULE_LINKS.map((m) => (
                        <Link key={m.href} href={m.href}>
                          <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs">
                            <m.icon className="h-3 w-3" />
                            Học {m.label}
                          </Button>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading skeleton */}
      <AnimatePresence>
        {state === 'loading' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Card>
              <CardContent className="pt-6 pb-6 space-y-3">
                {[80, 60, 90, 50, 70].map((w, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`h-3 rounded-full bg-muted animate-pulse`} style={{ width: `${w}%` }} />
                  </div>
                ))}
                <p className="text-sm text-muted-foreground text-center pt-2 flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  AI đang phân tích dữ liệu học của bạn...
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Streaming / Done feedback */}
      <AnimatePresence>
        {(state === 'streaming' || state === 'done') && feedback && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-rose-500" />
                  Nhận xét của AI
                  {state === 'streaming' && (
                    <span className="inline-block h-4 w-0.5 bg-rose-500 animate-pulse ml-0.5" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-base prose-headings:font-semibold prose-p:leading-relaxed prose-li:leading-relaxed prose-strong:text-foreground">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {feedback}
                  </ReactMarkdown>
                </div>
              </CardContent>
            </Card>

            {state === 'done' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                <Card className="border-dashed">
                  <CardContent className="pt-4 pb-4">
                    <p className="text-sm text-muted-foreground text-center mb-3">Tiếp tục học ngay</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {MODULE_LINKS.map((m) => (
                        <Link key={m.href} href={m.href}>
                          <Button variant="outline" size="sm" className="gap-2">
                            <div className={`flex h-5 w-5 items-center justify-center rounded ${m.color}`}>
                              <m.icon className="h-3 w-3" />
                            </div>
                            {m.label}
                          </Button>
                        </Link>
                      ))}
                      <Link href="/vocabulary">
                        <Button variant="outline" size="sm" className="gap-2">
                          <RotateCcw className="h-3.5 w-3.5 text-rose-500" />
                          Ôn từ hôm nay
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
