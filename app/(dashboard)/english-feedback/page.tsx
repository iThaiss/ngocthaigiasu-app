'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  ArrowLeft, Sparkles, Loader2, AlertCircle, RefreshCw,
  BookOpen, Languages, Headphones, RotateCcw, History,
  ChevronDown, ChevronRight, Trash2, Clock,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth-context'

type FeedbackState = 'idle' | 'loading' | 'streaming' | 'done' | 'error'

interface HistoryItem {
  id: string
  content: string
  created_at: string
}

const MODULE_LINKS = [
  { href: '/vocabulary', icon: Languages, label: 'Từ vựng', color: 'text-rose-500 bg-rose-500/10' },
  { href: '/grammar', icon: BookOpen, label: 'Ngữ pháp', color: 'text-violet-500 bg-violet-500/10' },
  { href: '/reading', icon: Headphones, label: 'Đọc hiểu', color: 'text-sky-500 bg-sky-500/10' },
]

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

function getPreview(content: string) {
  // Strip markdown, return first ~100 chars
  return content.replace(/[#*_`>[\]]/g, '').replace(/\n+/g, ' ').trim().slice(0, 100) + '...'
}

// ─── History Panel ───────────────────────────────────────────────────────────

function HistoryPanel({
  history,
  onDelete,
}: {
  history: HistoryItem[]
  onDelete: (id: string) => void
}) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa nhận xét này?')) return
    setDeleting(id)
    try {
      await fetch(`/api/english-feedback/history?id=${id}`, { method: 'DELETE' })
      onDelete(id)
    } finally {
      setDeleting(null)
    }
  }

  if (history.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        Chưa có lịch sử nhận xét nào.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {history.map((item) => {
        const isOpen = expanded === item.id
        return (
          <div
            key={item.id}
            className="border rounded-lg overflow-hidden transition-colors hover:border-rose-500/30"
          >
            {/* Row header */}
            <button
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
              onClick={() => setExpanded(isOpen ? null : item.id)}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Clock className="h-4 w-4 text-rose-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{formatDate(item.created_at)}</span>
                    <span className="text-xs text-muted-foreground">{formatTime(item.created_at)}</span>
                  </div>
                  {!isOpen && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {getPreview(item.content)}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(item.id) }}
                  disabled={deleting === item.id}
                  className="p-1 rounded hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors"
                  title="Xóa nhận xét này"
                >
                  {deleting === item.id
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <Trash2 className="h-3.5 w-3.5" />
                  }
                </button>
                {isOpen
                  ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                }
              </div>
            </button>

            {/* Expanded content */}
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 border-t bg-muted/20">
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-base prose-headings:font-semibold prose-p:leading-relaxed prose-li:leading-relaxed prose-strong:text-foreground pt-3">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {item.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function EnglishFeedbackPage() {
  const { user } = useAuth()
  const [state, setState] = useState<FeedbackState>('idle')
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Load history
  const loadHistory = useCallback(async () => {
    setHistoryLoading(true)
    try {
      const res = await fetch('/api/english-feedback/history')
      if (res.ok) {
        const json = await res.json()
        setHistory(json.history ?? [])
      }
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  // Save feedback after streaming done
  const saveFeedback = useCallback(async (text: string) => {
    if (!text.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/english-feedback/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      })
      if (res.ok) {
        const json = await res.json()
        // Prepend to local history list
        setHistory((prev) => [
          { id: json.id, content: text, created_at: json.created_at },
          ...prev,
        ])
      }
    } finally {
      setSaving(false)
    }
  }, [])

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

      let fullText = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        fullText += chunk
        setFeedback((prev) => prev + chunk)
      }

      setState('done')
      setGeneratedAt(new Date())

      // Save to history in background
      await saveFeedback(fullText)
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

      {/* Actions row */}
      <div className="flex items-center gap-3 flex-wrap">
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
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            {saving
              ? <><Loader2 className="h-3 w-3 animate-spin" /> Đang lưu...</>
              : <>✓ Đã lưu lúc {generatedAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</>
            }
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
                    <div className="h-3 rounded-full bg-muted animate-pulse" style={{ width: `${w}%` }} />
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

      {/* ─── History Section ─────────────────────────────────────────────── */}
      <div>
        <button
          onClick={() => setHistoryOpen((o) => !o)}
          className="w-full flex items-center justify-between py-3 px-1 text-left group"
        >
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-rose-500" />
            <span className="text-sm font-semibold">Lịch sử nhận xét</span>
            {history.length > 0 && (
              <Badge variant="secondary" className="text-xs h-5 px-1.5">
                {history.length}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            {historyLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {historyOpen
              ? <ChevronDown className="h-4 w-4 group-hover:text-foreground transition-colors" />
              : <ChevronRight className="h-4 w-4 group-hover:text-foreground transition-colors" />
            }
          </div>
        </button>

        <AnimatePresence>
          {historyOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <HistoryPanel
                history={history}
                onDelete={(id) => setHistory((prev) => prev.filter((h) => h.id !== id))}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
