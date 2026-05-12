'use client'

import { useState, useRef } from 'react'
import confetti from 'canvas-confetti'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, Lightbulb, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface PracticeQuestion {
  id: string
  question_type: 'multiple_choice' | 'true_false' | 'short_answer'
  question_text: string
  option_a?: string | null
  option_b?: string | null
  option_c?: string | null
  option_d?: string | null
  correct_answer?: string | null
  statements?: Array<{ label: string; text: string; answer: boolean }>
  numeric_answer?: number | null
  explanation?: string | null
  difficulty?: string | null
  topic?: string | null
}

export interface QuestionPracticeModalProps {
  question: PracticeQuestion
  isOpen: boolean
  onClose: () => void
  onNext?: () => void
}

// ─── LaTeX renderer ───────────────────────────────────────────────────────────

function renderLatex(text: string): string {
  if (!text) return ''
  let result = text
  result = result.replace(/\$\$([^$]+)\$\$/g, (_, math) => {
    try {
      return `<div class="my-2 overflow-x-auto py-1">${katex.renderToString(math.trim(), { throwOnError: false, displayMode: true })}</div>`
    } catch { return math }
  })
  result = result.replace(/\$([^$\n]+)\$/g, (_, math) => {
    try {
      return katex.renderToString(math.trim(), { throwOnError: false, displayMode: false })
    } catch { return math }
  })
  return result.replace(/\n/g, '<br/>')
}

