'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock,
  Eye,
  FileQuestion,
  Loader2,
  RotateCcw,
  Target,
  XCircle,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface Question {
  id: string
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_answer: string
  explanation: string | null
  question_type: string
  order_index: number
}

interface Passage {
  id: string
  title: string
  title_vi: string | null
  content: string
  topic: string
  topic_vi: string | null
  level: string
  word_count: number
  question_count: number
}

interface ReadingProgress {
  completed: boolean
  score: number
  total: number
  answers: Record<string, string>
  completed_at: string | null
}

type EvidenceSnippet = {
  text: string
  paragraph?: number
}

const OPTIONS = ['A', 'B', 'C', 'D'] as const

const LEVEL_COLOR: Record<string, string> = {
  B1: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  B2: 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
  C1: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
}

const Q_TYPE_LABEL: Record<string, string> = {
  main_idea: 'Ý chính',
  detail: 'Chi tiết',
  detail_except: 'Chi tiết EXCEPT',
  true_statement: 'TRUE',
  inference: 'Suy luận',
  paragraph_summary: 'Tóm tắt đoạn',
  passage_summary: 'Tóm tắt bài',
  sentence_insertion: 'Chèn câu',
  paragraph_location: 'Vị trí đoạn',
  reference: 'Quy chiếu',
  pronoun_reference: 'Quy chiếu',
  sentence_paraphrase: 'Paraphrase',
  vocab_in_context: 'Từ vựng',
  vocab_meaning: 'Nghĩa từ',
  vocab_antonym: 'Trái nghĩa',
}

function estimatedMinutes(questionCount: number, wordCount: number) {
  if (questionCount >= 10) return 14
  if (questionCount >= 8) return 11
  return Math.max(6, Math.round(wordCount / 45))
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0')
  const secs = (seconds % 60).toString().padStart(2, '0')
  return `${mins}:${secs}`
}

function getOptionText(question: Question, option: string) {
  return question[`option_${option.toLowerCase()}` as keyof Question] as string
}

function splitPassage(content: string) {
  const byBlank = content.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
  if (byBlank.length > 1) return byBlank
  return content
    .split(/(?<=[.!?])\s+(?=[A-Z\[])/)
    .reduce<string[]>((paragraphs, sentence, index) => {
      const bucket = Math.floor(index / 4)
      paragraphs[bucket] = paragraphs[bucket] ? `${paragraphs[bucket]} ${sentence}` : sentence
      return paragraphs
    }, [])
    .filter(Boolean)
}

function extractQuotedSnippets(text: string | null | undefined, minLength = 2) {
  const snippets: string[] = []
  const source = text ?? ''
  const pattern = /"([^"]{2,})"|“([^”]{2,})”|'([^']{2,})'/g
  let match: RegExpExecArray | null
  while ((match = pattern.exec(source))) {
    const snippet = (match[1] || match[2] || match[3] || '').trim()
    if (snippet.length >= minLength) snippets.push(snippet)
  }
  return snippets
}

function extractParagraphNumber(text: string | null | undefined) {
  const match = (text ?? '').match(/\bparagraph\s+([1-9])\b/i)
  return match ? Number(match[1]) : undefined
}

function isBoundaryChar(value: string | undefined) {
  return !value || !/[A-Za-z0-9]/.test(value)
}

function findEvidenceRanges(text: string, snippets: EvidenceSnippet[], paragraphNumber: number) {
  const lowerText = text.toLowerCase()
  const ranges: Array<{ start: number; end: number; long: boolean }> = []
  const sorted = snippets
    .filter((item) => !item.paragraph || item.paragraph === paragraphNumber)
    .map((item) => item.text.trim())
    .filter(Boolean)
    .filter((item, index, list) => list.indexOf(item) === index)
    .sort((a, b) => b.length - a.length)

  for (const snippet of sorted) {
    const lowerSnippet = snippet.toLowerCase()
    let start = lowerText.indexOf(lowerSnippet)
    while (start >= 0) {
      const end = start + snippet.length
      const wholeWord = snippet.length <= 20 && /^[A-Za-z0-9]+$/.test(snippet)
      const boundaryOk = !wholeWord || (isBoundaryChar(text[start - 1]) && isBoundaryChar(text[end]))
      const overlaps = ranges.some((range) => start < range.end && end > range.start)
      if (boundaryOk && !overlaps) ranges.push({ start, end, long: snippet.length > 70 })
      start = lowerText.indexOf(lowerSnippet, start + Math.max(1, snippet.length))
    }
  }

  return ranges.sort((a, b) => a.start - b.start)
}

