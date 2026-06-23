'use client'

import { useState } from 'react'
import { Plus, Eye, EyeOff, Trash2, FileKey, Loader2, Settings2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import AdminExamForm from './AdminExamForm'
import AdminAnswerKeyForm from './AdminAnswerKeyForm'

interface Exam {
  id: string
  title: string
  year: number | null
  status: 'draft' | 'published'
  question_count: number
  attempt_count: number
  pdf_url?: string | null
  solution_url?: string | null
  handwritten_url?: string | null
}

interface Question {
  question_number: number
  part: 'part_1' | 'part_2' | 'part_3'
  question_type: 'multiple_choice' | 'true_false' | 'short_answer'
  correct_answer: string | null
  max_score: number
  scoring_rule: Record<string, unknown> | null
}

interface AdminExamPanelProps {
  exams: Exam[]
  onRefresh: () => void
}

interface SettingsState {
  exam: Exam
  buffValue: string
  driveUrl: string
}

export default function AdminExamPanel({ exams, onRefresh }: AdminExamPanelProps) {
  const [showForm, setShowForm] = useState(false)
  const [answerKeyExamId, setAnswerKeyExamId] = useState<string | null>(null)
  const [answerKeyExam, setAnswerKeyExam] = useState<Exam | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [loadingKey, setLoadingKey] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [settings, setSettings] = useState<SettingsState | null>(null)
  const [settingsSaving, setSettingsSaving] = useState(false)
  const { toast } = useToast()

  const openAnswerKey = async (exam: Exam) => {
    setLoadingKey(true)
    setAnswerKeyExam(exam)
    setAnswerKeyExamId(exam.id)
    try {
      const res = await fetch(`/api/admin/de-thi/${exam.id}/questions`)
      const data = await res.json()
      setQuestions(data.questions ?? [])
    } catch {
      toast({ title: 'Không tải được đáp án', variant: 'destructive' })
      setAnswerKeyExamId(null)
      setAnswerKeyExam(null)
    } finally {
      setLoadingKey(false)
    }
  }

  const openSettings = (exam: Exam) => {
    setSettings({
      exam,
      buffValue: String(exam.attempt_count),
      driveUrl: exam.pdf_url ?? '',
    })
  }

  const saveSettings = async () => {
    if (!settings) return
    const buffVal = parseInt(settings.buffValue)
    if (isNaN(buffVal) || buffVal < 0) {
      toast({ title: 'Số lượt không hợp lệ', variant: 'destructive' })
      return
    }
    setSettingsSaving(true)
    try {
      const res = await fetch(`/api/admin/de-thi/${settings.exam.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attempt_count: buffVal,
          pdf_url: settings.driveUrl.trim() || null,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast({ title: 'Đã lưu cài đặt', variant: 'success' as never })
      setSettings(null)
      onRefresh()
    } catch (e) {
      toast({ title: 'Lỗi lưu', description: String(e), variant: 'destructive' })
    } finally {
      setSettingsSaving(false)
    }
  }

  const toggleStatus = async (exam: Exam) => {
    setTogglingId(exam.id)
    try {
      const newStatus = exam.status === 'published' ? 'draft' : 'published'
      const res = await fetch(`/api/admin/de-thi/${exam.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast({ title: newStatus === 'published' ? 'Đã publish đề thi' : 'Đã ẩn đề thi', variant: 'success' as never })
      onRefresh()
    } catch (e) {
      toast({ title: 'Lỗi', description: String(e), variant: 'destructive' })
    } finally {
      setTogglingId(null)
    }
  }

  const deleteExam = async (exam: Exam) => {
    if (!confirm(`Xóa đề "${exam.title}"? Không thể khôi phục.`)) return
    setDeletingId(exam.id)
    try {
      const res = await fetch(`/api/admin/de-thi/${exam.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error((await res.json()).error)
      toast({ title: 'Đã xóa đề thi', variant: 'success' as never })
      onRefresh()
    } catch (e) {
      toast({ title: 'Lỗi xóa', description: String(e), variant: 'destructive' })
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Quản lý đề thi (Admin)
            </CardTitle>
            <Button size="sm" className="gap-1.5 h-8" onClick={() => setShowForm(true)}>
              <Plus className="h-3.5 w-3.5" /> Thêm đề mới
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {exams.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-3">Chưa có đề thi nào</p>
          )}
          {exams.map((exam) => (
            <div key={exam.id} className="rounded-md border bg-background">
              <div className="flex items-center gap-3 p-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{exam.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant={exam.status === 'published' ? 'default' : 'outline'} className="text-[10px] py-0">
                      {exam.status === 'published' ? 'Công khai' : 'Nháp'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{exam.attempt_count} lượt thi</span>
                    {!exam.pdf_url && (
                      <span className="text-xs text-yellow-600 dark:text-yellow-400">⚠ Chưa có link đề</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost" size="icon" className="h-8 w-8"
                    title="Cài đặt (Drive URL, buff lượt)"
                    onClick={() => openSettings(exam)}
                  >
                    <Settings2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost" size="icon" className="h-8 w-8"
                    title="Nhập đáp án"
                    onClick={() => openAnswerKey(exam)}
                    disabled={loadingKey && answerKeyExamId === exam.id}
                  >
                    {loadingKey && answerKeyExamId === exam.id
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <FileKey className="h-3.5 w-3.5" />}
                  </Button>
                  <Button
                    variant="ghost" size="icon" className="h-8 w-8"
                    title={exam.status === 'published' ? 'Ẩn đề' : 'Publish'}
                    onClick={() => toggleStatus(exam)}
                    disabled={togglingId === exam.id}
                  >
                    {togglingId === exam.id
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : exam.status === 'published'
                        ? <EyeOff className="h-3.5 w-3.5" />
                        : <Eye className="h-3.5 w-3.5" />}
                  </Button>
                  <Button
                    variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    title="Xóa đề"
                    onClick={() => deleteExam(exam)}
                    disabled={deletingId === exam.id}
                  >
                    {deletingId === exam.id
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Trash2 className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Form tạo đề mới */}
      <Dialog open={showForm} onOpenChange={(v) => !v && setShowForm(false)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Thêm đề thi mới</DialogTitle>
          </DialogHeader>
          <AdminExamForm
            onCreated={(exam) => {
              setShowForm(false)
              onRefresh()
              openAnswerKey({ id: exam.id, title: exam.title, year: null, status: 'draft', question_count: 22, attempt_count: 0 })
            }}
            onCancel={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Form nhập đáp án */}
      <Dialog
        open={answerKeyExamId !== null && !loadingKey}
        onOpenChange={(v) => !v && setAnswerKeyExamId(null)}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nhập đáp án — {answerKeyExam?.title}</DialogTitle>
          </DialogHeader>
          {answerKeyExamId && (
            <AdminAnswerKeyForm
              examId={answerKeyExamId}
              questions={questions}
              solutionUrl={answerKeyExam?.solution_url}
              handwrittenUrl={answerKeyExam?.handwritten_url}
              onSaved={() => { onRefresh() }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Settings dialog: Drive URL + buff lượt */}
      <Dialog open={settings !== null} onOpenChange={(v) => !v && setSettings(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Cài đặt đề thi</DialogTitle>
          </DialogHeader>
          {settings && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Link Google Drive (đề thi PDF)</label>
                <input
                  type="url"
                  value={settings.driveUrl}
                  onChange={(e) => setSettings((s) => s ? { ...s, driveUrl: e.target.value } : s)}
                  placeholder="https://drive.google.com/file/d/..."
                  className="h-9 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
                <p className="text-xs text-muted-foreground">File Drive phải bật chia sẻ &quot;Bất kỳ ai có liên kết&quot;</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Số lượt thi hiển thị</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={settings.buffValue}
                    onChange={(e) => setSettings((s) => s ? { ...s, buffValue: e.target.value } : s)}
                    className="h-9 w-28 rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                  <span className="text-sm text-muted-foreground">lượt</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" onClick={() => setSettings(null)} disabled={settingsSaving}>Hủy</Button>
                <Button onClick={saveSettings} disabled={settingsSaving} className="gap-2">
                  {settingsSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Lưu
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
