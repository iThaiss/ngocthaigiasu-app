'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import {
  BarChart3, CheckCircle, ChevronLeft, ChevronRight, Clock, FileText,
  Loader2, RotateCcw, Trophy, XCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import Timer from '@/components/exam/Timer'
import QuestionGrid from '@/components/exam/QuestionGrid'
import { formatTime } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'
import QuestionTutorAgent, { type TutorQuestionContext } from '@/components/QuestionTutorAgent'

type Phase = 'start' | 'exam' | 'result'
type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer'

interface ExamSet {
  id: string
  title: string
  exam_type: string
  exam_index: number
  expected_question_count: number
  expected_item_count: number
  extracted_question_count: number
  max_score: number
  status: string
}

interface ExamSection {
  id: string
  section_code: string
  title: string | null
  question_type: QuestionType
  section_order: number
  expected_count: number
  extracted_count: number
  max_score: number
  scoring_rule: Record<string, unknown> | null
}

interface ExamQuestion {
  id: string
  exam_question_id: string
  section_code: string
  question_number: number
  display_order: number
  page_number: number | null
  source_hint: string | null
  max_score: number
  scoring_rule_snapshot: Record<string, unknown> | null
  question_text: string
  question_type: QuestionType
  topic: string | null
  subtopic: string | null
  chapter: string | null
  difficulty: string | null
  option_a: string | null
  option_b: string | null
  option_c: string | null
  option_d: string | null
  correct_answer: string | null
  statements: Array<{ label: string; text: string; answer: boolean; explanation?: string }> | null
  numeric_answer: string | number | null
  explanation: string | null
  needs_visual: boolean
  image_url: string | null
}

interface ExamMetadata {
  examSets: ExamSet[]
  defaultExamId: string | null
  sections: ExamSection[]
}

const ALL = 'all'
const DURATION = 90 * 60

function renderLatex(text: string): string {
  if (!text) return ''
  let result = text
  result = result.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => {
    try { return `<div class="my-2 overflow-x-auto py-1">${katex.renderToString(math.trim(), { throwOnError: false, displayMode: true })}</div>` } catch { return math }
  })
  result = result.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => {
    try { return katex.renderToString(math.trim(), { throwOnError: false }) } catch { return math }
  })
  result = result.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
    try { return `<div class="my-2 overflow-x-auto py-1">${katex.renderToString(math.trim(), { throwOnError: false, displayMode: true })}</div>` } catch { return math }
  })
  result = result.replace(/\$([^$\n]+?)\$/g, (_, math) => {
    try { return katex.renderToString(math.trim(), { throwOnError: false }) } catch { return math }
  })
  return result.replace(/\n/g, '<br/>')
}

function LatexText({ text, className }: { text: string; className?: string }) {
  return <span className={className} dangerouslySetInnerHTML={{ __html: renderLatex(text) }} />
}

function parseNumber(value: string | number | null | undefined) {
  if (typeof value === 'number') return value
  if (!value) return Number.NaN
  return Number(String(value).replace(',', '.').trim())
}

function parseTfAnswer(value: string | undefined) {
  if (!value) return {}
  try { return JSON.parse(value) as Record<string, boolean> } catch { return {} }
}

function scoreQuestion(question: ExamQuestion, answer: string | undefined) {
  if (answer === undefined) return 0

  if (question.question_type === 'multiple_choice') {
    return answer === question.correct_answer ? question.max_score : 0
  }

  if (question.question_type === 'short_answer') {
    const userValue = parseNumber(answer)
    const target = parseNumber(question.numeric_answer)
    return Number.isFinite(userValue) && Number.isFinite(target) && Math.abs(userValue - target) <= 0.01
      ? question.max_score
      : 0
  }

  const parsed = parseTfAnswer(answer)
  const correctCount = (question.statements ?? []).filter((statement) => parsed[statement.label] === statement.answer).length
  const rule = question.scoring_rule_snapshot
  const scoreByCorrect = rule?.score_by_correct_statements as Record<string, number> | undefined
  if (scoreByCorrect) return Number(scoreByCorrect[String(correctCount)] ?? 0)
  return correctCount === (question.statements ?? []).length ? question.max_score : 0
}

function answerLabel(question: ExamQuestion) {
  if (question.question_type === 'multiple_choice') return question.correct_answer ?? ''
  if (question.question_type === 'short_answer') return question.numeric_answer != null ? String(question.numeric_answer) : ''
  return question.statements?.map((s) => `${s.label}) ${s.answer ? 'Đúng' : 'Sai'}`).join('; ') ?? ''
}

