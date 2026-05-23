'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { BookmarkCheck, Bot, Loader2, RefreshCw, Search, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { formatDate } from '@/lib/utils'

interface SavedQuestion {
  id: string
  question_id: string
  source: string
  note: string | null
  created_at: string
  question: {
    id: string
    question_type: string
    question_text: string
    option_a: string | null
    option_b: string | null
    option_c: string | null
    option_d: string | null
    correct_answer: string | null
    numeric_answer: string | number | null
    explanation: string | null
    topic: string | null
    subtopic: string | null
    canonical_topic_title: string | null
    canonical_subtopic_title: string | null
    difficulty: string | null
    needs_visual: boolean | null
    image_url: string | null
  } | null
}

const TYPE_LABEL: Record<string, string> = {
  multiple_choice: 'Trắc nghiệm',
  true_false: 'Đúng/Sai',
  short_answer: 'Trả lời ngắn',
}

function topicOf(item: SavedQuestion) {
  return item.question?.canonical_topic_title ?? item.question?.topic ?? 'Chưa phân loại'
}

function subtopicOf(item: SavedQuestion) {
  return item.question?.canonical_subtopic_title ?? item.question?.subtopic ?? ''
}

export default function SavedQuestionsPage() {
  const { toast } = useToast()
  const [items, setItems] = useState<SavedQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [review, setReview] = useState('')
  const [reviewing, setReviewing] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const fetchSaved = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/saved-questions?source=standard_exam&include=questions')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to fetch')
      setItems(data.savedQuestions ?? [])
    } catch {
      toast({ title: 'Không tải được câu đã lưu', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { fetchSaved() }, [fetchSaved])

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return items
    return items.filter((item) => {
      const haystack = [
        item.question?.question_text,
        topicOf(item),
        subtopicOf(item),
        item.note,
      ].join(' ').toLowerCase()
      return haystack.includes(keyword)
    })
  }, [items, search])

  const groupedTopics = useMemo(() => {
    const map = new Map<string, number>()
    items.forEach((item) => map.set(topicOf(item), (map.get(topicOf(item)) ?? 0) + 1))
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8)
  }, [items])

  async function removeSaved(item: SavedQuestion) {
    setRemovingId(item.id)
    try {
      const res = await fetch(`/api/saved-questions?source=standard_exam&question_id=${encodeURIComponent(item.question_id)}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setItems((current) => current.filter((saved) => saved.id !== item.id))
      toast({ title: 'Đã bỏ lưu câu hỏi' })
    } catch {
      toast({ title: 'Không bỏ lưu được câu hỏi', variant: 'destructive' })
    } finally {
      setRemovingId(null)
    }
  }

  async function runReview() {
    setReviewing(true)
    setReview('')
    try {
      const res = await fetch('/api/saved-questions/review', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to review')
      setReview(data.review ?? '')
    } catch {
      toast({ title: 'AI review đang bận, thử lại sau', variant: 'destructive' })
    } finally {
      setReviewing(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Câu cần ôn tập</h1>
          <p className="text-sm text-muted-foreground">Những câu bạn đã lưu khi luyện đề, dùng để ôn lại đúng chỗ còn vướng.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchSaved} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Tải lại
          </Button>
          <Button onClick={runReview} disabled={reviewing || items.length === 0}>
            {reviewing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
            AI gợi ý ôn
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm theo nội dung, chủ đề, dạng bài..." className="pl-9" />
          </div>

          <div className="rounded-lg border bg-card">
            {loading ? (
              <div className="flex h-48 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground">
                <BookmarkCheck className="mx-auto mb-3 h-8 w-8" />
                <p>Chưa có câu nào trong danh sách này.</p>
              </div>
            ) : (
              <div className="divide-y">
                {filtered.map((item) => (
                  <div key={item.id} className="p-4">
                    <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">{TYPE_LABEL[item.question?.question_type ?? ''] ?? item.question?.question_type ?? 'Câu hỏi'}</span>
                      <span>{topicOf(item)}</span>
                      {subtopicOf(item) && <span>/ {subtopicOf(item)}</span>}
                      <span>· Lưu {formatDate(item.created_at)}</span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{item.question?.question_text ?? 'Không tìm thấy nội dung câu hỏi.'}</p>
                    {item.question?.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.question.image_url} alt="Hình minh họa câu hỏi" className="mt-3 max-h-56 rounded-md border object-contain" />
                    )}
                    <div className="mt-3 rounded-md bg-muted/50 p-3 text-sm">
                      <p className="font-medium">Đáp án/lời giải để ôn lại</p>
                      <p className="mt-1 text-muted-foreground">
                        Đáp án: <span className="font-mono text-foreground">{item.question?.correct_answer ?? item.question?.numeric_answer ?? '—'}</span>
                      </p>
                      {item.question?.explanation && <p className="mt-2 whitespace-pre-wrap text-muted-foreground">{item.question.explanation}</p>}
                    </div>
                    <div className="mt-3 flex justify-end">
                      <Button variant="outline" size="sm" onClick={() => removeSaved(item)} disabled={removingId === item.id}>
                        {removingId === item.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                        Bỏ lưu
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm font-semibold">Tổng quan ôn tập</p>
            <p className="mt-2 text-3xl font-bold">{items.length}</p>
            <p className="text-sm text-muted-foreground">câu đã lưu</p>
            <div className="mt-4 space-y-2">
              {groupedTopics.map(([topic, count]) => (
                <div key={topic} className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm">
                  <span className="truncate">{topic}</span>
                  <span className="font-mono">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold">AI review</p>
            </div>
            {review ? (
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{review}</p>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">Bấm “AI gợi ý ôn” để AI xem các câu bạn đã lưu và đề xuất thứ tự ôn tập.</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
