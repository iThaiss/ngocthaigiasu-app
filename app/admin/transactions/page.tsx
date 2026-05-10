'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Loader2, Download, TrendingUp, TrendingDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDate, formatCurrency } from '@/lib/utils'

interface Transaction {
  id: string
  user_id: string
  amount: number
  type: string
  status: string
  reference_code: string | null
  created_at: string
  users: { email: string; name: string | null } | null
}

interface StatsData {
  transactions: Transaction[]
  total: number
  totalPages: number
  thisMonthRevenue: number
  lastMonthRevenue: number
}

const STATUS_STYLE: Record<string, string> = {
  completed: 'bg-green-500/15 text-green-400',
  pending: 'bg-yellow-500/15 text-yellow-400',
  failed: 'bg-red-500/15 text-red-400',
}

export default function AdminTransactionsPage() {
  const [data, setData] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [monthFilter, setMonthFilter] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        ...(statusFilter && { status: statusFilter }),
        ...(typeFilter && { type: typeFilter }),
        ...(monthFilter && { month: monthFilter }),
      })
      const res = await fetch(`/api/admin/transactions?${params}`)
      const json = await res.json()
      setData(json)
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, typeFilter, monthFilter])

  useEffect(() => { fetchData() }, [fetchData])

  function exportCSV() {
    if (!data?.transactions.length) return
    const headers = ['ID', 'Email', 'Tên', 'Số tiền', 'Loại', 'Trạng thái', 'Mã tham chiếu', 'Ngày tạo']
    const rows = data.transactions.map((t) => [
      t.id,
      t.users?.email ?? '',
      t.users?.name ?? '',
      t.amount,
      t.type,
      t.status,
      t.reference_code ?? '',
      formatDate(t.created_at),
    ])
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-100">Giao dịch</h1>
        <Button size="sm" variant="outline" onClick={exportCSV} className="border-zinc-700 text-zinc-300 hover:text-zinc-100">
          <Download className="h-3.5 w-3.5 mr-1.5" /> Xuất CSV
        </Button>
      </div>

      {/* Revenue stats */}
      {data && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-green-400" />
              <p className="text-xs text-zinc-400">Doanh thu tháng này</p>
            </div>
            <p className="text-lg font-bold text-green-400">{formatCurrency(data.thisMonthRevenue * 1000)}</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="h-4 w-4 text-zinc-400" />
              <p className="text-xs text-zinc-400">Doanh thu tháng trước</p>
            </div>
            <p className="text-lg font-bold text-zinc-300">{formatCurrency(data.lastMonthRevenue * 1000)}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }}
          className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
        >
          <option value="">Tất cả loại</option>
          <option value="topup">Nạp tiền</option>
          <option value="subscribe">Đăng ký VIP</option>
        </select>
        <select
          value={monthFilter}
          onChange={(e) => { setMonthFilter(e.target.value); setPage(1) }}
          className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
        >
          <option value="">Tất cả tháng</option>
          {months.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-xs text-zinc-400">
              <th className="px-4 py-2.5 text-left font-medium">Email</th>
              <th className="px-4 py-2.5 text-right font-medium">Số tiền</th>
              <th className="px-4 py-2.5 text-center font-medium">Loại</th>
              <th className="px-4 py-2.5 text-center font-medium">Trạng thái</th>
              <th className="px-4 py-2.5 text-left font-medium">Mã tham chiếu</th>
              <th className="px-4 py-2.5 text-left font-medium">Ngày tạo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {loading ? (
              <tr><td colSpan={6} className="py-12 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-zinc-500" /></td></tr>
            ) : (data?.transactions ?? []).length === 0 ? (
              <tr><td colSpan={6} className="py-12 text-center text-zinc-500">Không có giao dịch</td></tr>
            ) : (
              (data?.transactions ?? []).map((t) => (
                <tr key={t.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-4 py-2.5">
                    <p className="text-zinc-200 text-xs">{t.users?.email ?? t.user_id.slice(0, 8) + '...'}</p>
                    {t.users?.name && <p className="text-zinc-500 text-[10px]">{t.users.name}</p>}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono font-medium text-yellow-400">
                    {formatCurrency(t.amount * 1000)}
                  </td>
                  <td className="px-4 py-2.5 text-center text-zinc-400 text-xs">{t.type}</td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[t.status] ?? 'bg-zinc-700 text-zinc-300'}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-zinc-400">{t.reference_code ?? '—'}</td>
                  <td className="px-4 py-2.5 text-zinc-500 text-xs">{formatDate(t.created_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {(data?.totalPages ?? 1) > 1 && (
        <div className="flex items-center justify-between text-sm text-zinc-400">
          <span>Trang {page}/{data?.totalPages}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => setPage(p => Math.min(data?.totalPages ?? 1, p + 1))} disabled={page === (data?.totalPages ?? 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
