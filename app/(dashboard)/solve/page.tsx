'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain, Sparkles, Clock, History, Crown, Zap, AlertCircle,
  BookOpen, ChevronRight, Loader2, Lightbulb,
} from 'lucide-react'
import katex from 'katex'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import Dropzone from '@/components/solve/Dropzone'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/components/ui/use-toast'
import Link from 'next/link'

// ─── Types ──────────────────────────────────────────────────────────────────
interface SolveStep {
  step: number
  title: string
  content: string
}

interface Solution {
  problem: string
  steps: SolveStep[]
  answer: string
  tips: string | null
  topics: string[]
  difficulty: string
}

interface RelatedQuestion {
  id: string
  question_text: string
  difficulty: string | null
  correct_answer: string | null
}

interface HistoryItem {
  id: string
  problem_text: string
  topics: string[] | null
  difficulty: string | null
  model_used: string
  image_url: string | null
  created_at: string
}

interface SolveResult {
  solution: Solution
  relatedQuestions: RelatedQuestion[]
  modelUsed: string
  modelLabel: string
  remainingToday: number
  limit: number
}

interface Status {
  usedToday: number
  limit: number
  remaining: number
  model: string
  modelLabel: string
  isVip: boolean
  history: HistoryItem[]
}

// ─── LaTeX Renderer ──────────────────────────────────────────────────────────
function renderLatex(text: string): string {
  if (!text) return ''
  let result = text
  // Block math: $$...$$
  result = result.replace(/\$\$([^$]+)\$\$/g, (_, math) => {
    try {
      return `<div class="my-3 overflow-x-auto py-1">${katex.renderToString(math.trim(), { throwOnError: false, displayMode: true })}</div>`
    } catch { return `<span class="font-mono text-sm bg-muted px-1 rounded">${math}</span>` }
  })
  // Inline math: $...$
  result = result.replace(/\$([^$\n]+)\$/g, (_, math) => {
    try {
      return katex.renderToString(math.trim(), { throwOnError: false, displayMode: false })
    } catch { return `<span class="font-mono text-sm bg-muted px-1 rounded">${math}</span>` }
  })
  // Newlines to <br>
  result = result.replace(/\n/g, '<br/>')
  return result
}

function LatexText({ text, className }: { text: string; className?: string }) {
  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: renderLatex(text) }}
    />
  )
}

// ─── Difficulty Badge ────────────────────────────────────────────────────────
const DIFF_COLOR: Record<string, string> = {
  'Nhận biết': 'bg-green-500/15 text-green-600 dark:text-green-400',
  'Thông hiểu': 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  'Vận dụng': 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400',
  'Vận dụng cao': 'bg-red-500/15 text-red-600 dark:text-red-400',
}

function relativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Vừa xong'
  if (m < 60) return `${m} phút trước`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} giờ trước`
  return `${Math.floor(h / 24)} ngày trước`
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function SolvePage() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [file, setFile] = useState<File | null>(null)
  const [solving, setSolving] = useState(false)
  const [result, setResult] = useState<SolveResult | null>(null)
  const [status, setStatus] = useState<Status | null>(null)
  const [loadingStatus, setLoadingStatus] = useState(true)

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/solve')
      if (res.ok) setStatus(await res.json())
    } finally {
      setLoadingStatus(false)
    }
  }, [])

  useEffect(() => { fetchStatus() }, [fetchStatus])

  const handleFileAccepted = useCallback((f: File) => {
    setFile(f)
    setResult(null)
  }, [])

  const handleSolve = async () => {
    if (!file) {
      toast({ title: 'Vui lòng chọn ảnh bài toán', variant: 'destructive' })
      return
    }
    setSolving(true)
    try {
      const fd = new FormData()
      fd.append('image', file)
      const res = await fetch('/api/solve', { method: 'POST', body: fd })
      const data = await res.json()

      if (res.status === 429) {
        toast({
          title: 'Hết lượt hôm nay',
          description: `Đã dùng ${data.used}/${data.limit} lượt. ${!data.isVip ? 'Nâng cấp VIP để dùng nhiều hơn!' : 'Quay lại vào ngày mai.'}`,
          variant: 'destructive',
        })
        return
      }
      if (res.status === 400 && data.error === 'Không phải bài toán') {
        toast({ title: 'Không nhận diện được bài toán', description: 'Vui lòng upload ảnh bài Toán rõ hơn.', variant: 'destructive' })
        return
      }
      if (!res.ok) {
        toast({ title: 'Dịch vụ tạm thời gián đoạn', description: 'Vui lòng thử lại sau.', variant: 'destructive' })
        return
      }

      setResult(data)
      // Update remaining count
      setStatus((prev) => prev ? { ...prev, remaining: data.remainingToday, usedToday: data.limit - data.remainingToday } : prev)
      toast({ title: 'Giải xong!', description: `Dùng ${data.modelLabel}` })
      // Refresh history
      fetchStatus()
    } finally {
      setSolving(false)
    }
  }

  const isLimitReached = status !== null && status.remaining <= 0
  const isVip = status?.isVip ?? false

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10">
          <Brain className="h-5 w-5 text-purple-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Giải toán AI</h1>
          <p className="text-muted-foreground text-sm">Upload ảnh bài toán — AI giải ngay từng bước</p>
        </div>
      </motion.div>

      {/* 2-column layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Upload */}
        <div className="space-y-4">
          {/* Status bar */}
          <Card className="border-purple-500/20">
            <CardContent className="pt-4 pb-4">
              {loadingStatus ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
              ) : status ? (
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      {isVip ? (
                        <Badge className="bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30 gap-1">
                          <Crown className="h-3 w-3" />
                          {status.modelLabel.includes('Pro') ? 'VIP Năm Học' : 'VIP Tháng'}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Free</Badge>
                      )}
                      <span className={`text-sm font-medium ${isLimitReached ? 'text-destructive' : 'text-foreground'}`}>
                        Còn {status.remaining}/{status.limit} lượt hôm nay
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Zap className="h-3 w-3" /> Đang dùng: {status.modelLabel}
                    </p>
                  </div>
                  {!isVip && (
                    <Link href="/payment">
                      <Button size="sm" variant="outline" className="border-yellow-500/30 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-500/10">
                        <Crown className="mr-1 h-3.5 w-3.5" /> Nâng cấp VIP
                      </Button>
                    </Link>
                  )}
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Limit reached warning */}
          {isLimitReached && !loadingStatus && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="border-destructive/30 bg-destructive/5">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm text-destructive">Hết lượt hôm nay</p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {isVip ? 'Quay lại vào ngày mai để tiếp tục.' : 'Nâng cấp VIP để có 20–50 lượt/ngày.'}
                      </p>
                      {!isVip && (
                        <Link href="/payment">
                          <Button size="sm" className="mt-2">
                            <Crown className="mr-1 h-3.5 w-3.5" /> Nâng cấp VIP ngay
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Dropzone */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <Dropzone onFileAccepted={handleFileAccepted} disabled={solving || isLimitReached} />
              <Button
                onClick={handleSolve}
                disabled={!file || solving || isLimitReached}
                className="w-full gap-2 h-11"
              >
                {solving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    AI đang phân tích...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Giải bài
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* History */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <History className="h-4 w-4" /> Lịch sử giải gần đây
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0 p-0">
              {loadingStatus ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : (status?.history ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Chưa có bài giải nào</p>
              ) : (
                <div className="divide-y divide-border">
                  {(status?.history ?? []).map((item) => (
                    <div key={item.id} className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                      {item.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.image_url} alt="" className="h-10 w-10 rounded object-cover shrink-0 border" />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-500/10">
                          <Brain className="h-4 w-4 text-purple-500" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.problem_text ?? 'Bài toán'}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {(item.topics ?? []).slice(0, 2).map((t) => (
                            <span key={t} className="text-[10px] bg-muted rounded px-1.5 py-0.5">{t}</span>
                          ))}
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <Clock className="h-2.5 w-2.5" /> {relativeTime(item.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Results */}
        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {solving ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Card className="border-purple-500/30">
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
                      <div>
                        <p className="font-medium">AI đang phân tích bài toán...</p>
                        <p className="text-sm text-muted-foreground">Thường mất 5–15 giây</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : result ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* Problem statement */}
                <Card className="border-purple-500/30">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <CardTitle className="text-base">Đề bài</CardTitle>
                      <div className="flex items-center gap-2">
                        {result.solution.difficulty && (
                          <span className={`text-xs font-medium rounded-full px-2.5 py-0.5 ${DIFF_COLOR[result.solution.difficulty] ?? 'bg-muted text-muted-foreground'}`}>
                            {result.solution.difficulty}
                          </span>
                        )}
                        {result.solution.topics?.slice(0, 2).map((t) => (
                          <span key={t} className="text-xs bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-full px-2.5 py-0.5">{t}</span>
                        ))}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <LatexText text={result.solution.problem} className="text-sm leading-relaxed" />
                  </CardContent>
                </Card>

                {/* Steps */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Lời giải từng bước</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {result.solution.steps.map((step, idx) => (
                      <motion.div
                        key={step.step}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.08 }}
                        className="flex gap-3"
                      >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                          {step.step}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold mb-1">{step.title}</p>
                          <LatexText text={step.content} className="text-sm text-muted-foreground leading-relaxed" />
                        </div>
                      </motion.div>
                    ))}
                  </CardContent>
                </Card>

                {/* Answer */}
                <Card className="border-green-500/30 bg-green-500/5">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/20">
                        <span className="text-green-600 dark:text-green-400 font-bold text-sm">✓</span>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wide mb-0.5">Đáp án</p>
                        <LatexText text={result.solution.answer} className="font-semibold text-green-700 dark:text-green-300" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Tips */}
                {result.solution.tips && (
                  <Card className="border-yellow-500/30 bg-yellow-500/5">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-start gap-3">
                        <Lightbulb className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-yellow-600 dark:text-yellow-400 uppercase tracking-wide mb-0.5">Mẹo giải nhanh</p>
                          <LatexText text={result.solution.tips} className="text-sm text-yellow-700 dark:text-yellow-300" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Related questions */}
                {result.relatedQuestions.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <BookOpen className="h-4 w-4" /> Câu hỏi liên quan từ ngân hàng đề
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-0 p-0">
                      {result.relatedQuestions.map((q, idx) => (
                        <div key={q.id}>
                          {idx > 0 && <Separator />}
                          <div className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm line-clamp-2">{q.question_text}</p>
                              <div className="flex items-center gap-2 mt-1.5">
                                {q.difficulty && (
                                  <span className={`text-[10px] font-medium rounded-full px-2 py-0.5 ${DIFF_COLOR[q.difficulty] ?? 'bg-muted text-muted-foreground'}`}>
                                    {q.difficulty}
                                  </span>
                                )}
                                {q.correct_answer && (
                                  <span className="text-[10px] text-muted-foreground">Đáp án: <span className="font-bold text-green-500">{q.correct_answer}</span></span>
                                )}
                              </div>
                            </div>
                            <Link href="/exam">
                              <Button size="sm" variant="ghost" className="shrink-0 gap-1 text-xs">
                                Luyện tập <ChevronRight className="h-3 w-3" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Meta info */}
                <p className="text-xs text-muted-foreground text-center">
                  Giải bởi {result.modelLabel} · Còn {result.remainingToday}/{result.limit} lượt hôm nay
                </p>
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-500/10">
                      <Sparkles className="h-8 w-8 text-purple-400" />
                    </div>
                    <div>
                      <p className="font-medium">Kết quả sẽ hiển thị tại đây</p>
                      <p className="text-sm text-muted-foreground mt-1">Upload ảnh và nhấn "Giải bài" để bắt đầu</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
