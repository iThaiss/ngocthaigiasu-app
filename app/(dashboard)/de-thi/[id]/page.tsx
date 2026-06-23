'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen, Clock, FileText, Loader2, Users, CheckCircle2, Trophy, AlertTriangle,
  LogIn,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import Timer from '@/components/exam/Timer'
import AnswerInput from '@/components/de-thi/AnswerInput'
import ResultView from '@/components/de-thi/ResultView'
import Leaderboard from '@/components/de-thi/Leaderboard'
import DethiQuestionGrid from '@/components/de-thi/DethiQuestionGrid'

type Phase = 'loading' | 'error' | 'start' | 'exam' | 'result'
type MobileTab = 'pdf' | 'answers'

interface Exam {
  id: string
  title: string
  year: number | null
  pdf_url: string | null
  time_limit_minutes: number
  question_count: number
  max_score: number
  attempt_count: number
  avg_score: number | null
  status: string
  solution_url: string | null
  handwritten_url: string | null
}

interface Question {
  question_number: number
  part: 'part_1' | 'part_2' | 'part_3'
  question_type: 'multiple_choice' | 'true_false' | 'short_answer'
  max_score: number
  scoring_rule: Record<string, unknown> | null
}

interface Submission {
  id: string
  score: number
  answers: Record<number, string>
  time_spent_seconds: number
  attempt_number: number
}

interface LeaderboardEntry {
  rank: number
  user_id: string
  name: string
  score: number
  time_spent_seconds: number
  submitted_at: string
  is_me: boolean
}

const PART_LABELS: Record<string, string> = {
  part_1: 'Phần I',
  part_2: 'Phần II',
  part_3: 'Phần III',
}

