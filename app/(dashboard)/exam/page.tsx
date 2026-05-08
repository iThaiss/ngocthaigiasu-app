'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Clock, Target, Users, CheckCircle, XCircle, BarChart3 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import Timer from '@/components/exam/Timer'
import QuestionGrid from '@/components/exam/QuestionGrid'
import { MOCK_EXAM_QUESTIONS, MOCK_LEADERBOARD } from '@/lib/mock-data'
import { formatTime } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/components/ui/use-toast'

type Phase = 'start' | 'exam' | 'result'

export default function ExamPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [phase, setPhase] = useState<Phase>('start')
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [autoSubmitted, setAutoSubmitted] = useState(false)
  const [showAutoSubmitModal, setShowAutoSubmitModal] = useState(false)
  const [startTime] = useState(Date.now())
  const [timeSpent, setTimeSpent] = useState(0)

  const TOTAL = 50
  const DURATION = 90 * 60

  const score = Object.entries(answers).filter(([qi, ans]) => {
    const q = MOCK_EXAM_QUESTIONS[Number(qi)]
    return q && ans === q.correct
  }).length

  const answered = new Set(Object.keys(answers).map(Number))

  const handleAutoExpire = useCallback(() => {
    if (phase !== 'exam') return
    const spent = Math.floor((Date.now() - startTime) / 1000)
    setTimeSpent(spent)
    setAutoSubmitted(true)
    setShowAutoSubmitModal(true)
    setTimeout(() => {
      setShowAutoSubmitModal(false)
      setPhase('result')
    }, 2500)
  }, [phase, startTime])

  const handleSubmit = () => {
    const spent = Math.floor((Date.now() - startTime) / 1000)
    setTimeSpent(spent)
    setPhase('result')
    toast({ title: 'Đã nộp bài!', description: `Điểm của bạn: ${score}/50`, variant: 'success' as never })
  }

  const selectAnswer = (optIdx: number) => {
    setAnswers({ ...answers, [current]: optIdx })
  }

  const q = MOCK_EXAM_QUESTIONS[current]

  // Leaderboard with current user inserted
  const leaderboard = [...MOCK_LEADERBOARD]
  if (phase === 'result') {
    const userEntry = { rank: 4, userId: user?.id ?? '', userName: user?.name ?? '', userAvatar: user?.image ?? '', score, timeSpent, completedAt: new Date().toISOString() }
    leaderboard.splice(3, 0, userEntry)
    leaderboard.forEach((e, i) => { e.rank = i + 1 })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <AnimatePresence mode="wait">
        {/* START */}
        {phase === 'start' && (
          <motion.div key="start" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
            <Card className="border-yellow-500/30">
              <CardContent className="pt-8 pb-8">
                <div className="text-center space-y-6">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-500/10">
                    <Trophy className="h-8 w-8 text-yellow-500" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold">Bài Thi Thử</h1>
                    <p className="text-muted-foreground mt-2">Thi thử với đề ngẫu nhiên — điểm sẽ được cập nhật lên bảng xếp hạng</p>
                  </div>
                  <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <p className="text-2xl font-bold text-primary">50</p>
                      <p className="text-xs text-muted-foreground mt-1">Câu hỏi</p>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <p className="text-2xl font-bold text-primary">90</p>
                      <p className="text-xs text-muted-foreground mt-1">Phút</p>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <p className="text-2xl font-bold text-primary">10</p>
                      <p className="text-xs text-muted-foreground mt-1">điểm/câu</p>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>• Mỗi câu hỏi có 4 lựa chọn, chỉ 1 đáp án đúng</p>
                    <p>• Hết giờ hệ thống tự động nộp bài</p>
                    <p>• Kết quả sẽ được cập nhật lên bảng xếp hạng</p>
                  </div>
                  <Button size="lg" className="gap-2" onClick={() => setPhase('exam')}>
                    <Trophy className="h-4 w-4" /> Bắt đầu thi
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* EXAM */}
        {phase === 'exam' && (
          <motion.div key="exam" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {/* Header bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant="outline">Câu {current + 1}/{TOTAL}</Badge>
                <Progress value={((current + 1) / TOTAL) * 100} className="w-32 h-2" />
                <span className="text-sm text-muted-foreground">{answered.size} đã trả lời</span>
              </div>
              <div className="flex items-center gap-3">
                <Timer totalSeconds={DURATION} onExpire={handleAutoExpire} />
                <Button variant="destructive" size="sm" onClick={handleSubmit}>Nộp bài</Button>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {/* Question */}
              <div className="md:col-span-2 space-y-4">
                <Card>
                  <CardContent className="pt-6">
                    <p className="font-medium leading-relaxed mb-6">{q.content}</p>
                    <div className="space-y-2">
                      {q.options.map((opt, idx) => {
                        const selected = answers[current] === idx
                        return (
                          <button
                            key={idx}
                            onClick={() => selectAnswer(idx)}
                            className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all text-sm ${
                              selected
                                ? 'border-primary bg-primary/10 text-primary font-medium'
                                : 'border-border hover:border-primary/40 hover:bg-accent'
                            }`}
                          >
                            <span className="font-bold mr-2">{String.fromCharCode(65 + idx)}.</span>
                            {opt}
                          </button>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
                <div className="flex justify-between">
                  <Button variant="outline" disabled={current === 0} onClick={() => setCurrent(current - 1)}>Câu trước</Button>
                  <Button disabled={current === TOTAL - 1} onClick={() => setCurrent(current + 1)}>Câu sau</Button>
                </div>
              </div>

              {/* Grid */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Danh sách câu hỏi</CardTitle>
                </CardHeader>
                <CardContent>
                  <QuestionGrid total={TOTAL} current={current} answered={answered} onSelect={setCurrent} />
                  <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2"><div className="h-3 w-3 rounded bg-primary" /> Đã trả lời</div>
                    <div className="flex items-center gap-2"><div className="h-3 w-3 rounded bg-muted" /> Chưa trả lời</div>
                    <div className="flex items-center gap-2"><div className="h-3 w-3 rounded border-2 border-primary" /> Câu hiện tại</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}

        {/* RESULT */}
        {phase === 'result' && (
          <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <Card className="border-yellow-500/30">
              <CardContent className="pt-8 pb-6 text-center space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-500/10">
                  <Trophy className="h-8 w-8 text-yellow-500" />
                </div>
                <div>
                  <h2 className="text-3xl font-extrabold">{score} <span className="text-muted-foreground font-normal text-xl">/ 50</span></h2>
                  <p className="text-muted-foreground mt-1">
                    {autoSubmitted ? 'Tự động nộp khi hết giờ' : 'Đã nộp bài thành công'}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
                  <div className="text-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                    <p className="text-lg font-bold mt-1">{score}</p>
                    <p className="text-xs text-muted-foreground">Đúng</p>
                  </div>
                  <div className="text-center">
                    <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                    <p className="text-lg font-bold mt-1">{answered.size - score}</p>
                    <p className="text-xs text-muted-foreground">Sai</p>
                  </div>
                  <div className="text-center">
                    <Clock className="h-5 w-5 text-blue-500 mx-auto" />
                    <p className="text-lg font-bold mt-1">{formatTime(timeSpent)}</p>
                    <p className="text-xs text-muted-foreground">Thời gian</p>
                  </div>
                </div>
                <Button onClick={() => { setPhase('start'); setAnswers({}); setCurrent(0) }} variant="outline">
                  Thi lại
                </Button>
              </CardContent>
            </Card>

            {/* Leaderboard */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" /> Bảng xếp hạng
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {leaderboard.slice(0, 10).map((entry) => {
                  const isCurrentUser = entry.userId === user?.id
                  return (
                    <div
                      key={entry.rank}
                      className={`flex items-center gap-3 rounded-lg p-2.5 ${isCurrentUser ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted/50'}`}
                    >
                      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                        entry.rank === 1 ? 'bg-yellow-500 text-white' :
                        entry.rank === 2 ? 'bg-gray-400 text-white' :
                        entry.rank === 3 ? 'bg-amber-600 text-white' : 'bg-muted text-muted-foreground'
                      }`}>
                        {entry.rank}
                      </div>
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={entry.userAvatar} />
                        <AvatarFallback>{entry.userName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <p className={`flex-1 text-sm font-medium truncate ${isCurrentUser ? 'text-primary' : ''}`}>
                        {entry.userName} {isCurrentUser && '(Bạn)'}
                      </p>
                      <Badge variant={isCurrentUser ? 'default' : 'secondary'}>{entry.score}/50</Badge>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auto-submit modal */}
      <Dialog open={showAutoSubmitModal} onOpenChange={setShowAutoSubmitModal}>
        <DialogContent className="text-center">
          <DialogHeader>
            <DialogTitle>Hết giờ!</DialogTitle>
            <DialogDescription>Bài thi đã được tự động nộp. Đang tính điểm...</DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
