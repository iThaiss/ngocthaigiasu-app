'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { CheckCircle, ChevronLeft, ChevronRight, ImageOff, Loader2, Trash2, Upload } from 'lucide-react'
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
  page_number: number | null
}

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
    setUploading(activeUploadId)
    try {
      const file = useOriginal ? cropFile : await buildCroppedFile()
      if (!file) throw new Error('crop failed')
      const fd = new FormData()
      fd.append('file', file)
      fd.append('questionId', activeUploadId)
      const res = await fetch('/api/admin/questions/upload-image', { method: 'POST', body: fd })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error ?? 'Upload failed')
      toast({ title: 'Đã upload hình thành công' })
      closeCropDialog()
      fetchQuestions()
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
              <p className="line-clamp-3 text-xs leading-relaxed text-zinc-200">{question.question_text}</p>

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
        <DialogContent className="max-w-4xl border-zinc-800 bg-zinc-900 text-zinc-100">
          <DialogHeader>
            <DialogTitle>Crop ảnh trước khi upload</DialogTitle>
          </DialogHeader>
          {cropImageUrl && (
            <div className="space-y-3">
              <p className="text-sm text-zinc-400">Kéo chuột để khoanh đúng vùng hình/bảng/đồ thị cần giữ lại.</p>
              <div className="flex justify-center overflow-auto rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                <ReactCrop
                  crop={crop}
                  onChange={(nextCrop) => setCrop(nextCrop)}
                  onComplete={(nextCrop) => setCompletedCrop(nextCrop)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    ref={imgRef}
                    src={cropImageUrl}
                    alt="Ảnh cần crop"
                    className="max-h-[62vh] max-w-full select-none object-contain"
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
