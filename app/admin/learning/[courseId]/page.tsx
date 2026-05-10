'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  ChevronRight, Plus, Trash2, Loader2, BookOpen, FileText,
  ChevronLeft, CalculatorIcon, Shapes,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { formatDate } from '@/lib/utils'

interface Chapter {
  id: string
  name: string
  description: string | null
  subject: 'toan_dai' | 'toan_hinh'
  order_index: number
  lesson_count: number
  created_at: string
}

interface Course {
  id: string
  name: string
  slug: string
}

const SUBJECT_LABEL = { toan_dai: 'Toán Đại số', toan_hinh: 'Toán Hình học' }
const SUBJECT_STYLE = {
  toan_dai: 'bg-blue-500/15 text-blue-400',
  toan_hinh: 'bg-emerald-500/15 text-emerald-400',
}

export default function AdminChaptersPage() {
  const params = useParams()
  const courseId = params.courseId as string
  const { toast } = useToast()

  const [course, setCourse] = useState<Course | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [loading, setLoading] = useState(true)

  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({ name: '', subject: 'toan_dai', description: '' })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [cRes, chRes] = await Promise.all([
        fetch('/api/admin/learning/courses'),
        fetch(`/api/admin/learning/courses/${courseId}/chapters`),
      ])
      const cData = await cRes.json()
      const chData = await chRes.json()
      const found = (cData.courses ?? []).find((c: Course) => c.id === courseId)
      setCourse(found ?? null)
      setChapters(chData.chapters ?? [])
    } finally {
      setLoading(false)
    }
  }, [courseId])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleCreate() {
    if (!form.name) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/learning/courses/${courseId}/chapters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      toast({ title: 'Đã tạo chương' })
      setCreateOpen(false)
      setForm({ name: '', subject: 'toan_dai', description: '' })
      fetchData()
    } catch {
      toast({ title: 'Lỗi khi tạo chương', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(chapterId: string) {
    setDeleting(chapterId)
    try {
      const res = await fetch(`/api/admin/learning/courses/${courseId}/chapters/${chapterId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error()
      toast({ title: 'Đã xóa chương', variant: 'destructive' })
      fetchData()
    } catch {
      toast({ title: 'Lỗi khi xóa', variant: 'destructive' })
    } finally {
      setDeleting(null)
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
      <div className="flex items-center gap-2 text-sm text-zinc-400">
        <Link href="/admin/learning" className="hover:text-zinc-200 flex items-center gap-1">
          <ChevronLeft className="h-3.5 w-3.5" /> Học Tập
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-zinc-100">{course?.name ?? 'Khoá học'}</span>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-100">{course?.name ?? 'Khoá học'}</h1>
        <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
          <Plus className="h-4 w-4" /> Tạo chương
        </Button>
      </div>

      {/* Chapters list */}
      <div className="space-y-3">
        {chapters.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-dashed border-zinc-700">
            <BookOpen className="h-10 w-10 text-zinc-600 mb-2" />
            <p className="text-zinc-400">Chưa có chương nào</p>
            <Button size="sm" variant="outline" className="mt-3" onClick={() => setCreateOpen(true)}>
              Tạo chương đầu tiên
            </Button>
          </div>
        ) : (
          chapters.map((ch) => (
            <div
              key={ch.id}
              className="flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 hover:border-zinc-700 transition-colors"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800 shrink-0">
                {ch.subject === 'toan_dai'
                  ? <CalculatorIcon className="h-4 w-4 text-blue-400" />
                  : <Shapes className="h-4 w-4 text-emerald-400" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-semibold text-zinc-100 truncate">{ch.name}</p>
                  <span className={`shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full ${SUBJECT_STYLE[ch.subject]}`}>
                    {SUBJECT_LABEL[ch.subject]}
                  </span>
                </div>
                <p className="text-xs text-zinc-500">
                  {ch.lesson_count} bài · {formatDate(ch.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link href={`/admin/learning/${courseId}/${ch.id}`}>
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs border-zinc-700">
                    <FileText className="h-3.5 w-3.5" /> Xem bài
                  </Button>
                </Link>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-zinc-500 hover:text-red-400"
                  onClick={() => handleDelete(ch.id)}
                  disabled={deleting === ch.id}
                >
                  {deleting === ch.id
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <Trash2 className="h-3.5 w-3.5" />
                  }
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md bg-zinc-900 border-zinc-800 text-zinc-100">
          <DialogHeader>
            <DialogTitle>Tạo chương mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400">Tên chương *</label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="VD: Chương 1 — Hàm số và đồ thị"
                className="bg-zinc-800 border-zinc-700 text-zinc-100"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400">Môn học *</label>
              <select
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100"
              >
                <option value="toan_dai">Toán Đại số</option>
                <option value="toan_hinh">Toán Hình học</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400">Mô tả</label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Mô tả nội dung chương..."
                className="bg-zinc-800 border-zinc-700 text-zinc-100 resize-none"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)} className="text-zinc-400">Hủy</Button>
            <Button onClick={handleCreate} disabled={saving || !form.name}>
              {saving && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
              Tạo chương
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
