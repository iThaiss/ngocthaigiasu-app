'use client'

import { type ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle, BookOpenCheck, CheckCircle2, ChevronLeft, ChevronRight, Edit3,
  Eye, FileStack, ImageOff, Loader2, RefreshCw, Search, SlidersHorizontal, Upload,
} from 'lucide-react'
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { formatDate } from '@/lib/utils'

type ExamStatus = 'ready' | 'draft' | 'reviewing' | 'disabled' | 'archived'

interface ExamSection {
  id: string
  section_code: string
  title: string
  question_type: string
  section_order: number
  expected_count: number
  extracted_count: number
  max_score: number
  scoring_rule: Record<string, unknown> | null
}

interface StandardQuestion {
  id: string
  question_type?: string | null
  question_text?: string | null
  correct_answer?: string | null
  numeric_answer?: string | number | null
  explanation?: string | null
  topic?: string | null
  subtopic?: string | null
  canonical_topic_title?: string | null
  canonical_subtopic_title?: string | null
  difficulty?: string | null
  needs_visual?: boolean | null
  image_url?: string | null
}

interface ExamQuestion {
  id: string
  section_code: string
  question_number: number | null
  display_order: number
  page_number: number | null
  max_score: number
  question_id: string
  questions: StandardQuestion | null
}

interface ExamSet {
  id: string
  title: string
  subject: string | null
  exam_type: string | null
  source_file: string | null
  exam_index: number | null
  expected_question_count: number | null
  expected_item_count: number | null
  extracted_question_count: number | null
  max_score: number | null
  status: ExamStatus
  audit_json: Record<string, unknown> | null
  created_at: string
  sections: ExamSection[]
  reportCounts: { total: number; open: number }
}

interface FilterOption {
  value: string
  count: number
}

const STATUS_LABEL: Record<string, string> = {
  ready: 'Đang mở',
  draft: 'Nháp',
  reviewing: 'Cần duyệt',
  disabled: 'Tạm ẩn',
  archived: 'Lưu trữ',
}

const STATUS_CLASS: Record<string, string> = {
  ready: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  draft: 'border-zinc-600 bg-zinc-800 text-zinc-300',
  reviewing: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  disabled: 'border-red-500/30 bg-red-500/10 text-red-300',
  archived: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
}

const EXAM_TYPE_LABEL: Record<string, string> = {
  thpt_graduation_standard: 'Luyện đề chuẩn',
  '8_plus': 'Đề 8+',
  '9_plus': 'Đề 9+',
  school_collection: 'Tổng hợp đề trường sở',
  midterm: 'Đề giữa kì',
  final: 'Đề cuối kì',
}

const QUESTION_TYPE_LABEL: Record<string, string> = {
  multiple_choice: 'Trắc nghiệm',
  true_false: 'Đúng/Sai',
  short_answer: 'Trả lời ngắn',
}

function statusClass(status: string) {
  return STATUS_CLASS[status] ?? 'border-zinc-700 bg-zinc-800 text-zinc-300'
}

function examTypeLabel(value: string | null) {
  if (!value) return 'Chưa phân loại'
  return EXAM_TYPE_LABEL[value] ?? value
}

function sourceName(sourceFile: string | null) {
  if (!sourceFile) return '—'
  return sourceFile.split(/[\\/]/).pop() ?? sourceFile
}

function auditValue(audit: Record<string, unknown> | null, key: string) {
  const value = audit?.[key]
  return typeof value === 'number' || typeof value === 'string' ? value : null
}

function questionTopic(question: StandardQuestion | null) {
  return question?.canonical_topic_title ?? question?.topic ?? 'Chưa phân loại'
}

