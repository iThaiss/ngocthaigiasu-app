'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { normalizeMathText, renderLatex } from '@/lib/math-render'
import {
  BarChart3, CheckCircle, ChevronLeft, ChevronRight, Clock, FileText,
  Flag, Loader2, RotateCcw, Sparkles, Target, Trophy, XCircle, Bookmark,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import Timer from '@/components/exam/Timer'
import QuestionGrid from '@/components/exam/QuestionGrid'
import { formatTime } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'
import QuestionTutorAgent, { type TutorMessage, type TutorQuestionContext } from '@/components/QuestionTutorAgent'

type Phase = 'start' | 'exam' | 'result'
type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer'
type PracticeMode = 'study' | 'battle'

interface SolutionStep {
  title?: string
  content?: string
  table?: {
    columns?: string[]
    rows?: Array<Array<string | number>>
  }
}

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
  exam_set_id: string
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
  solution_steps: SolutionStep[] | null
  solution_style_version: string | null
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
const REPORT_TYPES = [
  { value: 'wrong_answer', label: 'Đáp án sai' },
  { value: 'unclear_question', label: 'Đề chưa rõ' },
  { value: 'bad_image', label: 'Hình ảnh lỗi/thiếu' },
  { value: 'bad_explanation', label: 'Lời giải chưa đúng' },
  { value: 'typo', label: 'Lỗi chính tả/ký hiệu' },
  { value: 'other', label: 'Vấn đề khác' },
]

function LatexText({ text, className }: { text: string; className?: string }) {
  return <span className={className} dangerouslySetInnerHTML={{ __html: renderLatex(text) }} />
}

function isMarkdownTableSeparator(line: string) {
  return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line)
}

function splitMarkdownTableRow(line: string) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim())
}

function parseMarkdownBlocks(text: string) {
  const lines = normalizeMathText(text).split(/\r?\n/)
  const blocks: Array<{ type: 'text'; content: string } | { type: 'table'; headers: string[]; rows: string[][] }> = []
  let buffer: string[] = []

  const flushText = () => {
    const content = buffer.join('\n').trim()
    if (content) blocks.push({ type: 'text', content })
    buffer = []
  }

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    const next = lines[index + 1]
    if (line.trim().startsWith('|') && next && isMarkdownTableSeparator(next)) {
      flushText()
      const headers = splitMarkdownTableRow(line)
      const rows: string[][] = []
      index += 2
      while (index < lines.length && lines[index].trim().startsWith('|')) {
        rows.push(splitMarkdownTableRow(lines[index]))
        index += 1
      }
      index -= 1
      blocks.push({ type: 'table', headers, rows })
    } else {
      buffer.push(line)
    }
  }

  flushText()
  return blocks
}

