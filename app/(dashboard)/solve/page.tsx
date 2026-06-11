'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain, Sparkles, Clock, History, Crown, AlertCircle,
  ChevronRight, Loader2, Lightbulb,
} from 'lucide-react'
import PracticeModal, { type PracticeQuestion } from '@/components/PracticeModal'
import { renderLatex } from '@/lib/math-render'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import Dropzone from '@/components/solve/Dropzone'
import { useToast } from '@/components/ui/use-toast'
import Link from 'next/link'
import QuestionTutorAgent, { type TutorQuestionContext } from '@/components/QuestionTutorAgent'

// ─── Types ───────────────────────────────────────────────────────────────────

interface SolveStep {
  step: number
  title: string
  content: string
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
  steps: SolveStep[]
  answer: string
  tips: string | null
}

function formatAnswer(solution: Solution): string {
  if (solution.question_type === 'multiple_choice') {
    const optionMap: Record<string, string> = {
      A: solution.option_a ?? '',
      B: solution.option_b ?? '',
      C: solution.option_c ?? '',
      D: solution.option_d ?? '',
    }
    const ans = solution.correct_answer ?? solution.answer?.replace('Đáp án: ', '') ?? ''
    const content = optionMap[ans] ?? ''
    return `${ans}${content ? ' - ' + content : ''}`
  }
  if (solution.question_type === 'short_answer') {
    if (solution.numeric_answer !== null && solution.numeric_answer !== undefined) {
      return String(solution.numeric_answer)
    }
    const match = solution.answer?.match(/-?\d+\.?\d*/)
    return match ? match[0] : solution.answer ?? ''
  }
  if (solution.question_type === 'true_false') {
    if (solution.statements && solution.statements.length > 0) {
      return solution.statements.map((s) => (s.answer ? 'Đ' : 'S')).join('')
    }
    return solution.answer?.replace(/[^ĐDS]/g, '') ?? ''
  }
  return solution.answer ?? ''
}

interface RelatedQuestion {
  id: string
  question_type: 'multiple_choice' | 'true_false' | 'short_answer' | null
  question_text: string
  difficulty: string | null
  topic: string | null
  subtopic: string | null
  correct_answer: string | null
  option_a: string | null
  option_b: string | null
  option_c: string | null
  option_d: string | null
  statements: Array<{ label: string; text: string; answer: boolean }> | null
  numeric_answer: number | null
  explanation: string | null
}

