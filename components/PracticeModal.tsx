'use client'

import { useState, useCallback } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, Lightbulb, ChevronRight, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PracticeQuestion {
  id: string
  question_type: 'multiple_choice' | 'true_false' | 'short_answer'
  question_text: string
  difficulty: string | null
  topic: string | null
  subtopic: string | null
  option_a: string | null
  option_b: string | null
  option_c: string | null
  option_d: string | null
  correct_answer: string | null
  statements: Array<{ label: string; text: string; answer: boolean }> | null
  numeric_answer: number | null
  explanation: string | null
}

export interface PracticeModalProps {
  isOpen: boolean
  onClose: () => void
  initialQuestion: PracticeQuestion
  topic: string
  subtopic: string
}

// ─── LaTeX renderer ───────────────────────────────────────────────────────────

function renderLatex(text: string): string {
  if (!text) return ''
  let r = text
  r = r.replace(/\\\[([\s\S]*?)\\\]/g, (_, m) => {
    try { return `<div class="my-2 overflow-x-auto py-1">${katex.renderToString(m.trim(), { throwOnError: false, displayMode: true })}</div>` }
    catch { return m }
  })
  r = r.replace(/\\\(([\s\S]*?)\\\)/g, (_, m) => {
    try { return katex.renderToString(m.trim(), { throwOnError: false }) }
    catch { return m }
  })
  r = r.replace(/\$\$([\s\S]*?)\$\$/g, (_, m) => {
    try { return `<div class="my-2 overflow-x-auto py-1">${katex.renderToString(m.trim(), { throwOnError: false, displayMode: true })}</div>` }
    catch { return m }
  })
  r = r.replace(/\$([^$\n]+?)\$/g, (_, m) => {
    try { return katex.renderToString(m.trim(), { throwOnError: false }) }
    catch { return m }
  })
  return r.replace(/\n/g, '<br/>')
}

function LatexText({ text, className }: { text: string; className?: string }) {
  return <span className={className} dangerouslySetInnerHTML={{ __html: renderLatex(text) }} />
}

// ─── Statement toggle (Đ/S) ───────────────────────────────────────────────────

function StatementToggle({
  label, text, value, onChange, disabled,
}: {
  label: string
  text: string
  value: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border">
      <span className="text-sm flex-1 min-w-0">
        <span className="font-bold mr-1">{label})</span>
        <LatexText text={text} />
      </span>
      <button
        type="button"
        onClick={() => !disabled && onChange(!value)}
        disabled={disabled}
        className={cn(
          'px-3 py-1 rounded-full font-bold text-sm transition-all shrink-0 min-w-[36px]',
          value ? 'bg-green-500 text-white' : 'bg-red-500 text-white',
          disabled && 'opacity-60 cursor-not-allowed',
        )}
      >
        {value ? 'Đ' : 'S'}
      </button>
    </div>
  )
}

// ─── Difficulty badge ─────────────────────────────────────────────────────────