export default function AdminStandardExamsPage() {
  const { toast } = useToast()
  const [examSets, setExamSets] = useState<ExamSet[]>([])
  const [selectedExam, setSelectedExam] = useState<ExamSet | null>(null)
  const [questions, setQuestions] = useState<ExamQuestion[]>([])
  const [examTypes, setExamTypes] = useState<FilterOption[]>([])
  const [statuses, setStatuses] = useState<FilterOption[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [editExam, setEditExam] = useState<ExamSet | null>(null)
  const [editForm, setEditForm] = useState({
    title: '',
    exam_type: '',
    subject: '',
    status: 'ready',
    exam_index: '',
    max_score: '',
  })
  const [saving, setSaving] = useState(false)
  const [editQuestion, setEditQuestion] = useState<ExamQuestion | null>(null)
  const [questionForm, setQuestionForm] = useState({
    question_text: '',
    correct_answer: '',
    numeric_answer: '',
    explanation: '',
    topic: '',
    subtopic: '',
    difficulty: '',
  })
  const [savingQuestion, setSavingQuestion] = useState(false)
  const [activeImageQuestionId, setActiveImageQuestionId] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState<string | null>(null)
  const [clearingVisual, setClearingVisual] = useState<string | null>(null)
  const [cropFile, setCropFile] = useState<File | null>(null)
  const [cropImageUrl, setCropImageUrl] = useState<string | null>(null)
  const [cropFromExisting, setCropFromExisting] = useState(false)
  const [crop, setCrop] = useState<Crop>({ unit: '%', x: 10, y: 10, width: 80, height: 80 })
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  const fetchExams = useCallback(async (detailId?: string) => {
    setLoading(!detailId)
    setDetailLoading(Boolean(detailId))
    try {
      const params = new URLSearchParams({
        page: String(page),
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        ...(typeFilter && { examType: typeFilter }),
        ...(detailId && { id: detailId }),
      })
      const res = await fetch(`/api/admin/standard-exams?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to fetch exams')
      if (!detailId) {
        setExamSets(data.examSets ?? [])
        setTotal(data.total ?? 0)
        setTotalPages(data.totalPages ?? 1)
        setExamTypes(data.filters?.examTypes ?? [])
        setStatuses(data.filters?.statuses ?? [])
      }
      if (detailId) {
        setQuestions(data.selectedDetails?.questions ?? [])
        const fresh = (data.examSets ?? [])[0]
        if (fresh) setSelectedExam(fresh)
      }
    } catch {
      toast({ title: 'Không tải được bộ đề chuẩn', variant: 'destructive' })
    } finally {
      setLoading(false)
      setDetailLoading(false)
    }
  }, [page, search, statusFilter, toast, typeFilter])

  useEffect(() => { fetchExams() }, [fetchExams])

  const readyCount = useMemo(() => statuses.find((item) => item.value === 'ready')?.count ?? 0, [statuses])
  const hiddenCount = useMemo(() => statuses.filter((item) => item.value !== 'ready').reduce((sum, item) => sum + item.count, 0), [statuses])

  function openEdit(exam: ExamSet) {
    setEditExam(exam)
    setEditForm({
      title: exam.title ?? '',
      exam_type: exam.exam_type ?? '',
      subject: exam.subject ?? 'math',
      status: exam.status ?? 'ready',
      exam_index: exam.exam_index ? String(exam.exam_index) : '',
      max_score: exam.max_score ? String(exam.max_score) : '',
    })
  }

  async function saveExam() {
    if (!editExam) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/standard-exams', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editExam.id,
          title: editForm.title,
          exam_type: editForm.exam_type,
          subject: editForm.subject,
          status: editForm.status,
          exam_index: editForm.exam_index ? Number(editForm.exam_index) : null,
          max_score: editForm.max_score ? Number(editForm.max_score) : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to update exam')
      toast({ title: 'Đã cập nhật bộ đề chuẩn' })
      setEditExam(null)
      fetchExams()
      if (selectedExam?.id === editExam.id) fetchExams(editExam.id)
    } catch {
      toast({ title: 'Không cập nhật được bộ đề', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  async function openDetails(exam: ExamSet) {
    setSelectedExam(exam)
    setQuestions([])
    await fetchExams(exam.id)
  }

  function openQuestionEdit(question: ExamQuestion) {
    setEditQuestion(question)
    setQuestionForm({
      question_text: question.questions?.question_text ?? '',
      correct_answer: question.questions?.correct_answer ?? '',
      numeric_answer: question.questions?.numeric_answer ? String(question.questions.numeric_answer) : '',
      explanation: question.questions?.explanation ?? '',
      topic: question.questions?.topic ?? '',
      subtopic: question.questions?.subtopic ?? '',
      difficulty: question.questions?.difficulty ?? '',
    })
  }

  async function saveQuestion() {
    if (!editQuestion?.questions?.id) return
    setSavingQuestion(true)
    try {
      const res = await fetch('/api/admin/standard-exams/questions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editQuestion.questions.id,
          question_text: questionForm.question_text,
          correct_answer: questionForm.correct_answer,
          numeric_answer: questionForm.numeric_answer,
          explanation: questionForm.explanation,
          topic: questionForm.topic,
          subtopic: questionForm.subtopic,
          difficulty: questionForm.difficulty,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      toast({ title: 'Đã sửa câu hỏi chuẩn' })
      setEditQuestion(null)
      if (selectedExam) fetchExams(selectedExam.id)
    } catch {
      toast({ title: 'Không sửa được câu hỏi', variant: 'destructive' })
    } finally {
      setSavingQuestion(false)
    }
  }

  function triggerImageUpload(questionId: string) {
    setActiveImageQuestionId(questionId)
    fileInputRef.current?.click()
  }

  function handleImageFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !activeImageQuestionId) return
    if (!file.type.startsWith('image/')) {
      toast({ title: 'File không phải hình ảnh', variant: 'destructive' })
      return
    }
    if (cropImageUrl && !cropFromExisting) URL.revokeObjectURL(cropImageUrl)
    setCropFile(file)
    setCropImageUrl(URL.createObjectURL(file))
    setCropFromExisting(false)
    setCompletedCrop(null)
    setCrop({ unit: '%', x: 10, y: 10, width: 80, height: 80 })
  }

  function cropExistingQuestion(question: StandardQuestion | null) {
    if (!question?.id || !question.image_url) return
    if (cropImageUrl && !cropFromExisting) URL.revokeObjectURL(cropImageUrl)
    setActiveImageQuestionId(question.id)
    setCropFile(null)
    setCropImageUrl(`/api/admin/questions/upload-image?url=${encodeURIComponent(question.image_url)}`)
    setCropFromExisting(true)
    setCompletedCrop(null)
    setCrop({ unit: '%', x: 10, y: 10, width: 80, height: 80 })
  }

  async function buildCroppedFile() {
    const image = imgRef.current
    if (!image) return cropFile
    const width = completedCrop?.width || image.naturalWidth
    const height = completedCrop?.height || image.naturalHeight
    const x = completedCrop?.x || 0
    const y = completedCrop?.y || 0
    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(width * scaleX))
    canvas.height = Math.max(1, Math.round(height * scaleY))
    const ctx = canvas.getContext('2d')
    if (!ctx) return cropFile
    ctx.drawImage(image, x * scaleX, y * scaleY, width * scaleX, height * scaleY, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9))
    return blob ? new File([blob], `standard-question-${activeImageQuestionId}.jpg`, { type: 'image/jpeg' }) : cropFile
  }

  async function uploadCroppedImage(useOriginal = false) {
    if (!activeImageQuestionId || (!cropFile && useOriginal)) return
    setUploadingImage(activeImageQuestionId)
    try {
      const file = useOriginal ? cropFile : await buildCroppedFile()
      if (!file) throw new Error('crop failed')
      const fd = new FormData()
      fd.append('file', file)
      fd.append('questionId', activeImageQuestionId)
      const res = await fetch('/api/admin/standard-exams/questions/upload-image', { method: 'POST', body: fd })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error ?? 'Upload failed')
      toast({ title: 'Đã upload hình câu chuẩn' })
      closeCropDialog()
      if (selectedExam) fetchExams(selectedExam.id)
    } catch (error) {
      toast({
        title: 'Lỗi upload hình',
        description: error instanceof Error ? error.message : 'Không upload được ảnh',
        variant: 'destructive',
      })
    } finally {
      setUploadingImage(null)
    }
  }

  async function markQuestionNoVisual(question: StandardQuestion | null) {
    if (!question?.id) return
    setClearingVisual(question.id)
    try {
      const res = await fetch('/api/admin/standard-exams/questions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: question.id, image_url: null, needs_visual: false }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error ?? 'Failed')
      setQuestions((current) => current.map((item) => item.questions?.id === question.id
        ? { ...item, questions: item.questions ? { ...item.questions, image_url: null, needs_visual: false } : item.questions }
        : item))
    } catch {
      toast({ title: 'Không cập nhật được trạng thái hình', variant: 'destructive' })
    } finally {
      setClearingVisual(null)
    }
  }

  function closeCropDialog() {
    if (cropImageUrl && !cropFromExisting) URL.revokeObjectURL(cropImageUrl)
    setCropImageUrl(null)
    setCropFile(null)
    setCropFromExisting(false)
    setActiveImageQuestionId(null)
    setCompletedCrop(null)
  }

  return (
    <div className="space-y-5">
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageFileChange} />
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Bộ đề chuẩn</h1>
          <p className="text-sm text-zinc-400">Điều khiển các đề đang xuất hiện trong khu vực luyện đề chuẩn.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchExams()} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Tải lại
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <div className="flex items-center gap-2 text-zinc-400">
            <FileStack className="h-4 w-4 text-blue-300" />
            <span className="text-sm">Tổng bộ đề</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-zinc-100">{total.toLocaleString('vi-VN')}</p>
        </div>
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4">
          <div className="flex items-center gap-2 text-emerald-300">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm">Đang mở cho học sinh</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-200">{readyCount.toLocaleString('vi-VN')}</p>
        </div>
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4">
          <div className="flex items-center gap-2 text-amber-300">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Nháp / ẩn / cần duyệt</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-200">{hiddenCount.toLocaleString('vi-VN')}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-60 flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
          <Input
            value={search}
            onChange={(event) => { setSearch(event.target.value); setPage(1) }}
            placeholder="Tìm tên đề, dạng đề, file nguồn..."
            className="border-zinc-700 bg-zinc-900 pl-8 text-zinc-100 placeholder:text-zinc-500"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(event) => { setTypeFilter(event.target.value); setPage(1) }}
          className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
        >
          <option value="">Tất cả dạng đề</option>
          {examTypes.map((item) => (
            <option key={item.value} value={item.value}>{examTypeLabel(item.value)} ({item.count})</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(event) => { setStatusFilter(event.target.value); setPage(1) }}
          className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
        >
          <option value="">Tất cả trạng thái</option>
          {statuses.map((item) => (
            <option key={item.value} value={item.value}>{STATUS_LABEL[item.value] ?? item.value} ({item.count})</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-xs text-zinc-400">
              <th className="px-3 py-2.5 text-left font-medium">Bộ đề</th>
              <th className="px-3 py-2.5 text-left font-medium">Dạng</th>
              <th className="px-3 py-2.5 text-center font-medium">Câu / item</th>
              <th className="px-3 py-2.5 text-center font-medium">Thang điểm</th>
              <th className="px-3 py-2.5 text-center font-medium">Báo lỗi</th>
              <th className="px-3 py-2.5 text-center font-medium">Trạng thái</th>
              <th className="px-3 py-2.5 text-center font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin text-zinc-500" />
                </td>
              </tr>
            ) : examSets.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-zinc-500">Chưa có bộ đề phù hợp</td>
              </tr>
            ) : examSets.map((exam) => (
              <tr key={exam.id} className="transition-colors hover:bg-zinc-800/35">
                <td className="px-3 py-3 align-top">
                  <p className="max-w-md truncate font-medium text-zinc-100">{exam.title}</p>
                  <p className="mt-1 max-w-md truncate text-[11px] text-zinc-500">{sourceName(exam.source_file)}</p>
                  <p className="mt-1 text-[11px] text-zinc-500">{formatDate(exam.created_at)}</p>
                </td>
                <td className="px-3 py-3 align-top">
                  <p className="text-xs text-zinc-200">{examTypeLabel(exam.exam_type)}</p>
                  <p className="mt-1 text-[11px] text-zinc-500">#{exam.exam_index ?? '—'} · {exam.subject ?? 'math'}</p>
                </td>
                <td className="px-3 py-3 text-center align-top">
                  <p className="font-mono text-xs text-zinc-200">{exam.extracted_question_count ?? '—'} / {exam.expected_question_count ?? '—'}</p>
                  <p className="mt-1 text-[11px] text-zinc-500">item {auditValue(exam.audit_json, 'extracted_item_count') ?? exam.expected_item_count ?? '—'}</p>
                </td>
                <td className="px-3 py-3 text-center align-top">
                  <p className="font-mono text-xs text-emerald-300">{exam.max_score ?? '—'}</p>
                  <p className="mt-1 text-[11px] text-zinc-500">{exam.sections.length} phần</p>
                </td>
                <td className="px-3 py-3 text-center align-top">
                  <p className={exam.reportCounts.open > 0 ? 'font-semibold text-red-300' : 'text-zinc-300'}>{exam.reportCounts.open}</p>
                  <p className="text-[11px] text-zinc-500">/{exam.reportCounts.total}</p>
                </td>
                <td className="px-3 py-3 text-center align-top">
                  <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${statusClass(exam.status)}`}>
                    {STATUS_LABEL[exam.status] ?? exam.status}
                  </span>
                </td>
                <td className="px-3 py-3 text-center align-top">
                  <div className="flex justify-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => openDetails(exam)}>
                      <Eye className="mr-1.5 h-3.5 w-3.5" />
                      Xem
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => openEdit(exam)}>
                      <Edit3 className="mr-1.5 h-3.5 w-3.5" />
                      Sửa
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-zinc-400">
        <span>Trang {page}/{totalPages}</span>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page >= totalPages}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Dialog open={!!editExam} onOpenChange={(open) => !open && setEditExam(null)}>
        <DialogContent className="max-w-lg border-zinc-800 bg-zinc-900 text-zinc-100">
          <DialogHeader>
            <DialogTitle>Sửa bộ đề chuẩn</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400">Tên bộ đề</label>
              <Input value={editForm.title} onChange={(event) => setEditForm((form) => ({ ...form, title: event.target.value }))} className="border-zinc-700 bg-zinc-950 text-zinc-100" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400">Dạng đề</label>
                <Input value={editForm.exam_type} onChange={(event) => setEditForm((form) => ({ ...form, exam_type: event.target.value }))} placeholder="VD: 8_plus" className="border-zinc-700 bg-zinc-950 text-zinc-100 placeholder:text-zinc-500" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400">Môn</label>
                <Input value={editForm.subject} onChange={(event) => setEditForm((form) => ({ ...form, subject: event.target.value }))} className="border-zinc-700 bg-zinc-950 text-zinc-100" />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400">Số thứ tự</label>
                <Input type="number" value={editForm.exam_index} onChange={(event) => setEditForm((form) => ({ ...form, exam_index: event.target.value }))} className="border-zinc-700 bg-zinc-950 text-zinc-100" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400">Điểm tối đa</label>
                <Input type="number" value={editForm.max_score} onChange={(event) => setEditForm((form) => ({ ...form, max_score: event.target.value }))} className="border-zinc-700 bg-zinc-950 text-zinc-100" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400">Trạng thái</label>
                <select
                  value={editForm.status}
                  onChange={(event) => setEditForm((form) => ({ ...form, status: event.target.value }))}
                  className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100"
                >
                  <option value="ready">Đang mở</option>
                  <option value="draft">Nháp</option>
                  <option value="reviewing">Cần duyệt</option>
                  <option value="disabled">Tạm ẩn</option>
                  <option value="archived">Lưu trữ</option>
                </select>
              </div>
            </div>
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-100">
              Chỉ bộ đề có trạng thái <span className="font-semibold">Đang mở</span> mới xuất hiện cho học sinh trong `/exam`.
            </div>
          </div>

          <DialogFooter>
            <Button onClick={saveExam} disabled={saving || !editForm.title.trim()}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedExam} onOpenChange={(open) => !open && setSelectedExam(null)}>
        <DialogContent className="max-w-5xl border-zinc-800 bg-zinc-900 text-zinc-100">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpenCheck className="h-5 w-5 text-emerald-300" />
              {selectedExam?.title ?? 'Chi tiết bộ đề'}
            </DialogTitle>
          </DialogHeader>

          {selectedExam && (
            <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
              <div className="space-y-3">
                <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs">
                  <p className="font-medium text-zinc-300">Thông tin</p>
                  <div className="mt-2 space-y-1.5 text-zinc-400">
                    <p>Dạng: <span className="text-zinc-200">{examTypeLabel(selectedExam.exam_type)}</span></p>
                    <p>Trạng thái: <span className="text-zinc-200">{STATUS_LABEL[selectedExam.status] ?? selectedExam.status}</span></p>
                    <p>Điểm: <span className="text-zinc-200">{selectedExam.max_score ?? '—'}</span></p>
                    <p>Câu: <span className="text-zinc-200">{selectedExam.extracted_question_count ?? '—'} / {selectedExam.expected_question_count ?? '—'}</span></p>
                    <p>Báo lỗi mở: <span className="text-red-300">{selectedExam.reportCounts.open}</span></p>
                  </div>
                </div>

                <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs">
                  <p className="font-medium text-zinc-300">Cấu trúc phần</p>
                  <div className="mt-2 space-y-2">
                    {selectedExam.sections.map((section) => (
                      <div key={section.id} className="rounded-md bg-zinc-900 p-2">
                        <p className="font-medium text-zinc-200">{section.section_code} · {QUESTION_TYPE_LABEL[section.question_type] ?? section.question_type}</p>
                        <p className="mt-1 text-zinc-500">{section.extracted_count}/{section.expected_count} câu · {section.max_score} điểm</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="min-h-80 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
                <div className="flex items-center gap-2 border-b border-zinc-800 px-3 py-2 text-xs text-zinc-400">
                  <SlidersHorizontal className="h-4 w-4" />
                  Danh sách câu trong đề
                </div>
                {detailLoading ? (
                  <div className="flex h-80 items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
                  </div>
                ) : (
                  <div className="max-h-[520px] overflow-y-auto divide-y divide-zinc-800/70">
                    {questions.length === 0 ? (
                      <p className="p-6 text-center text-sm text-zinc-500">Không có dữ liệu câu hỏi.</p>
                    ) : questions.map((question) => (
                      <div key={question.id} className="p-3">
                        <div className="mb-1 flex items-center justify-between gap-3">
                          <p className="text-xs font-medium text-zinc-300">
                            {question.section_code} · Câu {question.question_number ?? question.display_order} · {question.max_score} điểm
                          </p>
                          {question.questions?.needs_visual && <span className="rounded-full bg-orange-500/10 px-2 py-0.5 text-[11px] text-orange-300">có hình</span>}
                        </div>
                        <p className="line-clamp-2 text-xs leading-relaxed text-zinc-100">{question.questions?.question_text ?? 'Không tìm thấy nội dung câu hỏi'}</p>
                        <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-zinc-500">
                          <span>{QUESTION_TYPE_LABEL[question.questions?.question_type ?? ''] ?? question.questions?.question_type ?? '—'}</span>
                          <span>·</span>
                          <span>{questionTopic(question.questions)}</span>
                          <span>·</span>
                          <span>Đáp án: <span className="font-mono text-emerald-300">{question.questions?.correct_answer ?? question.questions?.numeric_answer ?? '—'}</span></span>
                          <button onClick={() => openQuestionEdit(question)} className="ml-auto text-primary hover:underline">Sửa nhanh</button>
                        </div>
                        {question.questions?.image_url && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={question.questions.image_url} alt="Hình câu chuẩn" className="mt-2 max-h-40 rounded-lg border border-zinc-800 bg-zinc-900 object-contain" />
                        )}
                        <div className="mt-2 flex flex-wrap gap-2">
                          {question.questions?.image_url && (
                            <Button size="sm" variant="outline" onClick={() => cropExistingQuestion(question.questions)} disabled={uploadingImage === question.questions?.id || clearingVisual === question.questions?.id}>
                              Crop ảnh
                            </Button>
                          )}
                          <Button size="sm" variant="outline" onClick={() => question.questions?.id && triggerImageUpload(question.questions.id)} disabled={!question.questions?.id || uploadingImage === question.questions?.id || clearingVisual === question.questions?.id}>
                            {uploadingImage === question.questions?.id ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Upload className="mr-2 h-3.5 w-3.5" />}
                            Upload ảnh
                          </Button>
                          <Button size="sm" variant="outline" className="border-orange-900/60 text-orange-300 hover:bg-orange-950/40" onClick={() => markQuestionNoVisual(question.questions)} disabled={!question.questions?.id || uploadingImage === question.questions?.id || clearingVisual === question.questions?.id}>
                            {clearingVisual === question.questions?.id ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <ImageOff className="mr-2 h-3.5 w-3.5" />}
                            Không cần hình
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!cropImageUrl} onOpenChange={(open) => !open && closeCropDialog()}>
        <DialogContent className="max-w-4xl border-zinc-800 bg-zinc-900 text-zinc-100">
          <DialogHeader>
            <DialogTitle>Crop ảnh câu chuẩn</DialogTitle>
          </DialogHeader>
          {cropImageUrl && (
            <div className="space-y-3">
              <p className="text-sm text-zinc-400">Kéo chuột để khoanh đúng vùng hình cần giữ lại.</p>
              <div className="flex justify-center overflow-hidden max-w-full rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                <ReactCrop
                  crop={crop}
                  onChange={(nextCrop) => setCrop(nextCrop)}
                  onComplete={(nextCrop) => setCompletedCrop(nextCrop)}
                  className="max-w-full"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    ref={imgRef}
                    src={cropImageUrl}
                    alt="Crop ảnh câu chuẩn"
                    className="w-full h-auto max-h-[60vh] object-contain"
                    style={{ maxHeight: '60vh', maxWidth: '100%', height: 'auto', display: 'block' }}
                    crossOrigin="anonymous"
                  />
                </ReactCrop>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            {cropFile && (
              <Button variant="outline" onClick={() => uploadCroppedImage(true)} disabled={!activeImageQuestionId || uploadingImage === activeImageQuestionId}>
                Dùng ảnh gốc
              </Button>
            )}
            <Button onClick={() => uploadCroppedImage(false)} disabled={!activeImageQuestionId || uploadingImage === activeImageQuestionId}>
              {activeImageQuestionId && uploadingImage === activeImageQuestionId && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Upload ảnh đã crop
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editQuestion} onOpenChange={(open) => !open && setEditQuestion(null)}>
        <DialogContent className="max-w-2xl border-zinc-800 bg-zinc-900 text-zinc-100">
          <DialogHeader>
            <DialogTitle>Sửa nhanh câu chuẩn</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400">Nội dung câu hỏi</label>
              <textarea
                value={questionForm.question_text}
                onChange={(event) => setQuestionForm((form) => ({ ...form, question_text: event.target.value }))}
                rows={5}
                className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400">Đáp án MC</label>
                <Input value={questionForm.correct_answer} onChange={(event) => setQuestionForm((form) => ({ ...form, correct_answer: event.target.value }))} className="border-zinc-700 bg-zinc-950 text-zinc-100" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400">Đáp số</label>
                <Input value={questionForm.numeric_answer} onChange={(event) => setQuestionForm((form) => ({ ...form, numeric_answer: event.target.value }))} className="border-zinc-700 bg-zinc-950 text-zinc-100" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400">Độ khó</label>
                <Input value={questionForm.difficulty} onChange={(event) => setQuestionForm((form) => ({ ...form, difficulty: event.target.value }))} className="border-zinc-700 bg-zinc-950 text-zinc-100" />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400">Chủ đề</label>
                <Input value={questionForm.topic} onChange={(event) => setQuestionForm((form) => ({ ...form, topic: event.target.value }))} className="border-zinc-700 bg-zinc-950 text-zinc-100" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400">Dạng bài</label>
                <Input value={questionForm.subtopic} onChange={(event) => setQuestionForm((form) => ({ ...form, subtopic: event.target.value }))} className="border-zinc-700 bg-zinc-950 text-zinc-100" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400">Lời giải</label>
              <textarea
                value={questionForm.explanation}
                onChange={(event) => setQuestionForm((form) => ({ ...form, explanation: event.target.value }))}
                rows={5}
                className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={saveQuestion} disabled={savingQuestion || !questionForm.question_text.trim()}>
              {savingQuestion && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Lưu câu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