function LatexText({ text, className }: { text: string; className?: string }) {
  return (
    <span className={className} dangerouslySetInnerHTML={{ __html: renderLatex(text) }} />
  )
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_ATTEMPTS = 2
const DIFF_COLOR: Record<string, string> = {
  'Nhận biết':    'bg-green-500/15 text-green-600 dark:text-green-400',
  'Thông hiểu':   'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  'Vận dụng':     'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400',
  'Vận dụng cao': 'bg-red-500/15 text-red-600 dark:text-red-400',
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function QuestionPracticeModal({
  question, isOpen, onClose, onNext,
}: QuestionPracticeModalProps) {
  const [attempts, setAttempts]             = useState(0)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [isCorrect, setIsCorrect]           = useState<boolean | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [shortInput, setShortInput]         = useState('')
  const [tfAnswers, setTfAnswers]           = useState<Record<string, boolean | null>>({})
  const [tfResult, setTfResult]             = useState<Record<string, boolean> | null>(null)
  const startTime = useRef(Date.now())

  const isDone = isCorrect === true || attempts >= MAX_ATTEMPTS

  const fireConfetti = () => {
    confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } })
  }

  const saveAnswer = async (answer: string, correct: boolean) => {
    try {
      await fetch('/api/student-answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: question.id,
          answer,
          is_correct: correct,
          time_spent: Math.floor((Date.now() - startTime.current) / 1000),
        }),
      })
    } catch { /* fire-and-forget */ }
  }

  const resetState = () => {
    setAttempts(0)
    setSelectedOption(null)
    setIsCorrect(null)
    setShowExplanation(false)
    setShortInput('')
    setTfAnswers({})
    setTfResult(null)
    startTime.current = Date.now()
  }

  const handleClose = () => { resetState(); onClose() }
  const handleNext  = () => { resetState(); onNext?.() }

  // ── Multiple choice ──────────────────────────────────────────────────────────

  const handleOptionClick = (label: string) => {
    if (isDone) return
    const correct = label === question.correct_answer
    setSelectedOption(label)
    setIsCorrect(correct)
    const next = attempts + 1
    setAttempts(next)
    if (correct) { fireConfetti(); setShowExplanation(true); saveAnswer(label, true) }
    else if (next >= MAX_ATTEMPTS) { setShowExplanation(true); saveAnswer(label, false) }
  }

  const optionStyle = (label: string) => {
    if (label === question.correct_answer && isDone)
      return 'border-green-500 bg-green-500/10 text-green-700 dark:text-green-300'
    if (selectedOption === label && label !== question.correct_answer)
      return 'border-red-500 bg-red-500/10 text-red-700 dark:text-red-300'
    if (!isDone) return 'border-border hover:border-primary/50 hover:bg-primary/5'
    return 'border-border opacity-50'
  }

  // ── Short answer ─────────────────────────────────────────────────────────────

  const handleShortSubmit = () => {
    if (isDone || !shortInput) return
    const val = parseFloat(shortInput)
    const target = question.numeric_answer ?? NaN
    const correct = !isNaN(val) && !isNaN(target) && Math.abs(val - target) <= 0.01
    setIsCorrect(correct)
    const next = attempts + 1
    setAttempts(next)
    if (correct) { fireConfetti(); setShowExplanation(true); saveAnswer(shortInput, true) }
    else if (next >= MAX_ATTEMPTS) { setShowExplanation(true); saveAnswer(shortInput, false) }
    else setShortInput('')
  }

  // ── True / False ─────────────────────────────────────────────────────────────

  const allTfAnswered = question.statements?.every(({ label }) => tfAnswers[label] !== undefined && tfAnswers[label] !== null) ?? false

  const handleTfSubmit = () => {
    if (!question.statements || !allTfAnswered) return
    const results: Record<string, boolean> = {}
    let allCorrect = true
    question.statements.forEach(({ label, answer: correct }) => {
      const ok = tfAnswers[label] === correct
      results[label] = ok
      if (!ok) allCorrect = false
    })
    setTfResult(results)
    setIsCorrect(allCorrect)
    const next = attempts + 1
    setAttempts(next)
    const payload = JSON.stringify(tfAnswers)
    if (allCorrect) { fireConfetti(); setShowExplanation(true); saveAnswer(payload, true) }
    else if (next >= MAX_ATTEMPTS) { setShowExplanation(true); saveAnswer(payload, false) }
    else { setTfResult(null); setTfAnswers({}) } // reset for next attempt
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose() }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap pr-6">
            <span>Luyện tập</span>
            {question.topic && (
              <span className="text-xs bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-full px-2.5 py-0.5 font-normal">
                {question.topic}
              </span>
            )}
            {question.difficulty && (
              <span className={cn('text-xs rounded-full px-2.5 py-0.5 font-normal', DIFF_COLOR[question.difficulty] ?? 'bg-muted text-muted-foreground')}>
                {question.difficulty}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Question text */}
          <div className="rounded-lg bg-muted/30 p-4">
            <LatexText text={question.question_text} className="text-sm leading-relaxed" />
          </div>

          {/* Remaining attempts hint */}
          {attempts > 0 && !isDone && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Còn {MAX_ATTEMPTS - attempts} lần thử
            </p>
          )}

          {/* ── Multiple choice ── */}
          {question.question_type === 'multiple_choice' && (
            <div className="grid gap-2">
              {(['A', 'B', 'C', 'D'] as const).map((label) => {
                const key = `option_${label.toLowerCase()}` as keyof PracticeQuestion
                const text = question[key] as string | null | undefined
                if (!text) return null
                return (
                  <button
                    key={label}
                    onClick={() => handleOptionClick(label)}
                    disabled={isDone}
                    className={cn(
                      'flex items-start gap-3 w-full rounded-lg border p-3 text-left text-sm transition-all',
                      optionStyle(label),
                      isDone ? 'cursor-default' : 'cursor-pointer',
                    )}
                  >
                    <span className="font-bold shrink-0 w-5">{label}.</span>
                    <LatexText text={text} className="flex-1 min-w-0" />
                    {isDone && label === question.correct_answer && (
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                    )}
                    {selectedOption === label && label !== question.correct_answer && (
                      <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {/* ── True / False ── */}
          {question.question_type === 'true_false' && question.statements && (
            <div className="space-y-3">
              {question.statements.map(({ label, text, answer: correctAnswer }) => {
                const userVal = tfAnswers[label]
                const result  = tfResult?.[label]
                return (
                  <div
                    key={label}
                    className={cn(
                      'rounded-lg border p-3 space-y-2 transition-colors',
                      result === true  && 'border-green-500 bg-green-500/5',
                      result === false && 'border-red-500 bg-red-500/5',
                      result === undefined && 'border-border',
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-sm shrink-0">{label}.</span>
                      <LatexText text={text} className="text-sm flex-1 min-w-0" />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {(['Đúng', 'Sai'] as const).map((opt) => {
                        const val = opt === 'Đúng'
                        const selected = userVal === val
                        return (
                          <button
                            key={opt}
                            onClick={() => {
                              if (isDone) return
                              setTfAnswers(prev => ({ ...prev, [label]: val }))
                            }}
                            disabled={isDone}
                            className={cn(
                              'px-3 py-1 text-xs rounded border transition-all',
                              selected && !tfResult && 'bg-primary text-primary-foreground border-primary',
                              !selected && !tfResult && 'border-border hover:border-primary/50',
                              tfResult && selected && result === true  && 'bg-green-500 text-white border-green-500',
                              tfResult && selected && result === false && 'bg-red-500 text-white border-red-500',
                              tfResult && !selected && val === correctAnswer && 'border-green-500 text-green-600 dark:text-green-400',
                            )}
                          >
                            {opt}
                          </button>
                        )
                      })}
                      {tfResult && result === false && (
                        <span className="text-xs text-green-600 dark:text-green-400">
                          → Đáp án đúng: {correctAnswer ? 'Đúng' : 'Sai'}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
              {!isDone && (
                <Button onClick={handleTfSubmit} disabled={!allTfAnswered} size="sm" className="w-full">
                  Kiểm tra
                </Button>
              )}
            </div>
          )}

          {/* ── Short answer ── */}
          {question.question_type === 'short_answer' && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="number"
                  step="any"
                  value={shortInput}
                  onChange={(e) => setShortInput(e.target.value)}
                  disabled={isDone}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleShortSubmit() }}
                  placeholder="Nhập đáp án..."
                  className={cn(
                    'flex-1 rounded-lg border px-3 py-2 text-sm outline-none transition-colors bg-background',
                    'focus:border-primary',
                    isCorrect === false && 'border-red-500',
                    isCorrect === true  && 'border-green-500',
                    isDone              && 'opacity-60 cursor-not-allowed',
                  )}
                />
                <Button onClick={handleShortSubmit} disabled={isDone || !shortInput} size="sm">
                  Kiểm tra
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Dùng dấu . cho số thập phân (ví dụ: 1.5)</p>
              {isCorrect === false && !isDone && (
                <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <XCircle className="h-4 w-4" /> Chưa đúng, thử lại!
                </p>
              )}
              {isDone && isCorrect === false && question.numeric_answer != null && (
                <p className="text-sm text-muted-foreground">
                  Đáp án đúng: <span className="font-bold text-green-600 dark:text-green-400">{question.numeric_answer}</span>
                </p>
              )}
            </div>
          )}

          {/* Result banner */}
          {isDone && isCorrect !== null && (
            <div className={cn(
              'rounded-lg p-3 flex items-center gap-2',
              isCorrect ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30',
            )}>
              {isCorrect
                ? <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                : <XCircle    className="h-5 w-5 text-red-500 shrink-0"   />}
              <p className={cn('text-sm font-medium', isCorrect ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300')}>
                {isCorrect ? 'Chính xác! Xuất sắc!' : 'Hết lượt thử. Xem lại đáp án nhé!'}
              </p>
            </div>
          )}

          {/* Explanation */}
          {showExplanation && question.explanation && (
            <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="h-4 w-4 text-yellow-500 shrink-0" />
                <p className="text-xs font-medium text-yellow-600 dark:text-yellow-400 uppercase tracking-wide">Lời giải</p>
              </div>
              <LatexText text={question.explanation} className="text-sm text-yellow-800 dark:text-yellow-200 leading-relaxed" />
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-between pt-2 border-t">
            <Button variant="outline" size="sm" onClick={handleClose}>
              Đóng
            </Button>
            {onNext && (
              <Button size="sm" onClick={handleNext} className="gap-1">
                Làm câu tương tự <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