function RichSolutionText({ text }: { text: string }) {
  const blocks = parseMarkdownBlocks(text)
  return (
    <div className="space-y-3">
      {blocks.map((block, index) => {
        if (block.type === 'table') {
          return (
            <div key={index} className="overflow-x-auto rounded-md border">
              <table className="w-full min-w-max border-collapse text-sm">
                <thead className="bg-muted/70">
                  <tr>
                    {block.headers.map((header, cellIndex) => (
                      <th key={cellIndex} className="border-b px-3 py-2 text-left font-semibold">
                        <LatexText text={header} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-t">
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="px-3 py-2 align-top">
                          <LatexText text={cell} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }

        return <LatexText key={index} text={block.content} className="block leading-relaxed" />
      })}
    </div>
  )
}

function SolutionTable({ table }: { table: NonNullable<SolutionStep['table']> }) {
  const columns = table.columns ?? []
  const rows = table.rows ?? []
  if (!columns.length || !rows.length) return null

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full min-w-max border-collapse text-sm">
        <thead className="bg-muted/70">
          <tr>
            {columns.map((column, index) => (
              <th key={index} className="border-b px-3 py-2 text-left font-semibold">
                <LatexText text={String(column)} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-t">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-3 py-2 align-top">
                  <LatexText text={String(cell)} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function hasStatementExplanations(question: ExamQuestion) {
  return question.question_type === 'true_false'
    && (question.statements ?? []).some((statement) => Boolean(statement.explanation?.trim()))
}

function SolutionDetails({
  question,
  statementExplanationsAlreadyShown = false,
}: {
  question: ExamQuestion
  statementExplanationsAlreadyShown?: boolean
}) {
  const steps = question.solution_steps?.filter((step) => step?.content?.trim() || step?.table) ?? []
  const showStatementExplanations = hasStatementExplanations(question) && !statementExplanationsAlreadyShown

  if (showStatementExplanations) {
    return (
      <div className="space-y-3">
        <p className="font-medium">Giải thích từng ý</p>
        {(question.statements ?? []).map((statement) => (
          <div key={statement.label} className="rounded-md border bg-background/50 p-3">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant="outline">Ý {statement.label}</Badge>
              <Badge className={statement.answer ? 'bg-green-600' : 'bg-red-600'}>
                {statement.answer ? 'Đúng' : 'Sai'}
              </Badge>
            </div>
            {statement.explanation ? (
              <RichSolutionText text={statement.explanation} />
            ) : (
              <p className="text-muted-foreground">Chưa có giải thích riêng cho ý này.</p>
            )}
          </div>
        ))}
      </div>
    )
  }

  if (question.question_type === 'true_false' && statementExplanationsAlreadyShown) return null

  if (steps.length) {
    return (
      <div className="space-y-3">
        <p className="font-medium">Lời giải chi tiết</p>
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div key={index} className="rounded-md border bg-background/50 p-3">
              {step.title && <p className="mb-2 font-semibold">{step.title}</p>}
              {step.table && <SolutionTable table={step.table} />}
              {step.content && <RichSolutionText text={step.content} />}
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (question.explanation) {
    return (
      <div className="space-y-2">
        <p className="font-medium">Lời giải chi tiết</p>
        <RichSolutionText text={question.explanation} />
      </div>
    )
  }

  return <p className="text-muted-foreground">Chưa có lời giải chi tiết cho câu này.</p>
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

function userAnswerLabel(question: ExamQuestion, answer: string | undefined) {
  if (answer === undefined) return 'Chưa trả lời'
  if (question.question_type !== 'true_false') return answer
  const parsed = parseTfAnswer(answer)
  return (question.statements ?? [])
    .map((statement) => `${statement.label}) ${parsed[statement.label] === undefined ? '-' : parsed[statement.label] ? 'Đúng' : 'Sai'}`)
    .join('; ')
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
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('study')
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
  const [submittedQuestions, setSubmittedQuestions] = useState<Set<number>>(new Set())
  const [scorePopup, setScorePopup] = useState<{ key: number; score: number; maxScore: number } | null>(null)
  const [savedQuestionIds, setSavedQuestionIds] = useState<Set<string>>(new Set())
  const [savingQuestion, setSavingQuestion] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportType, setReportType] = useState('wrong_answer')
  const [reportDescription, setReportDescription] = useState('')
  const [reporting, setReporting] = useState(false)
  const [tutorChats, setTutorChats] = useState<Record<string, TutorMessage[]>>({})
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
  const isStudyMode = practiceMode === 'study'
  const isCurrentSubmitted = submittedQuestions.has(current)
  const hasCurrentAnswer = answers[current] !== undefined && String(answers[current]).trim() !== ''
  const currentScore = q ? scoreQuestion(q, answers[current]) : 0
  const currentSaved = q ? savedQuestionIds.has(q.id) : false
  const answeredIndexes = useMemo(() => new Set(Object.keys(answers).map(Number)), [answers])
  const maxScore = examSet?.max_score ?? questions.reduce((sum, question) => sum + question.max_score, 0)
  const score = questions.reduce((total, question, index) => total + scoreQuestion(question, answers[index]), 0)
  const progress = questions.length ? (answeredIndexes.size / questions.length) * 100 : 0

  useEffect(() => {
    if (!questions.length) {
      setSavedQuestionIds(new Set())
      return
    }

    const ids = questions.map((question) => question.id).filter(Boolean)
    if (!ids.length) return

    let mounted = true
    fetch(`/api/saved-questions?source=standard_exam&questionIds=${encodeURIComponent(ids.join(','))}`)
      .then((res) => res.ok ? res.json() : Promise.reject())
      .then((data) => {
        if (!mounted) return
        setSavedQuestionIds(new Set(data.savedQuestionIds ?? []))
      })
      .catch(() => {
        if (mounted) setSavedQuestionIds(new Set())
      })

    return () => { mounted = false }
  }, [questions])

  const reviewGroups = useMemo(() => {
    const map = new Map<string, Array<{ question: ExamQuestion; index: number }>>()
    questions.forEach((question, index) => {
      const key = question.section_code
      map.set(key, [...(map.get(key) ?? []), { question, index }])
    })
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [questions])

  const handleAutoExpire = useCallback(() => {
    if (phase !== 'exam' || practiceMode !== 'battle') return
    setTimeSpent(Math.floor((Date.now() - startTime) / 1000))
    setAutoSubmitted(true)
    setShowAutoSubmitModal(true)
    setTimeout(() => {
      setShowAutoSubmitModal(false)
      setPhase('result')
    }, 1800)
  }, [phase, practiceMode, startTime])

  useEffect(() => {
    if (phase !== 'exam') return

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }

    const handleLinkClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      const link = target?.closest('a[href]') as HTMLAnchorElement | null
      if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

      const url = new URL(link.href, window.location.href)
      if (url.origin !== window.location.origin) return
      if (url.pathname.startsWith('/exam')) return

      const ok = window.confirm('Bạn đang làm bài. Bạn có chắc muốn rời khỏi trang luyện đề?')
      if (!ok) {
        event.preventDefault()
        event.stopPropagation()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('click', handleLinkClick, true)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('click', handleLinkClick, true)
    }
  }, [phase])

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
      setSubmittedQuestions(new Set())
      setScorePopup(null)
      setReportOpen(false)
      setReportDescription('')
      setTutorChats({})
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

  const gradeStudyQuestion = () => {
    if (!q || !hasCurrentAnswer || isCurrentSubmitted) return false
    const nextScore = scoreQuestion(q, answers[current])
    setSubmittedQuestions((prev) => new Set(prev).add(current))
    setScorePopup({ key: Date.now(), score: nextScore, maxScore: q.max_score })
    window.setTimeout(() => setScorePopup(null), 1400)
    return true
  }

  const goToQuestion = (index: number) => {
    if (index === current || index < 0 || index >= questions.length) return
    if (isStudyMode && phase === 'exam' && hasCurrentAnswer && !isCurrentSubmitted) {
      const ok = window.confirm('Câu hiện tại đã có đáp án nhưng chưa được chấm. Bạn vẫn muốn chuyển sang câu khác?')
      if (!ok) return
    }
    setCurrent(index)
  }

  const handleNextQuestion = () => {
    if (!q) return
    if (isStudyMode && !isCurrentSubmitted) {
      gradeStudyQuestion()
      return
    }
    if (current === questions.length - 1) {
      submitExam()
      return
    }
    setCurrent((value) => value + 1)
  }

  const toggleSavedQuestion = async () => {
    if (!q || savingQuestion) return
    setSavingQuestion(true)
    const wasSaved = savedQuestionIds.has(q.id)
    setSavedQuestionIds((prev) => {
      const next = new Set(prev)
      wasSaved ? next.delete(q.id) : next.add(q.id)
      return next
    })

    try {
      const res = await fetch(wasSaved
        ? `/api/saved-questions?source=standard_exam&question_id=${encodeURIComponent(q.id)}`
        : '/api/saved-questions', {
        method: wasSaved ? 'DELETE' : 'POST',
        headers: wasSaved ? undefined : { 'Content-Type': 'application/json' },
        body: wasSaved ? undefined : JSON.stringify({ question_id: q.id, source: 'standard_exam' }),
      })
      if (!res.ok) throw new Error()
      toast({
        title: wasSaved ? 'Đã bỏ lưu câu hỏi' : 'Đã lưu vào danh sách ôn tập',
        variant: 'success' as never,
      })
    } catch {
      setSavedQuestionIds((prev) => {
        const next = new Set(prev)
        wasSaved ? next.add(q.id) : next.delete(q.id)
        return next
      })
      toast({ title: 'Không cập nhật được câu cần ôn', variant: 'destructive' })
    } finally {
      setSavingQuestion(false)
    }
  }

  const submitReport = async () => {
    if (!q || !reportDescription.trim()) return
    setReporting(true)
    try {
      const res = await fetch('/api/question-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: q.id,
          exam_question_id: q.exam_question_id,
          exam_set_id: q.exam_set_id,
          source: 'standard_exam',
          issue_type: reportType,
          description: reportDescription,
        }),
      })
      if (!res.ok) throw new Error()
      setReportOpen(false)
      setReportDescription('')
      setReportType('wrong_answer')
      toast({ title: 'Đã gửi báo cáo cho admin', variant: 'success' as never })
    } catch {
      toast({ title: 'Không gửi được báo cáo', variant: 'destructive' })
    } finally {
      setReporting(false)
    }
  }

  const scrollToReviewQuestion = (examQuestionId: string) => {
    document.getElementById(`review-question-${examQuestionId}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  const reviewButtonClass = (question: ExamQuestion, index: number) => {
    const answer = answers[index]
    if (answer === undefined) return 'border-muted bg-muted text-muted-foreground hover:bg-muted/80'
    const questionScore = scoreQuestion(question, answer)
    if (questionScore >= question.max_score) return 'border-green-500 bg-green-500/15 text-green-700 dark:text-green-300'
    if (questionScore > 0) return 'border-yellow-500 bg-yellow-500/15 text-yellow-700 dark:text-yellow-300'
    return 'border-red-500 bg-red-500/15 text-red-700 dark:text-red-300'
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
    answered: isCurrentSubmitted,
    imageUrl: q.image_url,
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

                <div className="grid gap-3 md:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setPracticeMode('study')}
                    className={`rounded-lg border p-4 text-left transition-colors ${practiceMode === 'study' ? 'border-primary bg-primary/10' : 'hover:border-primary/50 hover:bg-accent'}`}
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      <p className="font-semibold">Luyện đề học tập</p>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">Không giới hạn thời gian, có AI gợi ý, chốt từng câu để xem điểm và lời giải.</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPracticeMode('battle')}
                    className={`rounded-lg border p-4 text-left transition-colors ${practiceMode === 'battle' ? 'border-primary bg-primary/10' : 'hover:border-primary/50 hover:bg-accent'}`}
                  >
                    <div className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-red-500" />
                      <p className="font-semibold">Luyện đề thực chiến</p>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">Có thời gian 90 phút, không hiện AI, chỉ chấm điểm sau khi nộp toàn bài.</p>
                  </button>
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <div className="grid gap-3 md:grid-cols-4">
                  <div className="rounded-md border p-3">
                    <p className="text-2xl font-bold">{practiceMode === 'battle' ? '90' : '∞'}</p>
                    <p className="text-sm text-muted-foreground">{practiceMode === 'battle' ? 'phút thực chiến' : 'thời gian học tập'}</p>
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
                <Badge variant={isStudyMode ? 'secondary' : 'destructive'}>
                  {isStudyMode ? 'Học tập' : 'Thực chiến'}
                </Badge>
                <Progress value={progress} className="h-2 w-36" />
                <span className="text-sm text-muted-foreground">{answeredIndexes.size} đã trả lời</span>
              </div>
              <div className="flex items-center gap-3">
                {!isStudyMode && <Timer totalSeconds={DURATION} onExpire={handleAutoExpire} />}
                <Button variant="destructive" size="sm" onClick={submitExam}>Nộp bài</Button>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
              <div className="space-y-4">
                <Card>
                  <CardHeader className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge>{sectionTitle(q.section_code)}</Badge>
                        <Badge variant="outline">Câu {q.question_number}</Badge>
                        <Badge variant="secondary">{q.max_score} điểm</Badge>
                        {q.topic && <Badge variant="outline">{q.topic}</Badge>}
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          type="button"
                          variant={currentSaved ? 'default' : 'ghost'}
                          size="icon"
                          className="h-8 w-8"
                          onClick={toggleSavedQuestion}
                          disabled={savingQuestion}
                          title={currentSaved ? 'Bỏ lưu câu ôn tập' : 'Lưu câu cần ôn tập'}
                        >
                          {savingQuestion ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bookmark className="h-4 w-4" />}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => setReportOpen(true)}
                          title="Báo cáo vấn đề câu hỏi"
                        >
                          <Flag className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <CardTitle className="relative text-base leading-relaxed">
                      <AnimatePresence>
                        {scorePopup && (
                          <motion.div
                            key={scorePopup.key}
                            initial={{ opacity: 0, y: -8, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute right-0 -top-10 rounded-full border bg-background px-3 py-1 text-sm font-semibold shadow-md"
                          >
                            +{scorePopup.score.toFixed(2)}/{scorePopup.maxScore} điểm
                          </motion.div>
                        )}
                      </AnimatePresence>
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
                              onClick={() => {
                                if (isStudyMode && isCurrentSubmitted) return
                                setAnswers((prev) => ({ ...prev, [current]: label }))
                              }}
                              className={`flex items-start gap-3 rounded-md border p-3 text-left text-sm transition-colors ${(isStudyMode && isCurrentSubmitted) ? 'cursor-default' : ''} ${selected ? 'border-primary bg-primary/10 text-primary' : 'hover:border-primary/50 hover:bg-accent'}`}
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
                        disabled={isStudyMode && isCurrentSubmitted}
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
                                    disabled={isStudyMode && isCurrentSubmitted}
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

                    {isStudyMode && isCurrentSubmitted && (
                      <div className="rounded-lg border bg-muted/30 p-4 text-sm">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <Badge className={currentScore >= q.max_score ? 'bg-green-600' : currentScore > 0 ? 'bg-yellow-600' : 'bg-red-600'}>
                            {currentScore.toFixed(2)}/{q.max_score} điểm
                          </Badge>
                          <span className="text-muted-foreground">Đáp án: <strong>{answerLabel(q)}</strong></span>
                        </div>
                        <SolutionDetails question={q} />
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Button variant="outline" disabled={current === 0} onClick={() => goToQuestion(current - 1)}>
                    <ChevronLeft className="mr-1 h-4 w-4" /> Câu trước
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      disabled={isStudyMode && !isCurrentSubmitted && !hasCurrentAnswer}
                      onClick={handleNextQuestion}
                    >
                      {current === questions.length - 1
                        ? isStudyMode && !isCurrentSubmitted ? 'Chấm câu' : 'Xem kết quả'
                        : 'Câu sau'}
                      {current < questions.length - 1 && <ChevronRight className="ml-1 h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Danh sách câu hỏi</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <QuestionGrid total={questions.length} current={current} answered={answeredIndexes} onSelect={goToQuestion} />
                    <p className="mt-4 text-xs text-muted-foreground">Điểm và thống kê từng phần chỉ hiển thị sau khi nộp bài.</p>
                  </CardContent>
                </Card>

                {isStudyMode && tutorContext && (
                  <QuestionTutorAgent
                    mode="exam"
                    contextKey={q.exam_question_id}
                    context={tutorContext}
                    messages={tutorChats[q.exam_question_id] ?? []}
                    onMessagesChange={(nextMessages) => {
                      setTutorChats((prev) => ({ ...prev, [q.exam_question_id]: nextMessages }))
                    }}
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
              <CardContent className="space-y-5 pt-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-yellow-500/10">
                      <Trophy className="h-7 w-7 text-yellow-500" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-extrabold">{score.toFixed(2)} <span className="text-xl font-normal text-muted-foreground">/ {maxScore}</span></h2>
                      <p className="mt-1 text-muted-foreground">{autoSubmitted ? 'Tự động nộp khi hết giờ' : 'Đã nộp bài thành công'}</p>
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => { setPhase('start'); setQuestions([]); setAnswers({}); setCurrent(0) }}>
                    <RotateCcw className="mr-1 h-4 w-4" /> Chọn đề khác
                  </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-md border p-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <p className="mt-1 text-lg font-bold">{score.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">Điểm đạt</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <XCircle className="h-5 w-5 text-red-500" />
                    <p className="mt-1 text-lg font-bold">{(maxScore - score).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">Mất điểm</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <Clock className="h-5 w-5 text-blue-500" />
                    <p className="mt-1 text-lg font-bold">{formatTime(timeSpent)}</p>
                    <p className="text-xs text-muted-foreground">Thời gian</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  <h2 className="text-lg font-semibold">Chữa chi tiết</h2>
                </div>

                {questions.map((question, index) => {
                  const userAnswer = answers[index]
                  const questionScore = scoreQuestion(question, userAnswer)
                  const tfUserAnswer = parseTfAnswer(userAnswer)
                  return (
                    <Card
                      key={question.exam_question_id}
                      id={`review-question-${question.exam_question_id}`}
                      className="scroll-mt-24"
                    >
                      <CardHeader className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline">Câu {question.question_number}</Badge>
                          <Badge variant="secondary">{sectionTitle(question.section_code)}</Badge>
                          <Badge className={questionScore >= question.max_score ? 'bg-green-600' : questionScore > 0 ? 'bg-yellow-600' : 'bg-red-600'}>
                            {questionScore.toFixed(2)}/{question.max_score} điểm
                          </Badge>
                          {question.subtopic && <span className="text-xs text-muted-foreground">{question.subtopic}</span>}
                        </div>
                        <CardTitle className="text-base leading-relaxed">
                          <LatexText text={question.question_text} />
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {question.image_url && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={question.image_url} alt="" className="max-h-80 rounded-md border object-contain" />
                        )}

                        {question.question_type === 'multiple_choice' && (
                          <div className="grid gap-2">
                            {(['A', 'B', 'C', 'D'] as const).map((label) => {
                              const text = question[`option_${label.toLowerCase()}` as keyof ExamQuestion] as string | null
                              if (!text) return null
                              const isCorrectAnswer = question.correct_answer === label
                              const isUserAnswer = userAnswer === label
                              return (
                                <div
                                  key={label}
                                  className={`flex items-start gap-3 rounded-md border p-3 text-sm ${
                                    isCorrectAnswer
                                      ? 'border-green-500 bg-green-500/10'
                                      : isUserAnswer
                                        ? 'border-red-500 bg-red-500/10'
                                        : 'border-border'
                                  }`}
                                >
                                  <span className="font-bold">{label}.</span>
                                  <LatexText text={text} className="flex-1" />
                                  {isCorrectAnswer && <CheckCircle className="mt-0.5 h-4 w-4 text-green-500" />}
                                  {isUserAnswer && !isCorrectAnswer && <XCircle className="mt-0.5 h-4 w-4 text-red-500" />}
                                </div>
                              )
                            })}
                          </div>
                        )}

                        {question.question_type === 'true_false' && (
                          <div className="space-y-3">
                            {(question.statements ?? []).map((statement) => {
                              const chosen = tfUserAnswer[statement.label]
                              const isRight = chosen === statement.answer
                              return (
                                <div
                                  key={statement.label}
                                  className={`rounded-md border p-3 text-sm ${
                                    chosen === undefined
                                      ? 'border-muted bg-muted/30'
                                      : isRight
                                        ? 'border-green-500 bg-green-500/10'
                                        : 'border-red-500 bg-red-500/10'
                                  }`}
                                >
                                  <div className="flex gap-2">
                                    <span className="font-bold">{statement.label})</span>
                                    <LatexText text={statement.text} />
                                  </div>
                                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                                    <span>Bạn chọn: <strong>{chosen === undefined ? 'Chưa chọn' : chosen ? 'Đúng' : 'Sai'}</strong></span>
                                    <span>Đáp án: <strong>{statement.answer ? 'Đúng' : 'Sai'}</strong></span>
                                  </div>
                                  {statement.explanation && (
                                    <div className="mt-2 border-t pt-2 text-sm">
                                      <LatexText text={statement.explanation} />
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}

                        {question.question_type === 'short_answer' && (
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-md border p-3">
                              <p className="text-xs text-muted-foreground">Bạn trả lời</p>
                              <p className="mt-1 font-semibold">{userAnswer ?? 'Chưa trả lời'}</p>
                            </div>
                            <div className="rounded-md border border-green-500/40 bg-green-500/10 p-3">
                              <p className="text-xs text-green-700 dark:text-green-300">Đáp án đúng</p>
                              <p className="mt-1 font-semibold">{answerLabel(question)}</p>
                            </div>
                          </div>
                        )}

                        <div className="rounded-md border bg-muted/30 p-3 text-sm">
                          <div className="mb-2 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                            <p>Bạn chọn: <strong>{userAnswerLabel(question, userAnswer)}</strong></p>
                            <p>Đáp án: <strong>{answerLabel(question)}</strong></p>
                          </div>
                          {!hasStatementExplanations(question) && (
                            <div className="border-t pt-3">
                              <SolutionDetails question={question} statementExplanationsAlreadyShown={question.question_type === 'true_false'} />
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              <aside className="lg:sticky lg:top-20 lg:self-start">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Bảng đáp án</CardTitle>
                    <p className="text-xs text-muted-foreground">Click vào câu để xem lời giải</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {reviewGroups.map(([code, items]) => (
                      <div key={code} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{sectionTitle(code)}</p>
                          <span className="text-xs text-muted-foreground">
                            {items.reduce((sum, item) => sum + scoreQuestion(item.question, answers[item.index]), 0).toFixed(2)}đ
                          </span>
                        </div>
                        <div className="grid grid-cols-6 gap-2">
                          {items.map(({ question, index }) => (
                            <button
                              key={question.exam_question_id}
                              type="button"
                              onClick={() => scrollToReviewQuestion(question.exam_question_id)}
                              className={`h-9 rounded-md border text-xs font-semibold transition-colors ${reviewButtonClass(question, index)}`}
                              title={`Câu ${question.question_number}: ${scoreQuestion(question, answers[index]).toFixed(2)}/${question.max_score} điểm`}
                            >
                              {question.question_number}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                    <div className="grid grid-cols-2 gap-2 border-t pt-3 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-green-500/60" /> Đủ điểm</span>
                      <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-yellow-500/60" /> Một phần</span>
                      <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-red-500/60" /> Sai</span>
                      <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-muted" /> Chưa làm</span>
                    </div>
                  </CardContent>
                </Card>
              </aside>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Báo cáo vấn đề câu hỏi</DialogTitle>
            <DialogDescription>Admin sẽ dùng báo cáo này để rà lại đáp án, hình ảnh hoặc lời giải.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Loại vấn đề</p>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REPORT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Mô tả ngắn</p>
              <Textarea
                value={reportDescription}
                onChange={(event) => setReportDescription(event.target.value)}
                placeholder="Ví dụ: đáp án đúng phải là B, hình bị thiếu trục tọa độ..."
                className="min-h-28"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportOpen(false)} disabled={reporting}>Hủy</Button>
            <Button onClick={submitReport} disabled={reporting || !reportDescription.trim()}>
              {reporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Gửi báo cáo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