interface HistoryItem {
  id: string
  problem_text: string
  topic: string | null
  difficulty: string | null
  model_used: string
  image_url: string | null
  solution: Solution | null
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

function LatexText({ text, className }: { text: string; className?: string }) {
  return (
    <span
      className={`inline-block max-w-full min-w-0 overflow-x-auto align-bottom scrollbar-none ${className || ''}`}
      dangerouslySetInnerHTML={{ __html: renderLatex(text) }}
    />
  )
}

// ─── Difficulty Badge ────────────────────────────────────────────────────────

const DIFF_COLOR: Record<string, string> = {
  'Nhận biết':    'bg-green-500/15 text-green-600 dark:text-green-400',
  'Thông hiểu':   'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  'Vận dụng':     'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400',
  'Vận dụng cao': 'bg-red-500/15 text-red-600 dark:text-red-400',
}

function DiffBadge({ diff }: { diff: string | null }) {
  if (!diff) return null
  return (
    <span className={`text-xs font-medium rounded-full px-2.5 py-0.5 ${DIFF_COLOR[diff] ?? 'bg-muted text-muted-foreground'}`}>
      {diff}
    </span>
  )
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

// ─── History Modal ────────────────────────────────────────────────────────────

function HistoryModal({ item, onClose }: { item: HistoryItem; onClose: () => void }) {
  const sol = item.solution
  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            <span>Chi tiết bài giải</span>
            {item.topic && (
              <span className="text-xs bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-full px-2.5 py-0.5 font-normal">
                {item.topic}
              </span>
            )}
            <DiffBadge diff={item.difficulty} />
          </DialogTitle>
        </DialogHeader>

        {!sol ? (
          <p className="text-sm text-muted-foreground">Không có dữ liệu lời giải.</p>
        ) : (
          <div className="space-y-4 mt-2">
            {/* Problem */}
            <div className="rounded-lg bg-muted/30 p-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Đề bài</p>
              <LatexText text={sol.problem} className="text-sm leading-relaxed" />
            </div>

            {/* Steps */}
            <div className="space-y-3">
              <p className="text-sm font-semibold">Lời giải từng bước</p>
              {sol.steps.map((step) => (
                <div key={step.step} className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                    {step.step}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold mb-0.5">{step.title}</p>
                    <LatexText text={step.content} className="text-sm text-muted-foreground leading-relaxed" />
                  </div>
                </div>
              ))}
            </div>

            {/* Answer */}
            <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-3 flex items-start gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500/20 shrink-0">
                <span className="text-green-600 dark:text-green-400 font-bold text-xs">✓</span>
              </div>
              <div>
                <p className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wide mb-0.5">Đáp án</p>
                <LatexText text={sol.answer} className="font-semibold text-green-700 dark:text-green-300" />
              </div>
            </div>

            {/* Tips */}
            {sol.tips && (
              <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3 flex items-start gap-3">
                <Lightbulb className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-yellow-600 dark:text-yellow-400 uppercase tracking-wide mb-0.5">Mẹo giải nhanh</p>
                  <LatexText text={sol.tips} className="text-sm text-yellow-700 dark:text-yellow-300" />
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground text-right">
              {relativeTime(item.created_at)}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SolvePage() {
  const { toast } = useToast()

  const [file, setFile] = useState<File | null>(null)
  const [solving, setSolving] = useState(false)
  const [result, setResult] = useState<SolveResult | null>(null)
  const [status, setStatus] = useState<Status | null>(null)
  const [loadingStatus, setLoadingStatus] = useState(true)
  const [historyModal, setHistoryModal] = useState<HistoryItem | null>(null)
  const [practiceOpen, setPracticeOpen] = useState(false)
  const [remainingToday, setRemainingToday] = useState<number | null>(null)
  const [dailyLimit, setDailyLimit] = useState<number | null>(null)

  // Crop state
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [cropFile, setCropFile] = useState<File | null>(null)
  const [crop, setCrop] = useState<Crop>({ unit: '%', x: 10, y: 10, width: 80, height: 80 })
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/solve')
      if (res.ok) setStatus(await res.json())
    } finally {
      setLoadingStatus(false)
    }
  }, [])

  useEffect(() => { fetchStatus() }, [fetchStatus])

  useEffect(() => {
    fetch('/api/solve/remaining')
      .then(r => r.json())
      .then(data => {
        if (typeof data.remaining === 'number') setRemainingToday(data.remaining)
        if (typeof data.limit === 'number') setDailyLimit(data.limit)
      })
      .catch(() => {})
  }, [])

  const handleFileAccepted = useCallback((f: File) => {
    setCropFile(f)
    setCropSrc(URL.createObjectURL(f))
    setResult(null)
  }, [])

  const handleImageLoad = useCallback(() => {
    if (!imgRef.current) return
    const { width, height } = imgRef.current
    setCompletedCrop({
      unit: 'px',
      x: Math.round(width * 0.10),
      y: Math.round(height * 0.10),
      width: Math.round(width * 0.80),
      height: Math.round(height * 0.80),
    })
  }, [])

  const handleCropConfirm = useCallback(async () => {
    if (!imgRef.current || !completedCrop || !cropFile) {
      setFile(cropFile)
      setCropSrc(null)
      return
    }
    const canvas = document.createElement('canvas')
    const scaleX = imgRef.current.naturalWidth / imgRef.current.width
    const scaleY = imgRef.current.naturalHeight / imgRef.current.height
    canvas.width = completedCrop.width * scaleX
    canvas.height = completedCrop.height * scaleY
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(
      imgRef.current,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0, 0,
      canvas.width,
      canvas.height,
    )
    canvas.toBlob((blob) => {
      setFile(blob ? new File([blob], cropFile.name, { type: cropFile.type }) : cropFile)
      setCropSrc(null)
    }, cropFile.type)
  }, [completedCrop, cropFile])

  const handleCropSkip = useCallback(() => {
    setFile(cropFile)
    setCropSrc(null)
  }, [cropFile])

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
        toast({ title: 'Không phát hiện bài toán trong ảnh. Vui lòng chỉ upload ảnh câu hỏi Toán.', variant: 'destructive' })
        return
      }
      if (!res.ok) {
        toast({ title: 'Dịch vụ tạm thời gián đoạn', description: data.error ?? 'Vui lòng thử lại sau.', variant: 'destructive' })
        return
      }

      setResult(data)
      setPracticeOpen(false)
      setRemainingToday(data.remainingToday)
      toast({ title: 'Giải xong!' })
      await fetchStatus()
    } finally {
      setSolving(false)
    }
  }

  const effectiveRemaining = remainingToday ?? status?.remaining ?? null
  const effectiveLimit = dailyLimit ?? status?.limit ?? null
  const isUnlimited = effectiveLimit === -1 || effectiveRemaining === -1
  const isLimitReached = !isUnlimited && effectiveRemaining !== null && effectiveRemaining <= 0
  const isVip = status?.isVip ?? false
  const solveTutorContext: TutorQuestionContext | null = result ? {
    questionText: result.solution.problem,
    type: result.solution.question_type,
    topic: result.solution.topic,
    subtopic: result.solution.subtopic,
    difficulty: result.solution.difficulty,
    options: {
      A: result.solution.option_a,
      B: result.solution.option_b,
      C: result.solution.option_c,
      D: result.solution.option_d,
    },
    statements: result.solution.statements ?? undefined,
    correctAnswer: result.solution.correct_answer,
    numericAnswer: result.solution.numeric_answer,
    explanation: result.solution.answer,
    solutionSteps: result.solution.steps,
    answered: true,
  } : null

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

        {/* ─── Left: Upload ─── */}
        <div className="space-y-4 min-w-0">
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
                          {status.modelLabel.includes('Năm') ? 'VIP Năm Học' : 'VIP Tháng'}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Free</Badge>
                      )}
                      <span className={`text-sm font-medium ${isLimitReached ? 'text-destructive' : 'text-foreground'}`}>
                        {isUnlimited ? 'Không giới hạn lượt' : `Còn ${effectiveRemaining ?? '…'}/${effectiveLimit ?? '…'} lượt hôm nay`}
                      </span>
                    </div>
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

          {/* Limit reached banner */}
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
              {/* Warning banner */}
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 space-y-1">
                <p className="text-sm text-amber-700 dark:text-amber-400">⚠️ Chỉ upload <strong>1 câu hỏi</strong> mỗi lần để AI giải chính xác nhất</p>
                <p className="text-xs text-muted-foreground">🤖 Kết quả AI có thể sai. Nếu phát hiện lỗi, hãy gửi phản hồi ở mục Liên hệ để đội ngũ kiểm tra lại.</p>
              </div>
              <Dropzone onFileAccepted={handleFileAccepted} disabled={solving || isLimitReached} />
              <Button
                onClick={handleSolve}
                disabled={!file || solving || isLimitReached}
                className="w-full gap-2 h-11"
              >
                {solving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang phân tích...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Giải bài
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center">Lưu ý: AI chỉ hỗ trợ các môn Toán</p>
            </CardContent>
          </Card>

          {/* History */}
          <Card className="w-full min-w-0 overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <History className="h-4 w-4" /> Lịch sử giải gần đây
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0 p-0 w-full min-w-0 overflow-hidden">
              {loadingStatus ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : (status?.history ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Chưa có bài giải nào</p>
              ) : (
                <div className="divide-y divide-border w-full min-w-0 overflow-hidden">
                  {(status?.history ?? []).map((item) => (
                    <div
                      key={item.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setHistoryModal(item)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setHistoryModal(item) }}
                      className="w-full flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors text-left cursor-pointer select-none min-w-0 overflow-hidden"
                    >
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
                          {item.topic && (
                            <span className="text-[10px] bg-muted rounded px-1.5 py-0.5">{item.topic}</span>
                          )}
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <Clock className="h-2.5 w-2.5" /> {relativeTime(item.created_at)}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ─── Right: Result ─── */}
        <div className="space-y-4 min-w-0">
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
                {/* Answer highlight */}
                <Card className="border-green-500/40 bg-green-500/8">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-500/20 text-lg">
                        ✅
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wide mb-0.5">Đáp án</p>
                        <LatexText
                          text={formatAnswer(result.solution)}
                          className="font-bold text-green-700 dark:text-green-300 text-base"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Problem statement */}
                <Card className="border-purple-500/30">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <CardTitle className="text-base">Đề bài</CardTitle>
                      <div className="flex items-center gap-2 flex-wrap">
                        <DiffBadge diff={result.solution.difficulty} />
                        <span className="text-xs bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-full px-2.5 py-0.5">
                          {result.solution.topic}
                        </span>
                        {result.solution.subtopic && (
                          <span className="text-xs bg-muted text-muted-foreground rounded-full px-2.5 py-0.5">
                            {result.solution.subtopic}
                          </span>
                        )}
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

                {solveTutorContext && (
                  <QuestionTutorAgent
                    mode="solve"
                    contextKey={`${result.solution.problem}-${result.modelUsed}`}
                    context={solveTutorContext}
                    title="AI hỏi thêm về lời giải"
                  />
                )}

                {/* Practice button */}
                {result.relatedQuestions.length > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPracticeOpen(true)}
                    className="w-full gap-2"
                  >
                    📚 Ôn tập câu tương tự
                  </Button>
                )}

                {/* Meta info */}
                <p className="text-xs text-muted-foreground text-center">
                  {isUnlimited ? 'Không giới hạn lượt' : `Còn ${effectiveRemaining ?? result.remainingToday}/${effectiveLimit ?? result.limit} lượt hôm nay`}
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
                      <p className="text-sm text-muted-foreground mt-1">Upload ảnh và nhấn &quot;Giải bài&quot; để bắt đầu</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Crop dialog */}
      {cropSrc && (
        <Dialog open onOpenChange={(open) => { if (!open) handleCropSkip() }}>
          <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Chọn vùng bài toán cần giải</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">Kéo để khoanh vùng 1 câu hỏi, sau đó nhấn &quot;Xác nhận crop&quot;.</p>
            <div className="flex justify-center overflow-hidden max-w-full">
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                className="max-w-full"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={imgRef}
                  src={cropSrc}
                  alt="crop preview"
                  onLoad={handleImageLoad}
                  className="w-full h-auto max-h-[50vh] object-contain"
                  style={{ maxHeight: '50vh', maxWidth: '100%', height: 'auto', display: 'block' }}
                />
              </ReactCrop>
            </div>
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-2">
              <Button variant="outline" onClick={handleCropSkip} className="w-full sm:w-auto">Bỏ qua crop</Button>
              <Button onClick={handleCropConfirm} className="w-full sm:w-auto">Xác nhận crop</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* History detail modal */}
      {historyModal && (
        <HistoryModal item={historyModal} onClose={() => setHistoryModal(null)} />
      )}

      {/* Practice modal */}
      {practiceOpen && result && result.relatedQuestions.length > 0 && (
        <PracticeModal
          isOpen={practiceOpen}
          onClose={() => setPracticeOpen(false)}
          initialQuestion={{
            ...result.relatedQuestions[0],
            question_type: result.relatedQuestions[0].question_type ?? 'multiple_choice',
          } as PracticeQuestion}
          topic={result.solution.topic}
          subtopic={result.solution.subtopic}
        />
      )}
    </div>
  )
}
