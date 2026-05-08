'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'

const ROUTE_LABELS: Record<string, string> = {
  dashboard: 'Tổng quan',
  profile: 'Hồ sơ',
  solve: 'Giải toán AI',
  exam: 'Thi thử',
  questions: 'Câu hỏi',
  new: 'Tạo mới',
  notifications: 'Thông báo',
  payment: 'Nâng cấp VIP',
  affiliate: 'Hoa hồng',
}

export default function AppBreadcrumb() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  if (segments.length === 0) return null

  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground">
      <Link href="/dashboard" className="hover:text-foreground transition-colors">
        <Home className="h-3.5 w-3.5" />
      </Link>
      {segments.map((seg, idx) => {
        const href = '/' + segments.slice(0, idx + 1).join('/')
        const label = ROUTE_LABELS[seg] ?? seg
        const isLast = idx === segments.length - 1
        return (
          <span key={seg} className="flex items-center gap-1">
            <ChevronRight className="h-3 w-3" />
            {isLast ? (
              <span className="text-foreground font-medium">{label}</span>
            ) : (
              <Link href={href} className="hover:text-foreground transition-colors">{label}</Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
