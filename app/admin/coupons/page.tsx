'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, Plus, Trash2, ToggleLeft, ToggleRight, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { formatDate } from '@/lib/utils'

interface Coupon {
  id: string
  code: string
  discount_percent: number
  max_uses: number
  used_count: number
  valid_from: string
  valid_until: string | null
  is_active: boolean
  created_at: string
}

function genCode() {
  const prefixes = ['THPTQG', 'TOANHOC', 'GIASU', 'VIP', 'NGOCTHAI']
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
  const suffix = Math.floor(1000 + Math.random() * 9000)
  return `${prefix}${suffix}`
}

export default function AdminCouponsPage() {
  const { toast } = useToast()
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)

  const [code, setCode] = useState('')
  const [discountPercent, setDiscountPercent] = useState('20')
  const [maxUses, setMaxUses] = useState('100')
  const [validUntil, setValidUntil] = useState('')
  const [creating, setCreating] = useState(false)

  const fetchCoupons = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/coupons')
      const data = await res.json()
      setCoupons(data.coupons ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchCoupons() }, [fetchCoupons])

  async function handleCreate() {
    if (!code.trim()) { toast({ title: 'Nhập mã coupon', variant: 'destructive' }); return }
    const disc = parseInt(discountPercent)
    if (!disc || disc < 1 || disc > 100) { toast({ title: 'Giảm % phải từ 1-100', variant: 'destructive' }); return }

    setCreating(true)
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim(),
          discount_percent: disc,
          max_uses: parseInt(maxUses) || 1,
          valid_until: validUntil || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast({ title: `Tạo coupon ${code.trim().toUpperCase()} thành công` })
      setCode('')
      fetchCoupons()
    } catch (e) {
      toast({ title: 'Lỗi', description: e instanceof Error ? e.message : 'Thử lại', variant: 'destructive' })
    } finally {
      setCreating(false)
    }
  }

  async function toggleActive(coupon: Coupon) {
    const res = await fetch(`/api/admin/coupons/${coupon.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !coupon.is_active }),
    })
    if (res.ok) {
      setCoupons((prev) => prev.map((c) => c.id === coupon.id ? { ...c, is_active: !c.is_active } : c))
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Xóa coupon này?')) return
    const res = await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setCoupons((prev) => prev.filter((c) => c.id !== id))
      toast({ title: 'Đã xóa coupon' })
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-zinc-100">Coupon</h1>

      {/* Create form */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <h2 className="text-sm font-semibold text-zinc-200 mb-3">Tạo coupon mới</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-zinc-400">Mã coupon</label>
            <div className="flex gap-1">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="THPTQG2027"
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
            <label className="text-xs text-zinc-400">Giảm %</label>
            <Input
              type="number"
              min="1"
              max="100"
              value={discountPercent}
              onChange={(e) => setDiscountPercent(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-zinc-100"
            />
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
          Tạo coupon
        </Button>
      </div>

      {/* Coupon list */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-xs text-zinc-400">
              <th className="px-4 py-2.5 text-left font-medium">Code</th>
              <th className="px-4 py-2.5 text-center font-medium">Giảm %</th>
              <th className="px-4 py-2.5 text-center font-medium">Đã dùng / Tối đa</th>
              <th className="px-4 py-2.5 text-left font-medium">Hết hạn</th>
              <th className="px-4 py-2.5 text-center font-medium">Trạng thái</th>
              <th className="px-4 py-2.5 text-center font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {loading ? (
              <tr><td colSpan={6} className="py-12 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-zinc-500" /></td></tr>
            ) : coupons.length === 0 ? (
              <tr><td colSpan={6} className="py-12 text-center text-zinc-500">Chưa có coupon</td></tr>
            ) : (
              coupons.map((c) => (
                <tr key={c.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-4 py-2.5">
                    <span className="font-mono font-bold text-zinc-100">{c.code}</span>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span className="text-green-400 font-bold">{c.discount_percent}%</span>
                  </td>
                  <td className="px-4 py-2.5 text-center text-zinc-300">
                    <span className={c.used_count >= c.max_uses ? 'text-red-400' : ''}>
                      {c.used_count} / {c.max_uses}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-zinc-400 text-xs">
                    {c.valid_until
                      ? (new Date(c.valid_until) < new Date()
                        ? <span className="text-red-400">Hết hạn {formatDate(c.valid_until).slice(0, 10)}</span>
                        : formatDate(c.valid_until).slice(0, 10))
                      : <span className="text-zinc-500">Vĩnh viễn</span>
                    }
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <button onClick={() => toggleActive(c)} className="transition-colors">
                      {c.is_active
                        ? <ToggleRight className="h-5 w-5 text-green-400" />
                        : <ToggleLeft className="h-5 w-5 text-zinc-600" />
                      }
                    </button>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <button
                      onClick={() => handleDelete(c.id)}
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
