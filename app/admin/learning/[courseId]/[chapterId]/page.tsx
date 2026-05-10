'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  ChevronRight, ChevronLeft, Plus, Trash2, Loader2, Brain,
  Video, CheckCircle2, Circle, Download, Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { formatDate } from '@/lib/utils'

interface Lesson {
  id: string
  title: string
  topic: string | null
  video_url: string | null
  is_published: boolean
  lesson_plan: Record<string, unknown> | null
  order_index: number
  created_at: string
}

interface Chapter {
  id: string
  name: string
  subject: string
  course_id: string
}

type JobStatus = 'pending' | 'processing' | 'completed' | 'failed'

interface ActiveJob {
  jobId: string
  lessonId: string
  status: JobStatus
}

export default function AdminLessonsPage() {
  const params = useParams()
  const courseId = params.courseId as string
  const chapterId = params.chapterId as string
  const { toast } = useToast()

  const [chapter, setChapter] = useState<Chapter | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)

  // Create lesson
  const [createOpen, setCreateOpen] = useState(false)
  const [lessonForm, setLessonForm] = useState({ title: '', topic: '', video_url: '', is_published: false })
  const [creating, setCreating] = useState(false)

  // Generate plan
  const [genOpen, setGenOpen] = useState(false)
  const [genLesson, setGenLesson] = useState<Lesson | null>(null)
  const [genPrompt, setGenPrompt] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Active jobs polling
  const [activeJobs, setActiveJobs] = useState<ActiveJob[]>([])
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Delete
  const [deleting, setDeleting] = useState<string | null>(null)

  // PDF export
  const [exporting, setExporting] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [chRes, lRes] = await Promise.all([
        fetch(`/api/admin/learning/courses/${courseId}/chapters`),
        fetch(`/api/admin/learning/lessons?chapterId=${chapterId}`),
      ])
      const chData = await chRes.json()
      const lData = await lRes.json()
      const found = (chData.chapters ?? []).find((c: Chapter) => c.id === chapterId)
      setChapter(found ?? null)
      setLessons(lData.lessons ?? [])
    } finally {
      setLoading(false)
    }
  }, [courseId, chapterId])

  useEffect(() => { fetchData() }, [fetchData])

  // Poll active jobs every 10s
  useEffect(() => {
    if (activeJobs.length === 0) {
      if (pollingRef.current) clearInterval(pollingRef.current)
      return
    }

    const poll = async () => {
      const remaining: ActiveJob[] = []
      for (const job of activeJobs) {
        try {
          const res = await fetch(`/api/admin/learning/job-status/${job.jobId}`)
          const data = await res.json()
          if (data.status === 'completed') {
            toast({ title: 'Giáo án đã tạo xong!', description: 'Danh sách bài đã được cập nhật.' })
            fetchData()
          } else if (data.status === 'failed') {
            toast({ title: 'Tạo giáo án thất bại', description: data.error ?? 'Thử lại sau', variant: 'destructive' })
          } else {
            remaining.push({ ...job, status: data.status as JobStatus })
          }
        } catch {
          remaining.push(job)
        }
      }
      setActiveJobs(remaining)
    }

    pollingRef.current = setInterval(poll, 10000)
    return () => { if (pollingRef.current) clearInterval(pollingRef.current) }
  }, [activeJobs, fetchData, toast])

  function getLessonJobStatus(lessonId: string): JobStatus | null {
    return activeJobs.find((j) => j.lessonId === lessonId)?.status ?? null
  }

  async function handleCreateLesson() {
    if (!lessonForm.title) return
    setCreating(true)
    try {
      const res = await fetch('/api/admin/learning/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...lessonForm, chapterId }),
      })
      if (!res.ok) throw new Error()
      toast({ title: 'Đã tạo bài học' })
      setCreateOpen(false)
      setLessonForm({ title: '', topic: '', video_url: '', is_published: false })
      fetchData()
    } catch {
      toast({ title: 'Lỗi khi tạo bài', variant: 'destructive' })
    } finally {
      setCreating(false)
    }
  }

  async function handleTogglePublish(lesson: Lesson) {
    try {
      await fetch(`/api/admin/learning/lessons/${lesson.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: !lesson.is_published }),
      })
      setLessons((prev) =>
        prev.map((l) => l.id === lesson.id ? { ...l, is_published: !l.is_published } : l)
      )
    } catch {
      toast({ title: 'Lỗi cập nhật', variant: 'destructive' })
    }
  }

  async function handleDelete(lessonId: string) {
    setDeleting(lessonId)
    try {
      await fetch(`/api/admin/learning/lessons/${lessonId}`, { method: 'DELETE' })
      toast({ title: 'Đã xóa bài học', variant: 'destructive' })
      fetchData()
    } catch {
      toast({ title: 'Lỗi khi xóa', variant: 'destructive' })
    } finally {
      setDeleting(null)
    }
  }

  function openGenModal(lesson: Lesson) {
    setGenLesson(lesson)
    setGenPrompt(
      lesson.topic
        ? `Tạo giáo án bài "${lesson.title}" về chủ đề ${lesson.topic} lớp 12, thời lượng 90 phút`
        : `Tạo giáo án bài "${lesson.title}" lớp 12, thời lượng 90 phút`
    )
    setGenOpen(true)
  }

  async function handleGenerate() {
    if (!genLesson || !genPrompt) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/learning/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId: genLesson.id,
          prompt: genPrompt,
          topic: genLesson.topic ?? genLesson.title,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Lỗi')

      setActiveJobs((prev) => [
        ...prev,
        { jobId: data.jobId, lessonId: genLesson.id, status: 'pending' },
      ])
      toast({ title: 'Yêu cầu đã được gửi!', description: 'Giáo án đang được tạo, bạn sẽ được thông báo khi xong.' })
      setGenOpen(false)
    } catch (err: unknown) {
      toast({ title: 'Lỗi gửi yêu cầu', description: err instanceof Error ? err.message : 'Thử lại sau', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleExportPdf(lessonId: string) {
    setExporting(lessonId)
    try {
      const res = await fetch('/api/admin/learning/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId }),
      })
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `giao-an-${lessonId.slice(0, 8)}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast({ title: 'Xuất PDF thất bại', variant: 'destructive' })
    } finally {
      setExporting(null)
    }
  }

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-zinc-400 flex-wrap">
        <Link href="/admin/learning" className="hover:text-zinc-200 flex items-center gap-1">
          <ChevronLeft className="h-3.5 w-3.5" /> Học Tập
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/admin/learning/${courseId}`} className="hover:text-zinc-200">Khoá học</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-zinc-100">{chapter?.name ?? 'Chương'}</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">{chapter?.name ?? 'Chương'}</h1>
          <p className="text-sm text-zinc-400">{lessons.length} bài học</p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
          <Plus className="h-4 w-4" /> Tạo bài học
        </Button>
      </div>

      {/* Lessons table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-xs text-zinc-400">
              <th className="px-4 py-3 text-left font-medium">Tiêu đề</th>
              <th className="px-4 py-3 text-left font-medium">Chủ đề</th>
              <th className="px-4 py-3 text-center font-medium">Video</th>
              <th className="px-4 py-3 text-center font-medium">Giáo án</th>
              <th className="px-4 py-3 text-center font-medium">Publish</th>
              <th className="px-4 py-3 text-left font-medium">Ngày tạo</th>
              <th className="px-4 py-3 text-center font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {lessons.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-zinc-500">
                  Chưa có bài học. Nhấn &quot;Tạo bài học&quot; để bắt đầu.
                </td>
              </tr>
            ) : lessons.map((lesson) => {
              const jobStatus = getLessonJobStatus(lesson.id)
              return (
                <tr key={lesson.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-4 py-3 text-zinc-200 max-w-xs">
                    <p className="font-medium line-clamp-1">{lesson.title}</p>
                  </td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">{lesson.topic ?? '—'}</td>
                  <td className="px-4 py-3 text-center">
                    {lesson.video_url
                      ? <Video className="h-4 w-4 text-blue-400 mx-auto" />
                      : <span className="text-zinc-600">—</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-center">
                    {jobStatus === 'pending' || jobStatus === 'processing' ? (
                      <Badge variant="outline" className="text-yellow-400 border-yellow-700 gap-1 text-[10px]">
                        <Loader2 className="h-2.5 w-2.5 animate-spin" /> Đang tạo...
                      </Badge>
                    ) : lesson.lesson_plan ? (
                      <Badge variant="outline" className="text-green-400 border-green-800 gap-1 text-[10px]">
                        <CheckCircle2 className="h-2.5 w-2.5" /> Có giáo án
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-zinc-500 border-zinc-700 gap-1 text-[10px]">
                        <Circle className="h-2.5 w-2.5" /> Chưa có
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Switch
                      checked={lesson.is_published}
                      onCheckedChange={() => handleTogglePublish(lesson)}
                    />
                  </td>
                  <td className="px-4 py-3 text-zinc-500 text-xs">
                    {formatDate(lesson.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs text-violet-400 hover:text-violet-300"
                        onClick={() => openGenModal(lesson)}
                        disabled={jobStatus === 'pending' || jobStatus === 'processing'}
                        title="Tạo giáo án AI"
                      >
                        {jobStatus === 'pending' || jobStatus === 'processing'
                          ? <Clock className="h-3.5 w-3.5" />
                          : <Brain className="h-3.5 w-3.5" />
                        }
                      </Button>
                      {lesson.lesson_plan && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs text-zinc-400 hover:text-zinc-200"
                          onClick={() => handleExportPdf(lesson.id)}
                          disabled={exporting === lesson.id}
                          title="Xuất PDF"
                        >
                          {exporting === lesson.id
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <Download className="h-3.5 w-3.5" />
                          }
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-zinc-500 hover:text-red-400"
                        onClick={() => handleDelete(lesson.id)}
                        disabled={deleting === lesson.id}
                      >
                        {deleting === lesson.id
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <Trash2 className="h-3.5 w-3.5" />
                        }
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Create lesson dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md bg-zinc-900 border-zinc-800 text-zinc-100">
          <DialogHeader>
            <DialogTitle>Tạo bài học mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400">Tiêu đề bài học *</label>
              <Input
                value={lessonForm.title}
                onChange={(e) => setLessonForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="VD: Bài 1 — Tích phân từng phần"
                className="bg-zinc-800 border-zinc-700 text-zinc-100"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400">Chủ đề</label>
              <Input
                value={lessonForm.topic}
                onChange={(e) => setLessonForm((f) => ({ ...f, topic: e.target.value }))}
                placeholder="VD: Tích phân, Giới hạn, Hàm số..."
                className="bg-zinc-800 border-zinc-700 text-zinc-100"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400">Video URL (YouTube / Google Drive)</label>
              <Input
                value={lessonForm.video_url}
                onChange={(e) => setLessonForm((f) => ({ ...f, video_url: e.target.value }))}
                placeholder="https://youtube.com/..."
                className="bg-zinc-800 border-zinc-700 text-zinc-100"
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={lessonForm.is_published}
                onCheckedChange={(v) => setLessonForm((f) => ({ ...f, is_published: v }))}
              />
              <label className="text-sm text-zinc-300">Publish ngay</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)} className="text-zinc-400">Hủy</Button>
            <Button onClick={handleCreateLesson} disabled={creating || !lessonForm.title}>
              {creating && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
              Tạo bài
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate plan dialog */}
      <Dialog open={genOpen} onOpenChange={(o) => { if (!submitting) setGenOpen(o) }}>
        <DialogContent className="max-w-lg bg-zinc-900 border-zinc-800 text-zinc-100">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-violet-400" />
              Tạo giáo án AI — {genLesson?.title}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-xs text-zinc-400">
              AI sẽ tạo giáo án trong nền. Bạn có thể đóng dialog và tiếp tục làm việc, giáo án sẽ tự cập nhật khi xong.
            </p>
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400">Prompt cho AI</label>
              <Textarea
                value={genPrompt}
                onChange={(e) => setGenPrompt(e.target.value)}
                rows={4}
                className="bg-zinc-800 border-zinc-700 text-zinc-100 resize-none font-mono text-sm"
                placeholder="Tạo giáo án bài Tích phân từng phần lớp 12, thời lượng 90 phút..."
              />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={submitting || !genPrompt}
              className="w-full gap-2"
            >
              {submitting
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Đang gửi yêu cầu...</>
                : <><Brain className="h-4 w-4" /> Tạo giáo án</>
              }
            </Button>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setGenOpen(false)} className="text-zinc-400" disabled={submitting}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
