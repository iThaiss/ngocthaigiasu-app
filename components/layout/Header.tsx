'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bell, Sun, Moon, Crown, ArrowLeftRight, LogOut, User, Calendar, GitBranch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth-context'
import AppBreadcrumb from './Breadcrumb'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function Header() {
  const { theme, setTheme } = useTheme()
  const { user, isVip, logout } = useAuth()
  const router = useRouter()
  const [unreadCount, setUnreadCount] = useState(0)
  const [daysLeft, setDaysLeft] = useState<number | null>(null)

  useEffect(() => {
    // Calculate countdown to THPT QG 2027 (12/06/2027)
    const target = new Date('2027-06-12T00:00:00+07:00')
    const diff = target.getTime() - Date.now()
    setDaysLeft(Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24))))

    let cancelled = false
    async function fetchUnread() {
      try {
        const res = await fetch('/api/notifications')
        if (!res.ok || cancelled) return
        const data = await res.json()
        setUnreadCount(data.unreadCount ?? 0)
      } catch {
        // ignore network errors silently
      }
    }

    fetchUnread()
    const interval = setInterval(fetchUnread, 30000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  const handleSwitchSubject = () => {
    localStorage.removeItem('ngocthai_subject')
    router.push('/select')
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/95 backdrop-blur px-4 md:px-6">
      {/* Left: Breadcrumbs */}
      <div className="flex-1 min-w-0 pl-10 md:pl-0">
        <AppBreadcrumb />
      </div>

      {/* Center (Desktop): Countdown to THPT QG 2027 */}
      {daysLeft !== null && (
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full border border-red-500/10 bg-red-500/5 text-red-500 dark:text-red-400 text-xs font-semibold select-none">
          <Calendar className="h-3.5 w-3.5" />
          <span>{daysLeft} ngày · THPT QG 2027</span>
        </div>
      )}

      {/* Right: Actions & User Menu */}
      <div className="flex items-center gap-2">
        {/* Switch Subject Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSwitchSubject}
          className="gap-1.5 h-9 px-2.5 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftRight className="h-4 w-4" />
          <span className="hidden sm:inline text-xs font-medium">Chọn môn khác</span>
        </Button>

        {/* Notifications */}
        <Link href="/notifications">
          <Button variant="ghost" size="icon" className="relative h-9 w-9">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Button>
        </Link>

        {/* Avatar Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className="h-8 w-8 cursor-pointer ring-offset-background transition-all hover:ring-2 hover:ring-primary/20">
              <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? ''} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                {user?.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent align="end" className="w-56 mt-1.5">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground truncate">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            
            <DropdownMenuSeparator />

            {/* Profile */}
            <Link href="/profile">
              <DropdownMenuItem className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Hồ sơ cá nhân</span>
              </DropdownMenuItem>
            </Link>

            {/* VIP Upgrade */}
            <Link href="/payment">
              <DropdownMenuItem className="cursor-pointer">
                <Crown className={isVip ? 'mr-2 h-4 w-4 text-yellow-500' : 'mr-2 h-4 w-4 text-muted-foreground'} />
                <span>Nâng cấp VIP</span>
                {isVip && (
                  <Badge variant="warning" className="ml-auto text-[10px] py-0 px-1 border-0">
                    VIP
                  </Badge>
                )}
              </DropdownMenuItem>
            </Link>

            {/* Affiliate */}
            <Link href="/affiliate">
              <DropdownMenuItem className="cursor-pointer">
                <GitBranch className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>Hoa hồng affiliate</span>
              </DropdownMenuItem>
            </Link>

            <DropdownMenuSeparator />

            {/* Theme Toggle */}
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="mr-2 h-4 w-4 text-amber-500" />
                  <span>Giao diện sáng</span>
                </>
              ) : (
                <>
                  <Moon className="mr-2 h-4 w-4 text-blue-500" />
                  <span>Giao diện tối</span>
                </>
              )}
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* Logout */}
            <DropdownMenuItem
              className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
              onClick={logout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Đăng xuất</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
