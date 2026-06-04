'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, User, Brain, FileText, Bell, CreditCard,
  BookOpen, Library, LogOut, ChevronLeft, ChevronRight, Menu, X,
  Crown, GitBranch, CalendarDays, MessageCircle, Phone, GraduationCap,
  Target, BookmarkCheck, Languages, Sparkles, Users, BookMarked,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  roles?: string[]
  badge?: string
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'TOÁN HỌC',
    items: [
      { href: '/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
      { href: '/learning', label: 'Học Tập', icon: GraduationCap },
      { href: '/solve', label: 'Giải toán AI', icon: Brain },
      { href: '/practice', label: 'Luyện tập', icon: Target },
      { href: '/exam', label: 'Thi thử', icon: FileText },
    ],
  },
  {
    label: 'TIẾNG ANH',
    items: [
      { href: '/vocabulary', label: 'Từ vựng', icon: Languages },
      { href: '/grammar', label: 'Ngữ pháp', icon: BookOpen },
      { href: '/reading', label: 'Đọc hiểu', icon: BookMarked },
      { href: '/vocabulary/ai', label: 'AI Tạo từ vựng', icon: Sparkles },
      { href: '/vocabulary/community', label: 'Cộng đồng', icon: Users },
    ],
  },
  {
    label: 'CHUNG',
    items: [
      { href: '/saved-questions', label: 'Câu cần ôn', icon: BookmarkCheck },
      { href: '/payment', label: 'Nâng cấp VIP', icon: CreditCard },
      { href: '/documents', label: 'Tài liệu', icon: Library },
      { href: '/schedule', label: 'Lịch học', icon: CalendarDays },
      { href: '/chat', label: 'Chat cộng đồng', icon: MessageCircle },
      { href: '/questions', label: 'Câu hỏi', icon: BookOpen, roles: ['teacher', 'admin'] },
      { href: '/notifications', label: 'Thông báo', icon: Bell },
      { href: '/affiliate', label: 'Hoa hồng', icon: GitBranch },
      { href: '/contact', label: 'Liên hệ', icon: Phone },
      { href: '/profile', label: 'Hồ sơ', icon: User },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { user, role, isVip, logout } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className={cn('flex items-center gap-3 p-4 border-b border-border', collapsed && 'justify-center')}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-sm">
          NT
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="font-bold text-sm truncate">ngocthaigiasu</p>
            <p className="text-xs text-muted-foreground truncate">.id.vn</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {NAV_GROUPS.map((group) => {
          const visibleItems = group.items.filter(
            (item) => !item.roles || item.roles.includes(role)
          )
          if (visibleItems.length === 0) return null
          return (
            <div key={group.label} className="mb-1">
              {!collapsed && (
                <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                  {group.label}
                </p>
              )}
              {collapsed && <div className="my-1 border-t border-border/40" />}
              {visibleItems.map((item) => {
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
                    {!collapsed && item.badge && (
                      <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0 h-4 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-0">
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                )
              })}
            </div>
          )
        })}
      </nav>

      {/* User */}
      <div className={cn('flex items-center gap-3 p-3 border-t border-border', collapsed && 'justify-center')}>
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
        {!collapsed && (
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={logout}>
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
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
