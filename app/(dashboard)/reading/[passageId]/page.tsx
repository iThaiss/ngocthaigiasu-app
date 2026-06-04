'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowLeft, CheckCircle2, XCircle, BookOpen, Target, Loader2,
  AlertCircle, RotateCcw, ChevronRight,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface Question {
  id: string
  question_text: string
  option_a: string; option_b: string; option_c: string; option_d: string
  correct_answer: string
  explanation: string
  question_type: string
  order_index: number
}

interface Passage {
  id: string
  title: string
  title_vi: string
  content: string
  topic: string
  topic_vi: string
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

const LEVEL_COLOR: Record<string, string> = {
  B1: 'bg-green-500/15 text-green-600 dark:text-green-400',
  B2: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400',
  C1: 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
}

const OPTIONS = ['A', 'B', 'C', 'D'] as const

const Q_TYPE_LABEL: Record<string, string> = {
  main_idea: '💡 Ý chính',
  detail: '🔍 Chi tiết',
  inference: '🧠 Suy luận',
  vocab_in_context: '📖 Từ vựng',
}

export default function ReadingPassagePage() {
  const { passageId } = useParams<{ passageId: string }>()
  const [passage, setPassage] = useState<Passage | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [progress, setProgress] = useState<ReadingProgress | null>(null)
  const [loading, setLoading] = useState(true)

  // Answer state
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [revealed, setRevealed] = useState<Record<string, boolean>>({})
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/reading/${passageId}`)
      .then((r) => r.json())
      .then((data) => {
        setPassage(data.passage)
        setQuestions(data.questions ?? [])
        setProgress(data.progress)
        // If already completed, show previous answers
        if (data.progress?.completed && data.progress?.answers) {
          setAnswers(data.progress.answers)
          const rev: Record<string, boolean> = {}
          for (const qId of Object.keys(data.progress.answers)) rev[qId] = true
          setRevealed(rev)
          setSubmitted(true)
        }
      })
      .finally(() => setLoading(false))
  }, [passageId])

  const handleAnswer = (qId: string, opt: string) => {
    if (revealed[qId] || submitted) return
    setAnswers((a) => ({ ...a, [qId]: opt }))
    setRevealed((r) => ({ ...r, [qId]: true }))
  }

  const answeredAll = questions.length > 0 && questions.every((q) => !!revealed[q.id])
  const correctCount = questions.filter((q) => answers[q.id] === q.correct_answer).length
  const scorePct = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0

  const handleSubmit = async () => {
    if (saving) return
    setSaving(true)
    setSubmitted(true)
    try {
      const res = await fetch(`/api/reading/${passageId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      })
      const data = await res.json()
      setProgress({ completed: true, score: data.score, total: data.total, answers, completed_at: new Date().toISOString() })
    } catch { /* ignore */ }
    setSaving(false)
  }

  const resetExercise = () => {
    setAnswers({})
    setRevealed({})
    setSubmitted(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!passage) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
        <AlertCircle className="h-10 w-10 opacity-30" />
        <p>Không tìm thấy đoạn văn này</p>
        <Link href="/reading"><Button variant="outline" size="sm">← Quay lại</Button></Link>
      </div>
    )
  }

  const lc = LEVEL_COLOR[passage.level] ?? ''

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Back */}
      <div className="flex items-center gap-2">
        <Link href="/reading">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Đọc hiểu
          </Button>
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-sm text-muted-foreground line-clamp-1">{passage.topic}</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold leading-snug">{passage.title}</h1>
        {passage.title_vi && <p className="text-sm text-muted-foreground mt-0.5">{passage.title_vi}</p>}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <Badge variant="secondary" className={cn('text-xs border-0', lc)}>{passage.level}</Badge>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <BookOpen className="h-3 w-3" />{passage.word_count} từ
          </span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Target className="h-3 w-3" />{passage.question_count} câu hỏi
          </span>
          {progress?.completed && (
            <span className="text-xs text-emerald-500 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />{progress.score}/{progress.total} đúng ({scorePct}%)
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Passage text */}
        <div className="lg:col-span-3">
          <Card className="border">
            <CardContent className="p-5">
              <p className="text-sm leading-relaxed whitespace-pre-line">{passage.content}</p>
            </CardContent>
          </Card>
        </div>

        {/* Questions panel */}
        <div className="lg:col-span-2 space-y-3">
          {submitted && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
              <Card className={cn('border-2', scorePct >= 80 ? 'border-emerald-500/50' : scorePct >= 60 ? 'border-yellow-500/50' : 'border-red-500/50')}>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold">{correctCount}/{questions.length}</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    {scorePct >= 80 ? '🎉 Xuất sắc!' : scorePct >= 60 ? '👍 Khá tốt!' : '💪 Cần ôn thêm!'}
                  </p>
                  <Progress value={scorePct} className="h-1.5 mb-3" />
                  <Button variant="outline" size="sm" onClick={resetExercise} className="gap-1.5">
                    <RotateCcw className="h-3.5 w-3.5" /> Làm lại
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {questions.map((q, qi) => (
            <Card key={q.id} className="border">
              <CardContent className="p-4">
                <div className="flex items-start gap-1.5 mb-3">
                  <span className="text-xs text-muted-foreground font-medium shrink-0 mt-0.5">{qi + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-snug">{q.question_text}</p>
                    {Q_TYPE_LABEL[q.question_type] && (
                      <span className="text-[10px] text-muted-foreground">{Q_TYPE_LABEL[q.question_type]}</span>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5">
                  {OPTIONS.map((opt) => {
                    const val = q[`option_${opt.toLowerCase()}` as keyof Question] as string
                    const selected = answers[q.id] === opt
                    const isRevealed = revealed[q.id]
                    const isCorrect = opt === q.correct_answer
                    return (
                      <button
                        key={opt}
                        onClick={() => handleAnswer(q.id, opt)}
                        disabled={isRevealed}
                        className={cn(
                          'w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-xs text-left transition-all',
                          !isRevealed && 'hover:bg-accent cursor-pointer',
                          isRevealed && isCorrect && 'bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-300',
                          isRevealed && selected && !isCorrect && 'bg-red-500/10 border-red-500/40 text-red-700 dark:text-red-300',
                          selected && !isRevealed && 'border-primary bg-primary/5',
                          !selected && !isRevealed && 'border-border',
                          isRevealed && !selected && !isCorrect && 'opacity-40',
                        )}
                      >
                        <span className="font-bold w-4 shrink-0">{opt}.</span>
                        <span className="flex-1">{val}</span>
                        {isRevealed && isCorrect && <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />}
                        {isRevealed && selected && !isCorrect && <XCircle className="h-3.5 w-3.5 shrink-0 text-red-500" />}
                      </button>
                    )
                  })}
                </div>
                {revealed[q.id] && q.explanation && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-2 text-xs text-muted-foreground border-t pt-2"
                  >
                    💡 {q.explanation}
                  </motion.p>
                )}
              </CardContent>
            </Card>
          ))}

          {/* Submit button */}
          {!submitted && answeredAll && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
              <Button className="w-full gap-2" onClick={handleSubmit} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Nộp bài ({correctCount}/{questions.length} câu)
              </Button>
            </motion.div>
          )}

          {!submitted && !answeredAll && questions.length > 0 && (
            <p className="text-xs text-center text-muted-foreground">
              Trả lời tất cả {questions.length} câu để nộp bài
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
