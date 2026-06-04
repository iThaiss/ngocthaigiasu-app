'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  ArrowLeft, BookOpen, CheckCircle2, XCircle, ChevronRight,
  ChevronLeft, Star, Loader2, AlertCircle, RotateCcw, Target,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface Exercise {
  id: string
  question_text: string
  option_a: string; option_b: string; option_c: string; option_d: string
  correct_answer: string
  explanation: string
  difficulty: string
  question_type: string
}

interface Lesson {
  id: string
  topic_group: string
  topic_group_icon: string
  title: string
  title_vi: string
  level: string
  content_md: string
  key_rules: string[]
  common_mistakes: string[]
  exercise_count: number
}

interface LessonProgress {
  mastered: boolean
  best_score: number
  attempts: number
  last_practiced: string | null
}

const LEVEL_COLOR: Record<string, string> = {
  B1: 'bg-green-500/15 text-green-600 dark:text-green-400',
  B2: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400',
  C1: 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
  C2: 'bg-red-500/15 text-red-600 dark:text-red-400',
}

const OPTIONS = ['A', 'B', 'C', 'D'] as const

export default function GrammarLessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>()
  const [tab, setTab] = useState<'theory' | 'practice' | 'summary'>('theory')
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [progress, setProgress] = useState<LessonProgress | null>(null)
  const [loading, setLoading] = useState(true)

  // Practice state
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [revealed, setRevealed] = useState<Record<string, boolean>>({})
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/grammar/${lessonId}`)
      .then((r) => r.json())
      .then((data) => {
        setLesson(data.lesson)
        setExercises(data.exercises ?? [])
        setProgress(data.progress)
      })
      .finally(() => setLoading(false))
  }, [lessonId])

  const handleAnswer = (exerciseId: string, opt: string) => {
    if (revealed[exerciseId]) return
    setAnswers((a) => ({ ...a, [exerciseId]: opt }))
    setRevealed((r) => ({ ...r, [exerciseId]: true }))
  }

  const correctCount = exercises.filter((ex) => answers[ex.id] === ex.correct_answer).length

  const handleSubmit = async () => {
    if (saving) return
    setSaving(true)
    setSubmitted(true)
    try {
      await fetch(`/api/grammar/${lessonId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score: correctCount, total: exercises.length }),
      })
      const updated = await fetch(`/api/grammar/${lessonId}`).then((r) => r.json())
      setProgress(updated.progress)
    } catch { /* ignore */ }
    setSaving(false)
  }

  const resetPractice = () => {
    setAnswers({})
    setRevealed({})
    setSubmitted(false)
    setCurrent(0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!lesson) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
        <AlertCircle className="h-10 w-10 opacity-30" />
        <p>Không tìm thấy bài học này</p>
        <Link href="/grammar"><Button variant="outline" size="sm">← Quay lại</Button></Link>
      </div>
    )
  }

  const lc = LEVEL_COLOR[lesson.level] ?? LEVEL_COLOR['B2']
  const ex = exercises[current]
  const answeredAll = exercises.length > 0 && exercises.every((e) => !!revealed[e.id])
  const scorePct = exercises.length > 0 ? Math.round((correctCount / exercises.length) * 100) : 0

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Back + breadcrumb */}
      <div className="flex items-center gap-2">
        <Link href="/grammar">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Grammar
          </Button>
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-sm text-muted-foreground line-clamp-1">{lesson.topic_group_en || lesson.topic_group}</span>
      </div>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-start gap-3">
          <span className="text-3xl">{lesson.topic_group_icon}</span>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold leading-snug">{lesson.title}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{lesson.title_vi}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge variant="secondary" className={cn('text-xs border-0', lc)}>{lesson.level}</Badge>
              {lesson.exercise_count > 0 && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Target className="h-3 w-3" />{lesson.exercise_count} bài tập
                </span>
              )}
              {progress?.mastered && (
                <span className="text-xs text-emerald-500 flex items-center gap-1">
                  <Star className="h-3 w-3 fill-current" /> Đã học xong · {progress.best_score}%
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 border-b pb-0">
        {([
          { key: 'theory',   label: '📖 Theory' },
          { key: 'practice', label: `✏️ Exercises${exercises.length > 0 ? ` (${exercises.length})` : ''}` },
          { key: 'summary',  label: '📌 Summary' },
        ] as { key: typeof tab; label: string }[]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px',
              tab === key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab: Theory */}
      {tab === 'theory' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {lesson.content_md ? (
            <div className="prose prose-sm dark:prose-invert max-w-none
              prose-headings:font-bold prose-headings:text-foreground
              prose-h2:text-base prose-h2:mt-5 prose-h2:mb-2
              prose-h3:text-sm prose-h3:mt-4 prose-h3:mb-1.5
              prose-p:text-sm prose-p:leading-relaxed prose-p:text-foreground
              prose-strong:text-foreground prose-strong:font-semibold
              prose-code:text-primary prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono
              prose-ul:text-sm prose-li:text-sm
              prose-table:text-sm prose-th:bg-muted prose-th:font-semibold
              prose-blockquote:border-primary prose-blockquote:text-muted-foreground">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{lesson.content_md}</ReactMarkdown>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>Nội dung bài học đang được cập nhật…</p>
            </div>
          )}
          {exercises.length > 0 && (
            <div className="mt-6">
              <Button className="w-full gap-2" onClick={() => setTab('practice')}>
                <Target className="h-4 w-4" /> Làm bài tập ({exercises.length} câu)
              </Button>
            </div>
          )}
        </motion.div>
      )}

      {/* Tab: Practice */}
      {tab === 'practice' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {exercises.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Target className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>Bài tập đang được cập nhật…</p>
            </div>
          ) : submitted ? (
            /* Result screen */
            <div className="space-y-4">
              <Card className={cn('border-2', scorePct >= 80 ? 'border-emerald-500/50' : scorePct >= 60 ? 'border-yellow-500/50' : 'border-red-500/50')}>
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-3">{scorePct >= 80 ? '🎉' : scorePct >= 60 ? '👍' : '💪'}</div>
                  <p className="text-2xl font-bold">{correctCount}/{exercises.length}</p>
                  <p className="text-muted-foreground text-sm mb-4">
                    {scorePct >= 80 ? 'Xuất sắc! Bạn đã nắm bài tốt.' : scorePct >= 60 ? 'Tốt! Ôn lại phần lý thuyết nhé.' : 'Hãy đọc lại lý thuyết và thử lại!'}
                  </p>
                  <Progress value={scorePct} className="h-2 mb-4" />
                  <div className="flex gap-2 justify-center flex-wrap">
                    <Button variant="outline" size="sm" onClick={resetPractice} className="gap-1.5">
                      <RotateCcw className="h-3.5 w-3.5" /> Làm lại
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setTab('theory')} className="gap-1.5">
                      <BookOpen className="h-3.5 w-3.5" /> Xem lý thuyết
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Review all answers */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Chi tiết đáp án</h3>
                {exercises.map((ex, i) => {
                  const ua = answers[ex.id]
                  const correct = ua === ex.correct_answer
                  return (
                    <Card key={ex.id} className={cn('border', correct ? 'border-emerald-500/30' : 'border-red-500/30')}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-2 mb-2">
                          {correct ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" /> : <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />}
                          <p className="text-sm font-medium">{i + 1}. {ex.question_text}</p>
                        </div>
                        {OPTIONS.map((opt) => {
                          const val = ex[`option_${opt.toLowerCase()}` as keyof Exercise] as string
                          const isCorrect = opt === ex.correct_answer
                          const isSelected = opt === ua
                          return (
                            <div key={opt} className={cn(
                              'flex items-center gap-2 text-xs px-3 py-1.5 rounded mb-1',
                              isCorrect ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' :
                              isSelected && !isCorrect ? 'bg-red-500/10 text-red-700 dark:text-red-300' : 'text-muted-foreground'
                            )}>
                              <span className="font-bold w-4">{opt}.</span> {val}
                            </div>
                          )
                        })}
                        {ex.explanation && (
                          <p className="mt-2 text-xs text-muted-foreground border-t pt-2">💡 {ex.explanation}</p>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          ) : (
            /* Exercise carousel */
            <div className="space-y-4">
              {/* Progress bar */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">{current + 1}/{exercises.length}</span>
                <Progress value={((current + 1) / exercises.length) * 100} className="flex-1 h-1.5" />
                <Badge variant="secondary" className="text-[10px]">{ex.difficulty}</Badge>
              </div>

              {/* Question card */}
              <Card className="border">
                <CardContent className="p-5">
                  <p className="font-medium mb-4">{ex.question_text}</p>
                  <div className="space-y-2">
                    {OPTIONS.map((opt) => {
                      const val = ex[`option_${opt.toLowerCase()}` as keyof Exercise] as string
                      const selected = answers[ex.id] === opt
                      const isRevealed = revealed[ex.id]
                      const isCorrect = opt === ex.correct_answer
                      return (
                        <button
                          key={opt}
                          onClick={() => handleAnswer(ex.id, opt)}
                          disabled={isRevealed}
                          className={cn(
                            'w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-sm text-left transition-all',
                            !isRevealed && 'hover:bg-accent cursor-pointer',
                            isRevealed && isCorrect && 'bg-emerald-500/10 border-emerald-500/50 text-emerald-700 dark:text-emerald-300',
                            isRevealed && selected && !isCorrect && 'bg-red-500/10 border-red-500/50 text-red-700 dark:text-red-300',
                            selected && !isRevealed && 'border-primary bg-primary/5',
                            !selected && !isRevealed && 'border-border',
                            isRevealed && !selected && !isCorrect && 'opacity-50 border-border',
                          )}
                        >
                          <span className={cn(
                            'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold border',
                            isRevealed && isCorrect ? 'bg-emerald-500 text-white border-emerald-500' :
                            isRevealed && selected ? 'bg-red-500 text-white border-red-500' : 'border-border'
                          )}>{opt}</span>
                          <span className="flex-1">{val}</span>
                          {isRevealed && isCorrect && <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />}
                          {isRevealed && selected && !isCorrect && <XCircle className="h-4 w-4 text-red-500 shrink-0" />}
                        </button>
                      )
                    })}
                  </div>
                  {revealed[ex.id] && ex.explanation && (
                    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                      className="mt-4 p-3 rounded-lg bg-muted text-sm text-muted-foreground">
                      💡 {ex.explanation}
                    </motion.div>
                  )}
                </CardContent>
              </Card>

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <Button variant="outline" size="sm" disabled={current === 0}
                  onClick={() => setCurrent((c) => c - 1)} className="gap-1.5">
                  <ChevronLeft className="h-4 w-4" /> Trước
                </Button>

                {current < exercises.length - 1 ? (
                  <Button size="sm" disabled={!revealed[ex.id]}
                    onClick={() => setCurrent((c) => c + 1)} className="gap-1.5">
                    Tiếp <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : answeredAll ? (
                  <Button size="sm" onClick={handleSubmit} disabled={saving} className="gap-1.5">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Nộp bài
                  </Button>
                ) : (
                  <Button size="sm" disabled className="gap-1.5 opacity-50">
                    Trả lời câu {current + 1} trước
                  </Button>
                )}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Tab: Summary */}
      {tab === 'summary' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {lesson.key_rules?.length > 0 && (
            <Card className="border">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Quy tắc quan trọng
                </h3>
                <ul className="space-y-2">
                  {lesson.key_rules.map((rule, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-emerald-500 font-bold shrink-0 mt-0.5">{i + 1}.</span>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {lesson.common_mistakes?.length > 0 && (
            <Card className="border">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500" /> Lỗi thường gặp
                </h3>
                <ul className="space-y-2">
                  {lesson.common_mistakes.map((mistake, i) => (
                    <li key={i} className="text-sm font-mono bg-muted/60 rounded px-3 py-2">
                      {mistake}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {lesson.key_rules?.length === 0 && lesson.common_mistakes?.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>Tóm tắt đang được cập nhật…</p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}
