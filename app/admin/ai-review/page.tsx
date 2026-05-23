'use client'

import { useCallback, useEffect, useState } from 'react'
import { AlertCircle, Bot, CheckCircle, ChevronLeft, ChevronRight, Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'

type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer'

interface AiQuestion {
  id: string
  question_text: string
  question_type: QuestionType
  topic: string | null
  subtopic: string | null
  difficulty: string | null
  correct_answer: string | null
  option_a: string | null
  option_b: string | null
  option_c: string | null
  option_d: string | null
  answer_a: boolean | null
  answer_b: boolean | null
  answer_c: boolean | null
  answer_d: boolean | null
  numeric_answer: number | null
  explanation: string | null
  needs_visual: boolean
  visual_description: string | null
  visual_image_url: string | null
  image_url: string | null
  is_published: boolean
  needs_review: boolean
  created_at: string
}

const TYPE_LABEL: Record<QuestionType, string> = {
  multiple_choice: 'Trắc nghiệm',
  true_false: 'Đúng/Sai',
  short_answer: 'Trả lời ngắn',
}

function answerLabel(question: AiQuestion) {
  if (question.question_type === 'multiple_choice') return question.correct_answer || 'Thiếu đáp án'
  if (question.question_type === 'short_answer') return question.numeric_answer ?? question.correct_answer ?? 'Thiếu đáp án'
  return [question.answer_a, question.answer_b, question.answer_c, question.answer_d]
    .map((answer) => answer === null || answer === undefined ? '?' : answer ? 'Đ' : 'S')
    .join('')
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })
}

export default function AiReviewPage() {
  const { toast } = useToast()
  const [questions, setQuestions] = useState<AiQuestion[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  const fetchQueue = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        answerSource: 'AI_generated',
        needsReview: 'true',
        published: 'false',
      })
      const res = await fetch(`/api/admin/questions?${params}`)
      const data = await res.json()
      setQuestions(data.questions ?? [])
      setTotal(data.total ?? 0)
      setTotalPages(data.totalPages ?? 1)
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => { fetchQueue() }, [fetchQueue])

  async function approve(question: AiQuestion) {
    setBusyId(question.id)
    try {
      const res = await fetch(`/api/admin/questions/${question.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ needs_review: false, is_published: true }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error ?? 'Không duyệt được câu hỏi')
      toast({ title: 'Đã duyệt và publish câu hỏi' })
      await fetchQueue()
    } catch (error) {
      toast({
        title: 'Không thể publish',
        description: error instanceof Error ? error.message : 'Câu hỏi chưa đủ đáp án hoặc hình ảnh.',
        variant: 'destructive',
      })
    } finally {
      setBusyId(null)
    }
  }

  async function reject(question: AiQuestion) {
    const ok = window.confirm('Từ chối và xóa câu hỏi AI này khỏi kho? Thao tác này không thể hoàn tác.')
    if (!ok) return

    setBusyId(question.id)
    try {
      const res = await fetch(`/api/admin/questions/${question.id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error ?? 'Không xóa được câu hỏi')
      toast({ title: 'Đã từ chối câu hỏi' })
      await fetchQueue()
    } catch (error) {
      toast({
        title: 'Không thể từ chối',
        description: error instanceof Error ? error.message : 'Không xóa được câu hỏi.',
        variant: 'destructive',
      })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/15">
              <Bot className="h-5 w-5 text-purple-300" />
            </div>
            <h1 className="text-xl font-bold text-zinc-100">Duyệt câu hỏi AI</h1>
          </div>
          <p className="mt-1 text-sm text-zinc-400">Kiểm tra câu AI-generated trước khi đưa vào kho luyện tập.</p>
        </div>
        <Badge className="border-purple-500/30 bg-purple-500/15 text-purple-200">{total.toLocaleString('vi-VN')} câu chờ duyệt</Badge>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
        </div>
      ) : questions.length === 0 ? (
        <Card className="border-zinc-800 bg-zinc-900 text-zinc-100">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <CheckCircle className="mb-3 h-10 w-10 text-green-400" />
            <p className="font-medium">Không còn câu AI cần duyệt</p>
            <p className="mt-1 text-sm text-zinc-400">Các câu mới từ AI solve sẽ xuất hiện ở đây.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {questions.map((question) => {
            const busy = busyId === question.id
            return (
              <Card key={question.id} className="border-zinc-800 bg-zinc-900 text-zinc-100">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-2">
                      <CardTitle className="text-base leading-snug line-clamp-3">{question.question_text}</CardTitle>
                      <div className="flex flex-wrap gap-1.5">
                        <Badge className="border-purple-500/30 bg-purple-500/15 text-purple-200">AI</Badge>
                        <Badge variant="outline" className="border-zinc-700 text-zinc-300">{TYPE_LABEL[question.question_type]}</Badge>
                        {question.difficulty && <Badge variant="outline" className="border-zinc-700 text-zinc-300">{question.difficulty}</Badge>}
                        {question.needs_visual && <Badge className="border-orange-500/30 bg-orange-500/15 text-orange-200">Cần hình</Badge>}
                      </div>
                    </div>
                    <span className="shrink-0 text-xs text-zinc-500">{formatDate(question.created_at)}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3">
                      <p className="text-xs font-medium text-zinc-500">Phân loại</p>
                      <p className="mt-1 text-sm text-zinc-200">{question.topic || 'Chưa có chủ đề'}</p>
                      <p className="mt-0.5 text-xs text-zinc-500">{question.subtopic || 'Chưa có dạng bài'}</p>
                    </div>
                    <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3">
                      <p className="text-xs font-medium text-zinc-500">Đáp án</p>
                      <p className="mt-1 font-mono text-lg font-bold text-green-300">{answerLabel(question)}</p>
                    </div>
                  </div>

                  {question.question_type === 'multiple_choice' && (
                    <div className="grid gap-2 text-xs text-zinc-300 md:grid-cols-2">
                      {(['A', 'B', 'C', 'D'] as const).map((letter) => {
                        const value = question[`option_${letter.toLowerCase()}` as keyof AiQuestion]
                        if (!value) return null
                        return <p key={letter} className="rounded border border-zinc-800 bg-zinc-950/40 p-2"><strong>{letter}.</strong> {String(value)}</p>
                      })}
                    </div>
                  )}

                  {question.needs_visual && (
                    <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-3">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-orange-300" />
                        <div>
                          <p className="text-xs font-medium text-orange-200">Cần kiểm tra hình ảnh trước khi publish</p>
                          {question.visual_description && <p className="mt-1 text-xs text-zinc-300">{question.visual_description}</p>}
                        </div>
                      </div>
                    </div>
                  )}

                  {(question.visual_image_url || question.image_url) && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={question.visual_image_url || question.image_url || ''} alt="Hình câu hỏi" className="max-h-44 rounded-lg border border-zinc-800 bg-zinc-950 object-contain" />
                  )}

                  <div className="flex flex-wrap justify-end gap-2 border-t border-zinc-800 pt-4">
                    <Button variant="destructive" size="sm" onClick={() => reject(question)} disabled={busy || !!busyId}>
                      {busy ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Trash2 className="mr-1 h-3.5 w-3.5" />}
                      Từ chối
                    </Button>
                    <Button size="sm" onClick={() => approve(question)} disabled={busy || !!busyId} className="bg-green-600 hover:bg-green-700">
                      {busy ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="mr-1 h-3.5 w-3.5" />}
                      Duyệt & publish
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-zinc-400">
          <span>Trang {page}/{totalPages}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page === totalPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
