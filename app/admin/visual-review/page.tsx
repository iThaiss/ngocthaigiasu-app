'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { CheckCircle, ChevronLeft, ChevronRight, Edit3, Eye, ImageOff, Loader2, Save, Trash2, Upload } from 'lucide-react'
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'

type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer'
type Difficulty = 'Nhận biết' | 'Thông hiểu' | 'Vận dụng' | 'Vận dụng cao'

interface VisualQuestion {
  id: string
  question_text: string
  question_type: QuestionType
  topic: string | null
  subtopic: string | null
  grade: number | null
  part: string | null
  difficulty: Difficulty | null
  correct_answer: string | null
  option_a: string | null
  option_b: string | null
  option_c: string | null
  option_d: string | null
  statement_a: string | null
  statement_b: string | null
  statement_c: string | null
  statement_d: string | null
  answer_a: boolean | null
  answer_b: boolean | null
  answer_c: boolean | null
  answer_d: boolean | null
  numeric_answer: number | null
  explanation: string | null
  source: string | null
  visual_type: string | null
  visual_description: string | null
  visual_image_url: string | null
  image_url: string | null
  has_image: boolean | null
  source_file: string | null
  source_hint: string | null
  page_number: number | null
  answer_source: string | null
  needs_visual: boolean | null
  needs_review: boolean | null
  is_published: boolean | null
}

type VisualQuestionForm = Partial<VisualQuestion>

const DIFFICULTIES: Difficulty[] = ['Nhận biết', 'Thông hiểu', 'Vận dụng', 'Vận dụng cao']

const VISUAL_TYPE_LABEL: Record<string, string> = {
  bang_bien_thien: 'Bảng biến thiên',
  do_thi: 'Đồ thị',
  hinh_khong_gian: 'Hình không gian',
  bang_so_lieu: 'Bảng số liệu',
  so_do_cay: 'Sơ đồ cây',
}