function renderHighlightedText(text: string, snippets: EvidenceSnippet[], paragraphNumber: number) {
  const ranges = findEvidenceRanges(text, snippets, paragraphNumber)
  if (ranges.length === 0) return text

  const parts = []
  let cursor = 0
  ranges.forEach((range, index) => {
    if (cursor < range.start) parts.push(text.slice(cursor, range.start))
    parts.push(
      <mark
        key={`${range.start}-${index}`}
        className={cn(
          'rounded px-1 py-0.5 text-amber-950 ring-1 ring-amber-300/70 dark:text-amber-100',
          range.long
            ? 'bg-amber-100/70 font-medium underline decoration-amber-500 decoration-2 underline-offset-2 dark:bg-amber-300/10'
            : 'bg-amber-200/80 font-semibold dark:bg-amber-300/25'
        )}
      >
        {text.slice(range.start, range.end)}
      </mark>
    )
    cursor = range.end
  })
  if (cursor < text.length) parts.push(text.slice(cursor))
  return parts
}

function getEvidenceSnippets(question: Question | undefined, content: string) {
  if (!question) return []
  const paragraph = extractParagraphNumber(question.question_text)
  const snippets: EvidenceSnippet[] = [
    ...extractQuotedSnippets(question.question_text, 2).map((text) => ({ text, paragraph })),
  ]
  if (question.question_type === 'sentence_insertion') {
    snippets.push({ text: '[I]' }, { text: '[II]' }, { text: '[III]' }, { text: '[IV]' })
  }
  const lowerContent = content.toLowerCase()
  return snippets
    .map((snippet) => ({ ...snippet, text: snippet.text.trim() }))
    .filter((snippet) => snippet.text && lowerContent.includes(snippet.text.toLowerCase()))
    .filter((snippet, index, list) => (
      list.findIndex((item) => item.text === snippet.text && item.paragraph === snippet.paragraph) === index
    ))
}

