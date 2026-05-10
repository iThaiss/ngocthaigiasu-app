'use client'

import { useEffect, useState } from 'react'
import { HelpCircle, Users, TrendingUp, AlertCircle, FileCheck, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Stats {
  totalQuestions: number
  totalStudents: number
  noAnswerQuestions: number
  docsCompleted: number
  monthlyRevenue: number
  recentDocs: {
    id: string
    filename: string
    source: string
    total_pages: number
    status: string
    created_at: string
  }[]
}

const STATUS_BADGE: Record<string, string> = {
  completed: 'bg-green-500/15 text-green-400',
  processing: 'bg-yellow-500/15 text-yellow-400',
  failed: 'bg-red-500/15 text-red-400',
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then(setStats)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    )
  }

  const cards = [
    { label: 'Tổng câu hỏi', value: stats?.totalQuestions ?? 0, icon: HelpCircle, color: 'text-blue-400' },
    { label: 'Học sinh', value: stats?.totalStudents ?? 0, icon: Users, color: 'text-green-400' },
    { label: 'Doanh thu tháng', value: formatCurrency(stats?.monthlyRevenue ?? 0), icon: TrendingUp, color: 'text-yellow-400', raw: true },
    { label: 'Câu hỏi thiếu đáp án', value: stats?.noAnswerQuestions ?? 0, icon: AlertCircle, color: 'text-red-400' },
    { label: 'Tài liệu đã xử lý', value: stats?.docsCompleted ?? 0, icon: FileCheck, color: 'text-purple-400' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-zinc-100">Tổng quan</h1>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`h-4 w-4 ${card.color}`} />
                <p className="text-xs text-zinc-400">{card.label}</p>
              </div>
              <p className={`text-xl font-bold ${card.color}`}>
                {card.raw ? card.value : card.value.toLocaleString('vi-VN')}
              </p>
            </div>
          )
        })}
      </div>

      {/* Recent documents */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900">
        <div className="px-4 py-3 border-b border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-200">10 tài liệu mới nhất</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 text-xs">
                <th className="px-4 py-2.5 text-left font-medium">Tên file</th>
                <th className="px-4 py-2.5 text-left font-medium">Nguồn</th>
                <th className="px-4 py-2.5 text-center font-medium">Trang</th>
                <th className="px-4 py-2.5 text-center font-medium">Trạng thái</th>
                <th className="px-4 py-2.5 text-left font-medium">Ngày tạo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {(stats?.recentDocs ?? []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">Chưa có dữ liệu</td>
                </tr>
              ) : (
                (stats?.recentDocs ?? []).map((doc) => (
                  <tr key={doc.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-4 py-2.5 text-zinc-200 max-w-xs truncate">{doc.filename}</td>
                    <td className="px-4 py-2.5 text-zinc-400">{doc.source ?? '—'}</td>
                    <td className="px-4 py-2.5 text-center text-zinc-400">{doc.total_pages ?? '—'}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[doc.status] ?? 'bg-zinc-700 text-zinc-300'}`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-zinc-400 text-xs">{formatDate(doc.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