const DIFF_COLOR: Record<string, string> = {
  'Nhận biết':    'bg-green-500/15 text-green-600 dark:text-green-400',
  'Thông hiểu':   'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  'Vận dụng':     'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400',
  'Vận dụng cao': 'bg-red-500/15 text-red-600 dark:text-red-400',
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PracticeModal({
  isOpen, onClose, initialQuestion, topic, subtopic,
}: PracticeModalProps) {
  const [currentQuestion, setCurrentQuestion] = useState<PracticeQuestion>(initialQuestion)
  const [usedIds,         setUsedIds]         = useState<string[]>([initialQuestion.id])
  const [score,           setScore]           = useState({ correct: 0, wrong: 0, total: 1 })
  const [answered,        setAnswered]        = useState(false)
  const [isCorrect,       setIsCorrect]       = useState<boolean | null>(null)
  const [loadingNext,     setLoadingNext]     = useState(false)

  // Multiple choice
  const [selectedOption, setSelectedOption] = useState<string | null>(null)

  // Short answer
  const [shortInput, setShortInput] = useState('')

  // True/false — empty means "not yet set by user"; display defaults to true (Đ)
  const [tfValues, setTfValues] = useState<Record<string, boolean>>({})
  const [tfSummary, setTfSummary] = useState<{ correct: number; total: number } | null>(null)

  const statements = (() => {
    const raw = currentQuestion.statements
    if (!raw) return []
    if (typeof raw === 'string') {
      try { return JSON.parse(raw) as Array<{ label: string; text: string; answer: boolean }> }
      catch { return [] }
    }
    return raw
  })()

  const allTfSet = statements.length > 0 && statements.every(s => s.label in tfValues)

  // ── helpers ────────────────────────────────────────────────────────────────

  const resetAnswer = () => {
    setAnswered(false)
    setIsCorrect(null)
    setSelectedOption(null)
    setShortInput('')
    setTfValues({})
    setTfSummary(null)
  }

  const commitResult = (correct: boolean) => {
    setAnswered(true)
    setIsCorrect(correct)
    setScore(prev => ({
      correct: prev.correct + (correct ? 1 : 0),
      wrong:   prev.wrong   + (correct ? 0 : 1),
      total:   prev.total,
    }))
  }

  // ── Multiple choice ────────────────────────────────────────────────────────

  const handleOptionClick = (label: string) => {
    if (answered) return
    setSelectedOption(label)
    commitResult(label === currentQuestion.correct_answer)
  }

  const optionStyle = (label: string) => {
    if (!answered) return 'border-border hover:border-primary/50 hover:bg-primary/5 cursor-pointer'
    if (label === currentQuestion.correct_answer) return 'border-green-500 bg-green-500/10 text-green-700 dark:text-green-300'
    if (selectedOption === label) return 'border-red-500 bg-red-500/10 text-red-700 dark:text-red-300'
    return 'border-border opacity-40'
  }

  // ── Short answer ───────────────────────────────────────────────────────────

  const handleShortSubmit = () => {
    if (answered || !shortInput.trim()) return
    const val    = parseFloat(shortInput)
    const target = currentQuestion.numeric_answer ?? NaN
    commitResult(!isNaN(val) && !isNaN(target) && Math.abs(val - target) <= 0.01)
  }

  // ── True / False ───────────────────────────────────────────────────────────

  const handleTfSubmit = () => {
    if (!allTfSet || answered) return
    let correctCount = 0
    statements.forEach(s => {
      if ((tfValues[s.label] ?? true) === s.answer) correctCount++
    })
    setTfSummary({ correct: correctCount, total: statements.length })
    commitResult(correctCount === statements.length)
  }

  // ── Load next question ─────────────────────────────────────────────────────

  const loadNext = useCallback(async () => {
    setLoadingNext(true)
    try {
      const params = new URLSearchParams({
        subtopic:   subtopic || currentQuestion.subtopic || '',
        topic:      topic    || currentQuestion.topic    || '',
        exclude:    usedIds.join(','),
        difficulty: currentQuestion.difficulty ?? 'Nhận biết',
      })
      const res = await fetch(`/api/questions/practice?${params}`)
      if (!res.ok) { onClose(); return }
      const data = await res.json()
      const q = data.question as PracticeQuestion
      setCurrentQuestion(q)
      setUsedIds(prev => data.reset ? [q.id] : [...prev, q.id])
      setScore(prev => ({ ...prev, total: prev.total + 1 }))
      resetAnswer()
    } finally {
      setLoadingNext(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion, usedIds, topic, subtopic, onClose])

  // ── Close / reset ──────────────────────────────────────────────────────────

  const handleClose = () => {
    setCurrentQuestion(initialQuestion)
    setUsedIds([initialQuestion.id])
    setScore({ correct: 0, wrong: 0, total: 1 })
    resetAnswer()
    onClose()
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose() }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3 pr-6">
            <DialogTitle className="text-base leading-tight">
              📚 Ôn tập — {currentQuestion.topic ?? topic}
            </DialogTitle>
            <div className="flex items-center gap-2 text-xs shrink-0 pt-0.5">
              <span className="text-muted-foreground">Câu {score.total}</span>
              <span className="text-green-600 dark:text-green-400 font-semibold">✓ {score.correct}</span>
              <span className="text-red-600 dark:text-red-400 font-semibold">✗ {score.wrong}</span>
            </div>
          </div>
          {currentQuestion.difficulty && (
            <span className={cn('text-xs rounded-full px-2.5 py-0.5 font-normal w-fit mt-1', DIFF_COLOR[currentQuestion.difficulty] ?? 'bg-muted text-muted-foreground')}>
              {currentQuestion.difficulty}
            </span>
          )}
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Question */}
          <div className="rounded-lg bg-muted/30 p-4">
            <LatexText text={currentQuestion.question_text} className="text-sm leading-relaxed" />
          </div>

          {/* ── Multiple choice ── */}
          {currentQuestion.question_type === 'multiple_choice' && (
            <div className="grid gap-2">
              {(['A', 'B', 'C', 'D'] as const).map(label => {
                const text = currentQuestion[`option_${label.toLowerCase()}` as keyof PracticeQuestion] as string | null
                if (!text) return null
                return (
                  <button
                    key={label}
                    onClick={() => handleOptionClick(label)}
                    disabled={answered}
                    className={cn('flex items-start gap-3 w-full rounded-lg border p-3 text-left text-sm transition-all', optionStyle(label), answered && 'cursor-default')}
                  >
                    <span className="font-bold shrink-0 w-5">{label}.</span>
                    <LatexText text={text} className="flex-1 min-w-0" />
                    {answered && label === currentQuestion.correct_answer && <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />}
                    {answered && selectedOption === label && label !== currentQuestion.correct_answer && <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />}
                  </button>
                )
              })}
            </div>
          )}

          {/* ── Short answer ── */}
          {currentQuestion.question_type === 'short_answer' && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="number"
                  step="any"
                  value={shortInput}
                  onChange={e => setShortInput(e.target.value)}
                  disabled={answered}
                  onKeyDown={e => { if (e.key === 'Enter') handleShortSubmit() }}
                  placeholder="Nhập đáp số..."
                  className={cn(
                    'flex-1 rounded-lg border px-3 py-2 text-sm outline-none transition-colors bg-background focus:border-primary',
                    answered && isCorrect === false && 'border-red-500',
                    answered && isCorrect === true  && 'border-green-500',
                    answered && 'opacity-60 cursor-not-allowed',
                  )}
                />
                <Button onClick={handleShortSubmit} disabled={answered || !shortInput.trim()} size="sm">
                  Kiểm tra
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Dùng dấu . cho số thập phân</p>
              {answered && isCorrect === false && currentQuestion.numeric_answer != null && (
                <p className="text-sm text-muted-foreground">
                  Đáp án đúng: <span className="font-bold text-green-600 dark:text-green-400">{currentQuestion.numeric_answer}</span>
                </p>
              )}
            </div>
          )}

          {/* ── True / False ── */}
          {currentQuestion.question_type === 'true_false' && (
            <div className="space-y-2">
              {statements.map(s => (
                <StatementToggle
                  key={s.label}
                  label={s.label}
                  text={s.text}
                  value={tfValues[s.label] ?? true}
                  onChange={v => setTfValues(prev => ({ ...prev, [s.label]: v }))}
                  disabled={answered}
                />
              ))}
              {tfSummary && (
                <p className={cn('text-sm font-medium', tfSummary.correct === tfSummary.total ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400')}>
                  Đúng {tfSummary.correct}/{tfSummary.total} mệnh đề
                </p>
              )}
              {!answered && (
                <Button onClick={handleTfSubmit} disabled={!allTfSet} size="sm" className="w-full">
                  Kiểm tra
                </Button>
              )}
            </div>
          )}

          {/* Result banner */}
          {answered && isCorrect !== null && (
            <div className={cn('rounded-lg p-3 flex items-center gap-2', isCorrect ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30')}>
              {isCorrect
                ? <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                : <XCircle className="h-5 w-5 text-red-500 shrink-0" />}
              <p className={cn('text-sm font-medium', isCorrect ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300')}>
                {isCorrect ? 'Chính xác! Xuất sắc! 🎉' : 'Chưa đúng. Xem lời giải nhé!'}
              </p>
            </div>
          )}

          {/* Explanation */}
          {answered && (
            <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="h-4 w-4 text-yellow-500 shrink-0" />
                <p className="text-xs font-medium text-yellow-600 dark:text-yellow-400 uppercase tracking-wide">Lời giải</p>
              </div>
              {currentQuestion.explanation
                ? <LatexText text={currentQuestion.explanation} className="text-sm text-yellow-800 dark:text-yellow-200 leading-relaxed" />
                : <p className="text-sm text-muted-foreground italic">Chưa có lời giải cho câu này.</p>
              }
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-between pt-2 border-t">
            <Button variant="outline" size="sm" onClick={handleClose}>Đóng</Button>
            {answered && (
              <Button size="sm" onClick={loadNext} disabled={loadingNext} className="gap-1">
                {loadingNext && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Câu tiếp theo <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