export default function ReadingPassagePage() {
  const { passageId } = useParams<{ passageId: string }>()
  const [passage, setPassage] = useState<Passage | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [progress, setProgress] = useState<ReadingProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [activeQuestion, setActiveQuestion] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(false)
    fetch(`/api/reading/${passageId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed: ${res.status}`)
        return res.json()
      })
      .then((data) => {
        if (!alive) return
        const loadedQuestions = data.questions ?? []
        setPassage(data.passage)
        setQuestions(loadedQuestions)
        setProgress(data.progress)
        setActiveQuestion(loadedQuestions[0]?.id ?? null)
        if (data.progress?.completed && data.progress?.answers) {
          setAnswers(data.progress.answers)
          setSubmitted(true)
        }
      })
      .catch(() => setError(true))
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => { alive = false }
  }, [passageId])

  useEffect(() => {
    if (loading || submitted) return
    const timer = window.setInterval(() => setElapsed((value) => value + 1), 1000)
    return () => window.clearInterval(timer)
  }, [loading, submitted])

  const correctCount = useMemo(
    () => questions.filter((question) => answers[question.id] === question.correct_answer).length,
    [questions, answers]
  )
  const answeredCount = questions.filter((question) => Boolean(answers[question.id])).length
  const answeredAll = questions.length > 0 && answeredCount === questions.length
  const scorePct = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0
  const typeStats = useMemo(() => {
    const stats = new Map<string, { correct: number; total: number }>()
    for (const question of questions) {
      const key = Q_TYPE_LABEL[question.question_type] ?? question.question_type ?? 'Khác'
      const item = stats.get(key) ?? { correct: 0, total: 0 }
      item.total += 1
      if (answers[question.id] === question.correct_answer) item.correct += 1
      stats.set(key, item)
    }
    return Array.from(stats.entries())
  }, [questions, answers])

  const paragraphs = useMemo(() => splitPassage(passage?.content ?? ''), [passage])
  const evidenceSnippets = useMemo(
    () => questions.flatMap((question) => getEvidenceSnippets(question, passage?.content ?? '')),
    [passage, questions]
  )
  const lc = passage ? LEVEL_COLOR[passage.level] ?? 'bg-muted text-muted-foreground' : ''
  const targetMinutes = passage ? estimatedMinutes(questions.length || passage.question_count, passage.word_count) : 0

  const handleAnswer = (qId: string, option: string) => {
    if (submitted) return
    setAnswers((prev) => ({ ...prev, [qId]: option }))
  }

  const handleSubmit = async () => {
    if (saving || !answeredAll) return
    setSaving(true)
    setSubmitted(true)
    try {
      const res = await fetch(`/api/reading/${passageId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      })
      const data = await res.json()
      setProgress({
        completed: true,
        score: data.score ?? correctCount,
        total: data.total ?? questions.length,
        answers,
        completed_at: new Date().toISOString(),
      })
    } catch {
      setProgress({
        completed: true,
        score: correctCount,
        total: questions.length,
        answers,
        completed_at: new Date().toISOString(),
      })
    } finally {
      setSaving(false)
    }
  }

  const resetExercise = () => {
    setAnswers({})
    setSubmitted(false)
    setProgress(null)
    setElapsed(0)
    setActiveQuestion(questions[0]?.id ?? null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !passage) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center text-muted-foreground">
        <AlertCircle className="h-10 w-10 text-rose-500/70" />
        <div>
          <p className="font-medium text-foreground">Không tải được bài đọc</p>
          <p className="text-sm">Vui lòng kiểm tra đăng nhập/kết nối và thử lại.</p>
        </div>
        <Link href="/reading"><Button variant="outline" size="sm">Quay lại Reading</Button></Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Link href="/reading">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Đọc hiểu
          </Button>
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="line-clamp-1 text-sm text-muted-foreground">{passage.topic_vi || passage.topic}</span>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold leading-snug">{passage.title}</h1>
          {passage.title_vi && <p className="mt-0.5 text-sm text-muted-foreground">{passage.title_vi}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className={cn('border-0 text-xs', lc)}>{passage.level}</Badge>
            <Badge variant="outline" className="border-primary/30 text-xs text-primary">{questions.length || passage.question_count} câu</Badge>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <BookOpen className="h-3 w-3" />{passage.word_count} từ
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />Gợi ý {targetMinutes} phút
            </span>
          </div>
        </div>
        <Card className="w-full border sm:w-auto">
          <CardContent className="flex items-center justify-between gap-5 p-3 sm:min-w-[260px]">
            <div>
              <p className="text-xs text-muted-foreground">Thời gian</p>
              <p className={cn('text-xl font-bold tabular-nums', elapsed > targetMinutes * 60 && !submitted ? 'text-orange-500' : '')}>
                {formatTime(elapsed)}
              </p>
            </div>
            <div className="min-w-[110px]">
              <p className="text-xs text-muted-foreground">Tiến độ</p>
              <p className="text-sm font-semibold">{answeredCount}/{questions.length} câu</p>
              <Progress value={questions.length ? (answeredCount / questions.length) * 100 : 0} className="mt-1 h-1.5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {submitted && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
          <Card className={cn('border-2', scorePct >= 80 ? 'border-emerald-500/50' : scorePct >= 60 ? 'border-amber-500/50' : 'border-rose-500/50')}>
            <CardContent className="grid gap-4 p-4 lg:grid-cols-[220px_1fr_auto] lg:items-center">
              <div>
                <p className="text-xs text-muted-foreground">Kết quả</p>
                <p className="text-3xl font-bold">{progress?.score ?? correctCount}/{progress?.total ?? questions.length}</p>
                <p className="text-sm text-muted-foreground">{scorePct}% · {formatTime(elapsed)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {typeStats.map(([label, stat]) => (
                  <Badge key={label} variant="secondary" className="border-0 text-[11px]">
                    {label}: {stat.correct}/{stat.total}
                  </Badge>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={resetExercise} className="gap-1.5">
                <RotateCcw className="h-4 w-4" />Làm lại
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(420px,0.9fr)]">
        <Card className="border lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
          <CardContent className="p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Passage</p>
                <p className="text-xs text-muted-foreground">Đọc bài trước, sau đó trả lời đủ {questions.length} câu rồi nộp.</p>
              </div>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-4 text-sm leading-7">
              {paragraphs.map((paragraph, index) => (
                <p key={index}>
                  <span className="mr-2 rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">P{index + 1}</span>
                  {renderHighlightedText(paragraph, evidenceSnippets, index + 1)}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Card className="border">
            <CardContent className="p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-muted-foreground">Câu hỏi</p>
                {!submitted && (
                  <Button size="sm" onClick={handleSubmit} disabled={!answeredAll || saving} className="h-8 gap-1.5">
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                    Nộp bài
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {questions.map((question, index) => {
                  const isActive = activeQuestion === question.id
                  const answered = Boolean(answers[question.id])
                  const correct = submitted && answers[question.id] === question.correct_answer
                  const wrong = submitted && answered && !correct
                  return (
                    <button
                      key={question.id}
                      onClick={() => {
                        setActiveQuestion(question.id)
                        document.getElementById(`question-${question.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      }}
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-semibold transition-colors',
                        isActive && 'border-primary bg-primary/10 text-primary',
                        !isActive && !answered && 'border-border text-muted-foreground hover:bg-accent',
                        !submitted && answered && !isActive && 'border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300',
                        correct && 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
                        wrong && 'border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300'
                      )}
                    >
                      {index + 1}
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {questions.map((question, index) => {
            const selected = answers[question.id]
            const isCorrect = selected === question.correct_answer
            return (
              <Card key={question.id} id={`question-${question.id}`} className={cn('border scroll-mt-4', activeQuestion === question.id && 'border-primary/40')}>
                <CardContent className="p-4">
                  <div className="mb-3 flex items-start gap-2">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-snug">{question.question_text}</p>
                      <Badge variant="secondary" className="mt-1 border-0 text-[10px]">
                        {Q_TYPE_LABEL[question.question_type] ?? question.question_type}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    {OPTIONS.map((option) => {
                      const optionText = getOptionText(question, option)
                      const optionSelected = selected === option
                      const optionCorrect = question.correct_answer === option
                      return (
                        <button
                          key={option}
                          onClick={() => handleAnswer(question.id, option)}
                          disabled={submitted}
                          className={cn(
                            'flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs transition-all',
                            !submitted && 'hover:bg-accent',
                            !submitted && optionSelected && 'border-primary bg-primary/5 text-primary',
                            !submitted && !optionSelected && 'border-border',
                            submitted && optionCorrect && 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
                            submitted && optionSelected && !optionCorrect && 'border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300',
                            submitted && !optionSelected && !optionCorrect && 'border-border opacity-55'
                          )}
                        >
                          <span className="w-4 shrink-0 font-bold">{option}.</span>
                          <span className="flex-1">{optionText}</span>
                          {submitted && optionCorrect && <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />}
                          {submitted && optionSelected && !optionCorrect && <XCircle className="h-3.5 w-3.5 shrink-0 text-rose-500" />}
                        </button>
                      )
                    })}
                  </div>

                  {submitted && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 rounded-lg border bg-muted/25 p-3 text-xs">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span className={cn('font-semibold', isCorrect ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300')}>
                          {isCorrect ? 'Đúng' : `Sai, đáp án đúng là ${question.correct_answer}`}
                        </span>
                        <span className="text-muted-foreground">Bạn chọn: {selected || 'chưa chọn'}</span>
                      </div>
                      {question.explanation ? (
                        <p className="leading-relaxed text-muted-foreground">{question.explanation}</p>
                      ) : (
                        <p className="leading-relaxed text-muted-foreground">Hãy đối chiếu lại đoạn văn và tìm câu chứa bằng chứng trực tiếp cho đáp án đúng.</p>
                      )}
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            )
          })}

          {!submitted && (
            <Card className="border">
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold">Sẵn sàng nộp bài?</p>
                  <p className="text-xs text-muted-foreground">Bạn đã trả lời {answeredCount}/{questions.length} câu. Sau khi nộp mới xem đáp án và giải thích.</p>
                </div>
                <Button onClick={handleSubmit} disabled={!answeredAll || saving} className="gap-1.5">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Target className="h-4 w-4" />}
                  Nộp bài
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