function sectionTitle(sectionCode: string) {
  if (sectionCode === 'part_1') return 'Phần I'
  if (sectionCode === 'part_2') return 'Phần II'
  if (sectionCode === 'part_3') return 'Phần III'
  return sectionCode
}

export default function ExamPage() {
  const { toast } = useToast()
  const [phase, setPhase] = useState<Phase>('start')
  const [metadata, setMetadata] = useState<ExamMetadata>({ examSets: [], defaultExamId: null, sections: [] })
  const [examSet, setExamSet] = useState<ExamSet | null>(null)
  const [sections, setSections] = useState<ExamSection[]>([])
  const [loadingMeta, setLoadingMeta] = useState(true)
  const [starting, setStarting] = useState(false)
  const [selectedExamId, setSelectedExamId] = useState('')
  const [sectionCode, setSectionCode] = useState(ALL)
  const [questions, setQuestions] = useState<ExamQuestion[]>([])
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [autoSubmitted, setAutoSubmitted] = useState(false)
  const [showAutoSubmitModal, setShowAutoSubmitModal] = useState(false)
  const [startTime, setStartTime] = useState(Date.now())
  const [timeSpent, setTimeSpent] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    fetch('/api/exam?mode=metadata')
      .then((res) => res.json())
      .then((data) => {
        if (!mounted) return
        const next = {
          examSets: data.examSets ?? [],
          defaultExamId: data.defaultExamId ?? null,
          sections: data.sections ?? [],
        }
        setMetadata(next)
        setSections(next.sections)
        setSelectedExamId(next.defaultExamId ?? '')
      })
      .catch(() => setError('Không tải được schema standard_exam.'))
      .finally(() => mounted && setLoadingMeta(false))
    return () => { mounted = false }
  }, [])

  const q = questions[current]
  const answeredIndexes = useMemo(() => new Set(Object.keys(answers).map(Number)), [answers])
  const maxScore = examSet?.max_score ?? questions.reduce((sum, question) => sum + question.max_score, 0)
  const score = questions.reduce((total, question, index) => total + scoreQuestion(question, answers[index]), 0)
  const progress = questions.length ? (answeredIndexes.size / questions.length) * 100 : 0

  const partStats = useMemo(() => {
    const map = new Map<string, { total: number; answered: number; score: number }>()
    questions.forEach((question, index) => {
      const key = sectionTitle(question.section_code)
      const item = map.get(key) ?? { total: 0, answered: 0, score: 0 }
      item.total += 1
      if (answers[index] !== undefined) item.answered += 1
      item.score += scoreQuestion(question, answers[index])
      map.set(key, item)
    })
    return Array.from(map.entries())
  }, [answers, questions])

  const handleAutoExpire = useCallback(() => {
    if (phase !== 'exam') return
    setTimeSpent(Math.floor((Date.now() - startTime) / 1000))
    setAutoSubmitted(true)
    setShowAutoSubmitModal(true)
    setTimeout(() => {
      setShowAutoSubmitModal(false)
      setPhase('result')
    }, 1800)
  }, [phase, startTime])

  const startExam = async () => {
    setStarting(true)
    setError(null)
    try {
      const params = new URLSearchParams({ mode: 'session' })
      if (selectedExamId) params.set('examSetId', selectedExamId)
      if (sectionCode !== ALL) params.set('sectionCode', sectionCode)
      const res = await fetch(`/api/exam?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to start exam')
      if (!data.questions?.length) {
        setError('Đề chuẩn này chưa có câu hỏi phù hợp.')
        return
      }
      setExamSet(data.examSet)
      setSections(data.sections ?? [])
      setQuestions(data.questions)
      setAnswers({})
      setCurrent(0)
      setAutoSubmitted(false)
      setStartTime(Date.now())
      setPhase('exam')
    } catch {
      setError('Không bắt đầu được đề luyện. Vui lòng thử lại.')
    } finally {
      setStarting(false)
    }
  }

  const submitExam = () => {
    setTimeSpent(Math.floor((Date.now() - startTime) / 1000))
    setPhase('result')
    toast({ title: 'Đã nộp bài', description: `Điểm của bạn: ${score.toFixed(2)}/${maxScore}`, variant: 'success' as never })
  }

  const tutorContext: TutorQuestionContext | null = q ? {
    questionText: q.question_text,
    type: q.question_type,
    topic: q.topic,
    subtopic: q.subtopic,
    difficulty: q.difficulty,
    options: { A: q.option_a, B: q.option_b, C: q.option_c, D: q.option_d },
    statements: q.statements ?? undefined,
    correctAnswer: q.correct_answer,
    numericAnswer: parseNumber(q.numeric_answer),
    explanation: q.explanation,
    userAnswer: answers[current] ?? null,
    answered: answers[current] !== undefined,
  } : null

  if (loadingMeta) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <AnimatePresence mode="wait">
        {phase === 'start' && (
          <motion.div key="start" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <Card>
              <CardContent className="space-y-6 pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-500/10">
                    <Trophy className="h-6 w-6 text-yellow-500" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold">Luyện đề chuẩn</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Dữ liệu lấy trực tiếp từ schema <span className="font-mono">standard_exam</span>: đề, phần đề, câu hỏi và thang điểm chuẩn.</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Đề chuẩn</p>
                    <Select value={selectedExamId} onValueChange={setSelectedExamId}>
                      <SelectTrigger><SelectValue placeholder="Chọn đề" /></SelectTrigger>
                      <SelectContent>
                        {metadata.examSets.map((item) => <SelectItem key={item.id} value={item.id}>{item.title}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Phạm vi luyện</p>
                    <Select value={sectionCode} onValueChange={setSectionCode}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL}>Toàn bộ đề</SelectItem>
                        {metadata.sections.map((section) => (
                          <SelectItem key={section.id} value={section.section_code}>
                            {sectionTitle(section.section_code)} - {section.title ?? section.question_type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <div className="grid gap-3 md:grid-cols-4">
                  <div className="rounded-md border p-3">
                    <p className="text-2xl font-bold">90</p>
                    <p className="text-sm text-muted-foreground">phút luyện đề</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-2xl font-bold">{metadata.examSets.length}</p>
                    <p className="text-sm text-muted-foreground">đề ready</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-2xl font-bold">{metadata.examSets[0]?.expected_question_count ?? 22}</p>
                    <p className="text-sm text-muted-foreground">câu mỗi đề</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-2xl font-bold">{metadata.examSets[0]?.expected_item_count ?? 34}</p>
                    <p className="text-sm text-muted-foreground">ý cần chấm</p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button size="lg" onClick={startExam} disabled={starting || !selectedExamId} className="gap-2">
                    {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                    Bắt đầu luyện đề
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {phase === 'exam' && q && (
          <motion.div key="exam" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Badge variant="outline">Câu {current + 1}/{questions.length}</Badge>
                <Progress value={progress} className="h-2 w-36" />
                <span className="text-sm text-muted-foreground">{answeredIndexes.size} đã trả lời</span>
              </div>
              <div className="flex items-center gap-3">
                <Timer totalSeconds={DURATION} onExpire={handleAutoExpire} />
                <Button variant="destructive" size="sm" onClick={submitExam}>Nộp bài</Button>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
              <div className="space-y-4">
                <Card>
                  <CardHeader className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge>{sectionTitle(q.section_code)}</Badge>
                      <Badge variant="outline">Câu {q.question_number}</Badge>
                      <Badge variant="secondary">{q.max_score} điểm</Badge>
                      {q.topic && <Badge variant="outline">{q.topic}</Badge>}
                    </div>
                    <CardTitle className="text-base leading-relaxed">
                      <LatexText text={q.question_text} />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {q.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={q.image_url} alt="" className="max-h-80 rounded-md border object-contain" />
                    )}

                    {q.question_type === 'multiple_choice' && (
                      <div className="grid gap-2">
                        {(['A', 'B', 'C', 'D'] as const).map((label) => {
                          const text = q[`option_${label.toLowerCase()}` as keyof ExamQuestion] as string | null
                          if (!text) return null
                          const selected = answers[current] === label
                          return (
                            <button
                              key={label}
                              type="button"
                              onClick={() => setAnswers((prev) => ({ ...prev, [current]: label }))}
                              className={`flex items-start gap-3 rounded-md border p-3 text-left text-sm transition-colors ${selected ? 'border-primary bg-primary/10 text-primary' : 'hover:border-primary/50 hover:bg-accent'}`}
                            >
                              <span className="font-bold">{label}.</span>
                              <LatexText text={text} className="flex-1" />
                            </button>
                          )
                        })}
                      </div>
                    )}

                    {q.question_type === 'short_answer' && (
                      <input
                        value={answers[current] ?? ''}
                        onChange={(event) => setAnswers((prev) => ({ ...prev, [current]: event.target.value }))}
                        placeholder="Nhập đáp số"
                        className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                      />
                    )}

                    {q.question_type === 'true_false' && (
                      <div className="space-y-3">
                        {(q.statements ?? []).map((statement) => {
                          const currentAnswer = parseTfAnswer(answers[current])
                          return (
                            <div key={statement.label} className="rounded-md border p-3">
                              <div className="mb-3 flex gap-2 text-sm">
                                <span className="font-bold">{statement.label})</span>
                                <LatexText text={statement.text} />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                {[true, false].map((value) => (
                                  <Button
                                    key={String(value)}
                                    type="button"
                                    variant={currentAnswer[statement.label] === value ? 'default' : 'outline'}
                                    onClick={() => setAnswers((prev) => {
                                      const parsed = parseTfAnswer(prev[current])
                                      return { ...prev, [current]: JSON.stringify({ ...parsed, [statement.label]: value }) }
                                    })}
                                  >
                                    {value ? 'Đúng' : 'Sai'}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="flex justify-between">
                  <Button variant="outline" disabled={current === 0} onClick={() => setCurrent((value) => value - 1)}>
                    <ChevronLeft className="mr-1 h-4 w-4" /> Câu trước
                  </Button>
                  <Button disabled={current === questions.length - 1} onClick={() => setCurrent((value) => value + 1)}>
                    Câu sau <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Danh sách câu hỏi</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <QuestionGrid total={questions.length} current={current} answered={answeredIndexes} onSelect={setCurrent} />
                    <div className="mt-4 space-y-2">
                      {partStats.map(([name, stat]) => (
                        <div key={name} className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{name}</span>
                          <span>{stat.answered}/{stat.total} - {stat.score.toFixed(2)}đ</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {tutorContext && (
                  <QuestionTutorAgent
                    mode="exam"
                    contextKey={q.exam_question_id}
                    context={tutorContext}
                    title="AI gợi ý câu hiện tại"
                    compact
                  />
                )}
              </div>
            </div>
          </motion.div>
        )}

        {phase === 'result' && (
          <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <Card>
              <CardContent className="space-y-5 pt-6 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-yellow-500/10">
                  <Trophy className="h-7 w-7 text-yellow-500" />
                </div>
                <div>
                  <h2 className="text-3xl font-extrabold">{score.toFixed(2)} <span className="text-xl font-normal text-muted-foreground">/ {maxScore}</span></h2>
                  <p className="mt-1 text-muted-foreground">{autoSubmitted ? 'Tự động nộp khi hết giờ' : 'Đã nộp bài thành công'}</p>
                </div>
                <div className="mx-auto grid max-w-md grid-cols-3 gap-4">
                  <div>
                    <CheckCircle className="mx-auto h-5 w-5 text-green-500" />
                    <p className="mt-1 text-lg font-bold">{score.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">Điểm đạt</p>
                  </div>
                  <div>
                    <XCircle className="mx-auto h-5 w-5 text-red-500" />
                    <p className="mt-1 text-lg font-bold">{(maxScore - score).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">Mất điểm</p>
                  </div>
                  <div>
                    <Clock className="mx-auto h-5 w-5 text-blue-500" />
                    <p className="mt-1 text-lg font-bold">{formatTime(timeSpent)}</p>
                    <p className="text-xs text-muted-foreground">Thời gian</p>
                  </div>
                </div>
                <div className="flex justify-center gap-2">
                  <Button variant="outline" onClick={() => { setPhase('start'); setQuestions([]); setAnswers({}); setCurrent(0) }}>
                    <RotateCcw className="mr-1 h-4 w-4" /> Chọn đề khác
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="h-5 w-5" /> Xem lại đáp án
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {questions.map((question, index) => {
                  const userAnswer = answers[index]
                  return (
                    <div key={question.exam_question_id} className="rounded-md border p-3 text-sm">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Badge variant="outline">Câu {question.question_number}</Badge>
                        <Badge variant="secondary">{sectionTitle(question.section_code)}</Badge>
                        <span className="text-xs text-muted-foreground">{scoreQuestion(question, userAnswer).toFixed(2)}/{question.max_score} điểm</span>
                      </div>
                      <LatexText text={question.question_text} className="block leading-relaxed" />
                      <div className="mt-2 grid gap-1 text-xs text-muted-foreground md:grid-cols-2">
                        <p>Bạn chọn: <strong>{userAnswer ?? 'Chưa trả lời'}</strong></p>
                        <p>Đáp án: <strong>{answerLabel(question)}</strong></p>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={showAutoSubmitModal} onOpenChange={setShowAutoSubmitModal}>
        <DialogContent className="text-center">
          <DialogHeader>
            <DialogTitle>Hết giờ!</DialogTitle>
            <DialogDescription>Bài luyện đề đã được tự động nộp. Đang tính điểm...</DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
