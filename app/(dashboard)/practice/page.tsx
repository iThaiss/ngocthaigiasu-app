'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { renderLatex } from '@/lib/math-render'
import {
  ArrowLeft, BookOpen, CheckCircle2, ChevronRight, Layers, Loader2, RotateCcw, SlidersHorizontal, Target, XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import QuestionTutorAgent, { type TutorQuestionContext } from '@/components/QuestionTutorAgent'

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
  image_url?: string | null
  visual_image_url?: string | null
}

interface PracticeMetadata {
  topics: string[]
  subtopics: string[]
  subtopicsByTopic: Record<string, string[]>
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

function LatexText({ text, className }: { text: string; className?: string }) {
  return <span className={`inline-block max-w-full min-w-0 overflow-x-auto align-bottom scrollbar-none ${className || ''}`} dangerouslySetInnerHTML={{ __html: renderLatex(text) }} />
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
  const [metadata, setMetadata] = useState<PracticeMetadata>({ topics: [], subtopics: [], subtopicsByTopic: {}, difficulties: [] })
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
          subtopicsByTopic: data.subtopicsByTopic ?? {},
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

  const currentUserAnswer = current?.question_type === 'multiple_choice'
    ? selectedOption
    : current?.question_type === 'short_answer'
      ? shortAnswer
      : Object.keys(tfAnswers).length
        ? JSON.stringify(tfAnswers)
        : null

  const tutorContext: TutorQuestionContext | null = current ? {
    questionText: current.question_text,
    type: current.question_type,
    topic: current.topic,
    subtopic: current.subtopic,
    difficulty: current.difficulty,
    options: {
      A: current.option_a,
      B: current.option_b,
      C: current.option_c,
      D: current.option_d,
    },
    statements: statements.map((statement) => ({
      label: statement.label,
      text: statement.text,
      answer: statement.answer,
    })),
    correctAnswer: current.correct_answer,
    numericAnswer: current.numeric_answer,
    explanation: current.explanation,
    userAnswer: currentUserAnswer,
    answered,
    imageUrl: current.image_url || current.visual_image_url,
  } : null

  const availableSubtopics = topic === ALL
    ? metadata.subtopics
    : metadata.subtopicsByTopic[topic] ?? []
  const selectedTopicLabel = topic === ALL ? 'Toàn bộ chủ đề' : topic
  const selectedSubtopicLabel = subtopic === ALL ? 'Mọi dạng bài' : subtopic
  const selectedDifficultyLabel = difficulty === ALL ? 'Mọi độ khó' : difficulty

  const handleTopicChange = (value: string) => {
    setTopic(value)
    setSubtopic(ALL)
  }

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
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Luyện tập thông minh</h1>
                <p className="mt-1 text-sm text-muted-foreground">Chọn đúng phạm vi, luyện một phiên ngắn, rồi xem phần cần ôn lại.</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 rounded-xl border bg-muted/30 p-2 text-center text-xs">
            <div className="rounded-lg bg-background px-3 py-2">
              <p className="font-semibold">{metadata.topics.length}</p>
              <p className="text-muted-foreground">chủ đề</p>
            </div>
            <div className="rounded-lg bg-background px-3 py-2">
              <p className="font-semibold">{availableSubtopics.length}</p>
              <p className="text-muted-foreground">dạng bài</p>
            </div>
            <div className="rounded-lg bg-background px-3 py-2">
              <p className="font-semibold">{limit}</p>
              <p className="text-muted-foreground">câu</p>
            </div>
          </div>
        </div>

        <Card className="overflow-hidden border-primary/20 shadow-sm">
          <CardHeader className="border-b bg-gradient-to-r from-primary/10 via-background to-emerald-500/10">
            <CardTitle className="flex items-center gap-2 text-base">
              <SlidersHorizontal className="h-4 w-4 text-primary" /> Thiết lập phiên luyện
            </CardTitle>
            <div className="flex flex-wrap gap-2 pt-2">
              <Badge variant="secondary" className="gap-1"><BookOpen className="h-3 w-3" /> {selectedTopicLabel}</Badge>
              <Badge variant="secondary" className="gap-1"><Layers className="h-3 w-3" /> {selectedSubtopicLabel}</Badge>
              <Badge variant="outline">{selectedDifficultyLabel}</Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6 p-5 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">Chủ đề</p>
                  <span className="text-xs text-muted-foreground">Chọn trước để lọc dạng bài</span>
                </div>
                <Select value={topic} onValueChange={handleTopicChange}>
                  <SelectTrigger className="h-12 rounded-lg border-primary/20 bg-background text-base"><SelectValue placeholder="Chọn chủ đề" /></SelectTrigger>
                  <SelectContent className="max-h-80">
                  <SelectItem value={ALL}>Tất cả chủ đề</SelectItem>
                  {metadata.topics.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">Dạng bài</p>
                  <span className="text-xs text-muted-foreground">
                    {topic === ALL ? 'Đang hiện tất cả dạng bài' : `${availableSubtopics.length} dạng thuộc chủ đề đã chọn`}
                  </span>
                </div>
                <Select value={subtopic} onValueChange={setSubtopic} disabled={topic !== ALL && availableSubtopics.length === 0}>
                  <SelectTrigger className="h-12 rounded-lg border-emerald-500/20 bg-background text-base"><SelectValue placeholder="Chọn dạng bài" /></SelectTrigger>
                  <SelectContent className="max-h-80">
                  <SelectItem value={ALL}>Tất cả dạng bài</SelectItem>
                  {availableSubtopics.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-5 rounded-xl border bg-muted/20 p-4">
              <div className="space-y-2">
                <p className="text-sm font-semibold">Độ khó</p>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setDifficulty(ALL)} className={cn('rounded-lg border px-3 py-2 text-left text-sm transition-colors', difficulty === ALL ? 'border-primary bg-primary/10 text-primary' : 'bg-background hover:bg-accent')}>Tất cả</button>
                  {metadata.difficulties.map((item) => (
                    <button key={item} type="button" onClick={() => setDifficulty(item)} className={cn('rounded-lg border px-3 py-2 text-left text-sm transition-colors', difficulty === item ? 'border-primary bg-primary/10 text-primary' : 'bg-background hover:bg-accent')}>
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold">Số câu</p>
                <div className="grid grid-cols-4 gap-2">
                  {SESSION_SIZES.map((size) => (
                    <button key={size} type="button" onClick={() => setLimit(String(size))} className={cn('rounded-lg border px-2 py-2 text-sm font-medium transition-colors', limit === String(size) ? 'border-primary bg-primary text-primary-foreground' : 'bg-background hover:bg-accent')}>
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-dashed bg-background p-3 text-xs text-muted-foreground">
                Phiên luyện sẽ lấy câu đã publish, có đáp án đầy đủ và không dùng câu AI chưa duyệt.
              </div>
            </div>

            {error && <p className="lg:col-span-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p>}

            <div className="lg:col-span-2 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
              <p className="text-sm text-muted-foreground">Sẵn sàng luyện: <span className="font-medium text-foreground">{selectedTopicLabel}</span> · <span className="font-medium text-foreground">{selectedSubtopicLabel}</span></p>
              <Button onClick={startSession} disabled={starting} size="lg" className="gap-2 px-6">
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

      {tutorContext && (
        <QuestionTutorAgent
          mode="practice"
          contextKey={current.id}
          context={tutorContext}
          title="AI hỏi đáp câu luyện tập"
        />
      )}
    </div>
  )
}
