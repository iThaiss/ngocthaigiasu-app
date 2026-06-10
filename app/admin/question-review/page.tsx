'use client'

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import { renderLatex } from '@/lib/math-render'
import {
  ArrowLeft, ArrowRight, ChevronDown, ChevronRight, ChevronUp,
  Layers, Loader2, PartyPopper, RotateCcw, Trash2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'

// ─── Types ───────────────────────────────────────────────────────────────────

interface SubtopicStat {
  subtopic: string | null
  pending: number
  published: number
  total: number
}

interface TopicStat {
  topic: string | null
  pending: number
  published: number
  total: number
  subtopics: SubtopicStat[]
}

interface StatsData {
  topics: TopicStat[]
  allTopics: string[]
  subtopicsByTopic: Record<string, string[]>
}

interface Question {
  id: string
  question_text: string
  question_type: 'multiple_choice' | 'true_false' | 'short_answer'
  difficulty: string | null
  correct_answer: string | null
  option_a: string | null
  option_b: string | null
  option_c: string | null
  option_d: string | null
  statements: Array<{ label: string; text: string; answer: boolean }> | null
  numeric_answer: number | string | null
  explanation: string | null
  topic: string | null
  subtopic: string | null
  part: string | null
  is_published: boolean
  needs_review: boolean
  image_url: string | null
}

interface HistoryEntry {
  question: Question
  action: 'publish' | 'review'
  prevState: { is_published: boolean; needs_review: boolean }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function LatexText({ text, className }: { text: string; className?: string }) {
  return (
    <span
      className={`inline-block max-w-full min-w-0 overflow-x-auto align-bottom scrollbar-none ${className || ''}`}
      dangerouslySetInnerHTML={{ __html: renderLatex(text) }}
    />
  )
}

const DIFF_COLOR: Record<string, string> = {
  'Nhận biết': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'Thông hiểu': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'Vận dụng': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'Vận dụng cao': 'bg-red-500/20 text-red-400 border-red-500/30',
}

// ─── SwipeCard ───────────────────────────────────────────────────────────────

interface SwipeCardHandle {
  exit: (dir: 'left' | 'right') => void
}

interface SwipeCardProps {
  question: Question
  onSwipeDecided: (dir: 'left' | 'right') => void
  onExitComplete: () => void
  onDelete: () => void
  allTopics: string[]
  subtopicsByTopic: Record<string, string[]>
}

const SwipeCard = forwardRef<SwipeCardHandle, SwipeCardProps>(
  function SwipeCard({ question, onSwipeDecided, onExitComplete, onDelete, allTopics, subtopicsByTopic }, ref) {
    const x = useMotionValue(0)
    const rotate = useTransform(x, [-250, 250], [-13, 13])
    const publishOpacity = useTransform(x, [40, 130], [0, 1])
    const reviewOpacity = useTransform(x, [-130, -40], [1, 0])
    const isExiting = useRef(false)
    const [showExplanation, setShowExplanation] = useState(false)

    // Inline topic/subtopic editing
    const [editTopic, setEditTopic] = useState(question.topic ?? '')
    const [editSubtopic, setEditSubtopic] = useState(question.subtopic ?? '')
    const [savingClass, setSavingClass] = useState(false)
    const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
      setEditTopic(question.topic ?? '')
      setEditSubtopic(question.subtopic ?? '')
      setShowExplanation(false)
      isExiting.current = false
      return () => {
        if (saveTimer.current) clearTimeout(saveTimer.current)
      }
    }, [question.id])

    const saveClassification = useCallback((field: 'topic' | 'subtopic', value: string) => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(async () => {
        setSavingClass(true)
        const updates = field === 'topic' ? { topic: value || null } : { subtopic: value || null }
        await fetch(`/api/admin/questions/${question.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        }).catch(() => null)
        setSavingClass(false)
      }, 600)
    }, [question.id])

    const doExit = useCallback((dir: 'left' | 'right') => {
      if (isExiting.current) return
      isExiting.current = true
      animate(x, dir === 'right' ? 640 : -640, {
        duration: 0.3,
        ease: 'easeIn',
        onComplete: onExitComplete,
      })
    }, [x, onExitComplete])

    useImperativeHandle(ref, () => ({ exit: doExit }), [doExit])

    const handleDragEnd = (_: unknown, { offset, velocity }: { offset: { x: number }; velocity: { x: number } }) => {
      if (isExiting.current) return
      if (offset.x > 80 || velocity.x > 400) {
        onSwipeDecided('right')
        doExit('right')
      } else if (offset.x < -80 || velocity.x < -400) {
        onSwipeDecided('left')
        doExit('left')
      } else {
        animate(x, 0, { type: 'spring', stiffness: 400, damping: 30 })
      }
    }

    const availableSubs = editTopic
      ? (subtopicsByTopic[editTopic] ?? [])
      : Array.from(new Set(Object.values(subtopicsByTopic).flat()))

    return (
      <motion.div
        style={{ x, rotate }}
        drag={isExiting.current ? false : 'x'}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        className="relative w-full touch-none cursor-grab active:cursor-grabbing select-none"
      >
        {/* Publish overlay */}
        <motion.div
          style={{ opacity: publishOpacity }}
          className="pointer-events-none absolute inset-0 z-10 flex items-start justify-start p-5"
        >
          <div className="rounded-xl border-4 border-green-500 px-4 py-2 -rotate-12">
            <span className="text-xl font-black tracking-widest text-green-500">XUẤT BẢN</span>
          </div>
        </motion.div>

        {/* Review overlay */}
        <motion.div
          style={{ opacity: reviewOpacity }}
          className="pointer-events-none absolute inset-0 z-10 flex items-start justify-end p-5"
        >
          <div className="rounded-xl border-4 border-amber-500 px-4 py-2 rotate-12">
            <span className="text-xl font-black tracking-widest text-amber-500">XEM LẠI</span>
          </div>
        </motion.div>

        {/* Card */}
        <div className="rounded-2xl border bg-card shadow-2xl overflow-hidden">
          {/* Card header */}
          <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-3">
            <div className="flex flex-1 flex-wrap items-center gap-1.5 min-w-0">
              {question.difficulty && (
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${DIFF_COLOR[question.difficulty] ?? 'bg-muted text-muted-foreground'}`}>
                  {question.difficulty}
                </span>
              )}
              {question.part && <Badge variant="outline" className="text-xs">{question.part}</Badge>}
              {question.question_type === 'true_false' && <Badge variant="secondary" className="text-xs">Đúng/Sai</Badge>}
              {question.question_type === 'short_answer' && <Badge variant="secondary" className="text-xs">Ngắn</Badge>}
              {question.needs_review && <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30 text-xs">Cần duyệt</Badge>}
            </div>
            <button
              type="button"
              className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              onClick={(e) => { e.stopPropagation(); onDelete() }}
              title="Xóa câu hỏi"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="max-h-[58vh] overflow-y-auto p-4 space-y-3">
            {/* Question text */}
            <div className="text-sm font-medium leading-relaxed">
              <LatexText text={question.question_text} />
            </div>

            {/* Image */}
            {question.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={question.image_url} alt="" className="max-h-44 w-auto rounded-lg border object-contain" />
            )}

            {/* Multiple choice options */}
            {question.question_type === 'multiple_choice' && (
              <div className="grid gap-1.5">
                {(['A', 'B', 'C', 'D'] as const).map((label) => {
                  const text = question[`option_${label.toLowerCase()}` as keyof Question] as string | null
                  if (!text) return null
                  const isCorrect = question.correct_answer === label
                  return (
                    <div
                      key={label}
                      className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
                        isCorrect
                          ? 'border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-300'
                          : 'border-border bg-background/60'
                      }`}
                    >
                      <span className="shrink-0 font-bold">{label}.</span>
                      <LatexText text={text} className="flex-1" />
                      {isCorrect && <span className="shrink-0 text-green-500 font-bold text-xs mt-0.5">✓</span>}
                    </div>
                  )
                })}
              </div>
            )}

            {/* True/False statements */}
            {question.question_type === 'true_false' && question.statements && (
              <div className="space-y-1.5">
                {question.statements.map((st) => (
                  <div
                    key={st.label}
                    className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
                      st.answer
                        ? 'border-green-500/40 bg-green-500/5'
                        : 'border-red-500/40 bg-red-500/5'
                    }`}
                  >
                    <span className="shrink-0 font-bold">{st.label})</span>
                    <LatexText text={st.text} className="flex-1" />
                    <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${st.answer ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                      {st.answer ? 'Đ' : 'S'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Short answer */}
            {question.question_type === 'short_answer' && (
              <div className="rounded-lg border border-green-500/40 bg-green-500/5 px-3 py-2 text-sm">
                <span className="text-muted-foreground">Đáp số: </span>
                <strong>
                  {question.numeric_answer != null ? String(question.numeric_answer) : question.correct_answer ?? '—'}
                </strong>
              </div>
            )}

            {/* Classification */}
            <div className="rounded-xl border bg-muted/20 p-3 space-y-2">
              <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                Phân loại
                {savingClass && <Loader2 className="h-3 w-3 animate-spin" />}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wide">Topic</label>
                  <input
                    list={`tl-${question.id}`}
                    value={editTopic}
                    onChange={(e) => {
                      setEditTopic(e.target.value)
                      saveClassification('topic', e.target.value)
                    }}
                    placeholder="Chủ đề..."
                    className="w-full rounded-md border bg-background px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-ring"
                  />
                  <datalist id={`tl-${question.id}`}>
                    {allTopics.map((t) => <option key={t} value={t} />)}
                  </datalist>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wide">Subtopic</label>
                  <input
                    list={`sl-${question.id}`}
                    value={editSubtopic}
                    onChange={(e) => {
                      setEditSubtopic(e.target.value)
                      saveClassification('subtopic', e.target.value)
                    }}
                    placeholder="Dạng bài..."
                    className="w-full rounded-md border bg-background px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-ring"
                  />
                  <datalist id={`sl-${question.id}`}>
                    {availableSubs.map((s) => <option key={s} value={s} />)}
                  </datalist>
                </div>
              </div>
            </div>

            {/* Explanation */}
            {question.explanation && (
              <div>
                <button
                  type="button"
                  className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                  onClick={() => setShowExplanation((v) => !v)}
                >
                  {showExplanation ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  Giải thích
                </button>
                {showExplanation && (
                  <div className="mt-2 rounded-lg border bg-muted/20 p-3 text-sm leading-relaxed">
                    <LatexText text={question.explanation} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    )
  }
)

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function QuestionReviewPage() {
  const { toast } = useToast()

  // Phase
  const [phase, setPhase] = useState<'picker' | 'review' | 'done'>('picker')

  // Stats (picker phase)
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)
  const [filterPendingOnly, setFilterPendingOnly] = useState(true)
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set())

  // Review state
  const [currentTopic, setCurrentTopic] = useState<string | null>(null)
  const [currentSubtopic, setCurrentSubtopic] = useState<string | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [fetchedPage, setFetchedPage] = useState(0)
  const [loadingFirst, setLoadingFirst] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [sessionStats, setSessionStats] = useState({ published: 0, review: 0, deleted: 0 })
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Refs for animation coordination
  const cardRef = useRef<SwipeCardHandle | null>(null)
  const isExitingRef = useRef(false)
  const undoLockRef = useRef(false)

  // ── Load stats ──
  useEffect(() => {
    fetch('/api/admin/questions/stats')
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(() => toast({ title: 'Không tải được thống kê', variant: 'destructive' }))
      .finally(() => setLoadingStats(false))
  }, [toast])

  // ── Fetch questions batch ──
  const fetchBatch = useCallback(async (
    topic: string | null,
    subtopic: string | null,
    page: number,
    isFirst: boolean,
  ) => {
    if (isFirst) setLoadingFirst(true)
    else setLoadingMore(true)

    const params = new URLSearchParams({ limit: '20', page: String(page), published: 'false' })
    if (topic !== null) params.set('topic', topic)
    else params.set('topicNull', 'true')
    if (subtopic !== null) params.set('subtopicExact', subtopic)

    try {
      const res = await fetch(`/api/admin/questions?${params}`)
      const data = await res.json()
      const newQs: Question[] = data.questions ?? []
      if (isFirst) {
        setQuestions(newQs)
        setTotalCount(data.total ?? 0)
      } else {
        setQuestions((prev) => [...prev, ...newQs])
      }
      setFetchedPage(page)
    } catch {
      toast({ title: 'Không tải được câu hỏi', variant: 'destructive' })
    } finally {
      if (isFirst) setLoadingFirst(false)
      else setLoadingMore(false)
    }
  }, [toast])

  // ── Enter review ──
  const enterReview = useCallback((topic: string | null, subtopic: string | null) => {
    setCurrentTopic(topic)
    setCurrentSubtopic(subtopic)
    setCurrentIdx(0)
    setHistory([])
    setSessionStats({ published: 0, review: 0, deleted: 0 })
    isExitingRef.current = false
    setPhase('review')
    fetchBatch(topic, subtopic, 1, true)
  }, [fetchBatch])

  // ── Prefetch next batch when running low ──
  useEffect(() => {
    if (phase !== 'review' || loadingMore) return
    const remaining = questions.length - currentIdx
    if (remaining <= 5 && questions.length < totalCount) {
      fetchBatch(currentTopic, currentSubtopic, fetchedPage + 1, false)
    }
  }, [currentIdx, questions.length, totalCount, loadingMore, phase, currentTopic, currentSubtopic, fetchedPage, fetchBatch])

  // ── Detect done ──
  useEffect(() => {
    if (phase !== 'review') return
    if (!loadingFirst && questions.length > 0 && currentIdx >= questions.length && currentIdx >= totalCount) {
      setPhase('done')
    }
  }, [currentIdx, questions.length, totalCount, loadingFirst, phase])

  // ── Core action (fire API + update state) ──
  const doAction = useCallback((action: 'publish' | 'review', triggeredBySwipe = false) => {
    if (isExitingRef.current) return
    const q = questions[currentIdx]
    if (!q) return

    isExitingRef.current = true

    const updates = action === 'publish'
      ? { is_published: true, needs_review: false }
      : { is_published: false, needs_review: true }

    fetch(`/api/admin/questions/${q.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
      .then((r) => r.json())
      .then((data) => {
        if (!data.success) {
          toast({
            title: action === 'publish' ? 'Không xuất bản được' : 'Không cập nhật được',
            description: data.error ?? 'Lỗi không xác định',
            variant: 'destructive',
          })
        }
      })
      .catch(() => toast({ title: 'Lỗi kết nối', variant: 'destructive' }))

    setHistory((h) => [{
      question: q,
      action,
      prevState: { is_published: q.is_published, needs_review: q.needs_review },
    }, ...h.slice(0, 4)])

    setSessionStats((s) => action === 'publish'
      ? { ...s, published: s.published + 1 }
      : { ...s, review: s.review + 1 })

    // If keyboard/button triggered, animate the card out
    if (!triggeredBySwipe && cardRef.current) {
      cardRef.current.exit(action === 'publish' ? 'right' : 'left')
    }
  }, [questions, currentIdx, toast])

  const handleExitComplete = useCallback(() => {
    setCurrentIdx((i) => i + 1)
    isExitingRef.current = false
  }, [])

  const handleSwipeDecided = useCallback((dir: 'left' | 'right') => {
    doAction(dir === 'right' ? 'publish' : 'review', true)
  }, [doAction])

  const handlePublish = useCallback(() => doAction('publish', false), [doAction])
  const handleReview = useCallback(() => doAction('review', false), [doAction])

  // ── Undo ──
  const handleUndo = useCallback(() => {
    if (undoLockRef.current || !history.length || isExitingRef.current) return
    undoLockRef.current = true

    const entry = history[0]
    setHistory((h) => h.slice(1))

    fetch(`/api/admin/questions/${entry.question.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_published: entry.prevState.is_published, needs_review: entry.prevState.needs_review }),
    }).catch(() => null)

    const targetIdx = Math.max(0, currentIdx - 1)
    setQuestions((prev) => {
      const next = [...prev]
      next.splice(targetIdx, 0, entry.question)
      return next
    })
    setCurrentIdx(targetIdx)
    setSessionStats((s) => entry.action === 'publish'
      ? { ...s, published: Math.max(0, s.published - 1) }
      : { ...s, review: Math.max(0, s.review - 1) })

    toast({ title: 'Đã hoàn tác' })
    setTimeout(() => { undoLockRef.current = false }, 600)
  }, [history, currentIdx, toast])

  // ── Delete ──
  const handleDelete = useCallback(async () => {
    const q = questions[currentIdx]
    if (!q) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/questions/${q.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setSessionStats((s) => ({ ...s, deleted: s.deleted + 1 }))
      setTotalCount((c) => c - 1)
      setQuestions((prev) => prev.filter((_, i) => i !== currentIdx))
      setDeleteOpen(false)
      toast({ title: 'Đã xóa câu hỏi' })
    } catch {
      toast({ title: 'Không xóa được', variant: 'destructive' })
    } finally {
      setDeleting(false)
    }
  }, [questions, currentIdx, toast])

  // ── Keyboard shortcuts ──
  useEffect(() => {
    if (phase !== 'review') return
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') handlePublish()
      else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') handleReview()
      else if (e.key === 'z' || e.key === 'Z') handleUndo()
      else if (e.key === 'Delete' || e.key === 'Backspace') setDeleteOpen(true)
      else if (e.key === 'Escape') { setPhase('picker'); setQuestions([]) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [phase, handlePublish, handleReview, handleUndo])

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER: Picker phase
  // ═══════════════════════════════════════════════════════════════════════════
  if (phase === 'picker') {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            <div>
              <h1 className="text-lg font-bold">Swipe Duyệt Câu Hỏi</h1>
              <p className="text-xs text-muted-foreground">Chọn chủ đề → swipe phải xuất bản, trái xem lại</p>
            </div>
          </div>
          <label className="ml-auto flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={filterPendingOnly}
              onChange={(e) => setFilterPendingOnly(e.target.checked)}
              className="h-4 w-4 rounded"
            />
            Chỉ chủ đề có pending
          </label>
        </div>

        {loadingStats ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> Đang tải...
          </div>
        ) : (
          <div className="space-y-2">
            {(stats?.topics ?? [])
              .filter((t) => t.topic !== null && (!filterPendingOnly || t.pending > 0))
              .map((topicStat) => {
                const isExpanded = expandedTopics.has(topicStat.topic!)
                const filteredSubs = topicStat.subtopics.filter((s) => !filterPendingOnly || s.pending > 0)
                const publishedPct = topicStat.total ? Math.round((topicStat.published / topicStat.total) * 100) : 0

                return (
                  <div key={topicStat.topic} className="rounded-xl border bg-card overflow-hidden">
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40"
                      onClick={() => setExpandedTopics((prev) => {
                        const next = new Set(prev)
                        if (next.has(topicStat.topic!)) next.delete(topicStat.topic!)
                        else next.add(topicStat.topic!)
                        return next
                      })}
                    >
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm truncate">{topicStat.topic}</span>
                          {topicStat.pending > 0 && (
                            <span className="shrink-0 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-500">
                              {topicStat.pending} pending
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={publishedPct} className="h-1.5 flex-1" />
                          <span className="shrink-0 text-[10px] text-muted-foreground">
                            {topicStat.published}/{topicStat.total}
                          </span>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {topicStat.pending > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={(e) => { e.stopPropagation(); enterReview(topicStat.topic, null) }}
                          >
                            Duyệt hết ({topicStat.pending})
                          </Button>
                        )}
                        {isExpanded
                          ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    </button>

                    {isExpanded && filteredSubs.length > 0 && (
                      <div className="border-t divide-y bg-muted/10">
                        {filteredSubs.map((sub) => (
                          <button
                            key={sub.subtopic ?? '__null__'}
                            type="button"
                            className="flex w-full items-center gap-3 px-6 py-2.5 text-left text-sm transition-colors hover:bg-muted/30"
                            onClick={() => enterReview(topicStat.topic, sub.subtopic)}
                          >
                            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            <span className="flex-1 text-muted-foreground">{sub.subtopic ?? 'Chưa phân loại'}</span>
                            <span className="text-[10px] text-muted-foreground">{sub.published}/{sub.total}</span>
                            {sub.pending > 0 && (
                              <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-500">
                                {sub.pending}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}

            {/* Unclassified (topic IS NULL) */}
            {(() => {
              const u = stats?.topics.find((t) => t.topic === null)
              if (!u || (filterPendingOnly && u.pending === 0)) return null
              return (
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-xl border border-dashed bg-card px-4 py-3 text-left transition-colors hover:bg-muted/30"
                  onClick={() => enterReview(null, null)}
                >
                  <span className="flex-1 text-sm italic text-muted-foreground">Chưa phân loại topic</span>
                  {u.pending > 0 && (
                    <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-500">
                      {u.pending} pending
                    </span>
                  )}
                </button>
              )
            })()}

            {(stats?.topics ?? []).filter((t) => t.topic !== null && (!filterPendingOnly || t.pending > 0)).length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {filterPendingOnly ? 'Không còn câu hỏi cần duyệt 🎉' : 'Chưa có câu hỏi nào.'}
              </p>
            )}
          </div>
        )}
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER: Done phase
  // ═══════════════════════════════════════════════════════════════════════════
  if (phase === 'done') {
    return (
      <div className="mx-auto flex max-w-xs flex-col items-center gap-6 py-16 text-center">
        <PartyPopper className="h-14 w-14 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Duyệt xong!</h2>
          <p className="mt-1 text-sm text-muted-foreground truncate max-w-[200px] mx-auto">
            {currentSubtopic ?? currentTopic ?? 'Tất cả câu hỏi'}
          </p>
        </div>
        <div className="grid w-full grid-cols-3 gap-3">
          <div className="rounded-xl border p-3 text-center">
            <p className="text-xl font-bold text-green-500">{sessionStats.published}</p>
            <p className="text-xs text-muted-foreground">Xuất bản</p>
          </div>
          <div className="rounded-xl border p-3 text-center">
            <p className="text-xl font-bold text-amber-500">{sessionStats.review}</p>
            <p className="text-xs text-muted-foreground">Xem lại</p>
          </div>
          <div className="rounded-xl border p-3 text-center">
            <p className="text-xl font-bold text-red-500">{sessionStats.deleted}</p>
            <p className="text-xs text-muted-foreground">Đã xóa</p>
          </div>
        </div>
        <Button onClick={() => { setPhase('picker'); setQuestions([]); setCurrentIdx(0) }}>
          Chọn topic khác
        </Button>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER: Review phase
  // ═══════════════════════════════════════════════════════════════════════════
  const q = questions[currentIdx]
  const nextQ = questions[currentIdx + 1]
  const progress = totalCount > 0 ? Math.min(100, Math.round((currentIdx / totalCount) * 100)) : 0
  const canUndo = history.length > 0

  return (
    <div className="mx-auto max-w-lg space-y-3">
      {/* Header bar */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => { setPhase('picker'); setQuestions([]) }}
          title="Esc"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-1.5 text-sm">
            <span className="truncate font-medium">{currentSubtopic ?? currentTopic ?? 'Tất cả'}</span>
            <span className="shrink-0 text-muted-foreground text-xs">· {currentIdx + 1}/{totalCount}</span>
          </div>
          <Progress value={progress} className="h-1" />
        </div>
        {/* Session mini-stats */}
        <div className="flex shrink-0 items-center gap-2 text-xs">
          <span className="text-green-500 font-semibold">{sessionStats.published}✓</span>
          <span className="text-amber-500 font-semibold">{sessionStats.review}↺</span>
          {sessionStats.deleted > 0 && <span className="text-red-500 font-semibold">{sessionStats.deleted}✕</span>}
        </div>
      </div>

      {/* Card stack */}
      {loadingFirst ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !q ? (
        <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
          {totalCount === 0 ? 'Không có câu hỏi nào trong bộ lọc này.' : 'Đang tải...'}
        </div>
      ) : (
        <div className="relative">
          {/* Shadow card behind */}
          {nextQ && (
            <div
              className="pointer-events-none absolute inset-x-0 top-3 mx-3 -z-10 h-20 rounded-2xl border bg-card/50 blur-[1px]"
              style={{ transform: 'scale(0.96)' }}
            />
          )}
          <SwipeCard
            key={q.id}
            ref={cardRef}
            question={q}
            onSwipeDecided={handleSwipeDecided}
            onExitComplete={handleExitComplete}
            onDelete={() => setDeleteOpen(true)}
            allTopics={stats?.allTopics ?? []}
            subtopicsByTopic={stats?.subtopicsByTopic ?? {}}
          />
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          className="flex-1 border-amber-500/40 text-amber-500 hover:border-amber-500 hover:bg-amber-500/10"
          disabled={!q || isExitingRef.current}
          onClick={handleReview}
          title="← hoặc A"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Xem lại
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={!canUndo}
          onClick={handleUndo}
          title="Z"
          className="gap-1 text-muted-foreground px-3"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Undo
        </Button>
        <Button
          className="flex-1 bg-green-600 text-white hover:bg-green-700"
          disabled={!q || isExitingRef.current}
          onClick={handlePublish}
          title="→ hoặc D"
        >
          Xuất bản <ArrowRight className="ml-1.5 h-4 w-4" />
        </Button>
      </div>

      {/* Keyboard hint */}
      <p className="text-center text-[11px] text-muted-foreground">
        <kbd className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">←</kbd> Xem lại &nbsp;·&nbsp;
        <kbd className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">Z</kbd> Undo &nbsp;·&nbsp;
        <kbd className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">→</kbd> Xuất bản &nbsp;·&nbsp;
        <kbd className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">Del</kbd> Xóa
      </p>

      {/* Delete dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xóa câu hỏi?</DialogTitle>
            <DialogDescription>Hành động này không thể hoàn tác.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>Hủy</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xóa câu hỏi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
