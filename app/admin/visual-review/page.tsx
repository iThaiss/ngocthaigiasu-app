'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Loader2, ChevronLeft, ChevronRight, Upload, CheckCircle, ImageOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'

interface VisualQuestion {
  id: string
  question_text: string
  question_type: string
  topic: string | null
  subtopic: string | null
  grade: number | null
  part: string | null
  visual_type: string | null
  visual_description: string | null
  visual_image_url: string | null
  source_file: string | null
  source_hint: string | null
}

const VISUAL_TYPE_LABEL: Record<string, string> = {
  bang_bien_thien: 'Bảng biến thiên',
  do_thi: 'Đồ thị',
  hinh_khong_gian: 'Hình không gian',
  bang_so_lieu: 'Bảng số liệu',
  so_do_cay: 'Sơ đồ cây',
}

export default function VisualReviewPage() {
  const { toast } = useToast()
  const [questions, setQuestions] = useState<VisualQuestion[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('')
  const [uploading, setUploading] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeUploadId, setActiveUploadId] = useState<string | null>(null)

  const fetchQuestions = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        needsVisual: 'true',
        ...(typeFilter && { visualType: typeFilter }),
      })
      const res = await fetch(`/api/admin/questions?${params}`)
      const data = await res.json()
      setQuestions(data.questions ?? [])
      setTotal(data.total ?? 0)
      setTotalPages(data.totalPages ?? 1)
    } finally {
      setLoading(false)
    }
  }, [page, typeFilter])

  useEffect(() => { fetchQuestions() }, [fetchQuestions])

  function triggerUpload(id: string) {
    setActiveUploadId(id)
    fileInputRef.current?.click()
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !activeUploadId) return
    e.target.value = ''

    setUploading(activeUploadId)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('questionId', activeUploadId)

      const res = await fetch('/api/admin/questions/upload-image', {
        method: 'POST',
        body: fd,
      })
      if (!res.ok) throw new Error()
      toast({ title: 'Đã upload hình thành công' })
      fetchQuestions()
    } catch {
      toast({ title: 'Lỗi upload hình', variant: 'destructive' })
    } finally {
      setUploading(null)
      setActiveUploadId(null)
    }
  }

  const typeLabel: Record<string, string> = {
    multiple_choice: 'Trắc nghiệm',
    true_false: 'Đúng/Sai',
    short_answer: 'Trả lời ngắn',
  }

  return (
    <div className="space-y-4">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Câu cần hình ảnh</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Upload ảnh cho các câu hỏi cần hình vẽ, đồ thị, bảng biến thiên...</p>
        </div>
        <span className="text-sm text-zinc-400">{total.toLocaleString('vi-VN')} câu</span>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }}
          className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
        >
          <option value="">Tất cả loại hình</option>
          {Object.entries(VISUAL_TYPE_LABEL).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>

      {/* Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
        </div>
      ) : questions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
          <CheckCircle className="h-10 w-10 mb-3 text-green-500" />
          <p className="text-sm">Tất cả câu hỏi đã có hình ảnh!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {questions.map((q) => (
            <div
              key={q.id}
              className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 flex flex-col gap-3"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-wrap gap-1.5">
                  {q.grade && (
                    <span className="inline-flex rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-medium text-blue-400">
                      Lớp {q.grade}
                    </span>
                  )}
                  {q.part && (
                    <span className="inline-flex rounded-full bg-purple-500/15 px-2 py-0.5 text-[10px] font-medium text-purple-400">
                      Phần {q.part}
                    </span>
                  )}
                  {q.visual_type && (
                    <span className="inline-flex rounded-full bg-orange-500/15 px-2 py-0.5 text-[10px] font-medium text-orange-400">
                      {VISUAL_TYPE_LABEL[q.visual_type] ?? q.visual_type}
                    </span>
                  )}
                  <span className="inline-flex rounded-full bg-zinc-700 px-2 py-0.5 text-[10px] text-zinc-300">
                    {typeLabel[q.question_type] ?? q.question_type}
                  </span>
                </div>
                <ImageOff className="h-4 w-4 text-orange-400 shrink-0" />
              </div>

              {/* Topic */}
              {q.topic && (
                <p className="text-xs text-zinc-400">
                  {q.topic}{q.subtopic ? ` › ${q.subtopic}` : ''}
                </p>
              )}

              {/* Question text */}
              <p className="text-xs text-zinc-200 line-clamp-3 leading-relaxed">{q.question_text}</p>

              {/* Visual description */}
              {q.visual_description && (
                <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-2.5">
                  <p className="text-[10px] text-orange-300 font-medium mb-1">Cần hình:</p>
                  <p className="text-xs text-zinc-300 leading-relaxed">{q.visual_description}</p>
                </div>
              )}

              {/* Source hint */}
              {(q.source_hint || q.source_file) && (
                <p className="text-[10px] text-zinc-600">
                  {q.source_hint && <span>{q.source_hint} · </span>}
                  {q.source_file && <span>{q.source_file}</span>}
                </p>
              )}

              {/* Current image preview */}
              {q.visual_image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={q.visual_image_url}
                  alt="Visual"
                  className="rounded-lg border border-zinc-700 max-h-32 object-contain bg-zinc-800"
                />
              )}

              {/* Upload button */}
              <Button
                size="sm"
                variant={q.visual_image_url ? 'outline' : 'default'}
                className="w-full mt-auto"
                disabled={uploading === q.id}
                onClick={() => triggerUpload(q.id)}
              >
                {uploading === q.id
                  ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Đang upload...</>
                  : <><Upload className="mr-2 h-3.5 w-3.5" /> {q.visual_image_url ? 'Thay hình' : 'Upload hình'}</>
                }
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-zinc-400">
          <span>Trang {page}/{totalPages}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
