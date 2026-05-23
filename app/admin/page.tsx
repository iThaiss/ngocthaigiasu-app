'use client'

import { useEffect, useState } from 'react'
import { HelpCircle, Users, TrendingUp, AlertCircle, FileCheck, Loader2, ImageOff, Bot, MessageSquareWarning, BookmarkCheck } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'

interface ChartItem { [key: string]: string | number }

interface Stats {
  totalQuestions: number
  totalStudents: number
  noAnswerQuestions: number
  docsCompleted: number
  needsVisualCount: number
  aiReviewCount: number
  openReportsCount: number
  savedQuestionsCount: number
  monthlyRevenue: number
  recentDocs: {
    id: string
    filename: string
    source: string
    total_pages: number
    status: string
    created_at: string
  }[]
  charts: {
    byGrade: { grade: string; count: number }[]
    byDifficulty: { difficulty: string; count: number }[]
    byType: { type: string; count: number }[]
    topTopics: { topic: string; count: number }[]
    pipeline: { status: string; count: number }[]
  }
}

const STATUS_BADGE: Record<string, string> = {
  completed: 'bg-green-500/15 text-green-400',
  processing: 'bg-yellow-500/15 text-yellow-400',
  failed: 'bg-red-500/15 text-red-400',
}

const DIFF_COLOR: Record<string, string> = {
  'Nhận biết': 'bg-green-500',
  'Thông hiểu': 'bg-blue-500',
  'Vận dụng': 'bg-yellow-500',
  'Vận dụng cao': 'bg-red-500',
}

const TYPE_COLOR: Record<string, string> = {
  multiple_choice: 'bg-blue-500',
  true_false: 'bg-purple-500',
  short_answer: 'bg-teal-500',
  theory: 'bg-zinc-500',
  example: 'bg-zinc-600',
}

const TYPE_LABEL: Record<string, string> = {
  multiple_choice: 'Trắc nghiệm',
  true_false: 'Đúng/Sai',
  short_answer: 'Trả lời ngắn',
  theory: 'Lý thuyết',
  example: 'Ví dụ',
}

function BarChart({ data, labelKey, valueKey, colorFn }: {
  data: ChartItem[]
  labelKey: string
  valueKey: string
  colorFn?: (item: ChartItem) => string
}) {
  const max = Math.max(...data.map(d => d[valueKey] as number), 1)
  return (
    <div className="space-y-2">
      {data.map((item, i) => {
        const pct = Math.round(((item[valueKey] as number) / max) * 100)
        const color = colorFn ? colorFn(item) : 'bg-primary'
        return (
          <div key={i} className="flex items-center gap-3">
            <span className="text-xs text-zinc-400 w-32 shrink-0 truncate">{item[labelKey]}</span>
            <div className="flex-1 h-4 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${color}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs text-zinc-300 w-10 text-right shrink-0">
              {(item[valueKey] as number).toLocaleString('vi-VN')}
            </span>
          </div>
        )
      })}
    </div>
  )
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
    { label: 'Câu thiếu đáp án', value: stats?.noAnswerQuestions ?? 0, icon: AlertCircle, color: 'text-red-400' },
    { label: 'Tài liệu đã xử lý', value: stats?.docsCompleted ?? 0, icon: FileCheck, color: 'text-purple-400' },
    { label: 'Câu cần hình', value: stats?.needsVisualCount ?? 0, icon: ImageOff, color: 'text-orange-400', href: '/admin/visual-review' },
    { label: 'AI chờ duyệt', value: stats?.aiReviewCount ?? 0, icon: Bot, color: 'text-purple-300', href: '/admin/ai-review' },
    { label: 'Báo lỗi mở', value: stats?.openReportsCount ?? 0, icon: MessageSquareWarning, color: 'text-red-300', href: '/admin/question-reports' },
    { label: 'Câu HS lưu', value: stats?.savedQuestionsCount ?? 0, icon: BookmarkCheck, color: 'text-emerald-300', href: '/admin/saved-questions' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-zinc-100">Tổng quan</h1>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {cards.map((card) => {
          const Icon = card.icon
          const inner = (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 hover:border-zinc-700 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`h-4 w-4 ${card.color}`} />
                <p className="text-xs text-zinc-400">{card.label}</p>
              </div>
              <p className={`text-xl font-bold ${card.color}`}>
                {card.raw ? card.value : (card.value as number).toLocaleString('vi-VN')}
              </p>
            </div>
          )
          return card.href
            ? <Link key={card.label} href={card.href}>{inner}</Link>
            : <div key={card.label}>{inner}</div>
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* By grade */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <h3 className="text-sm font-semibold text-zinc-200 mb-4">Phân bổ theo lớp</h3>
          {(stats?.charts.byGrade ?? []).length === 0
            ? <p className="text-xs text-zinc-500">Chưa có dữ liệu</p>
            : <BarChart
                data={stats!.charts.byGrade}
                labelKey="grade"
                valueKey="count"
                colorFn={() => 'bg-blue-500'}
              />
          }
        </div>

        {/* By difficulty */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <h3 className="text-sm font-semibold text-zinc-200 mb-4">Phân bổ độ khó</h3>
          {(stats?.charts.byDifficulty ?? []).length === 0
            ? <p className="text-xs text-zinc-500">Chưa có dữ liệu</p>
            : <BarChart
                data={stats!.charts.byDifficulty}
                labelKey="difficulty"
                valueKey="count"
                colorFn={(item) => DIFF_COLOR[item.difficulty as string] ?? 'bg-zinc-500'}
              />
          }
        </div>

        {/* By type */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <h3 className="text-sm font-semibold text-zinc-200 mb-4">Loại câu hỏi</h3>
          {(stats?.charts.byType ?? []).length === 0
            ? <p className="text-xs text-zinc-500">Chưa có dữ liệu</p>
            : <BarChart
                data={stats!.charts.byType.map(d => ({ ...d, typeLabel: TYPE_LABEL[d.type] ?? d.type }))}
                labelKey="typeLabel"
                valueKey="count"
                colorFn={(item) => TYPE_COLOR[item.type as string] ?? 'bg-zinc-500'}
              />
          }
        </div>

        {/* Pipeline status */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <h3 className="text-sm font-semibold text-zinc-200 mb-4">Trạng thái pipeline</h3>
          {(stats?.charts.pipeline ?? []).length === 0
            ? <p className="text-xs text-zinc-500">Chưa có dữ liệu</p>
            : <BarChart
                data={stats!.charts.pipeline}
                labelKey="status"
                valueKey="count"
                colorFn={(item) => ({
                  completed: 'bg-green-500',
                  processing: 'bg-yellow-500',
                  failed: 'bg-red-500',
                }[item.status as string] ?? 'bg-zinc-500')}
              />
          }
        </div>
      </div>

      {/* Top topics */}
      {(stats?.charts.topTopics ?? []).length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <h3 className="text-sm font-semibold text-zinc-200 mb-4">Top 10 chủ đề nhiều câu nhất</h3>
          <BarChart
            data={stats!.charts.topTopics}
            labelKey="topic"
            valueKey="count"
            colorFn={() => 'bg-primary'}
          />
        </div>
      )}

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
