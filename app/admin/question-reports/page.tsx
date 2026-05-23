'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Eye, Loader2,
  MessageSquareWarning, RefreshCw, Search, XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { formatDate } from '@/lib/utils'

type ReportStatus = 'open' | 'reviewing' | 'resolved' | 'rejected'
type IssueType = 'wrong_answer' | 'unclear_question' | 'missing_image' | 'bad_solution' | 'typo' | 'other'

interface AdminUser {
  id: string
  name: string | null
  email: string
}

interface StandardQuestion {
  id: string
  question_text?: string | null
  question_type?: string | null
  topic?: string | null
  canonical_topic_title?: string | null
  subtopic?: string | null
  canonical_subtopic_title?: string | null
  correct_answer?: string | null
  numeric_answer?: string | number | null
  explanation?: string | null
  image_url?: string | null
}

interface ExamQuestion {
  id: string
  section_code?: string | null
  question_number?: number | null
  display_order?: number | null
  max_score?: number | null
}

interface ExamSet {
  id: string
  title?: string | null
  subject?: string | null
  exam_type?: string | null
  exam_index?: number | null
  status?: string | null
}

interface QuestionReport {
  id: string
  user_id: string
  question_id: string
  exam_question_id: string | null
  exam_set_id: string | null
  source: string
  issue_type: IssueType
  description: string
  status: ReportStatus
  admin_note: string | null
  created_at: string
  updated_at: string
  user: AdminUser | null
  question: StandardQuestion | null
  examQuestion: ExamQuestion | null
  examSet: ExamSet | null
}

const STATUS_LABEL: Record<ReportStatus, string> = {
  open: 'Mới',
  reviewing: 'Đang xử lý',
  resolved: 'Đã sửa',
  rejected: 'Bỏ qua',
}

const STATUS_CLASS: Record<ReportStatus, string> = {
  open: 'border-red-500/30 bg-red-500/10 text-red-300',
  reviewing: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  resolved: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  rejected: 'border-zinc-600 bg-zinc-800 text-zinc-300',
}

const ISSUE_LABEL: Record<IssueType, string> = {
  wrong_answer: 'Sai đáp án',
  unclear_question: 'Đề chưa rõ',
  missing_image: 'Thiếu hình',
  bad_solution: 'Lời giải sai',
  typo: 'Lỗi gõ chữ',
  other: 'Khác',
}

const STATUS_ICON: Record<ReportStatus, typeof AlertTriangle> = {
  open: AlertTriangle,
  reviewing: Clock3,
  resolved: CheckCircle2,
  rejected: XCircle,
}

function maskEmail(email: string) {
  const [name, domain] = email.split('@')
  if (!name || !domain) return email
  return `${name.slice(0, 2)}***@${domain}`
}

function questionTopic(question: StandardQuestion | null) {
  return question?.canonical_topic_title ?? question?.topic ?? 'Chưa phân loại'
}

function questionSubtopic(question: StandardQuestion | null) {
  return question?.canonical_subtopic_title ?? question?.subtopic ?? null
}

