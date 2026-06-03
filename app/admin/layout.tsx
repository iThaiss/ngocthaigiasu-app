'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  LayoutDashboard, HelpCircle, FileText, Users, CreditCard, Ticket,
  LogOut, Shield, Menu, X, ChevronRight, GraduationCap, ImageOff, MessageSquareWarning, FileStack, BookmarkCheck, Bot, Layers,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/admin', label: 'Tổng quan', icon: LayoutDashboard, exact: true },
  { href: '/admin/learning', label: 'Học Tập', icon: GraduationCap },
  { href: '/admin/questions', label: 'Câu hỏi', icon: HelpCircle },
  { href: '/admin/ai-review', label: 'Duyệt AI', icon: Bot },
  { href: '/admin/standard-exams', label: 'Bộ đề chuẩn', icon: FileStack },
  { href: '/admin/question-reports', label: 'Báo lỗi câu', icon: MessageSquareWarning },
  { href: '/admin/saved-questions', label: 'Câu HS lưu', icon: BookmarkCheck },
  { href: '/admin/visual-review', label: 'Review hình', icon: ImageOff },
  { href: '/admin/question-review', label: 'Swipe Duyệt', icon: Layers },
  { href: '/admin/documents', label: 'Tài liệu', icon: FileText },
  { href: '/admin/students', label: 'Học sinh', icon: Users },
  { href: '/admin/transactions', label: 'Giao dịch', icon: CreditCard },
  { href: '/admin/coupons', label: 'Coupon', icon: Ticket },
]

function AdminSidebar({ open, onClose }: { open?: boolean; onClose?: () => void }) {
  const pathname = usePathname()
  const { data: session } = useSession()

  return (
    <div className="flex h-full flex-col bg-zinc-900 text-zinc-100 w-56">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-zinc-800">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Shield className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold">Admin Panel</p>
          <p className="text-[10px] text-zinc-400 truncate max-w-[100px]">{session?.user?.email ?? ''}</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="ml-auto text-zinc-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {NAV.map((item) => {
          const Icon = item.icon
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-white'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-zinc-800 p-3 space-y-1">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-md px-3 py-2 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
        >
          <ChevronRight className="h-3.5 w-3.5" />
          Về Dashboard
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-red-400 transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          Đăng xuất
        </button>
      </div>
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col h-full shrink-0 border-r border-zinc-800">
        <AdminSidebar />
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full">
            <AdminSidebar open onClose={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Mobile header */}
        <header className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800 md:hidden">
          <button onClick={() => setMobileOpen(true)} className="text-zinc-400 hover:text-white">
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-semibold text-sm">Admin Panel</span>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