const QUESTION_TYPE_LABEL: Record<string, string> = {
  multiple_choice: 'Trắc nghiệm',
  true_false: 'Đúng/Sai',
  short_answer: 'Trả lời ngắn',
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
  const [deletingImage, setDeletingImage] = useState<string | null>(null)
  const [deletingQuestion, setDeletingQuestion] = useState<string | null>(null)
  const [activeUploadId, setActiveUploadId] = useState<string | null>(null)
  const [editingQuestion, setEditingQuestion] = useState<VisualQuestion | null>(null)
  const [editForm, setEditForm] = useState<VisualQuestionForm>({})
  const [savingQuestion, setSavingQuestion] = useState(false)
  const [cropFile, setCropFile] = useState<File | null>(null)
  const [cropImageUrl, setCropImageUrl] = useState<string | null>(null)
  const [cropFromExisting, setCropFromExisting] = useState(false)
  const [crop, setCrop] = useState<Crop>({ unit: '%', x: 10, y: 10, width: 80, height: 80 })
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

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

  function openEdit(question: VisualQuestion) {
    setEditingQuestion(question)
    setEditForm({
      question_text: question.question_text,
      question_type: question.question_type,
      topic: question.topic,
      subtopic: question.subtopic,
      grade: question.grade,
      part: question.part,
      difficulty: question.difficulty,
      correct_answer: question.correct_answer,
      option_a: question.option_a,
      option_b: question.option_b,
      option_c: question.option_c,
      option_d: question.option_d,
      statement_a: question.statement_a,
      statement_b: question.statement_b,
      statement_c: question.statement_c,
      statement_d: question.statement_d,
      answer_a: question.answer_a,
      answer_b: question.answer_b,
      answer_c: question.answer_c,
      answer_d: question.answer_d,
      numeric_answer: question.numeric_answer,
      explanation: question.explanation,
      source: question.source,
      visual_type: question.visual_type,
      visual_description: question.visual_description,
      source_file: question.source_file,
      source_hint: question.source_hint,
      page_number: question.page_number,
      needs_visual: question.needs_visual ?? true,
      needs_review: question.needs_review ?? false,
      is_published: question.is_published ?? false,
      answer_source: question.answer_source,
    })
  }

  async function saveQuestion() {
    if (!editingQuestion) return
    setSavingQuestion(true)
    try {
      const res = await fetch(`/api/admin/questions/${editingQuestion.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error ?? 'Không lưu được câu hỏi')
      toast({ title: '✓ Đã lưu', duration: 1500 })
      // Optimistic: update question in list, no refetch
      setQuestions((current) => current.map((q) => q.id === editingQuestion.id ? { ...q, ...editForm } : q))
      setEditingQuestion(null)
    } catch (error) {
      toast({
        title: 'Lỗi khi lưu câu hỏi',
        description: error instanceof Error ? error.message : 'Không lưu được câu hỏi',
        variant: 'destructive',
      })
    } finally {
      setSavingQuestion(false)
    }
  }

  function cropExisting(question: VisualQuestion) {
    if (!question.visual_image_url) return
    if (cropImageUrl && !cropFromExisting) URL.revokeObjectURL(cropImageUrl)
    setActiveUploadId(question.id)
    setCropFile(null)
    setCropFromExisting(true)
    setCropImageUrl(`/api/admin/questions/upload-image?url=${encodeURIComponent(question.visual_image_url)}`)
    setCrop({ unit: '%', x: 10, y: 10, width: 80, height: 80 })
    setCompletedCrop(null)
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file || !activeUploadId) return
    event.target.value = ''
    if (cropImageUrl && !cropFromExisting) URL.revokeObjectURL(cropImageUrl)
    setCropFile(file)
    setCropFromExisting(false)
    setCropImageUrl(URL.createObjectURL(file))
    setCrop({ unit: '%', x: 10, y: 10, width: 80, height: 80 })
    setCompletedCrop(null)
  }

  async function buildCroppedFile() {
    if (!imgRef.current) return null
    const image = imgRef.current
    const fallbackCrop = {
      x: image.width * 0.1,
      y: image.height * 0.1,
      width: image.width * 0.8,
      height: image.height * 0.8,
    }
    const activeCrop = completedCrop && completedCrop.width > 0 && completedCrop.height > 0
      ? completedCrop
      : fallbackCrop
    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height
    const sx = Math.round(activeCrop.x * scaleX)
    const sy = Math.round(activeCrop.y * scaleY)
    const sw = Math.round(activeCrop.width * scaleX)
    const sh = Math.round(activeCrop.height * scaleY)
    const maxSide = 1800
    const scale = Math.min(1, maxSide / Math.max(sw, sh))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(sw * scale))
    canvas.height = Math.max(1, Math.round(sh * scale))
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(image, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height)

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.88))
    if (!blob) return null
    return new File([blob], `${activeUploadId ?? 'question'}-crop.jpg`, { type: 'image/jpeg' })
  }

  async function uploadCrop(useOriginal = false) {
    if (!activeUploadId || (!cropFile && useOriginal)) return
    const uploadingId = activeUploadId
    setUploading(uploadingId)
    try {
      const file = useOriginal ? cropFile : await buildCroppedFile()
      if (!file) throw new Error('crop failed')
      const fd = new FormData()
      fd.append('file', file)
      fd.append('questionId', uploadingId)
      const res = await fetch('/api/admin/questions/upload-image', { method: 'POST', body: fd })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error ?? 'Upload failed')
      // Optimistic: remove from list immediately, update count — no refetch needed
      setQuestions((current) => current.filter((q) => q.id !== uploadingId))
      setTotal((current) => Math.max(0, current - 1))
      toast({ title: '✓ Đã lưu', duration: 1500 })
      closeCropDialog()
    } catch (error) {
      toast({
        title: 'Lỗi upload hình',
        description: error instanceof Error ? error.message : 'Không upload được ảnh đã crop',
        variant: 'destructive',
      })
    } finally {
      setUploading(null)
    }
  }

  async function deleteImage(question: VisualQuestion) {
    setDeletingImage(question.id)
    try {
      const res = await fetch(`/api/admin/questions/${question.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visual_image_url: null, image_url: null, has_image: false, needs_visual: false }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error ?? 'Không xóa được hình')
      setQuestions((current) => current.filter((item) => item.id !== question.id))
      setTotal((current) => Math.max(0, current - 1))
    } catch (error) {
      toast({
        title: 'Lỗi xóa hình',
        description: error instanceof Error ? error.message : 'Không xóa được hình',
        variant: 'destructive',
      })
    } finally {
      setDeletingImage(null)
    }
  }

  async function deleteQuestion(question: VisualQuestion) {
    const ok = window.confirm('Xóa hẳn câu hỏi này khỏi thư viện? Thao tác này không thể hoàn tác.')
    if (!ok) return

    setDeletingQuestion(question.id)
    try {
      const res = await fetch(`/api/admin/questions/${question.id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error ?? 'Không xóa được câu hỏi')
      toast({ title: 'Đã xóa câu hỏi' })
      setQuestions((current) => current.filter((item) => item.id !== question.id))
      setTotal((current) => Math.max(0, current - 1))
    } catch (error) {
      toast({
        title: 'Lỗi xóa câu hỏi',
        description: error instanceof Error ? error.message : 'Không xóa được câu hỏi',
        variant: 'destructive',
      })
    } finally {
      setDeletingQuestion(null)
    }
  }

  function closeCropDialog() {
    if (cropImageUrl && !cropFromExisting) URL.revokeObjectURL(cropImageUrl)
    setCropImageUrl(null)
    setCropFile(null)
    setCropFromExisting(false)
    setActiveUploadId(null)
    setCompletedCrop(null)
  }

  return (
    <div className="space-y-4">
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Câu cần hình ảnh</h1>
          <p className="mt-0.5 text-xs text-zinc-500">Crop trực tiếp ảnh chụp/PDF rồi upload cho câu cần hình, đồ thị, bảng biến thiên.</p>
        </div>
        <span className="text-sm text-zinc-400">{total.toLocaleString('vi-VN')} câu</span>
      </div>

      <select
        value={typeFilter}
        onChange={(event) => { setTypeFilter(event.target.value); setPage(1) }}
        className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
      >
        <option value="">Tất cả loại hình</option>
        {Object.entries(VISUAL_TYPE_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
        </div>
      ) : questions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
          <CheckCircle className="mb-3 h-10 w-10 text-green-500" />
          <p className="text-sm">Tất cả câu hỏi đã có hình ảnh.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {questions.map((question) => (
            <div key={question.id} className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-wrap gap-1.5">
                  {question.grade && <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-medium text-blue-400">Lớp {question.grade}</span>}
                  {question.part && <span className="rounded-full bg-purple-500/15 px-2 py-0.5 text-[10px] font-medium text-purple-400">Phần {question.part}</span>}
                  {question.visual_type && <span className="rounded-full bg-orange-500/15 px-2 py-0.5 text-[10px] font-medium text-orange-400">{VISUAL_TYPE_LABEL[question.visual_type] ?? question.visual_type}</span>}
                  <span className="rounded-full bg-zinc-700 px-2 py-0.5 text-[10px] text-zinc-300">{QUESTION_TYPE_LABEL[question.question_type] ?? question.question_type}</span>
                </div>
                <button
                  type="button"
                  className="rounded-md p-1 text-orange-400 transition hover:bg-orange-500/10 hover:text-orange-300 disabled:opacity-50"
                  title="Đánh dấu câu này không cần hình"
                  disabled={deletingImage === question.id || uploading === question.id || deletingQuestion === question.id}
                  onClick={() => deleteImage(question)}
                >
                  {deletingImage === question.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageOff className="h-4 w-4" />}
                </button>
              </div>

              {question.topic && (
                <p className="text-xs text-zinc-400">{question.topic}{question.subtopic ? ` › ${question.subtopic}` : ''}</p>
              )}
              <p className="line-clamp-4 text-xs leading-relaxed text-zinc-200">{question.question_text}</p>

              <div className="grid grid-cols-3 gap-2 rounded-lg border border-zinc-800 bg-zinc-950 p-2 text-[10px] text-zinc-400">
                <div>
                  <p className="text-zinc-500">Độ khó</p>
                  <p className="mt-0.5 font-medium text-zinc-200">{question.difficulty ?? 'Chưa có'}</p>
                </div>
                <div>
                  <p className="text-zinc-500">Đáp án</p>
                  <p className="mt-0.5 font-medium text-zinc-200">{question.question_type === 'short_answer' ? question.numeric_answer ?? 'Thiếu' : question.correct_answer ?? 'Thiếu'}</p>
                </div>
                <div>
                  <p className="text-zinc-500">Trạng thái</p>
                  <p className="mt-0.5 font-medium text-zinc-200">{question.is_published ? 'Published' : 'Draft'}</p>
                </div>
              </div>

              {question.visual_description && (
                <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-2.5">
                  <p className="mb-1 text-[10px] font-medium text-orange-300">Cần hình:</p>
                  <p className="text-xs leading-relaxed text-zinc-300">{question.visual_description}</p>
                </div>
              )}

              {(question.source_hint || question.source_file || question.page_number) && (
                <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-2 text-[10px] text-zinc-400">
                  <p className="font-medium text-zinc-300">Nguồn để chụp lại ảnh</p>
                  {question.source_file && <p className="mt-1 break-all">File: {question.source_file}</p>}
                  {question.page_number && <p>Trang: {question.page_number}</p>}
                  {question.source_hint && <p>Gợi ý: {question.source_hint}</p>}
                  {question.source_file && (
                    <button
                      type="button"
                      className="mt-1 text-primary hover:underline"
                      onClick={() => {
                        navigator.clipboard?.writeText(`${question.source_file}${question.page_number ? ` - trang ${question.page_number}` : ''}`)
                        toast({ title: 'Đã copy thông tin nguồn' })
                      }}
                    >
                      Copy nguồn
                    </button>
                  )}
                </div>
              )}

              {question.visual_image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={question.visual_image_url} alt="Visual" className="max-h-32 rounded-lg border border-zinc-700 bg-zinc-800 object-contain" />
              )}

              <div className="mt-auto grid gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className="w-full"
                  disabled={uploading === question.id || deletingImage === question.id || deletingQuestion === question.id}
                  onClick={() => openEdit(question)}
                >
                  <Edit3 className="mr-2 h-3.5 w-3.5" />
                  Sửa chi tiết câu hỏi
                </Button>
                {question.visual_image_url ? (
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      disabled={uploading === question.id || deletingImage === question.id || deletingQuestion === question.id}
                      onClick={() => cropExisting(question)}
                    >
                      Crop ảnh hiện tại
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full border-red-900/60 text-red-300 hover:bg-red-950/40"
                      disabled={deletingImage === question.id || uploading === question.id || deletingQuestion === question.id}
                      onClick={() => deleteImage(question)}
                    >
                      {deletingImage === question.id ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <ImageOff className="mr-2 h-3.5 w-3.5" />}
                      Không cần hình
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full border-orange-900/60 text-orange-300 hover:bg-orange-950/40"
                    disabled={deletingImage === question.id || uploading === question.id || deletingQuestion === question.id}
                    onClick={() => deleteImage(question)}
                  >
                    {deletingImage === question.id ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <ImageOff className="mr-2 h-3.5 w-3.5" />}
                    Không cần hình
                  </Button>
                )}
                <Button
                  size="sm"
                  variant={question.visual_image_url ? 'outline' : 'default'}
                  className="w-full"
                  disabled={uploading === question.id || deletingImage === question.id || deletingQuestion === question.id}
                  onClick={() => triggerUpload(question.id)}
                >
                  {uploading === question.id
                    ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Đang upload...</>
                    : <><Upload className="mr-2 h-3.5 w-3.5" /> Upload ảnh từ máy</>}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="w-full"
                  disabled={deletingQuestion === question.id || uploading === question.id || deletingImage === question.id}
                  onClick={() => deleteQuestion(question)}
                >
                  {deletingQuestion === question.id ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Trash2 className="mr-2 h-3.5 w-3.5" />}
                  Xóa câu hỏi
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!cropImageUrl} onOpenChange={(open) => !open && closeCropDialog()}>
        <DialogContent
          className="max-w-4xl border-zinc-800 bg-zinc-900 text-zinc-100"
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !uploading) { e.preventDefault(); uploadCrop(false) } }}
        >
          <DialogHeader>
            <DialogTitle>Crop ảnh — <span className="text-xs font-normal text-zinc-400">Enter để lưu</span></DialogTitle>
          </DialogHeader>
          {cropImageUrl && (
            <div className="space-y-3">
              <p className="text-sm text-zinc-400">Kéo chuột để khoanh đúng vùng hình/bảng/đồ thị cần giữ lại.</p>
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
                    alt="Ảnh cần crop"
                    className="w-full h-auto max-h-[60vh] object-contain select-none"
                    style={{ maxHeight: '60vh', maxWidth: '100%', height: 'auto', display: 'block' }}
                  />
                </ReactCrop>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => uploadCrop(true)} disabled={!!uploading || !cropFile}>Upload nguyên ảnh</Button>
            <Button onClick={() => uploadCrop(false)} disabled={!!uploading}>
              {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Upload ảnh đã crop
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      <Dialog open={!!editingQuestion} onOpenChange={(open) => !open && setEditingQuestion(null)}>
        <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto border-zinc-800 bg-zinc-900 text-zinc-100">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Edit3 className="h-4 w-4 text-primary" /> Sửa chi tiết câu hỏi
            </DialogTitle>
          </DialogHeader>

          {editingQuestion && (
            <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-400">Nội dung câu hỏi</label>
                  <Textarea
                    value={editForm.question_text ?? ''}
                    onChange={(event) => setEditForm((form) => ({ ...form, question_text: event.target.value }))}
                    className="min-h-[150px] border-zinc-700 bg-zinc-950 text-zinc-100"
                  />
                </div>

                {editForm.question_type === 'multiple_choice' && (
                  <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-medium text-zinc-300">Đáp án trắc nghiệm</p>
                      <select
                        value={editForm.correct_answer ?? ''}
                        onChange={(event) => setEditForm((form) => ({ ...form, correct_answer: event.target.value || null }))}
                        className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-100"
                      >
                        <option value="">Chưa có</option>
                        {['A', 'B', 'C', 'D'].map((item) => <option key={item} value={item}>{item}</option>)}
                      </select>
                    </div>
                    {(['a', 'b', 'c', 'd'] as const).map((letter) => {
                      const key = `option_${letter}` as keyof VisualQuestionForm
                      return (
                        <div key={letter} className="grid grid-cols-[28px_1fr] items-start gap-2">
                          <span className="pt-2 text-xs font-bold uppercase text-zinc-400">{letter}</span>
                          <Textarea
                            value={(editForm[key] as string | null) ?? ''}
                            onChange={(event) => setEditForm((form) => ({ ...form, [key]: event.target.value || null }))}
                            className="min-h-[54px] border-zinc-700 bg-zinc-900 text-zinc-100"
                          />
                        </div>
                      )
                    })}
                  </div>
                )}

                {editForm.question_type === 'true_false' && (
                  <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                    <p className="text-xs font-medium text-zinc-300">Mệnh đề đúng/sai</p>
                    {(['a', 'b', 'c', 'd'] as const).map((letter) => {
                      const statementKey = `statement_${letter}` as keyof VisualQuestionForm
                      const answerKey = `answer_${letter}` as keyof VisualQuestionForm
                      return (
                        <div key={letter} className="grid gap-2 rounded-md border border-zinc-800 p-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold uppercase text-zinc-400">{letter}</span>
                            <label className="flex items-center gap-2 text-xs text-zinc-300">
                              <Switch
                                checked={editForm[answerKey] === true}
                                onCheckedChange={(checked) => setEditForm((form) => ({ ...form, [answerKey]: checked }))}
                              />
                              Đúng
                            </label>
                          </div>
                          <Textarea
                            value={(editForm[statementKey] as string | null) ?? ''}
                            onChange={(event) => setEditForm((form) => ({ ...form, [statementKey]: event.target.value || null }))}
                            className="min-h-[58px] border-zinc-700 bg-zinc-900 text-zinc-100"
                          />
                        </div>
                      )
                    })}
                  </div>
                )}

                {editForm.question_type === 'short_answer' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-400">Đáp số</label>
                    <Input
                      type="number"
                      step="any"
                      value={editForm.numeric_answer ?? ''}
                      onChange={(event) => setEditForm((form) => ({ ...form, numeric_answer: event.target.value ? Number(event.target.value) : null }))}
                      className="border-zinc-700 bg-zinc-950 text-zinc-100"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-400">Lời giải</label>
                  <Textarea
                    value={editForm.explanation ?? ''}
                    onChange={(event) => setEditForm((form) => ({ ...form, explanation: event.target.value || null }))}
                    className="min-h-[120px] border-zinc-700 bg-zinc-950 text-zinc-100"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-400">Loại câu</label>
                    <select
                      value={editForm.question_type ?? 'multiple_choice'}
                      onChange={(event) => setEditForm((form) => ({ ...form, question_type: event.target.value as QuestionType }))}
                      className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100"
                    >
                      <option value="multiple_choice">Trắc nghiệm</option>
                      <option value="true_false">Đúng/Sai</option>
                      <option value="short_answer">Trả lời ngắn</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-400">Độ khó</label>
                    <select
                      value={editForm.difficulty ?? ''}
                      onChange={(event) => setEditForm((form) => ({ ...form, difficulty: (event.target.value || null) as Difficulty | null }))}
                      className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100"
                    >
                      <option value="">Chưa phân loại</option>
                      {DIFFICULTIES.map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Input value={editForm.topic ?? ''} onChange={(event) => setEditForm((form) => ({ ...form, topic: event.target.value || null }))} placeholder="Chủ đề" className="border-zinc-700 bg-zinc-950 text-zinc-100" />
                  <Input value={editForm.subtopic ?? ''} onChange={(event) => setEditForm((form) => ({ ...form, subtopic: event.target.value || null }))} placeholder="Dạng bài" className="border-zinc-700 bg-zinc-950 text-zinc-100" />
                  <Input type="number" value={editForm.grade ?? ''} onChange={(event) => setEditForm((form) => ({ ...form, grade: event.target.value ? Number(event.target.value) : null }))} placeholder="Lớp" className="border-zinc-700 bg-zinc-950 text-zinc-100" />
                  <Input value={editForm.part ?? ''} onChange={(event) => setEditForm((form) => ({ ...form, part: event.target.value || null }))} placeholder="Phần" className="border-zinc-700 bg-zinc-950 text-zinc-100" />
                </div>

                <Input value={editForm.source ?? ''} onChange={(event) => setEditForm((form) => ({ ...form, source: event.target.value || null }))} placeholder="Nguồn đề" className="border-zinc-700 bg-zinc-950 text-zinc-100" />

                <div className="space-y-3 rounded-lg border border-orange-500/25 bg-orange-500/5 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium text-orange-200">Thông tin hình ảnh</p>
                      <p className="text-[11px] text-zinc-500">Dùng để lọc danh sách cần crop/upload.</p>
                    </div>
                    <label className="flex items-center gap-2 text-xs text-zinc-300">
                      <Switch
                        checked={editForm.needs_visual === true}
                        onCheckedChange={(checked) => setEditForm((form) => ({ ...form, needs_visual: checked }))}
                      />
                      Cần hình
                    </label>
                  </div>
                  <select
                    value={editForm.visual_type ?? ''}
                    onChange={(event) => setEditForm((form) => ({ ...form, visual_type: event.target.value || null }))}
                    className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100"
                  >
                    <option value="">Chưa phân loại hình</option>
                    {Object.entries(VISUAL_TYPE_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                  <Textarea value={editForm.visual_description ?? ''} onChange={(event) => setEditForm((form) => ({ ...form, visual_description: event.target.value || null }))} placeholder="Mô tả hình cần có" className="min-h-[76px] border-zinc-700 bg-zinc-950 text-zinc-100" />
                  <Input value={editForm.source_file ?? ''} onChange={(event) => setEditForm((form) => ({ ...form, source_file: event.target.value || null }))} placeholder="File nguồn" className="border-zinc-700 bg-zinc-950 text-zinc-100" />
                  <div className="grid grid-cols-[1fr_120px] gap-3">
                    <Input value={editForm.source_hint ?? ''} onChange={(event) => setEditForm((form) => ({ ...form, source_hint: event.target.value || null }))} placeholder="Gợi ý tìm ảnh" className="border-zinc-700 bg-zinc-950 text-zinc-100" />
                    <Input type="number" value={editForm.page_number ?? ''} onChange={(event) => setEditForm((form) => ({ ...form, page_number: event.target.value ? Number(event.target.value) : null }))} placeholder="Trang" className="border-zinc-700 bg-zinc-950 text-zinc-100" />
                  </div>
                </div>

                <div className="grid gap-2 rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                  <label className="flex items-center justify-between gap-3 text-xs text-zinc-300">
                    <span>Publish vào kho luyện tập</span>
                    <Switch checked={editForm.is_published === true} onCheckedChange={(checked) => setEditForm((form) => ({ ...form, is_published: checked }))} />
                  </label>
                  <label className="flex items-center justify-between gap-3 text-xs text-zinc-300">
                    <span>Cần duyệt lại</span>
                    <Switch checked={editForm.needs_review === true} onCheckedChange={(checked) => setEditForm((form) => ({ ...form, needs_review: checked }))} />
                  </label>
                  {editingQuestion.visual_image_url && (
                    <Button type="button" variant="outline" size="sm" onClick={() => cropExisting(editingQuestion)} className="justify-start">
                      <Eye className="mr-2 h-3.5 w-3.5" /> Crop ảnh hiện tại
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditingQuestion(null)} disabled={savingQuestion}>Hủy</Button>
            <Button onClick={saveQuestion} disabled={savingQuestion}>
              {savingQuestion ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Lưu câu hỏi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