export default function AdminQuestionReportsPage() {
  const { toast } = useToast()
  const [reports, setReports] = useState<QuestionReport[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [issueFilter, setIssueFilter] = useState('')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<QuestionReport | null>(null)
  const [adminNote, setAdminNote] = useState('')
  const [nextStatus, setNextStatus] = useState<ReportStatus>('reviewing')
  const [saving, setSaving] = useState(false)

  const fetchReports = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        ...(statusFilter && { status: statusFilter }),
        ...(issueFilter && { issueType: issueFilter }),
        ...(search && { search }),
      })
      const res = await fetch(`/api/admin/question-reports?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to fetch reports')
      setReports(data.reports ?? [])
      setTotal(data.total ?? 0)
      setTotalPages(data.totalPages ?? 1)
    } catch {
      toast({ title: 'Không tải được báo cáo câu hỏi', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [issueFilter, page, search, statusFilter, toast])

  useEffect(() => { fetchReports() }, [fetchReports])

  const stats = useMemo(() => {
    const base: Record<ReportStatus, number> = { open: 0, reviewing: 0, resolved: 0, rejected: 0 }
    reports.forEach((report) => { base[report.status] += 1 })
    return base
  }, [reports])

  function openReport(report: QuestionReport) {
    setSelected(report)
    setAdminNote(report.admin_note ?? '')
    setNextStatus(report.status === 'open' ? 'reviewing' : report.status)
  }

  async function updateReport(status = nextStatus) {
    if (!selected) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/question-reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selected.id, status, admin_note: adminNote }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to update report')
      toast({ title: 'Đã cập nhật báo cáo' })
      setSelected(null)
      fetchReports()
    } catch {
      toast({ title: 'Không cập nhật được báo cáo', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const issueOptions = Object.entries(ISSUE_LABEL) as Array<[IssueType, string]>
  const statusOptions = Object.entries(STATUS_LABEL) as Array<[ReportStatus, string]>

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Báo cáo câu hỏi</h1>
          <p className="text-sm text-zinc-400">Theo dõi lỗi học sinh gửi từ luyện đề chuẩn.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchReports} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Tải lại
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {statusOptions.map(([status, label]) => {
          const Icon = STATUS_ICON[status]
          return (
            <button
              key={status}
              onClick={() => { setStatusFilter(statusFilter === status ? '' : status); setPage(1) }}
              className={`rounded-lg border p-3 text-left transition-colors ${statusFilter === status ? STATUS_CLASS[status] : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{label}</span>
                <Icon className="h-4 w-4" />
              </div>
              <p className="mt-2 text-2xl font-bold">{stats[status]}</p>
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
          <Input
            value={search}
            onChange={(event) => { setSearch(event.target.value); setPage(1) }}
            placeholder="Tìm trong mô tả hoặc ghi chú..."
            className="border-zinc-700 bg-zinc-900 pl-8 text-zinc-100 placeholder:text-zinc-500"
          />
        </div>
        <select
          value={issueFilter}
          onChange={(event) => { setIssueFilter(event.target.value); setPage(1) }}
          className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
        >
          <option value="">Tất cả loại lỗi</option>
          {issueOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={(event) => { setStatusFilter(event.target.value); setPage(1) }}
          className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
        >
          <option value="">Tất cả trạng thái</option>
          {statusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-xs text-zinc-400">
              <th className="px-3 py-2.5 text-left font-medium">Báo cáo</th>
              <th className="px-3 py-2.5 text-left font-medium">Câu hỏi</th>
              <th className="px-3 py-2.5 text-left font-medium">Đề</th>
              <th className="px-3 py-2.5 text-left font-medium">Học sinh</th>
              <th className="px-3 py-2.5 text-center font-medium">Trạng thái</th>
              <th className="px-3 py-2.5 text-center font-medium">Xử lý</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin text-zinc-500" />
                </td>
              </tr>
            ) : reports.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-zinc-500">Chưa có báo cáo phù hợp</td>
              </tr>
            ) : reports.map((report) => (
              <tr key={report.id} className="transition-colors hover:bg-zinc-800/35">
                <td className="px-3 py-3 align-top">
                  <div className="flex items-start gap-2">
                    <MessageSquareWarning className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-zinc-100">{ISSUE_LABEL[report.issue_type] ?? report.issue_type}</p>
                      <p className="mt-1 line-clamp-2 max-w-xs text-xs leading-relaxed text-zinc-400">{report.description}</p>
                      <p className="mt-1 text-[11px] text-zinc-500">{formatDate(report.created_at)}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 align-top">
                  <p className="line-clamp-2 max-w-md text-xs text-zinc-200">{report.question?.question_text ?? 'Không tìm thấy nội dung câu hỏi'}</p>
                  <p className="mt-1 text-[11px] text-zinc-500">
                    {questionTopic(report.question)}
                    {questionSubtopic(report.question) ? ` / ${questionSubtopic(report.question)}` : ''}
                  </p>
                </td>
                <td className="px-3 py-3 align-top">
                  <p className="max-w-[220px] truncate text-xs text-zinc-300">{report.examSet?.title ?? report.source}</p>
                  {report.examQuestion && (
                    <p className="mt-1 text-[11px] text-zinc-500">
                      Phần {report.examQuestion.section_code ?? '—'} · Câu {report.examQuestion.question_number ?? report.examQuestion.display_order ?? '—'}
                    </p>
                  )}
                </td>
                <td className="px-3 py-3 align-top">
                  <p className="text-xs text-zinc-200">{report.user?.name ?? 'Học sinh'}</p>
                  <p className="mt-1 text-[11px] text-zinc-500">{report.user?.email ? maskEmail(report.user.email) : report.user_id.slice(0, 8)}</p>
                </td>
                <td className="px-3 py-3 text-center align-top">
                  <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[report.status]}`}>
                    {STATUS_LABEL[report.status] ?? report.status}
                  </span>
                </td>
                <td className="px-3 py-3 text-center align-top">
                  <Button size="sm" variant="outline" onClick={() => openReport(report)}>
                    <Eye className="mr-1.5 h-3.5 w-3.5" />
                    Xem
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-zinc-400">
        <span>{total.toLocaleString('vi-VN')} báo cáo · Trang {page}/{totalPages}</span>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page >= totalPages}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-3xl border-zinc-800 bg-zinc-900 text-zinc-100">
          <DialogHeader>
            <DialogTitle>Chi tiết báo cáo</DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
              <div className="space-y-3">
                <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                  <p className="text-xs font-medium text-zinc-400">Nội dung học sinh báo</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-100">{selected.description}</p>
                </div>

                <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                  <p className="text-xs font-medium text-zinc-400">Câu hỏi</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-100">{selected.question?.question_text ?? 'Không tìm thấy nội dung câu hỏi.'}</p>
                  <div className="mt-3 grid gap-2 text-xs text-zinc-400 sm:grid-cols-2">
                    <p>Loại: <span className="text-zinc-200">{selected.question?.question_type ?? '—'}</span></p>
                    <p>Chủ đề: <span className="text-zinc-200">{questionTopic(selected.question)}</span></p>
                    <p>Đáp án MC: <span className="font-mono text-emerald-300">{selected.question?.correct_answer ?? '—'}</span></p>
                    <p>Đáp số: <span className="font-mono text-emerald-300">{selected.question?.numeric_answer ?? '—'}</span></p>
                  </div>
                </div>

                {selected.question?.explanation && (
                  <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                    <p className="text-xs font-medium text-zinc-400">Lời giải hiện tại</p>
                    <p className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap text-xs leading-relaxed text-zinc-300">{selected.question.explanation}</p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs">
                  <p className="font-medium text-zinc-300">Ngữ cảnh</p>
                  <div className="mt-2 space-y-1.5 text-zinc-400">
                    <p>Loại lỗi: <span className="text-zinc-200">{ISSUE_LABEL[selected.issue_type] ?? selected.issue_type}</span></p>
                    <p>Đề: <span className="text-zinc-200">{selected.examSet?.title ?? '—'}</span></p>
                    <p>Câu: <span className="text-zinc-200">{selected.examQuestion?.question_number ?? selected.examQuestion?.display_order ?? '—'}</span></p>
                    <p>Nguồn: <span className="text-zinc-200">{selected.source}</span></p>
                    <p>Gửi lúc: <span className="text-zinc-200">{formatDate(selected.created_at)}</span></p>
                    <p>Học sinh: <span className="text-zinc-200">{selected.user?.email ?? selected.user_id}</span></p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-400">Trạng thái xử lý</label>
                  <select
                    value={nextStatus}
                    onChange={(event) => setNextStatus(event.target.value as ReportStatus)}
                    className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
                  >
                    {statusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-400">Ghi chú admin</label>
                  <Textarea
                    value={adminNote}
                    onChange={(event) => setAdminNote(event.target.value)}
                    rows={6}
                    placeholder="VD: Đã sửa đáp án từ B sang C, cần kiểm tra lại lời giải..."
                    className="border-zinc-700 bg-zinc-950 text-sm text-zinc-100 placeholder:text-zinc-500"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => selected && updateReport('reviewing')} disabled={saving || !selected || selected.status === 'reviewing'}>
              Đang xử lý
            </Button>
            <Button variant="outline" onClick={() => selected && updateReport('rejected')} disabled={saving || !selected}>
              Bỏ qua
            </Button>
            <Button onClick={() => updateReport(nextStatus)} disabled={saving || !selected}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Lưu xử lý
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
