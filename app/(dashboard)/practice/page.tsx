'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import {
  ArrowLeft, CheckCircle2, ChevronRight, Loader2, RotateCcw, Target, XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer'

interface PracticeQuestion {
  id: string
  question_text: string
  difficulty: string | null
  topic: string | null
  subtopic: string | null
  question_type: QuestionType
  correct_answer: string | null
  option_a: string | null
  option_b: string | null
  option_c: string | null
  option_d: string | null
  statements: Array<{ label: string; text: string; answer: boolean }> | string | null
  numeric_answer: number | null
  explanation: string | null
}

interface PracticeMetadata {
  topics: string[]
  subtopics: string[]
  difficulties: string[]
}

interface AnswerRecord {
  questionId: string
  correct: boolean
  answer: string
  topic: string
  subtopic: string
}

const SESSION_SIZES = [5, 10, 15, 20]
const ALL = 'all'

const DIFF_COLOR: Record<string, string> = {
  'Nhận biết': 'bg-green-500/15 text-green-600 dark:text-green-400',
  'Thông hiểu': 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  'Vận dụng': 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400',
  'Vận dụng cao': 'bg-red-500/15 text-red-600 dark:text-red-400',
}

function renderLatex(text: string): string {
  if (!text) return ''
  let result = text
  result = result.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => {
    try {
      return `<div class="my-2 overflow-x-auto py-1">${katex.renderToString(math.trim(), { throwOnError: false, displayMode: true })}</div>`
    } catch {
      return math
    }
  })
  result = result.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => {
    try {
      return katex.renderToString(math.trim(), { throwOnError: false })
    } catch {
      return math
    }
  })
  result = result.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
    try {
      return `<div class="my-2 overflow-x-auto py-1">${katex.renderToString(math.trim(), { throwOnError: false, displayMode: true })}</div>`
    } catch {
      return math
    }
  })
  result = result.replace(/\$([^$\n]+?)\$/g, (_, math) => {
    try {
      return katex.renderToString(math.trim(), { throwOnError: false })
    } catch {
      return math
    }
  })
  return result.replace(/\n/g, '<br/>')
}

function LatexText({ text, className }: { text: string; className?: string }) {
  return <span className={className} dangerouslySetInnerHTML={{ __html: renderLatex(text) }} />
}

function parseStatements(raw: PracticeQuestion['statements']) {
  if (!raw) return []
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as Array<{ label: string; text: string; answer: boolean }>
    } catch {
      return []
    }
  }
  return raw
}

function normalizeNumber(value: string): number {
  return Number(value.replace(',', '.').trim())
}

