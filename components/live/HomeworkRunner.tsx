'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, FileText, CheckCircle2, XCircle, RotateCcw, Send, X, Play } from 'lucide-react'
import type { PublicHomeworkSlot, GradedAnswer } from '@/lib/homework-grading'

const TF_LABELS = ['a', 'b', 'c', 'd', 'e', 'f']

// Chuyển link Drive/PDF sang URL nhúng iframe
function getFileEmbedUrl(url: string): string {
  const drive = url.match(/drive\.google\.com\/file\/d\/([^/]+)/)
  if (drive) return `https://drive.google.com/file/d/${drive[1]}/preview`
  const driveOpen = url.match(/drive\.google\.com\/open\?id=([^&]+)/)
  if (driveOpen) return `https://drive.google.com/file/d/${driveOpen[1]}/preview`
  return url
}

interface HomeworkData {
  title: string
  file_url: string
  slots: PublicHomeworkSlot[]
  has_answer_key: boolean
  homework_recording_url: string | null
  homework_document_url: string | null
}

interface SubmitResult {
  score: number
  max_score: number
  correct_count: number
  total_count: number
  results: GradedAnswer[]
}

export default function HomeworkRunner({
  sessionId,
  open,
  onClose,
  onSubmitted,
  initiallySubmitted = false,
}: {
  sessionId: string
  open: boolean
  onClose: () => void
  onSubmitted?: () => void
  initiallySubmitted?: boolean
}) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<HomeworkData | null>(null)
  const [answers, setAnswers] = useState<Record<string, string | boolean[]>>({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<SubmitResult | null>(null)
  const [mobileView, setMobileView] = useState<'de' | 'lambai'>('de')
  // true = đang xem giải (sau khi nộp hoặc mở lại sau khi đã nộp)
  const [showSolution, setShowSolution] = useState(initiallySubmitted)
  const startRef = useRef<number>(Date.now())
  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose })

  const load = useCallback(async () => {
    setLoading(true)
    setResult(null)
    setAnswers({})
    // Nếu đã nộp trước đó thì mở thẳng vào view giải
    setShowSolution(initiallySubmitted)
    try {
      const res = await fetch(`/api/live/homework?sessionId=${sessionId}`)
      if (!res.ok) throw new Error()
      const d = await res.json()
      setData(d)
      startRef.current = Date.now()
      // Restore kết quả lần nộp cuối từ localStorage
      if (initiallySubmitted) {
        try {
          const saved = localStorage.getItem(`btvn_result_${sessionId}`)
          if (saved) setResult(JSON.parse(saved))
        } catch {}
      }
    } catch {
      toast({ title: 'Không tải được BTVN', variant: 'destructive' })
      onCloseRef.current()
    } finally {
      setLoading(false)
    }
  }, [sessionId, toast, initiallySubmitted])

  useEffect(() => {
    if (open) load()
  }, [open, load])

  function setMcq(stt: number, choice: string) {
    setAnswers((a) => ({ ...a, [stt]: choice }))
  }
  function setTf(stt: number, idx: number, value: boolean, count: number) {
    setAnswers((a) => {
      const cur = Array.isArray(a[stt]) ? [...(a[stt] as boolean[])] : new Array(count).fill(null)
      cur[idx] = value
      return { ...a, [stt]: cur }
    })
  }
  function setShort(stt: number, value: string) {
    setAnswers((a) => ({ ...a, [stt]: value }))
  }

  async function handleSubmit() {
    if (!data) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/live/homework/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          answers,
          timeSpent: (Date.now() - startRef.current) / 1000,
        }),
      })
      if (!res.ok) throw new Error()
      const r = await res.json()
      setResult(r)
      setShowSolution(true)
      setMobileView('lambai')
      onSubmitted?.()
      try { localStorage.setItem(`btvn_result_${sessionId}`, JSON.stringify(r)) } catch {}
      toast({ title: `Đã nộp! ${r.score}/${r.max_score} điểm` })
    } catch {
      toast({ title: 'Lỗi khi nộp bài', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const resultByStt = new Map((result?.results ?? []).map((r) => [r.stt, r]))

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-6xl w-[96vw] h-[92vh] p-0 gap-0 flex flex-col overflow-hidden">
        <DialogHeader className="px-4 py-3 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base pr-8">
            <FileText className="h-4 w-4 text-primary shrink-0" />
            <span className="truncate">{data?.title ?? 'Bài tập về nhà'}</span>
            {result && (
              <span className="ml-auto mr-2 text-sm font-bold text-primary whitespace-nowrap">
                {result.score}/{result.max_score} điểm · đúng {result.correct_count}/{result.total_count}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : data ? (
          <>
            {/* Mobile toggle */}
            <div className="flex md:hidden border-b shrink-0">
              <button
                onClick={() => setMobileView('de')}
                className={`flex-1 py-2 text-sm font-semibold ${mobileView === 'de' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
              >Đề bài</button>
              <button
                onClick={() => setMobileView('lambai')}
                className={`flex-1 py-2 text-sm font-semibold ${mobileView === 'lambai' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
              >Làm bài</button>
            </div>

            <div className="flex flex-1 min-h-0">
              {/* Đề — iframe */}
              <div className={`${mobileView === 'de' ? 'flex' : 'hidden'} md:flex md:w-1/2 lg:w-3/5 flex-1 bg-muted/30 border-r`}>
                <iframe
                  src={getFileEmbedUrl(data.file_url)}
                  className="h-full w-full"
                  allow="autoplay"
                  title="Đề BTVN"
                />
              </div>

              {/* Làm bài / Xem giải */}
              <div className={`${mobileView === 'lambai' ? 'flex' : 'hidden'} md:flex md:w-1/2 lg:w-2/5 flex-1 flex-col min-h-0`}>
                {!data.has_answer_key && (
                  <div className="mx-4 mt-4 p-3 rounded-lg border border-amber-400/30 bg-amber-400/10 text-amber-700 dark:text-amber-400 text-xs">
                    Bảng đáp án chưa được thiết lập. Admin vui lòng chỉnh sửa buổi học để thêm đáp án.
                  </div>
                )}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {data.slots.map((slot) => {
                    const r = resultByStt.get(slot.stt)
                    return (
                      <div
                        key={slot.stt}
                        className={`rounded-xl border p-3 ${r ? (r.correct ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/20' : 'border-rose-300 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/20') : 'border-border'}`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                            {slot.stt}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {slot.type === 'multiple_choice' ? 'Trắc nghiệm'
                              : slot.type === 'true_false' ? 'Đúng / Sai'
                              : 'Trả lời ngắn'}
                          </span>
                          {r && (r.correct
                            ? <CheckCircle2 className="h-4 w-4 text-emerald-500 ml-auto" />
                            : <XCircle className="h-4 w-4 text-rose-500 ml-auto" />)}
                        </div>

                        {/* Trắc nghiệm */}
                        {slot.type === 'multiple_choice' && (
                          <div className="flex gap-2">
                            {['A', 'B', 'C', 'D'].map((c) => (
                              <button
                                key={c}
                                disabled={showSolution}
                                onClick={() => setMcq(slot.stt, c)}
                                className={`flex-1 h-9 rounded-lg border text-sm font-bold transition-colors disabled:opacity-70
                                  ${answers[slot.stt] === c ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'}`}
                              >{c}</button>
                            ))}
                          </div>
                        )}

                        {/* Đúng / sai */}
                        {slot.type === 'true_false' && (
                          <div className="space-y-1.5">
                            {Array.from({ length: slot.statementCount ?? 4 }).map((_, idx) => {
                              const cur = Array.isArray(answers[slot.stt]) ? (answers[slot.stt] as boolean[])[idx] : null
                              return (
                                <div key={idx} className="flex items-center gap-2">
                                  <span className="text-xs font-semibold w-4 text-muted-foreground">{TF_LABELS[idx]})</span>
                                  <button
                                    disabled={showSolution}
                                    onClick={() => setTf(slot.stt, idx, true, slot.statementCount ?? 4)}
                                    className={`flex-1 h-8 rounded-lg border text-xs font-bold disabled:opacity-70 ${cur === true ? 'bg-emerald-500 text-white border-emerald-500' : 'border-border hover:bg-muted'}`}
                                  >Đúng</button>
                                  <button
                                    disabled={showSolution}
                                    onClick={() => setTf(slot.stt, idx, false, slot.statementCount ?? 4)}
                                    className={`flex-1 h-8 rounded-lg border text-xs font-bold disabled:opacity-70 ${cur === false ? 'bg-rose-500 text-white border-rose-500' : 'border-border hover:bg-muted'}`}
                                  >Sai</button>
                                </div>
                              )
                            })}
                          </div>
                        )}

                        {/* Trả lời ngắn */}
                        {slot.type === 'short_answer' && (
                          <input
                            type="text"
                            inputMode="decimal"
                            disabled={showSolution}
                            value={(answers[slot.stt] as string) ?? ''}
                            onChange={(e) => setShort(slot.stt, e.target.value)}
                            placeholder="Nhập đáp án (số)"
                            className="w-full h-9 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-70"
                          />
                        )}

                        {/* Đáp án đúng sau khi nộp */}
                        {r && !r.correct && (
                          <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                            Đáp án đúng: {Array.isArray(r.correctAnswer)
                              ? r.correctAnswer.map((v, i) => `${TF_LABELS[i]}:${v ? 'Đ' : 'S'}`).join('  ')
                              : String(r.correctAnswer)}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Footer actions */}
                <div className="border-t p-3 shrink-0 flex gap-2 flex-wrap">
                  {!data.has_answer_key ? (
                    <Button variant="outline" className="w-full" onClick={onClose}>
                      <X className="h-4 w-4 mr-1.5" /> Đóng
                    </Button>
                  ) : showSolution ? (
                    <>
                      <Button
                        variant="outline"
                        className="flex-1 gap-1.5 min-w-[90px]"
                        onClick={() => { setShowSolution(false); setResult(null); setAnswers({}) }}
                      >
                        <RotateCcw className="h-4 w-4" /> Nộp lại
                      </Button>
                      {data.homework_recording_url && (
                        <Button variant="outline" className="flex-1 gap-1.5 min-w-[110px]" asChild>
                          <a href={data.homework_recording_url} target="_blank" rel="noreferrer">
                            <Play className="h-4 w-4" /> Record giải
                          </a>
                        </Button>
                      )}
                      {data.homework_document_url && (
                        <Button variant="outline" className="flex-1 gap-1.5 min-w-[120px]" asChild>
                          <a href={data.homework_document_url} target="_blank" rel="noreferrer">
                            <FileText className="h-4 w-4" /> Bản viết tay
                          </a>
                        </Button>
                      )}
                      <Button className="flex-1 gap-1.5 min-w-[80px]" onClick={onClose}>
                        <X className="h-4 w-4" /> Đóng
                      </Button>
                    </>
                  ) : (
                    <Button className="w-full gap-1.5" onClick={handleSubmit} disabled={submitting}>
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      Nộp bài
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
