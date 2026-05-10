'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, ChevronLeft, ChevronRight, Loader2, Gift } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { formatDate } from '@/lib/utils'

interface Student {
  id: string
  name: string | null
  email: string
  province: string | null
  school: string | null
  is_vip: boolean
  vip_expires_at: string | null
  created_at: string
  points: number
  phone: string | null
}

function maskEmail(email: string) {
  const [local, domain] = email.split('@')
  if (local.length <= 3) return `${local[0]}***@${domain}`
  return `${local.slice(0, 3)}***@${domain}`
}

export default function AdminStudentsPage() {
  const { toast } = useToast()
  const [students, setStudents] = useState<Student[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [vipFilter, setVipFilter] = useState('')

  const [selected, setSelected] = useState<Student | null>(null)
  const [giftPoints, setGiftPoints] = useState('')
  const [giftReason, setGiftReason] = useState('')
  const [gifting, setGifting] = useState(false)

  const fetchStudents = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        ...(search && { search }),
        ...(vipFilter && { vip: vipFilter }),
      })
      const res = await fetch(`/api/admin/students?${params}`)
      const data = await res.json()
      setStudents(data.students ?? [])
      setTotal(data.total ?? 0)
      setTotalPages(data.totalPages ?? 1)
    } finally {
      setLoading(false)
    }
  }, [page, search, vipFilter])

  useEffect(() => { fetchStudents() }, [fetchStudents])

  async function handleGift() {
    if (!selected) return
    const pts = parseInt(giftPoints)
    if (!pts || pts <= 0) {
      toast({ title: 'Số điểm không hợp lệ', variant: 'destructive' })
      return
    }
    if (!giftReason.trim()) {
      toast({ title: 'Vui lòng nhập lý do', variant: 'destructive' })
      return
    }
    setGifting(true)
    try {
      const res = await fetch(`/api/admin/students/${selected.id}/gift`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ points: pts, reason: giftReason }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast({ title: `Đã tặng ${pts} điểm cho ${selected.name ?? selected.email}` })
      setGiftPoints('')
      setGiftReason('')
      setSelected((prev) => prev ? { ...prev, points: data.newPoints } : null)
      fetchStudents()
    } catch (e) {
      toast({ title: 'Lỗi', description: e instanceof Error ? e.message : 'Thử lại', variant: 'destructive' })
    } finally {
      setGifting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-100">Học sinh</h1>
        <span className="text-sm text-zinc-400">{total.toLocaleString('vi-VN')} học sinh</span>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
          <Input
            className="pl-8 bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
            placeholder="Tìm theo tên, email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <select
          value={vipFilter}
          onChange={(e) => { setVipFilter(e.target.value); setPage(1) }}
          className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
        >
          <option value="">Tất cả</option>
          <option value="vip">VIP</option>
          <option value="nonvip">Non-VIP</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-xs text-zinc-400">
              <th className="px-4 py-2.5 text-left font-medium">Tên</th>
              <th className="px-4 py-2.5 text-left font-medium">Email</th>
              <th className="px-4 py-2.5 text-left font-medium">Tỉnh</th>
              <th className="px-4 py-2.5 text-left font-medium">Trường</th>
              <th className="px-4 py-2.5 text-center font-medium">VIP</th>
              <th className="px-4 py-2.5 text-center font-medium">Điểm</th>
              <th className="px-4 py-2.5 text-left font-medium">Đăng ký</th>
              <th className="px-4 py-2.5 text-center font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {loading ? (
              <tr><td colSpan={8} className="py-12 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-zinc-500" /></td></tr>
            ) : students.length === 0 ? (
              <tr><td colSpan={8} className="py-12 text-center text-zinc-500">Không có học sinh</td></tr>
            ) : (
              students.map((s) => (
                <tr key={s.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-4 py-2.5 text-zinc-200">{s.name ?? '—'}</td>
                  <td className="px-4 py-2.5 text-zinc-400 font-mono text-xs">{maskEmail(s.email)}</td>
                  <td className="px-4 py-2.5 text-zinc-400 text-xs">{s.province ?? '—'}</td>
                  <td className="px-4 py-2.5 text-zinc-400 text-xs max-w-[120px] truncate">{s.school ?? '—'}</td>
                  <td className="px-4 py-2.5 text-center">
                    {s.is_vip
                      ? <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-yellow-500/15 text-yellow-400">VIP</span>
                      : <span className="text-zinc-600 text-xs">—</span>
                    }
                  </td>
                  <td className="px-4 py-2.5 text-center font-mono text-yellow-400 font-medium">{s.points}</td>
                  <td className="px-4 py-2.5 text-zinc-500 text-xs">{formatDate(s.created_at).slice(0, 10)}</td>
                  <td className="px-4 py-2.5 text-center">
                    <button
                      onClick={() => setSelected(s)}
                      className="p-1 text-zinc-400 hover:text-primary transition-colors"
                      title="Chi tiết & tặng điểm"
                    >
                      <Gift className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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

      {/* Detail modal */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-md bg-zinc-900 border-zinc-800 text-zinc-100">
          <DialogHeader>
            <DialogTitle>Chi tiết học sinh</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 text-sm">
              <div className="rounded-lg bg-zinc-800 p-3 space-y-2">
                <Row label="Tên" value={selected.name ?? '—'} />
                <Row label="Email" value={selected.email} />
                <Row label="SĐT" value={selected.phone ?? '—'} />
                <Row label="Tỉnh" value={selected.province ?? '—'} />
                <Row label="Trường" value={selected.school ?? '—'} />
                <Row label="VIP" value={selected.is_vip ? `Có (hết hạn: ${selected.vip_expires_at ? formatDate(selected.vip_expires_at).slice(0, 10) : '?'})` : 'Không'} />
                <Row label="Điểm ví" value={`${selected.points} điểm`} />
                <Row label="Ngày đăng ký" value={formatDate(selected.created_at).slice(0, 10)} />
              </div>

              {/* Gift points */}
              <div className="rounded-lg border border-zinc-700 p-3 space-y-3">
                <p className="text-xs font-semibold text-zinc-300">Tặng điểm</p>
                <div className="space-y-2">
                  <input
                    type="number"
                    min="1"
                    value={giftPoints}
                    onChange={(e) => setGiftPoints(e.target.value)}
                    placeholder="Số điểm"
                    className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-500"
                  />
                  <input
                    value={giftReason}
                    onChange={(e) => setGiftReason(e.target.value)}
                    placeholder="Lý do (bắt buộc)"
                    className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-500"
                  />
                </div>
                <Button size="sm" onClick={handleGift} disabled={gifting} className="w-full">
                  {gifting && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                  <Gift className="mr-1 h-3.5 w-3.5" /> Tặng điểm
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-zinc-500 shrink-0">{label}</span>
      <span className="text-zinc-200 text-right">{value}</span>
    </div>
  )
}
