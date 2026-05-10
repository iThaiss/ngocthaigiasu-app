'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, ChevronLeft, ChevronRight, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { createAdminClient } from '@/lib/supabase'

interface RawDocument {
  id: string
  filename: string
  source: string | null
  total_pages: number | null
  status: string
  created_at: string
  question_count?: number
}

const STATUS_STYLE: Record<string, string> = {
  completed: 'bg-green-500/15 text-green-400',
  processing: 'bg-yellow-500/15 text-yellow-400',
  failed: 'bg-red-500/15 text-red-400',
}

export default function AdminDocumentsPage() {
  const [docs, setDocs] = useState<RawDocument[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [viewDocId, setViewDocId] = useState<string | null>(null)
  const [docQuestions, setDocQuestions] = useState<{ id: string; question_text: string; question_type: string; difficulty: string | null }[]>([])
  const [loadingQ, setLoadingQ] = useState(false)

  const LIMIT = 20

  const fetchDocs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
        ...(statusFilter && { status: statusFilter }),
        ...(sourceFilter && { source: sourceFilter }),
      })
      const res = await fetch(`/api/admin/documents?${params}`)
      const data = await res.json()
      setDocs(data.documents ?? [])
      setTotal(data.total ?? 0)
      setTotalPages(data.totalPages ?? 1)
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, sourceFilter])

  useEffect(() => { fetchDocs() }, [fetchDocs])

  async function viewQuestions(docId: string, source: string | null) {
    setViewDocId(docId)
    setLoadingQ(true)
    setDocQuestions([])
    try {
      const params = new URLSearchParams({ source: source ?? docId, limit: '100' })
      const res = await fetch(`/api/admin/questions?${params}`)
      const data = await res.json()
      setDocQuestions(data.questions ?? [])
    } finally {
      setLoadingQ(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-100">Tài liệu</h1>
        <span className="text-sm text-zinc-400">{total.toLocaleString('vi-VN')} file</span>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="completed">Completed</option>
          <option value="processing">Processing</option>
          <option value="failed">Failed</option>
        </select>
        <input
          value={sourceFilter}
          onChange={(e) => { setSourceFilter(e.target.value); setPage(1) }}
          placeholder="Lọc theo nguồn..."
          className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500"
        />
      </div>

      <div className="flex gap-4">
        {/* Documents table */}
        <div className={`flex-1 rounded-xl border border-zinc-800 bg-zinc-900 overflow-x-auto ${viewDocId ? 'max-w-[55%]' : ''}`}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-xs text-zinc-400">
                <th className="px-4 py-2.5 text-left font-medium">Tên file</th>
                <th className="px-4 py-2.5 text-left font-medium">Nguồn</th>
                <th className="px-4 py-2.5 text-center font-medium">Trang</th>
                <th className="px-4 py-2.5 text-center font-medium">Trạng thái</th>
                <th className="px-4 py-2.5 text-left font-medium">Ngày tạo</th>
                <th className="px-4 py-2.5 text-center font-medium">Câu hỏi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-zinc-500" />
                  </td>
                </tr>
              ) : docs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500">Chưa có tài liệu</td>
                </tr>
              ) : (
                docs.map((doc) => (
                  <tr
                    key={doc.id}
                    className={`hover:bg-zinc-800/40 transition-colors cursor-pointer ${viewDocId === doc.id ? 'bg-zinc-800/60' : ''}`}
                    onClick={() => viewQuestions(doc.id, doc.source)}
                  >
                    <td className="px-4 py-2.5 text-zinc-200 max-w-[180px]">
                      <div className="flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                        <span className="truncate text-xs">{doc.filename}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-zinc-400 text-xs">{doc.source ?? '—'}</td>
                    <td className="px-4 py-2.5 text-center text-zinc-400">{doc.total_pages ?? '—'}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[doc.status] ?? 'bg-zinc-700 text-zinc-300'}`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-zinc-500 text-xs">{formatDate(doc.created_at).slice(0, 10)}</td>
                    <td className="px-4 py-2.5 text-center text-zinc-400">{doc.question_count ?? '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-2 border-t border-zinc-800 text-xs text-zinc-400">
              <span>Trang {page}/{totalPages}</span>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="h-7 w-7 p-0">
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="h-7 w-7 p-0">
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Questions panel */}
        {viewDocId && (
          <div className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
              <p className="text-sm font-semibold text-zinc-200">
                Câu hỏi từ tài liệu
                {!loadingQ && <span className="ml-1 text-zinc-400">({docQuestions.length})</span>}
              </p>
              <button onClick={() => setViewDocId(null)} className="text-zinc-500 hover:text-zinc-300 text-xs">Đóng</button>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/60">
              {loadingQ ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
                </div>
              ) : docQuestions.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 text-sm">Không có câu hỏi</div>
              ) : (
                docQuestions.map((q, i) => (
                  <div key={q.id} className="px-4 py-3">
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-zinc-600 shrink-0 mt-0.5">{i + 1}.</span>
                      <div className="min-w-0">
                        <p className="text-xs text-zinc-300 line-clamp-3">{q.question_text}</p>
                        <div className="flex gap-2 mt-1">
                          <span className="text-[10px] text-zinc-600">{q.question_type}</span>
                          {q.difficulty && (
                            <span className="text-[10px] text-zinc-500">{q.difficulty}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
