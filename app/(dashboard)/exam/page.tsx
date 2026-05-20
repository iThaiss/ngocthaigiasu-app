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

interface ExamQuestion {
  id: string
  question_text: string
  question_type: QuestionType
  difficulty: string | null
  topic: string | null
  subtopic: string | null
  grade: number | null
  part: string | null
  source: string | null
  correct_answer: string | null
  option_a: string | null
  option_b: string | null
  option_c: string | null
  option_d: string | null
  statements: Array<{ label: string; text: string; answer: boolean }> | null
  numeric_answer: number | null
  explanation: string | null
}

interface ExamMetadata {
  sources: string[]
  grades: number[]
  parts: string[]
  topics: string[]
  subtopics: string[]
  recommendedSource: string
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

function parseNumber(value: string) {
  return Number(value.replace(',', '.').trim())
}

function answerLabel(question: ExamQuestion) {
  if (question.question_type === 'multiple_choice') return question.correct_answer ?? ''
  if (question.question_type === 'short_answer') return question.numeric_answer != null ? String(question.numeric_answer) : ''
  return question.statements?.map((s) => `${s.label}) ${s.answer ? 'Đúng' : 'Sai'}`).join('; ') ?? ''
}

export default function ExamPage() {
  const { toast } = useToast()
  const [phase, setPhase] = useState<Phase>('start')
  const [metadata, setMetadata] = useState<ExamMetadata>({ sources: [], grades: [], parts: [], topics: [], subtopics: [], recommendedSource: '' })
  const [loadingMeta, setLoadingMeta] = useState(true)
  const [starting, setStarting] = useState(false)
  const [source, setSource] = useState(ALL)
  const [grade, setGrade] = useState(ALL)
  const [part, setPart] = useState(ALL)
  const [topic, setTopic] = useState(ALL)
  const [subtopic, setSubtopic] = useState(ALL)
  const [limit, setLimit] = useState('50')
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
          sources: data.sources ?? [],
          grades: data.grades ?? [],
          parts: data.parts ?? [],
          topics: data.topics ?? [],
          subtopics: data.subtopics ?? [],
          recommendedSource: data.recommendedSource ?? '',
        }
        setMetadata(next)
        if (next.recommendedSource) setSource(next.recommendedSource)
      })
      .catch(() => setError('Không tải được danh sách đề chuẩn.'))
      .finally(() => mounted && setLoadingMeta(false))
    return () => { mounted = false }
  }, [])

  const q = questions[current]
  const answeredIndexes = useMemo(() => new Set(Object.keys(answers).map(Number)), [answers])
  const score = questions.reduce((total, question, index) => {
    const answer = answers[index]
    if (answer === undefined) return total
    if (question.question_type === 'multiple_choice') return total + (answer === question.correct_answer ? 1 : 0)
    if (question.question_type === 'short_answer') {
      const target = question.numeric_answer ?? Number.NaN
      const value = parseNumber(answer)
      return total + (Number.isFinite(value) && Number.isFinite(target) && Math.abs(value - target) <= 0.01 ? 1 : 0)
    }
    try {
      const parsed = JSON.parse(answer) as Record<string, boolean>
      return total + (question.statements?.every((s) => parsed[s.label] === s.answer) ? 1 : 0)
    } catch {
      return total
    }
  }, 0)

  const partStats = useMemo(() => {
    const map = new Map<string, { total: number; answered: number }>()
    questions.forEach((question, index) => {
      const key = question.part ? `Phần ${question.part}` : 'Chưa phân phần'
      const item = map.get(key) ?? { total: 0, answered: 0 }
      item.total += 1
      if (answers[index] !== undefined) item.answered += 1
      map.set(key, item)
    })
    return Array.from(map.entries())
  }, [answers, questions])

  const progress = questions.length ? (answeredIndexes.size / questions.length) * 100 : 0

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
      const params = new URLSearchParams({ mode: 'session', limit })
      if (source !== ALL) params.set('source', source)
      if (grade !== ALL) params.set('grade', grade)
      if (part !== ALL) params.set('part', part)
      if (topic !== ALL) params.set('topic', topic)
      if (subtopic !== ALL) params.set('subtopic', subtopic)
      const res = await fetch(`/api/exam?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to start exam')
      if (!data.questions?.length) {
        setError('Chưa có câu hỏi phù hợp với bộ lọc này.')
        return
      }
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
    toast({ title: 'Đã nộp bài', description: `Bạn làm đúng ${score}/${questions.length} câu.`, variant: 'success' as never })
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
    numericAnswer: q.numeric_answer,
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
                    <p className="mt-1 text-sm text-muted-foreground">Chọn đề minh họa hoặc nguồn đề trong ngân hàng câu hỏi để luyện theo cấu trúc chuẩn.</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Nguồn đề</p>
                    <Select value={source} onValueChange={setSource}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL}>Tất cả nguồn đề</SelectItem>
                        {metadata.sources.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Lớp</p>
                    <Select value={grade} onValueChange={setGrade}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL}>Tất cả lớp</SelectItem>
                        {metadata.grades.map((item) => <SelectItem key={item} value={String(item)}>Lớp {item}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Phần đề</p>
                    <Select value={part} onValueChange={setPart}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL}>Đủ các phần</SelectItem>
                        {metadata.parts.map((item) => <SelectItem key={item} value={item}>Phần {item}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Chủ đề</p>
                    <Select value={topic} onValueChange={setTopic}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL}>Tất cả chủ đề</SelectItem>
                        {metadata.topics.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Dạng bài</p>
                    <Select value={subtopic} onValueChange={setSubtopic}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL}>Tất cả dạng bài</SelectItem>
                        {metadata.subtopics.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Số câu</p>
                    <Select value={limit} onValueChange={setLimit}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[10, 20, 30, 50].map((item) => <SelectItem key={item} value={String(item)}>{item} câu</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-md border p-3">
                    <p className="text-2xl font-bold">90</p>
                    <p className="text-sm text-muted-foreground">phút luyện đề</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-2xl font-bold">{metadata.sources.length}</p>
                    <p className="text-sm text-muted-foreground">nguồn đề trong DB</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-2xl font-bold">{metadata.subtopics.length}</p>
                    <p className="text-sm text-muted-foreground">dạng bài đã phân loại</p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button size="lg" onClick={startExam} disabled={starting} className="gap-2">
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
                      {q.part && <Badge>Phần {q.part}</Badge>}
                      {q.source && <Badge variant="outline">{q.source}</Badge>}
                      {q.topic && <Badge variant="secondary">{q.topic}</Badge>}
                    </div>
                    <CardTitle className="text-base leading-relaxed">
                      <LatexText text={q.question_text} />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
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
                          const currentAnswer = answers[current] ? JSON.parse(answers[current]) as Record<string, boolean> : {}
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
                                      const parsed = prev[current] ? JSON.parse(prev[current]) as Record<string, boolean> : {}
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
                          <span>{stat.answered}/{stat.total}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {tutorContext && (
                  <QuestionTutorAgent
                    mode="exam"
                    contextKey={q.id}
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
                  <h2 className="text-3xl font-extrabold">{score} <span className="text-xl font-normal text-muted-foreground">/ {questions.length}</span></h2>
                  <p className="mt-1 text-muted-foreground">{autoSubmitted ? 'Tự động nộp khi hết giờ' : 'Đã nộp bài thành công'}</p>
                </div>
                <div className="mx-auto grid max-w-md grid-cols-3 gap-4">
                  <div>
                    <CheckCircle className="mx-auto h-5 w-5 text-green-500" />
                    <p className="mt-1 text-lg font-bold">{score}</p>
                    <p className="text-xs text-muted-foreground">Đúng</p>
                  </div>
                  <div>
                    <XCircle className="mx-auto h-5 w-5 text-red-500" />
                    <p className="mt-1 text-lg font-bold">{questions.length - score}</p>
                    <p className="text-xs text-muted-foreground">Cần xem lại</p>
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
                    <div key={question.id} className="rounded-md border p-3 text-sm">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Badge variant="outline">Câu {index + 1}</Badge>
                        {question.part && <Badge variant="secondary">Phần {question.part}</Badge>}
                        {question.subtopic && <span className="text-xs text-muted-foreground">{question.subtopic}</span>}
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
