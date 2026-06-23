'use client'

import { CheckCircle, XCircle, Clock, Trophy, RotateCcw, ExternalLink } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatTime } from '@/lib/utils'

interface Question {
  question_number: number
  part: string
  question_type: 'multiple_choice' | 'true_false' | 'short_answer'
  max_score: number
}

interface ResultViewProps {
  score: number
  maxScore: number
  timeSpent: number
  questions: Question[]
  answers: Record<number, string>
  correctAnswers: Record<number, string | null>
  breakdown: Record<number, number>
  attemptNumber: number
  solutionUrl?: string | null
  handwrittenUrl?: string | null
  onRetry: () => void
}

const PART_LABELS: Record<string, string> = {
  part_1: 'Phần I',
  part_2: 'Phần II',
  part_3: 'Phần III',
}

function getPartDisplayNum(questions: Question[], questionNum: number): number {
  const q = questions.find((x) => x.question_number === questionNum)
  if (!q) return questionNum
  const partQs = questions.filter((x) => x.part === q.part)
  return partQs.findIndex((x) => x.question_number === questionNum) + 1
}

function displayAnswer(question: Question, answer: string | undefined) {
  if (!answer) return <span className="text-muted-foreground">Chưa trả lời</span>
  if (question.question_type === 'true_false') {
    try {
      const obj = JSON.parse(answer) as Record<string, boolean>
      return <span>{Object.entries(obj).map(([k, v]) => `${k.toUpperCase()}:${v ? 'Đ' : 'S'}`).join(' ')}</span>
    } catch { return <span>{answer}</span> }
  }
  return <span>{answer}</span>
}

export default function ResultView({
  score, maxScore, timeSpent, questions, answers, correctAnswers, breakdown, attemptNumber,
  solutionUrl, handwrittenUrl, onRetry,
}: ResultViewProps) {
  const percent = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0
  const parts = ['part_1', 'part_2', 'part_3']

  return (
    <div className="space-y-6">
      {/* Score summary */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-yellow-500/10">
              <Trophy className="h-7 w-7 text-yellow-500" />
            </div>
            <div>
              <p className="text-3xl font-extrabold">
                {score.toFixed(2)}
                <span className="text-xl font-normal text-muted-foreground"> / {maxScore}</span>
              </p>
              <p className="text-muted-foreground text-sm mt-0.5">{percent}% số điểm</p>
              {attemptNumber > 1 && (
                <Badge variant="outline" className="mt-2 text-xs">
                  Lần thi {attemptNumber} — chỉ lần 1 tính leaderboard
                </Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-md border p-3 text-center">
              <CheckCircle className="h-4 w-4 text-green-500 mx-auto mb-1" />
              <p className="font-bold">{questions.filter((q) => (breakdown[q.question_number] ?? 0) >= q.max_score).length}</p>
              <p className="text-xs text-muted-foreground">Đúng</p>
            </div>
            <div className="rounded-md border p-3 text-center">
              <XCircle className="h-4 w-4 text-red-500 mx-auto mb-1" />
              <p className="font-bold">{questions.filter((q) => (breakdown[q.question_number] ?? 0) === 0 && answers[q.question_number]).length}</p>
              <p className="text-xs text-muted-foreground">Sai</p>
            </div>
            <div className="rounded-md border p-3 text-center">
              <Clock className="h-4 w-4 text-blue-500 mx-auto mb-1" />
              <p className="font-bold">{formatTime(timeSpent)}</p>
              <p className="text-xs text-muted-foreground">Thời gian</p>
            </div>
          </div>

          {/* Solution links */}
          {(solutionUrl || handwrittenUrl) && (
            <div className="rounded-md border bg-muted/30 p-3 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tài liệu đề thi</p>
              {solutionUrl && (
                <a
                  href={solutionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-primary hover:underline underline-offset-2"
                >
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  Xem giải chi tiết
                </a>
              )}
              {handwrittenUrl && (
                <a
                  href={handwrittenUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-primary hover:underline underline-offset-2"
                >
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  Bản giải viết tay
                </a>
              )}
            </div>
          )}

          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
              <RotateCcw className="h-4 w-4" /> Thi lại (không tính leaderboard)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Per-question review */}
      {parts.map((part) => {
        const partQs = questions.filter((q) => q.part === part)
        if (!partQs.length) return null
        return (
          <div key={part} className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              {PART_LABELS[part]}
              <span className="text-xs text-muted-foreground font-normal">
                {partQs.reduce((s, q) => s + (breakdown[q.question_number] ?? 0), 0).toFixed(2)} /
                {partQs.reduce((s, q) => s + q.max_score, 0).toFixed(2)}đ
              </span>
            </h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {partQs.map((q) => {
                const dispNum = getPartDisplayNum(questions, q.question_number)
                const qScore = breakdown[q.question_number] ?? 0
                const full = qScore >= q.max_score
                const partial = qScore > 0 && !full
                const userAns = answers[q.question_number]
                const correctAns = correctAnswers[q.question_number]

                return (
                  <div
                    key={q.question_number}
                    className={`rounded-md border p-3 text-sm space-y-1.5 ${
                      full ? 'border-green-500/40 bg-green-500/5'
                        : partial ? 'border-yellow-500/40 bg-yellow-500/5'
                        : userAns ? 'border-red-500/40 bg-red-500/5'
                        : 'border-muted bg-muted/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Câu {dispNum}</span>
                      <Badge className={`text-xs ${full ? 'bg-green-600' : partial ? 'bg-yellow-600' : 'bg-red-600'}`}>
                        {qScore.toFixed(2)}/{q.max_score}đ
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <p>Bạn chọn: <strong className="text-foreground">{displayAnswer(q, userAns)}</strong></p>
                      {correctAns && (
                        <p>Đáp án: <strong className="text-green-600 dark:text-green-400">{displayAnswer(q, correctAns)}</strong></p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
