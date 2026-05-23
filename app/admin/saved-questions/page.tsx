'use client'

import { useCallback, useEffect, useState } from 'react'
import { BookmarkCheck, ChevronLeft, ChevronRight, Loader2, RefreshCw, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { formatDate } from '@/lib/utils'

interface SavedRow {
  id: string
  user_id: string
  question_id: string
  note: string | null
  created_at: string
  savedCount: number
  users: { id: string; name: string | null; email: string } | null
  question: {
    id: string
    question_type: string
    question_text: string
    topic: string | null
    subtopic: string | null
    canonical_topic_title: string | null
    canonical_subtopic_title: string | null
    difficulty: string | null
    correct_answer: string | null
    numeric_answer: string | number | null
    needs_visual: boolean | null
  } | null
}

interface TopQuestion {
  question_id: string
  count: number
  question: { question_text: string | null; topic: string | null; canonical_topic_title: string | null } | null
}

function maskEmail(email: string) {
  const [name, domain] = email.split('@')
  if (!name || !domain) return email
  return `${name.slice(0, 2)}***@${domain}`
}

function topic(row: SavedRow) {
  return row.question?.canonical_topic_title ?? row.question?.topic ?? 'Chưa phân loại'
}

export default function AdminSavedQuestionsPage() {
  const { toast } = useToast()
  const [rows, setRows] = useState<SavedRow[]>([])
  const [topQuestions, setTopQuestions] = useState<TopQuestion[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchRows = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), ...(search && { search }) })
      const res = await fetch(`/api/admin/saved-questions?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      setRows(data.savedQuestions ?? [])
      setTopQuestions(data.topQuestions ?? [])
      setTotal(data.total ?? 0)
      setTotalPages(data.totalPages ?? 1)
    } catch {
      toast({ title: 'Không tải được câu học sinh lưu', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [page, search, toast])

  useEffect(() => { fetchRows() }, [fetchRows])

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Câu học sinh lưu</h1>
          <p className="text-sm text-zinc-400">Xem câu nào học sinh cần ôn lại nhiều để ưu tiên sửa/làm bài giảng.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchRows} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Tải lại
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
            <Input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Tìm học sinh, nội dung, chủ đề..." className="border-zinc-700 bg-zinc-900 pl-8 text-zinc-100 placeholder:text-zinc-500" />
          </div>

          <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-xs text-zinc-400">
                  <th className="px-3 py-2.5 text-left font-medium">Câu hỏi</th>
                  <th className="px-3 py-2.5 text-left font-medium">Học sinh</th>
                  <th className="px-3 py-2.5 text-center font-medium">Lượt lưu</th>
                  <th className="px-3 py-2.5 text-left font-medium">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {loading ? (
                  <tr><td colSpan={4} className="py-12 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-zinc-500" /></td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={4} className="py-12 text-center text-zinc-500">Chưa có dữ liệu</td></tr>
                ) : rows.map((row) => (
                  <tr key={row.id} className="hover:bg-zinc-800/35">
                    <td className="px-3 py-3 align-top">
                      <p className="line-clamp-2 max-w-xl text-xs text-zinc-100">{row.question?.question_text ?? 'Không tìm thấy câu hỏi'}</p>
                      <p className="mt-1 text-[11px] text-zinc-500">{topic(row)} · Đáp án {row.question?.correct_answer ?? row.question?.numeric_answer ?? '—'}</p>
                    </td>
                    <td className="px-3 py-3 align-top">
                      <p className="text-xs text-zinc-200">{row.users?.name ?? 'Học sinh'}</p>
                      <p className="mt-1 text-[11px] text-zinc-500">{row.users?.email ? maskEmail(row.users.email) : row.user_id.slice(0, 8)}</p>
                    </td>
                    <td className="px-3 py-3 text-center align-top font-mono text-emerald-300">{row.savedCount}</td>
                    <td className="px-3 py-3 align-top text-xs text-zinc-400">{formatDate(row.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-sm text-zinc-400">
            <span>{total.toLocaleString('vi-VN')} lượt lưu · Trang {page}/{totalPages}</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1}><ChevronLeft className="h-4 w-4" /></Button>
              <Button size="sm" variant="outline" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page >= totalPages}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>

        <aside className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <div className="flex items-center gap-2 text-zinc-100">
            <BookmarkCheck className="h-4 w-4 text-primary" />
            <p className="font-semibold">Top câu được lưu</p>
          </div>
          <div className="mt-4 space-y-3">
            {topQuestions.length === 0 ? <p className="text-sm text-zinc-500">Chưa có dữ liệu.</p> : topQuestions.map((item) => (
              <div key={item.question_id} className="rounded-lg bg-zinc-950 p-3">
                <div className="mb-1 flex items-center justify-between gap-3">
                  <span className="text-xs text-zinc-500">{item.question?.canonical_topic_title ?? item.question?.topic ?? 'Chưa phân loại'}</span>
                  <span className="font-mono text-sm text-emerald-300">{item.count}</span>
                </div>
                <p className="line-clamp-2 text-xs leading-relaxed text-zinc-300">{item.question?.question_text ?? item.question_id}</p>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  )
}
