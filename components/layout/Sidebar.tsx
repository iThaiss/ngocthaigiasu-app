'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, User, Brain, FileText,
  BookOpen, LogOut, ChevronLeft, ChevronRight, Menu, X,
  Crown, GraduationCap, Target, Languages, Sparkles, Users, BookMarked, BotMessageSquare,
  Video,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
}

const MATH_ITEMS: NavItem[] = [
  { href: '/dashboard/math', label: 'Tổng quan', icon: LayoutDashboard },
  { href: '/learning', label: 'Học Tập', icon: GraduationCap },
  { href: '/live', label: 'Lớp học Live', icon: Video },
  { href: '/solve', label: 'Giải toán AI', icon: Brain },
  { href: '/practice', label: 'Luyện tập', icon: Target },
  // Tạm ẩn chức năng Thi thử — sẽ phát triển sau (không xóa)
  // { href: '/exam', label: 'Thi thử', icon: FileText },
]

const ENGLISH_ITEMS: NavItem[] = [
  { href: '/dashboard/english', label: 'Tổng quan', icon: LayoutDashboard },
  { href: '/live', label: 'Lớp học Live', icon: Video },
  { href: '/vocabulary', label: 'Từ vựng', icon: Languages },
  { href: '/grammar', label: 'Ngữ pháp', icon: BookOpen },
  { href: '/reading', label: 'Đọc hiểu', icon: BookMarked },
  { href: '/english-feedback', label: 'Nhận xét AI', icon: BotMessageSquare },
  { href: '/vocabulary/ai', label: 'AI Tạo từ vựng', icon: Sparkles },
  { href: '/vocabulary/community', label: 'Cộng đồng', icon: Users },
]

interface SidebarProps {
  subject: 'math' | 'english' | null
}

export default function Sidebar({ subject }: SidebarProps) {
  const pathname = usePathname()
  const { user, role, isVip, logout } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Default to Math if subject is not explicitly set (e.g. on general settings page)
  const activeSubject = subject || 'math'
  const navItems = activeSubject === 'english' ? ENGLISH_ITEMS : MATH_ITEMS

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <Link
        href="/dashboard"
        className={cn(
          'flex items-center justify-center border-b border-border overflow-hidden w-full cursor-pointer transition-all hover:opacity-85 active:scale-95',
          collapsed ? 'p-2 h-16' : 'py-3 px-0 h-auto'
        )}
      >
        {collapsed ? (
          <img
            src="/square-logo.png"
            className="h-10 w-10 object-contain rounded-md"
            alt="Logo"
          />
        ) : (
          <>
            <img
              src="/logo-light.png"
              className="w-full h-auto object-contain block dark:hidden scale-[1.25] -translate-x-4"
              alt="Logo"
            />
            <img
              src="/logo-dark.png"
              className="w-full h-auto object-contain hidden dark:block scale-[1.25] -translate-x-4"
              alt="Logo"
            />
          </>
        )}
      </Link>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        <div className="mb-1">
          {!collapsed && (
            <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              {activeSubject === 'english' ? 'TIẾNG ANH' : 'TOÁN HỌC'}
            </p>
          )}
          {collapsed && <div className="my-1 border-t border-border/40" />}
          {navItems.map((item) => {
            const Icon = item.icon
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground',
                  active ? 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground' : 'text-muted-foreground',
                  collapsed && 'justify-center px-2'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && (
                  <span className="flex-1 truncate">{item.label}</span>
                )}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* User Info (Footer) */}
      <Link href="/profile" onClick={() => setMobileOpen(false)}>
        <div className={cn('flex items-center gap-3 p-3 border-t border-border hover:bg-accent/50 cursor-pointer transition-colors', collapsed && 'justify-center')}>
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? ''} />
            <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                {isVip && <Crown className="h-3 w-3 text-yellow-500 shrink-0" />}
              </div>
              <p className="text-xs text-muted-foreground truncate capitalize">{role}</p>
            </div>
          )}
        </div>
      </Link>
    </div>
  )

  return (
    <>
      {/* Mobile toggle */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "fixed top-2.5 z-50 md:hidden transition-all duration-300",
          mobileOpen ? "left-[272px] text-white bg-white/10 hover:bg-white/20" : "left-2.5 text-foreground"
        )}
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed left-0 top-0 z-50 h-full w-64 bg-card border-r border-border md:hidden"
          >
            <SidebarContent />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 240 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="hidden md:flex flex-col h-full bg-card border-r border-border relative"
      >
        <SidebarContent />
        <Button
          variant="outline"
          size="icon"
          className="absolute -right-3 top-20 z-10 h-6 w-6 rounded-full border shadow-sm"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </Button>
      </motion.aside>
    </>
  )
}
