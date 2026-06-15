'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, Plus, Trash2, ToggleLeft, ToggleRight, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { formatDate } from '@/lib/utils'
import { VIP_PLANS, PlanId } from '@/lib/plans'

interface GiftCode {
  id: string
  code: string
  vip_plan_id: string
  plan_subject: string
  duration_days: number
  max_uses: number
  used_count: number
  valid_until: string | null
  is_active: boolean
  created_at: string
}

const CODE_PREFIXES = ['GIFT', 'TANGVIP', 'FREEVIP', 'QUATANG', 'BONUS']

function genCode() {
  const prefix = CODE_PREFIXES[Math.floor(Math.random() * CODE_PREFIXES.length)]
  const suffix = Math.floor(1000 + Math.random() * 9000)
  return `${prefix}${suffix}`
}

const PLAN_OPTIONS = (Object.keys(VIP_PLANS) as PlanId[])
  .filter((id) => !['monthly', 'yearly'].includes(id))
  .map((id) => ({
    value: id,
    label: VIP_PLANS[id].displayName + ` (${VIP_PLANS[id].durationDays} ngày)`,
  }))

export default function AdminGiftCodesPage() {
  const { toast } = useToast()
  const [giftCodes, setGiftCodes] = useState<GiftCode[]>([])
  const [loading, setLoading] = useState(true)

  const [code, setCode] = useState('')
  const [vipPlanId, setVipPlanId] = useState<PlanId>('combo_1week')
  const [maxUses, setMaxUses] = useState('1')
  const [validUntil, setValidUntil] = useState('')
  const [creating, setCreating] = useState(false)

  const fetchGiftCodes = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/gift-codes')
      const data = await res.json()
      setGiftCodes(data.giftCodes ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchGiftCodes() }, [fetchGiftCodes])

  async function handleCreate() {
    if (!code.trim()) { toast({ title: 'Nhập mã quà tặng', variant: 'destructive' }); return }

    setCreating(true)
    try {
      const res = await fetch('/api/admin/gift-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim(),
          vip_plan_id: vipPlanId,
          max_uses: parseInt(maxUses) || 1,
          valid_until: validUntil || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast({ title: `Tạo mã ${code.trim().toUpperCase()} thành công` })
      setCode('')
      fetchGiftCodes()
    } catch (e) {
      toast({ title: 'Lỗi', description: e instanceof Error ? e.message : 'Thử lại', variant: 'destructive' })
    } finally {
      setCreating(false)
    }
  }

  async function toggleActive(gc: GiftCode) {
    const res = await fetch(`/api/admin/gift-codes/${gc.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !gc.is_active }),
    })
    if (res.ok) {
      setGiftCodes((prev) => prev.map((c) => c.id === gc.id ? { ...c, is_active: !c.is_active } : c))
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Xóa mã quà tặng này?')) return
    const res = await fetch(`/api/admin/gift-codes/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setGiftCodes((prev) => prev.filter((c) => c.id !== id))
      toast({ title: 'Đã xóa mã quà tặng' })
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-zinc-100">Mã quà tặng</h1>

      {/* Create form */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <h2 className="text-sm font-semibold text-zinc-200 mb-3">Tạo mã quà tặng mới</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-zinc-400">Mã code</label>
            <div className="flex gap-1">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="TANGVIP2025"
                className="bg-zinc-800 border-zinc-700 text-zinc-100 uppercase"
              />
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setCode(genCode())}
                className="shrink-0 text-zinc-400 hover:text-zinc-100"
                title="Tự gen"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-zinc-400">Gói VIP</label>
            <select
              value={vipPlanId}
              onChange={(e) => setVipPlanId(e.target.value as PlanId)}
              className="w-full h-9 rounded-md border border-zinc-700 bg-zinc-800 px-3 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {PLAN_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-zinc-400">Số lần dùng tối đa</label>
            <Input
              type="number"
              min="1"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-zinc-100"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-zinc-400">Hết hạn (để trống = vĩnh viễn)</label>
            <Input
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-zinc-100"
            />
          </div>
        </div>
        <Button size="sm" onClick={handleCreate} disabled={creating} className="mt-3">
          {creating ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Plus className="mr-1 h-3 w-3" />}
          Tạo mã quà tặng
        </Button>
      </div>

      {/* List */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-xs text-zinc-400">
              <th className="px-4 py-2.5 text-left font-medium">Code</th>
              <th className="px-4 py-2.5 text-left font-medium">Gói VIP</th>
              <th className="px-4 py-2.5 text-center font-medium">Thời hạn</th>
              <th className="px-4 py-2.5 text-center font-medium">Đã dùng / Tối đa</th>
              <th className="px-4 py-2.5 text-left font-medium">Hết hạn mã</th>
              <th className="px-4 py-2.5 text-center font-medium">Trạng thái</th>
              <th className="px-4 py-2.5 text-center font-medium">Xóa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {loading ? (
              <tr><td colSpan={7} className="py-12 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-zinc-500" /></td></tr>
            ) : giftCodes.length === 0 ? (
              <tr><td colSpan={7} className="py-12 text-center text-zinc-500">Chưa có mã quà tặng nào</td></tr>
            ) : (
              giftCodes.map((gc) => (
                <tr key={gc.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-4 py-2.5">
                    <span className="font-mono font-bold text-zinc-100">{gc.code}</span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-zinc-300">
                    {VIP_PLANS[gc.vip_plan_id as PlanId]?.displayName ?? gc.vip_plan_id}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span className="text-rose-400 font-bold">{gc.duration_days} ngày</span>
                  </td>
                  <td className="px-4 py-2.5 text-center text-zinc-300">
                    <span className={gc.used_count >= gc.max_uses ? 'text-red-400' : ''}>
                      {gc.used_count} / {gc.max_uses}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-zinc-400 text-xs">
                    {gc.valid_until
                      ? (new Date(gc.valid_until) < new Date()
                        ? <span className="text-red-400">Hết hạn {formatDate(gc.valid_until).slice(0, 10)}</span>
                        : formatDate(gc.valid_until).slice(0, 10))
                      : <span className="text-zinc-500">Vĩnh viễn</span>
                    }
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <button onClick={() => toggleActive(gc)} className="transition-colors">
                      {gc.is_active
                        ? <ToggleRight className="h-5 w-5 text-green-400" />
                        : <ToggleLeft className="h-5 w-5 text-zinc-600" />
                      }
                    </button>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <button
                      onClick={() => handleDelete(gc.id)}
                      className="p-1 text-zinc-600 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
