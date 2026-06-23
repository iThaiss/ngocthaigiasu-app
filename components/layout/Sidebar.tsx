'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain, Target, Video, Crown, GitBranch, User,
  Languages, BookOpen, BookMarked, BotMessageSquare, Sparkles,
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  MoreHorizontal, X, LogOut, FileText,
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

const PRIMARY_NAV: NavItem[] = [
  { href: '/live', label: 'Lớp học Live', icon: Video },
  { href: '/solve', label: 'Giải toán AI', icon: Brain },
  { href: '/practice', label: 'Luyện tập', icon: Target },
  { href: '/exam', label: 'Thi thử', icon: FileText },
]

const BOTTOM_NAV: NavItem[] = [
  { href: '/payment', label: 'Nâng cấp VIP', icon: Crown },
  { href: '/affiliate', label: 'Hoa hồng', icon: GitBranch },
]

const ENGLISH_NAV: NavItem[] = [
  { href: '/vocabulary', label: 'Từ vựng', icon: Languages },
  { href: '/grammar', label: 'Ngữ pháp', icon: BookOpen },
  { href: '/reading', label: 'Đọc hiểu', icon: BookMarked },
  { href: '/english-feedback', label: 'Nhận xét AI', icon: BotMessageSquare },
  { href: '/vocabulary/ai', label: 'AI Tạo từ vựng', icon: Sparkles },
]

function NavLink({
  item,
  collapsed,
  onClick,
}: {
  item: NavItem
  collapsed?: boolean
  onClick?: () => void
}) {
  const pathname = usePathname()
  const Icon = item.icon
  const active = pathname === item.href || pathname.startsWith(item.href + '/')

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors',
        active
          ? 'bg-muted text-foreground font-medium'
          : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
        collapsed && 'justify-center px-1.5'
      )}
    >
      <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-foreground' : 'text-muted-foreground')} />
      {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
    </Link>
  )
}

function SidebarContent({
  collapsed,
  onClose,
}: {
  collapsed?: boolean
  onClose?: () => void
}) {
  const pathname = usePathname()
  const { user, isVip } = useAuth()
  const [englishOpen, setEnglishOpen] = useState(
    ENGLISH_NAV.some((i) => pathname === i.href || pathname.startsWith(i.href + '/'))
  )

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <Link
        href="/live"
        onClick={onClose}
        className={cn(
          'flex items-center justify-center border-b border-border overflow-hidden w-full cursor-pointer transition-opacity hover:opacity-80',
          collapsed ? 'p-2 h-14' : 'py-3 px-0 h-auto'
        )}
      >
        {collapsed ? (
          <img src="/square-logo.png" className="h-9 w-9 object-contain rounded-md" alt="Logo" />
        ) : (
          <>
            <img
              src="/logo-light.png"
              className="w-full h-auto object-contain block dark:hidden scale-[1.2] -translate-x-3"
              alt="Logo"
            />
            <img
              src="/logo-dark.png"
              className="w-full h-auto object-contain hidden dark:block scale-[1.2] -translate-x-3"
              alt="Logo"
            />
          </>
        )}
      </Link>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {/* Primary nav */}
        {PRIMARY_NAV.map((item) => (
          <NavLink key={item.href} item={item} collapsed={collapsed} onClick={onClose} />
        ))}

        {/* Tiếng Anh section */}
        {!collapsed ? (
          <div className="pt-3">
            <button
              onClick={() => setEnglishOpen((v) => !v)}
              className="flex w-full items-center justify-between px-2 py-1 rounded-md hover:bg-muted/40 transition-colors group"
            >
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 group-hover:text-muted-foreground transition-colors">
                Tiếng Anh
              </span>
              {englishOpen ? (
                <ChevronUp className="h-3 w-3 text-muted-foreground/50" />
              ) : (
                <ChevronDown className="h-3 w-3 text-muted-foreground/50" />
              )}
            </button>
            <AnimatePresence initial={false}>
              {englishOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.18, ease: 'easeInOut' }}
                  className="overflow-hidden mt-0.5 space-y-0.5"
                >
                  {ENGLISH_NAV.map((item) => (
                    <NavLink key={item.href} item={item} onClick={onClose} />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="pt-2 mt-1 border-t border-border/40 space-y-0.5">
            {ENGLISH_NAV.map((item) => (
              <NavLink key={item.href} item={item} collapsed onClick={onClose} />
            ))}
          </div>
        )}
      </nav>

      {/* Bottom nav: VIP + Hoa hồng */}
      <div className="px-2 pb-1 border-t border-border/40 pt-2 space-y-0.5">
        {BOTTOM_NAV.map((item) => (
          <NavLink key={item.href} item={item} collapsed={collapsed} onClick={onClose} />
        ))}
      </div>

      {/* Profile footer */}
      <Link href="/profile" onClick={onClose}>
        <div
          className={cn(
            'flex items-center gap-2.5 p-3 border-t border-border hover:bg-muted/50 cursor-pointer transition-colors',
            collapsed && 'justify-center'
          )}
        >
          <Avatar className="h-7 w-7 shrink-0">
            <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? ''} />
            <AvatarFallback className="text-xs">{user?.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <p className="text-sm font-medium truncate leading-none">{user?.name}</p>
                {isVip && <Crown className="h-3 w-3 text-yellow-500 shrink-0" />}
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5">Hồ sơ cá nhân</p>
            </div>
          )}
        </div>
      </Link>
    </div>
  )
}

