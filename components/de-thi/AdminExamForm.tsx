'use client'

import { useState } from 'react'
import { Loader2, Link2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'

interface AdminExamFormProps {
  onCreated: (exam: { id: string; title: string }) => void
  onCancel: () => void
}

export default function AdminExamForm({ onCreated, onCancel }: AdminExamFormProps) {
  const [title, setTitle] = useState('')
  const [year, setYear] = useState<string>(String(new Date().getFullYear()))
  const [timeLimitMinutes, setTimeLimitMinutes] = useState('90')
  const [driveUrl, setDriveUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast({ title: 'Vui lòng nhập tiêu đề đề thi', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/de-thi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          year: year ? parseInt(year) : null,
          time_limit_minutes: parseInt(timeLimitMinutes) || 90,
          pdf_url: driveUrl.trim() || null,
          use_preset: true,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      const { exam } = await res.json()
      toast({ title: 'Đã tạo đề thi', description: 'Tiếp theo: nhập đáp án và publish', variant: 'success' as never })
      onCreated(exam)
    } catch (e) {
      toast({ title: 'Lỗi tạo đề thi', description: String(e), variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-sm font-medium">Tiêu đề đề thi *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ví dụ: Đề thi Tốt nghiệp THPT 2025 — Mã đề 123"
            className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Năm thi</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Thời gian thi (phút)</label>
          <input
            type="number"
            value={timeLimitMinutes}
            onChange={(e) => setTimeLimitMinutes(e.target.value)}
            className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium flex items-center gap-1.5">
          <Link2 className="h-3.5 w-3.5" /> Link Google Drive (đề thi PDF)
        </label>
        <input
          type="url"
          value={driveUrl}
          onChange={(e) => setDriveUrl(e.target.value)}
          placeholder="https://drive.google.com/file/d/..."
          className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <p className="text-xs text-muted-foreground">
          Paste link chia sẻ Google Drive — file phải được đặt chế độ &quot;Bất kỳ ai có liên kết&quot;
        </p>
      </div>

      <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground space-y-1">
        <p className="font-medium text-foreground">Cấu trúc đề tự động (THPT 2025 chuẩn)</p>
        <p>• Phần I: 12 câu trắc nghiệm A/B/C/D × 0.25đ = 3đ</p>
        <p>• Phần II: 4 câu đúng/sai (4 ý/câu) × max 1đ = 4đ</p>
        <p>• Phần III: 6 câu điền số × 0.5đ = 3đ</p>
        <p>• Tổng: 22 câu · 10 điểm · 90 phút</p>
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <Button variant="outline" onClick={onCancel} disabled={saving}>Hủy</Button>
        <Button onClick={handleSubmit} disabled={saving || !title.trim()} className="gap-2">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Tạo đề
        </Button>
      </div>
    </div>
  )
}
