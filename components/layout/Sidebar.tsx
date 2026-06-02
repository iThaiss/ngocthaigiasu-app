'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, User, Brain, FileText, Bell, CreditCard,
  BookOpen, Library, LogOut, ChevronLeft, ChevronRight, Menu, X,
  Crown, GitBranch, CalendarDays, MessageCircle, Phone, GraduationCap,
  Target, BookmarkCheck, Languages, Sparkles, Users,
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
  color?: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'TOÁN HỌC',
    color: 'text-[var(--color-math)]',
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
    color: 'text-[var(--color-english)]',
    items: [
      { href: '/vocabulary', label: 'Từ vựng', icon: Languages, badge: 'Mới' },
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

const sidebarBg = {
  background: 'hsl(var(--sidebar-hsl))',
  borderRight: '1px solid var(--border-subtle)',
}

export default function Sidebar() {
  const pathname = usePathname()
  const { user, role, isVip, logout } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div
        className={cn('flex items-center gap-3 px-4 py-3.5', collapsed && 'justify-center px-2')}
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-rose text-white font-bold text-xs shadow-glow-sm">
          NT
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="font-bold text-sm leading-tight truncate">ngocthaigiasu</p>
            <p className="text-[11px] text-muted-foreground truncate">.id.vn</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 px-1.5 space-y-0.5">
        {NAV_GROUPS.map((group) => {
          const visibleItems = group.items.filter(
            (item) => !item.roles || item.roles.includes(role)
          )
          if (visibleItems.length === 0) return null
          return (
            <div key={group.label} className="mb-1.5">
              {!collapsed ? (
                <p className={cn(
                  'px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.12em]',
                  group.color ?? 'text-muted-foreground/50'
                )}>
                  {group.label}
                </p>
              ) : (
                <div className="my-2 mx-1" style={{ height: '1px', background: 'var(--border-subtle)' }} />
              )}
              {visibleItems.map((item) => {
                const Icon = item.icon
                const active = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-all duration-150',
                      active
                        ? 'text-primary'
                        : 'text-muted-foreground hover:text-foreground',
                      collapsed && 'justify-center px-2'
                    )}
                    style={
                      active
                        ? {
                            background: 'var(--accent-soft)',
                            border: '1px solid var(--accent-glow)',
                          }
                        : { border: '1px solid transparent' }
                    }
                    onMouseEnter={e => {
                      if (!active) {
                        (e.currentTarget as HTMLElement).style.background = 'var(--glass-bg)'
                      }
                    }}
                    onMouseLeave={e => {
                      if (!active) {
                        (e.currentTarget as HTMLElement).style.background = 'transparent'
                      }
                    }}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {!collapsed && (
                      <span className="flex-1 truncate">{item.label}</span>
                    )}
                    {!collapsed && item.badge && (
                      <Badge
                        variant="secondary"
                        className="ml-auto text-[9px] px-1.5 py-0 h-4 bg-rose-500/15 text-rose-400 border-0 font-semibold"
                      >
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

      {/* User footer */}
      <div
        className={cn('p-2', collapsed && 'px-1.5')}
        style={{ borderTop: '1px solid var(--border-subtle)' }}
      >
        <div
          className={cn(
            'flex items-center gap-2.5 rounded-lg p-2 cursor-pointer transition-colors group',
            collapsed && 'justify-center'
          )}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--glass-bg)')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
        >
          <Avatar className="h-7 w-7 shrink-0 ring-1 ring-border/60">
            <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? ''} />
            <AvatarFallback className="text-xs">{user?.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <p className="text-xs font-medium truncate leading-tight">{user?.name}</p>
                  {isVip && <Crown className="h-3 w-3 text-amber-400 shrink-0" />}
                </div>
                <p className="text-[10px] text-muted-foreground/70 truncate capitalize">{role}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                onClick={logout}
              >
                <LogOut className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>
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
            className="fixed inset-0 z-40 bg-black/70 md:hidden"
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
            className="fixed left-0 top-0 z-50 h-full w-64 md:hidden"
            style={sidebarBg}
          >
            <SidebarContent />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 256 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="hidden md:flex flex-col h-full relative overflow-hidden"
        style={sidebarBg}
      >
        <SidebarContent />
        <button
          className="absolute -right-3 top-[4.5rem] z-10 h-5 w-5 rounded-full flex items-center justify-center text-muted-foreground transition-colors"
          style={{
            background: 'hsl(var(--surface-2))',
            border: '1px solid var(--border-default)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
          }}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed
            ? <ChevronRight className="h-2.5 w-2.5" />
            : <ChevronLeft className="h-2.5 w-2.5" />
          }
        </button>
      </motion.aside>
    </>
  )
}