function toEmbedUrl(url: string): string {
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([^/?#]+)/)
  if (driveMatch) return `https://drive.google.com/file/d/${driveMatch[1]}/preview`
  const openMatch = url.match(/drive\.google\.com\/open\?id=([^&]+)/)
  if (openMatch) return `https://drive.google.com/file/d/${openMatch[1]}/preview`
  return url
}

function getPartDisplayNum(questions: Question[], questionNum: number): number {
  const q = questions.find((x) => x.question_number === questionNum)
  if (!q) return questionNum
  const partQs = questions.filter((x) => x.part === q.part)
  return partQs.findIndex((x) => x.question_number === questionNum) + 1
}

export default function ExamDetailPage() {
  const params = useParams<{ id: string }>()
  const { toast } = useToast()
  const examId = params.id

  const [phase, setPhase] = useState<Phase>('loading')
  const [exam, setExam] = useState<Exam | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [firstSubmission, setFirstSubmission] = useState<Submission | null>(null)

  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [current, setCurrent] = useState(0)
  const [startTime, setStartTime] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const [mobileTab, setMobileTab] = useState<MobileTab>('pdf')
  const [needsLogin, setNeedsLogin] = useState(false)

  const [draftData, setDraftData] = useState<{ answers: Record<number, string>; startTime: number } | null>(null)
  const [showRestoreDialog, setShowRestoreDialog] = useState(false)

  const [resultScore, setResultScore] = useState(0)
  const [breakdown, setBreakdown] = useState<Record<number, number>>({})
  const [correctAnswers, setCorrectAnswers] = useState<Record<number, string | null>>({})
  const [attemptNumber, setAttemptNumber] = useState(1)
  const [finalAnswers, setFinalAnswers] = useState<Record<number, string>>({})
  const [finalTimeSpent, setFinalTimeSpent] = useState(0)
  const [leaderboard, setLeaderboard] = useState<{
    entries: LeaderboardEntry[]
    my_rank: { rank: number; score: number; time_spent_seconds: number } | null
  } | null>(null)

  const DRAFT_KEY = `exam-draft-${examId}`

  useEffect(() => {
    fetch(`/api/de-thi/${examId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setPhase('error'); return }
        setExam(data.exam)
        setQuestions(data.questions ?? [])
        if (data.my_submission) setFirstSubmission(data.my_submission)
        setPhase('start')
      })
      .catch(() => setPhase('error'))
  }, [examId])

  // Auto-save progress
  useEffect(() => {
    if (phase !== 'exam') return
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ answers, startTime }))
  }, [answers, phase, startTime, DRAFT_KEY])

  // Warn on browser close
  useEffect(() => {
    if (phase !== 'exam') return
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [phase])

  const answeredSet = useMemo(() => new Set(
    Object.entries(answers).filter(([, v]) => v !== '').map(([k]) => Number(k) - 1)
  ), [answers])

  const q = questions[current]
  const progress = questions.length ? (answeredSet.size / questions.length) * 100 : 0

  const handleAutoExpire = useCallback(() => {
    if (phase !== 'exam') return
    submitExam(true)
  }, [phase, answers]) // eslint-disable-line react-hooks/exhaustive-deps

  const submitExam = async (auto = false) => {
    if (submitting) return
    const elapsed = Math.floor((Date.now() - startTime) / 1000)
    setSubmitting(true)
    try {
      const res = await fetch(`/api/de-thi/${examId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, time_spent_seconds: elapsed }),
      })
      const data = await res.json()

      // Session expired — keep draft, prompt re-login
      if (res.status === 401) {
        setNeedsLogin(true)
        toast({
          title: 'Phiên đăng nhập hết hạn',
          description: 'Bài làm đã được lưu. Vui lòng đăng nhập lại để nộp bài.',
          variant: 'destructive',
        })
        return
      }

      if (!res.ok) throw new Error(data.error)

      localStorage.removeItem(DRAFT_KEY)
      setResultScore(data.score)
      setBreakdown(data.breakdown ?? {})
      setCorrectAnswers(data.correct_answers ?? {})
      setAttemptNumber(data.attempt_number)
      setFinalAnswers(answers)
      setFinalTimeSpent(elapsed)
      setPhase('result')

      if (auto) toast({ title: 'Hết giờ! Bài đã tự động nộp.' })
      else toast({ title: `Nộp bài thành công — ${data.score}/${exam?.max_score ?? 10} điểm`, variant: 'success' as never })

      fetch(`/api/de-thi/${examId}/leaderboard`)
        .then((r) => r.json())
        .then((lb) => setLeaderboard({ entries: lb.entries ?? [], my_rank: lb.my_rank }))
    } catch (e) {
      toast({ title: 'Lỗi nộp bài', description: String(e), variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const beginFreshExam = () => {
    setAnswers({})
    setCurrent(0)
    setNeedsLogin(false)
    const now = Date.now()
    setStartTime(now)
    setRemainingSeconds(exam!.time_limit_minutes * 60)
    setMobileTab('pdf')
    setPhase('exam')
    localStorage.removeItem(DRAFT_KEY)
  }

  const startExam = () => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (raw && exam) {
        const parsed = JSON.parse(raw) as { answers: Record<number, string>; startTime: number }
        const elapsed = Math.floor((Date.now() - parsed.startTime) / 1000)
        if (elapsed < exam.time_limit_minutes * 60 && Object.keys(parsed.answers).length > 0) {
          setDraftData(parsed)
          setShowRestoreDialog(true)
          return
        }
      }
    } catch { /* ignore */ }
    beginFreshExam()
  }

  const restoreDraft = () => {
    if (!draftData || !exam) return
    setAnswers(draftData.answers)
    setCurrent(0)
    setNeedsLogin(false)
    setStartTime(draftData.startTime)
    const elapsed = Math.floor((Date.now() - draftData.startTime) / 1000)
    setRemainingSeconds(Math.max(30, exam.time_limit_minutes * 60 - elapsed))
    setMobileTab('answers')
    setPhase('exam')
    setShowRestoreDialog(false)
    toast({ title: `Đã khôi phục: ${Object.keys(draftData.answers).length} câu đã trả lời` })
  }

  const viewPreviousResult = () => {
    if (!firstSubmission) return
    setResultScore(firstSubmission.score)
    setFinalAnswers(firstSubmission.answers ?? {})
    setFinalTimeSpent(firstSubmission.time_spent_seconds ?? 0)
    setBreakdown({})
    setCorrectAnswers({})
    setAttemptNumber(firstSubmission.attempt_number)
    setPhase('result')
    fetch(`/api/de-thi/${examId}/leaderboard`)
      .then((r) => r.json())
      .then((lb) => setLeaderboard({ entries: lb.entries ?? [], my_rank: lb.my_rank }))
  }

  if (phase === 'loading' || (!exam && phase !== 'error')) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (phase === 'error' || !exam) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <p className="font-medium">Không tải được đề thi</p>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>Tải lại</Button>
      </div>
    )
  }

  const displayNum = q ? getPartDisplayNum(questions, q.question_number) : 0
  const embedUrl = exam.pdf_url ? toEmbedUrl(exam.pdf_url) : null

  const PdfPanel = () => embedUrl ? (
    <iframe src={embedUrl} className="w-full h-full border-0" title={exam.title} allow="autoplay" />
  ) : (
    <div className="flex h-full items-center justify-center flex-col gap-2 text-muted-foreground">
      <FileText className="h-8 w-8 opacity-30" />
      <p className="text-sm">Chưa có file đề thi</p>
    </div>
  )

  const AnswerPanel = () => (
    <>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge>{PART_LABELS[q.part]}</Badge>
          <Badge variant="outline">Câu {displayNum}</Badge>
          <Badge variant="secondary">{q.max_score}đ</Badge>
          {q.question_type === 'true_false' && (
            <span className="text-xs text-muted-foreground">Chọn Đúng/Sai cho từng ý</span>
          )}
        </div>

        {/* Session expired warning */}
        {needsLogin && (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 flex items-center gap-2">
            <LogIn className="h-4 w-4 text-destructive shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-destructive">Phiên đăng nhập hết hạn</p>
              <p className="text-xs text-muted-foreground">Bài làm đã lưu. Đăng nhập lại rồi nộp bài.</p>
            </div>
            <Button size="sm" variant="destructive" asChild className="shrink-0">
              <a href="/api/auth/signin">Đăng nhập</a>
            </Button>
          </div>
        )}

        <AnswerInput
          question={q}
          value={answers[q.question_number]}
          onChange={(val) => {
            setAnswers((prev) => ({ ...prev, [q.question_number]: val }))
            setNeedsLogin(false)
          }}
        />

        <div className="pt-2 border-t">
          <p className="text-xs font-medium text-muted-foreground mb-2">Danh sách câu</p>
          <DethiQuestionGrid
            questions={questions}
            current={current}
            answered={answeredSet}
            onSelect={(i) => { setCurrent(i); setMobileTab('answers') }}
          />
        </div>
      </div>

      <div className="border-t p-3 flex justify-between shrink-0">
        <Button variant="outline" size="sm" disabled={current === 0} onClick={() => setCurrent((c) => c - 1)}>
          ← Trước
        </Button>
        {current < questions.length - 1 ? (
          <Button size="sm" onClick={() => { setCurrent((c) => c + 1); setMobileTab('answers') }}>Sau →</Button>
        ) : (
          <Button size="sm" variant="destructive" onClick={() => submitExam(false)} disabled={submitting}>
            {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
            Nộp bài
          </Button>
        )}
      </div>
    </>
  )

  return (
    <>
      <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Bài làm dở chưa nộp</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Bạn có <strong>{draftData ? Object.keys(draftData.answers).length : 0} câu đã trả lời</strong> được lưu tự động.
            Tiếp tục hay bắt đầu lại?
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setShowRestoreDialog(false); beginFreshExam() }}>Bắt đầu lại</Button>
            <Button onClick={restoreDraft}>Tiếp tục bài dở</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AnimatePresence mode="wait">

        {/* ── START ── */}
        {phase === 'start' && (
          <motion.div key="start" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mx-auto max-w-4xl space-y-6">
            <Card>
              <CardContent className="space-y-6 pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold">{exam.title}</h1>
                    {exam.year && <p className="text-sm text-muted-foreground">Năm {exam.year}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { icon: <FileText className="h-4 w-4 text-muted-foreground mb-1" />, val: exam.question_count, label: 'câu hỏi' },
                    { icon: <Clock className="h-4 w-4 text-muted-foreground mb-1" />, val: exam.time_limit_minutes, label: 'phút' },
                    { icon: <Users className="h-4 w-4 text-muted-foreground mb-1" />, val: exam.attempt_count, label: 'lượt thi' },
                    { icon: <Trophy className="h-4 w-4 text-muted-foreground mb-1" />, val: exam.avg_score ?? '—', label: 'điểm TB' },
                  ].map(({ icon, val, label }) => (
                    <div key={label} className="rounded-md border p-3">
                      {icon}
                      <p className="text-lg font-bold">{val}</p>
                      <p className="text-xs text-muted-foreground">{label}</p>
                    </div>
                  ))}
                </div>

                {firstSubmission && (
                  <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-4 flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Bạn đã thi đề này</p>
                      <p className="text-xs text-muted-foreground">
                        Điểm lần 1: <strong>{firstSubmission.score}/{exam.max_score}</strong>
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={viewPreviousResult}>Xem kết quả</Button>
                  </div>
                )}

                <Button onClick={startExam}>
                  {firstSubmission ? 'Thi lại' : 'Bắt đầu làm bài'}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── EXAM — split screen ── */}
        {phase === 'exam' && q && (
          <motion.div key="exam" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col" style={{ height: 'calc(100dvh - 72px)' }}>

            {/* Top bar */}
            <div className="flex items-center justify-between gap-2 px-3 py-2 border rounded-t-lg bg-background shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <Badge variant="outline" className="text-xs whitespace-nowrap shrink-0">
                  {PART_LABELS[q.part]} — Câu {displayNum}
                </Badge>
                <Progress value={progress} className="h-1.5 w-16 sm:w-24 shrink-0" />
                <span className="text-xs text-muted-foreground whitespace-nowrap">{answeredSet.size}/{questions.length}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Timer
                  key={startTime}
                  totalSeconds={remainingSeconds || exam.time_limit_minutes * 60}
                  onExpire={handleAutoExpire}
                />
                <Button variant="destructive" size="sm" onClick={() => submitExam(false)} disabled={submitting} className="h-8 px-3">
                  {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Nộp bài'}
                </Button>
              </div>
            </div>

            {/* Mobile tab switcher */}
            <div className="flex lg:hidden border-x shrink-0 bg-background">
              <button
                onClick={() => setMobileTab('pdf')}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  mobileTab === 'pdf' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'
                }`}
              >
                <FileText className="h-3.5 w-3.5 inline mr-1.5" />Đề thi
              </button>
              <button
                onClick={() => setMobileTab('answers')}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  mobileTab === 'answers' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'
                }`}
              >
                Làm bài
                {answeredSet.size > 0 && (
                  <span className="ml-1 text-xs bg-primary text-primary-foreground rounded-full px-1.5 py-0.5">
                    {answeredSet.size}
                  </span>
                )}
              </button>
            </div>

            {/* Body */}
            <div className="flex flex-col lg:flex-row flex-1 min-h-0 border-x border-b rounded-b-lg overflow-hidden">

              {/* Mobile: single panel, tab-switched */}
              <div className="flex lg:hidden flex-col flex-1 min-h-0">
                {mobileTab === 'pdf' ? (
                  <div className="flex-1 bg-muted/20">
                    <PdfPanel />
                  </div>
                ) : (
                  <div className="flex flex-col flex-1 min-h-0">
                    <AnswerPanel />
                  </div>
                )}
              </div>

              {/* Desktop: side by side */}
              <div className="hidden lg:flex flex-row flex-1 min-h-0">
                <div className="flex-1 border-r bg-muted/20">
                  <PdfPanel />
                </div>
                <div className="w-[340px] shrink-0 flex flex-col">
                  <AnswerPanel />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── RESULT ── */}
        {phase === 'result' && (
          <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-5xl space-y-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
              <ResultView
                score={resultScore}
                maxScore={exam.max_score}
                timeSpent={finalTimeSpent}
                questions={questions}
                answers={finalAnswers}
                correctAnswers={correctAnswers}
                breakdown={breakdown}
                attemptNumber={attemptNumber}
                solutionUrl={exam.solution_url}
                handwrittenUrl={exam.handwritten_url}
                onRetry={startExam}
              />
              <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
                {leaderboard ? (
                  <Leaderboard entries={leaderboard.entries} my_rank={leaderboard.my_rank} max_score={exam.max_score} />
                ) : (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