function MobileBottomBar({ onOpenMore }: { onOpenMore: () => void }) {
  const pathname = usePathname()

  const tabs = [
    { href: '/live', label: 'Live', icon: Video },
    { href: '/solve', label: 'Giải toán', icon: Brain },
    { href: '/practice', label: 'Luyện tập', icon: Target },
    { href: '/payment', label: 'VIP', icon: Crown },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-card border-t border-border h-14 flex items-center">
      {tabs.map((tab) => {
        const Icon = tab.icon
        const active = pathname === tab.href || pathname.startsWith(tab.href + '/')
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-0.5 h-full text-[10px] font-medium transition-colors',
              active ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <Icon className="h-5 w-5" />
            <span>{tab.label}</span>
          </Link>
        )
      })}
      <button
        onClick={onOpenMore}
        className="flex flex-1 flex-col items-center justify-center gap-0.5 h-full text-[10px] font-medium text-muted-foreground"
      >
        <MoreHorizontal className="h-5 w-5" />
        <span>Thêm</span>
      </button>
    </nav>
  )
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { logout } = useAuth()

  return (
    <>
      {/* ── MOBILE: bottom tab bar ── */}
      <MobileBottomBar onOpenMore={() => setMobileOpen(true)} />

      {/* Mobile drawer overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 350, damping: 35 }}
              className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t border-border rounded-t-2xl"
              style={{ maxHeight: '80vh' }}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
                <span className="text-sm font-semibold">Menu</span>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setMobileOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="overflow-y-auto p-3 space-y-0.5">
                <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                  Tiếng Anh
                </p>
                {ENGLISH_NAV.map((item) => (
                  <NavLink key={item.href} item={item} onClick={() => setMobileOpen(false)} />
                ))}
                <div className="pt-2 mt-1 border-t border-border/40 space-y-0.5">
                  <NavLink
                    item={{ href: '/affiliate', label: 'Hoa hồng', icon: GitBranch }}
                    onClick={() => setMobileOpen(false)}
                  />
                  <NavLink
                    item={{ href: '/profile', label: 'Hồ sơ cá nhân', icon: User }}
                    onClick={() => setMobileOpen(false)}
                  />
                  <button
                    onClick={() => { setMobileOpen(false); logout() }}
                    className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4 shrink-0" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── DESKTOP: left sidebar ── */}
      <motion.aside
        animate={{ width: collapsed ? 52 : 220 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="hidden md:flex flex-col h-full bg-card border-r border-border relative shrink-0"
      >
        <SidebarContent collapsed={collapsed} />
        <Button
          variant="outline"
          size="icon"
          className="absolute -right-3 top-16 z-10 h-5 w-5 rounded-full border shadow-sm bg-card"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </Button>
      </motion.aside>
    </>
  )
}
