'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Search, ChevronLeft, ChevronRight, Edit, Trash2, Loader2, CheckSquare, Square, ImageOff,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { formatDate } from '@/lib/utils'

type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer'
type Difficulty = 'Nhận biết' | 'Thông hiểu' | 'Vận dụng' | 'Vận dụng cao'

interface Question {
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
  source: string | null
  needs_visual: boolean
  visual_description: string | null
  has_image: boolean
  created_at: string
}

const DIFFICULTIES: Difficulty[] = ['Nhận biết', 'Thông hiểu', 'Vận dụng', 'Vận dụng cao']
const DIFF_COLOR: Record<string, string> = {
  'Nhận biết': 'bg-green-500/15 text-green-400',
  'Thông hiểu': 'bg-blue-500/15 text-blue-400',
  'Vận dụng': 'bg-yellow-500/15 text-yellow-400',
  'Vận dụng cao': 'bg-red-500/15 text-red-400',
}

export default function AdminQuestionsPage() {
  const { toast } = useToast()
  const [questions, setQuestions] = useState<Question[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [diffFilter, setDiffFilter] = useState('')
  const [gradeFilter, setGradeFilter] = useState('')
  const [partFilter, setPartFilter] = useState('')
  const [subtopicFilter, setSubtopicFilter] = useState('')
  const [noAnswer, setNoAnswer] = useState(false)
  const [needsVisualFilter, setNeedsVisualFilter] = useState('')

  // Edit modal
  const [editQ, setEditQ] = useState<Question | null>(null)
  const [editForm, setEditForm] = useState<Partial<Question>>({})
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Bulk
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkDiff, setBulkDiff] = useState('')
  const [bulkTopic, setBulkTopic] = useState('')
  const [bulkGrade, setBulkGrade] = useState('')
  const [bulkLoading, setBulkLoading] = useState(false)

  const fetchQuestions = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        ...(search && { search }),
        ...(typeFilter && { type: typeFilter }),
        ...(diffFilter && { difficulty: diffFilter }),
        ...(gradeFilter && { grade: gradeFilter }),
        ...(partFilter && { part: partFilter }),
        ...(subtopicFilter && { subtopic: subtopicFilter }),
        ...(noAnswer && { noAnswer: 'true' }),
        ...(needsVisualFilter && { needsVisual: needsVisualFilter }),
      })
      const res = await fetch(`/api/admin/questions?${params}`)
      const data = await res.json()
      setQuestions(data.questions ?? [])
      setTotal(data.total ?? 0)
      setTotalPages(data.totalPages ?? 1)
    } finally {
      setLoading(false)
    }
  }, [page, search, typeFilter, diffFilter, gradeFilter, partFilter, subtopicFilter, noAnswer, needsVisualFilter])

  useEffect(() => { fetchQuestions() }, [fetchQuestions])

  function openEdit(q: Question) {
    setEditQ(q)
    setEditForm({
      difficulty: q.difficulty,
      topic: q.topic,
      subtopic: q.subtopic,
      grade: q.grade,
      part: q.part,
      correct_answer: q.correct_answer,
      statement_a: q.statement_a,
      statement_b: q.statement_b,
      statement_c: q.statement_c,
      statement_d: q.statement_d,
      answer_a: q.answer_a,
      answer_b: q.answer_b,
      answer_c: q.answer_c,
      answer_d: q.answer_d,
      numeric_answer: q.numeric_answer,
    })
  }

  async function handleSave() {
    if (!editQ) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/questions/${editQ.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      if (!res.ok) throw new Error()
      toast({ title: 'Đã lưu câu hỏi' })
      setEditQ(null)
      fetchQuestions()
    } catch {
      toast({ title: 'Lỗi khi lưu', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!editQ) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/questions/${editQ.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast({ title: 'Đã xóa câu hỏi', variant: 'destructive' })
      setEditQ(null)
      fetchQuestions()
    } catch {
      toast({ title: 'Lỗi khi xóa', variant: 'destructive' })
    } finally {
      setDeleting(false)
    }
  }

  async function handleBulkDiff() {
    if (selected.size === 0) return
    if (!bulkDiff && !bulkTopic && !bulkGrade) return
    setBulkLoading(true)
    try {
      const body: Record<string, unknown> = { ids: Array.from(selected) }
      if (bulkDiff) body.difficulty = bulkDiff
      if (bulkTopic) body.topic = bulkTopic
      if (bulkGrade) body.grade = parseInt(bulkGrade)
      const res = await fetch('/api/admin/questions/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error()
      toast({ title: `Đã cập nhật ${selected.size} câu hỏi` })
      setSelected(new Set())
      setBulkDiff(''); setBulkTopic(''); setBulkGrade('')
      fetchQuestions()
    } catch {
      toast({ title: 'Lỗi bulk update', variant: 'destructive' })
    } finally {
      setBulkLoading(false)
    }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const typeLabel: Record<string, string> = {
    multiple_choice: 'Trắc nghiệm',
    true_false: 'Đúng/Sai',
    short_answer: 'Trả lời ngắn',
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-100">Câu hỏi</h1>
        <span className="text-sm text-zinc-400">{total.toLocaleString('vi-VN')} câu</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
          <Input
            className="pl-8 bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
            placeholder="Tìm kiếm câu hỏi..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }}
          className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
        >
          <option value="">Tất cả loại</option>
          <option value="multiple_choice">Trắc nghiệm</option>
          <option value="true_false">Đúng/Sai</option>
          <option value="short_answer">Trả lời ngắn</option>
        </select>
        <select
          value={diffFilter}
          onChange={(e) => { setDiffFilter(e.target.value); setPage(1) }}
          className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
        >
          <option value="">Tất cả độ khó</option>
          {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select
          value={gradeFilter}
          onChange={(e) => { setGradeFilter(e.target.value); setPage(1) }}
          className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
        >
          <option value="">Tất cả lớp</option>
          <option value="10">Lớp 10</option>
          <option value="11">Lớp 11</option>
          <option value="12">Lớp 12</option>
        </select>
        <select
          value={partFilter}
          onChange={(e) => { setPartFilter(e.target.value); setPage(1) }}
          className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
        >
          <option value="">Tất cả phần</option>
          <option value="I">Phần I</option>
          <option value="II">Phần II</option>
          <option value="III">Phần III</option>
        </select>
        <Input
          className="w-40 bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
          placeholder="Subtopic..."
          value={subtopicFilter}
          onChange={(e) => { setSubtopicFilter(e.target.value); setPage(1) }}
        />
        <select
          value={needsVisualFilter}
          onChange={(e) => { setNeedsVisualFilter(e.target.value); setPage(1) }}
          className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
        >
          <option value="">Tất cả hình</option>
          <option value="true">Cần hình</option>
          <option value="false">Không cần hình</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer px-3 py-2 border border-zinc-700 rounded-md bg-zinc-900">
          <input type="checkbox" checked={noAnswer} onChange={(e) => { setNoAnswer(e.target.checked); setPage(1) }} />
          Thiếu đáp án
        </label>
      </div>

      {/* Bulk action */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-primary/30 bg-primary/10 px-4 py-2">
          <span className="text-sm text-zinc-300">Đã chọn {selected.size} câu</span>
          <select
            value={bulkDiff}
            onChange={(e) => setBulkDiff(e.target.value)}
            className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-zinc-100"
          >
            <option value="">Độ khó...</option>
            {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <Input
            className="w-36 h-8 bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 text-sm"
            placeholder="Chủ đề..."
            value={bulkTopic}
            onChange={(e) => setBulkTopic(e.target.value)}
          />
          <select
            value={bulkGrade}
            onChange={(e) => setBulkGrade(e.target.value)}
            className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-zinc-100"
          >
            <option value="">Lớp...</option>
            <option value="10">Lớp 10</option>
            <option value="11">Lớp 11</option>
            <option value="12">Lớp 12</option>
          </select>
          <Button size="sm" onClick={handleBulkDiff} disabled={(!bulkDiff && !bulkTopic && !bulkGrade) || bulkLoading}>
            {bulkLoading && <Loader2 className="mr-1 h-3 w-3 animate-spin" />} Áp dụng
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())} className="text-zinc-400">
            Bỏ chọn
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-xs text-zinc-400">
              <th className="px-3 py-2.5 w-8"></th>
              <th className="px-3 py-2.5 text-left font-medium">STT</th>
              <th className="px-3 py-2.5 text-left font-medium">Nội dung</th>
              <th className="px-3 py-2.5 text-left font-medium">Chủ đề</th>
              <th className="px-3 py-2.5 text-center font-medium">Lớp</th>
              <th className="px-3 py-2.5 text-center font-medium">Phần</th>
              <th className="px-3 py-2.5 text-center font-medium">Loại</th>
              <th className="px-3 py-2.5 text-center font-medium">Độ khó</th>
              <th className="px-3 py-2.5 text-center font-medium">Đáp án</th>
              <th className="px-3 py-2.5 text-center font-medium">Hình</th>
              <th className="px-3 py-2.5 text-center font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {loading ? (
              <tr>
                <td colSpan={10} className="py-12 text-center">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-zinc-500" />
                </td>
              </tr>
            ) : questions.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-zinc-500">Không có câu hỏi</td>
              </tr>
            ) : (
              questions.map((q, idx) => (
                <tr key={q.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-3 py-2.5">
                    <button onClick={() => toggleSelect(q.id)} className="text-zinc-400 hover:text-zinc-100">
                      {selected.has(q.id) ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4" />}
                    </button>
                  </td>
                  <td className="px-3 py-2.5 text-zinc-500">{(page - 1) * 20 + idx + 1}</td>
                  <td className="px-3 py-2.5 text-zinc-200 max-w-xs">
                    <p className="line-clamp-2 text-xs">{q.question_text}</p>
                  </td>
                  <td className="px-3 py-2.5 max-w-[120px]">
                    <p className="text-xs text-zinc-300 truncate">{q.topic ?? '—'}</p>
                    {q.subtopic && <p className="text-[10px] text-zinc-500 truncate">{q.subtopic}</p>}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {q.grade ? <span className="text-xs text-zinc-300">{q.grade}</span> : <span className="text-zinc-600">—</span>}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {q.part ? <span className="text-xs font-mono text-zinc-300">{q.part}</span> : <span className="text-zinc-600">—</span>}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className="text-xs text-zinc-400">{typeLabel[q.question_type] ?? q.question_type}</span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {q.difficulty ? (
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${DIFF_COLOR[q.difficulty] ?? 'bg-zinc-700 text-zinc-300'}`}>
                        {q.difficulty}
                      </span>
                    ) : <span className="text-zinc-600">—</span>}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {q.correct_answer
                      ? <span className="font-mono font-bold text-green-400">{q.correct_answer}</span>
                      : <span className="text-red-400 text-xs">Thiếu</span>
                    }
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {q.needs_visual
                      ? <ImageOff className="h-3.5 w-3.5 text-orange-400 mx-auto" aria-label={q.visual_description ?? ''} />
                      : <span className="text-zinc-600">—</span>}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <button onClick={() => openEdit(q)} className="p-1 text-zinc-400 hover:text-primary transition-colors">
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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

      {/* Edit Modal */}
      <Dialog open={!!editQ} onOpenChange={(o) => !o && setEditQ(null)}>
        <DialogContent className="max-w-lg bg-zinc-900 border-zinc-800 text-zinc-100">
          <DialogHeader>
            <DialogTitle>Sửa câu hỏi</DialogTitle>
          </DialogHeader>

          {editQ && (
            <div className="space-y-4 text-sm">
              <div className="rounded-lg bg-zinc-800 p-3 max-h-32 overflow-y-auto">
                <p className="text-zinc-300 text-xs leading-relaxed">{editQ.question_text}</p>
              </div>

              {/* Topic / Subtopic */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-400">Chủ đề</label>
                  <input
                    value={editForm.topic ?? ''}
                    onChange={(e) => setEditForm(f => ({ ...f, topic: e.target.value || null }))}
                    className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100"
                    placeholder="VD: Nguyên hàm - Tích phân"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-400">Subtopic</label>
                  <input
                    value={editForm.subtopic ?? ''}
                    onChange={(e) => setEditForm(f => ({ ...f, subtopic: e.target.value || null }))}
                    className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100"
                    placeholder="VD: Tích phân"
                  />
                </div>
              </div>

              {/* Grade / Part */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-400">Lớp</label>
                  <select
                    value={editForm.grade ?? ''}
                    onChange={(e) => setEditForm(f => ({ ...f, grade: e.target.value ? parseInt(e.target.value) : null }))}
                    className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100"
                  >
                    <option value="">— Chưa phân loại —</option>
                    <option value="10">Lớp 10</option>
                    <option value="11">Lớp 11</option>
                    <option value="12">Lớp 12</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-400">Phần đề thi</label>
                  <select
                    value={editForm.part ?? ''}
                    onChange={(e) => setEditForm(f => ({ ...f, part: e.target.value || null }))}
                    className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100"
                  >
                    <option value="">— Không xác định —</option>
                    <option value="I">Phần I (Trắc nghiệm)</option>
                    <option value="II">Phần II (Đúng/Sai)</option>
                    <option value="III">Phần III (Trả lời ngắn)</option>
                  </select>
                </div>
              </div>

              {/* Difficulty */}
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400">Độ khó</label>
                <select
                  value={editForm.difficulty ?? ''}
                  onChange={(e) => setEditForm(f => ({ ...f, difficulty: e.target.value as Difficulty || undefined }))}
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100"
                >
                  <option value="">— Chưa phân loại —</option>
                  {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              {/* Multiple choice */}
              {editQ.question_type === 'multiple_choice' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs text-zinc-400">Đáp án đúng</label>
                    <select
                      value={editForm.correct_answer ?? ''}
                      onChange={(e) => setEditForm(f => ({ ...f, correct_answer: e.target.value || null }))}
                      className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100"
                    >
                      <option value="">— Chưa có —</option>
                      {['A', 'B', 'C', 'D'].map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5 text-xs text-zinc-400">
                    {(['A', 'B', 'C', 'D'] as const).map((letter) => {
                      const key = `option_${letter.toLowerCase()}` as keyof Question
                      const val = editQ[key] as string | null
                      if (!val) return null
                      return (
                        <p key={letter}>
                          <span className={`font-bold mr-1 ${editQ.correct_answer === letter ? 'text-green-400' : 'text-zinc-300'}`}>{letter}.</span>
                          {val}
                        </p>
                      )
                    })}
                  </div>
                </>
              )}

              {/* True/False */}
              {editQ.question_type === 'true_false' && (
                <div className="space-y-2">
                  {(['a', 'b', 'c', 'd'] as const).map((letter) => {
                    const stmtKey = `statement_${letter}` as keyof Question
                    const ansKey = `answer_${letter}` as keyof Question
                    const stmt = editQ[stmtKey] as string | null
                    if (!stmt) return null
                    const current = (editForm[ansKey] as boolean | null) ?? (editQ[ansKey] as boolean | null)
                    return (
                      <div key={letter} className="flex items-center gap-3">
                        <span className="text-xs text-zinc-400 uppercase">{letter}.</span>
                        <p className="flex-1 text-xs text-zinc-300 line-clamp-2">{stmt}</p>
                        <label className="flex items-center gap-1.5 text-xs">
                          <input
                            type="checkbox"
                            checked={current === true}
                            onChange={(e) => setEditForm(f => ({ ...f, [ansKey]: e.target.checked }))}
                          />
                          Đúng
                        </label>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Short answer */}
              {editQ.question_type === 'short_answer' && (
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-400">Đáp số</label>
                  <input
                    type="number"
                    value={editForm.numeric_answer ?? ''}
                    onChange={(e) => setEditForm(f => ({ ...f, numeric_answer: e.target.value ? parseFloat(e.target.value) : null }))}
                    className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100"
                    placeholder="Nhập đáp số"
                  />
                </div>
              )}

              {/* Visual info */}
              {editQ.needs_visual && editQ.visual_description && (
                <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-3">
                  <p className="text-xs text-orange-400 font-medium mb-1">⚠ Câu cần hình ảnh</p>
                  <p className="text-xs text-zinc-300">{editQ.visual_description}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleting || saving}
            >
              {deleting && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
              <Trash2 className="mr-1 h-3.5 w-3.5" /> Xóa
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving || deleting}>
              {saving && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