export default function PracticePage() {
  const [metadata, setMetadata] = useState<PracticeMetadata>({ topics: [], subtopics: [], difficulties: [] })
  const [topic, setTopic] = useState(ALL)
  const [subtopic, setSubtopic] = useState(ALL)
  const [difficulty, setDifficulty] = useState(ALL)
  const [limit, setLimit] = useState('10')
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [questions, setQuestions] = useState<PracticeQuestion[]>([])
  const [index, setIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [shortAnswer, setShortAnswer] = useState('')
  const [tfAnswers, setTfAnswers] = useState<Record<string, boolean>>({})
  const [answered, setAnswered] = useState(false)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [records, setRecords] = useState<AnswerRecord[]>([])
  const [error, setError] = useState<string | null>(null)
  const questionStartRef = useRef(Date.now())

  const current = questions[index]
  const statements = useMemo(() => parseStatements(current?.statements ?? null), [current])
  const finished = questions.length > 0 && index >= questions.length
  const progress = questions.length ? ((Math.min(index + (answered ? 1 : 0), questions.length)) / questions.length) * 100 : 0
  const correctCount = records.filter((r) => r.correct).length
  const wrongRecords = records.filter((r) => !r.correct)

  useEffect(() => {
    let mounted = true
    fetch('/api/practice?mode=metadata')
      .then((res) => res.json())
      .then((data) => {
        if (mounted) setMetadata({
          topics: data.topics ?? [],
          subtopics: data.subtopics ?? [],
          difficulties: data.difficulties ?? [],
        })
      })
      .catch(() => setError('Không tải được bộ lọc luyện tập.'))
      .finally(() => mounted && setLoading(false))
    return () => { mounted = false }
  }, [])

  const resetQuestionState = () => {
    setSelectedOption(null)
    setShortAnswer('')
    setTfAnswers({})
    setAnswered(false)
    setIsCorrect(null)
    questionStartRef.current = Date.now()
  }

  const resetSession = () => {
    setQuestions([])
    setIndex(0)
    setRecords([])
    setError(null)
    resetQuestionState()
  }

  const startSession = async () => {
    setStarting(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        mode: 'session',
        limit,
      })
      if (topic !== ALL) params.set('topic', topic)
      if (subtopic !== ALL) params.set('subtopic', subtopic)
      if (difficulty !== ALL) params.set('difficulty', difficulty)

      const res = await fetch(`/api/practice?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to start practice')
      if (!data.questions?.length) {
        setError('Chưa có câu hỏi phù hợp với bộ lọc này.')
        return
      }
      setQuestions(data.questions)
      setIndex(0)
      setRecords([])
      resetQuestionState()
    } catch {
      setError('Không bắt đầu được phiên luyện tập.')
    } finally {
      setStarting(false)
    }
  }

  const saveAnswer = async (answer: string, correct: boolean) => {
    if (!current) return
    const timeSpent = Math.max(1, Math.floor((Date.now() - questionStartRef.current) / 1000))
    setRecords((prev) => [...prev, {
      questionId: current.id,
      correct,
      answer,
      topic: current.topic ?? 'Chưa phân loại',
      subtopic: current.subtopic ?? 'Chưa phân dạng',
    }])

    await fetch('/api/student-answers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question_id: current.id,
        answer,
        is_correct: correct,
        time_spent: timeSpent,
      }),
    }).catch(() => null)
  }

  const submitAnswer = async () => {
    if (!current || answered) return

    let answer = ''
    let correct = false
    if (current.question_type === 'multiple_choice') {
      if (!selectedOption) return
      answer = selectedOption
      correct = selectedOption === current.correct_answer
    } else if (current.question_type === 'short_answer') {
      if (!shortAnswer.trim()) return
      answer = shortAnswer.trim()
      const value = normalizeNumber(answer)
      const target = current.numeric_answer ?? Number.NaN
      correct = Number.isFinite(value) && Number.isFinite(target) && Math.abs(value - target) <= 0.01
    } else {
      if (!statements.length || statements.some((s) => tfAnswers[s.label] === undefined)) return
      answer = JSON.stringify(tfAnswers)
      correct = statements.every((s) => tfAnswers[s.label] === s.answer)
    }

    setAnswered(true)
    setIsCorrect(correct)
    await saveAnswer(answer, correct)
  }

  const nextQuestion = () => {
    if (index + 1 >= questions.length) {
      setIndex(questions.length)
      return
    }
    setIndex((prev) => prev + 1)
    resetQuestionState()
  }

  const typeLabel = current?.question_type === 'multiple_choice'
    ? 'Trắc nghiệm'
    : current?.question_type === 'true_false'
      ? 'Đúng/Sai'
      : 'Trả lời ngắn'

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (finished) {
    const weakMap = wrongRecords.reduce<Record<string, number>>((acc, item) => {
      const key = item.subtopic || item.topic
      acc[key] = (acc[key] ?? 0) + 1
      return acc
    }, {})
    const weakAreas = Object.entries(weakMap).sort((a, b) => b[1] - a[1]).slice(0, 3)

    return (
      <div className="mx-auto max-w-4xl space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Tổng kết luyện tập</h1>
            <p className="text-sm text-muted-foreground">Bạn đã hoàn thành {questions.length} câu.</p>
          </div>
          <Button variant="outline" onClick={resetSession} className="gap-2">
            <RotateCcw className="h-4 w-4" /> Luyện phiên mới
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Tỉ lệ đúng</p><p className="text-3xl font-bold">{Math.round((correctCount / questions.length) * 100)}%</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Đúng</p><p className="text-3xl font-bold text-green-600">{correctCount}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Cần ôn lại</p><p className="text-3xl font-bold text-red-600">{wrongRecords.length}</p></CardContent></Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Gợi ý học tiếp</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {weakAreas.length ? (
              weakAreas.map(([area, count]) => (
                <div key={area} className="flex items-center justify-between rounded-md border p-3 text-sm">
                  <span>{area}</span>
                  <Badge variant="secondary">{count} câu sai</Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Phiên này rất ổn. Bạn có thể tăng độ khó ở phiên tiếp theo.</p>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!current) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Luyện tập thông minh</h1>
          <p className="mt-1 text-sm text-muted-foreground">Chọn phạm vi câu hỏi, làm một phiên ngắn, rồi xem phần cần ôn lại.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4" /> Thiết lập phiên luyện
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
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
              <p className="text-sm font-medium">Độ khó</p>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Tất cả độ khó</SelectItem>
                  {metadata.difficulties.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Số câu</p>
              <Select value={limit} onValueChange={setLimit}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SESSION_SIZES.map((size) => <SelectItem key={size} value={String(size)}>{size} câu</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {error && <p className="md:col-span-2 text-sm text-destructive">{error}</p>}

            <div className="md:col-span-2 flex justify-end">
              <Button onClick={startSession} disabled={starting} className="gap-2">
                {starting && <Loader2 className="h-4 w-4 animate-spin" />}
                Bắt đầu luyện
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={resetSession} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> Thiết lập lại
        </Button>
        <div className="text-sm text-muted-foreground">Câu {index + 1}/{questions.length}</div>
      </div>

      <Progress value={progress} className="h-2" />

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{typeLabel}</Badge>
            {current.difficulty && <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', DIFF_COLOR[current.difficulty] ?? 'bg-muted text-muted-foreground')}>{current.difficulty}</span>}
            {current.topic && <Badge variant="outline">{current.topic}</Badge>}
          </div>
          <CardTitle className="text-base leading-relaxed">
            <LatexText text={current.question_text} />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {current.question_type === 'multiple_choice' && (
            <div className="grid gap-2">
              {(['A', 'B', 'C', 'D'] as const).map((label) => {
                const text = current[`option_${label.toLowerCase()}` as keyof PracticeQuestion] as string | null
                if (!text) return null
                const isSelected = selectedOption === label
                const isAnswer = current.correct_answer === label
                return (
                  <button
                    key={label}
                    type="button"
                    disabled={answered}
                    onClick={() => setSelectedOption(label)}
                    className={cn(
                      'flex items-start gap-3 rounded-lg border p-3 text-left text-sm transition-colors',
                      !answered && isSelected && 'border-primary bg-primary/5',
                      !answered && !isSelected && 'hover:border-primary/50',
                      answered && isAnswer && 'border-green-500 bg-green-500/10',
                      answered && isSelected && !isAnswer && 'border-red-500 bg-red-500/10',
                    )}
                  >
                    <span className="font-bold">{label}.</span>
                    <LatexText text={text} className="flex-1" />
                  </button>
                )
              })}
            </div>
          )}

          {current.question_type === 'short_answer' && (
            <div className="space-y-2">
              <input
                value={shortAnswer}
                onChange={(event) => setShortAnswer(event.target.value)}
                onKeyDown={(event) => { if (event.key === 'Enter') submitAnswer() }}
                disabled={answered}
                placeholder="Nhập đáp án"
                className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="text-xs text-muted-foreground">Có thể dùng dấu phẩy hoặc dấu chấm cho số thập phân.</p>
            </div>
          )}

          {current.question_type === 'true_false' && (
            <div className="space-y-3">
              {statements.map((statement) => (
                <div key={statement.label} className="rounded-lg border p-3">
                  <div className="mb-3 flex gap-2 text-sm">
                    <span className="font-bold">{statement.label})</span>
                    <LatexText text={statement.text} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[true, false].map((value) => (
                      <Button
                        key={String(value)}
                        type="button"
                        variant={tfAnswers[statement.label] === value ? 'default' : 'outline'}
                        disabled={answered}
                        onClick={() => setTfAnswers((prev) => ({ ...prev, [statement.label]: value }))}
                      >
                        {value ? 'Đúng' : 'Sai'}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {answered && (
            <div className={cn('rounded-lg border p-3 text-sm', isCorrect ? 'border-green-500/40 bg-green-500/10' : 'border-red-500/40 bg-red-500/10')}>
              <div className="mb-2 flex items-center gap-2 font-medium">
                {isCorrect ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />}
                {isCorrect ? 'Chính xác' : 'Chưa đúng'}
              </div>
              {!isCorrect && current.question_type === 'multiple_choice' && current.correct_answer && (
                <p>Đáp án đúng: <strong>{current.correct_answer}</strong></p>
              )}
              {!isCorrect && current.question_type === 'short_answer' && current.numeric_answer != null && (
                <p>Đáp án đúng: <strong>{current.numeric_answer}</strong></p>
              )}
              {!isCorrect && current.question_type === 'true_false' && (
                <div className="space-y-1">
                  {statements.map((s) => <p key={s.label}>{s.label}) {s.answer ? 'Đúng' : 'Sai'}</p>)}
                </div>
              )}
              {current.explanation && (
                <div className="mt-3 border-t pt-3">
                  <p className="mb-1 font-medium">Lời giải</p>
                  <LatexText text={current.explanation} />
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 border-t pt-4">
            {!answered ? (
              <Button onClick={submitAnswer}>Kiểm tra</Button>
            ) : (
              <Button onClick={nextQuestion} className="gap-1">
                {index + 1 >= questions.length ? 'Xem tổng kết' : 'Câu tiếp theo'}
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
