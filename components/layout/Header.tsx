'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { Bell, Sun, Moon, LogOut, User, Calendar, Sparkles, Flower2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog'

export default function Header() {
  const { theme, setTheme } = useTheme()
  const { user, isVip, logout } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const [daysLeft, setDaysLeft] = useState<number | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Calculate static days countdown for the header button
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

  return (
    <header className="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-border bg-background/95 backdrop-blur px-4">
      {/* Left: Breadcrumbs */}
      <div className="flex-1 min-w-0">
        <AppBreadcrumb />
      </div>

      {/* Center (Desktop): Countdown to THPT QG 2027 - Clickable dialog */}
      {daysLeft !== null && (
        <Dialog>
          <DialogTrigger asChild>
            <button className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-rose-500/20 bg-rose-500/5 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 dark:hover:bg-rose-500/20 text-xs font-semibold select-none transition-all duration-300 hover:scale-[1.03] active:scale-95 cursor-pointer shadow-sm hover:shadow-rose-500/5">
              <Calendar className="h-3.5 w-3.5 text-rose-500" />
              <span>{daysLeft} ngày · THPT QG 2027</span>
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md border-border bg-background/95 backdrop-blur-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-rose-500 to-orange-500">
                <Calendar className="h-5 w-5 text-rose-500" />
                Đếm ngược THPT QG 2027
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-1">
                Kỳ thi THPT Quốc Gia dự kiến diễn ra vào ngày 12/06/2027. Hãy quản lý thời gian thật tốt!
              </DialogDescription>
            </DialogHeader>
            <CountdownView />
          </DialogContent>
        </Dialog>
      )}

      {/* Right: Actions & User Menu */}
      <div className="flex items-center gap-2">
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

        {/* Standalone Theme Toggle — cycles light → dark → pink → light */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground hover:text-foreground cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95"
          onClick={() => setTheme(theme === 'light' ? 'dark' : theme === 'dark' ? 'pink' : 'light')}
          title={theme === 'dark' ? 'Chuyển sang sáng' : theme === 'pink' ? 'Chuyển sang tối' : 'Chuyển sang hồng'}
        >
          {!mounted ? (
            <Sun className="h-4 w-4 text-muted-foreground" />
          ) : theme === 'dark' ? (
            <Sun className="h-4 w-4 text-amber-500" />
          ) : theme === 'pink' ? (
            <Moon className="h-4 w-4 text-rose-400" />
          ) : (
            <Flower2 className="h-4 w-4 text-pink-500" />
          )}
        </Button>

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

const targetDate = new Date('2027-06-12T00:00:00+07:00')
const startDate = new Date('2024-06-12T00:00:00+07:00')

function calculateTimeRemaining() {
  const now = Date.now()
  const diff = targetDate.getTime() - now
  
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, progress: 100, completed: true }
  }
  
  const total = targetDate.getTime() - startDate.getTime()
  const elapsed = now - startDate.getTime()
  const progress = Math.min(100, Math.max(0, (elapsed / total) * 100))
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
  const minutes = Math.floor((diff / (1000 * 60)) % 60)
  const seconds = Math.floor((diff / 1000) % 60)
  
  return { days, hours, minutes, seconds, progress, completed: false }
}

function CountdownView() {
  const [time, setTime] = useState(calculateTimeRemaining)
  const [quote, setQuote] = useState('')

  useEffect(() => {
    const quotes = [
      "Hành trình vạn dặm khởi đầu từ một bước chân. Hãy cố gắng từng ngày! 🚀",
      "Thành công không phải là ngẫu nhiên. Đó là sự chăm chỉ, kiên trì và học hỏi mỗi ngày. 📚",
      "Tương lai thuộc về những ai tin tưởng vào vẻ đẹp của ước mơ của mình. ✨",
      "Đừng đợi cơ hội tự tìm đến. Hãy tự tạo ra cơ hội bằng cách tích lũy kiến thức ngay hôm nay. 💡",
      "Mỗi giờ học hôm nay sẽ đổi lại sự tự tin khi bước vào phòng thi. Cố gắng lên nhé! 🎯"
    ]
    setQuote(quotes[Math.floor(Math.random() * quotes.length)])

    const interval = setInterval(() => {
      setTime(calculateTimeRemaining())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const padZero = (n: number) => n.toString().padStart(2, '0')

  return (
    <div className="flex flex-col gap-6 py-4">
      {/* Grid of countdown cards */}
      <div className="grid grid-cols-4 gap-2 sm:gap-4">
        {/* Days Card */}
        <div className="bg-card border border-border shadow-sm rounded-xl p-3 flex flex-col items-center justify-center relative overflow-hidden group hover:border-rose-500/30 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          <span className="font-mono text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-rose-500 to-orange-500 select-none [font-variant-numeric:tabular-nums]">
            {time.days}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mt-1 select-none">Ngày</span>
        </div>

        {/* Hours Card */}
        <div className="bg-card border border-border shadow-sm rounded-xl p-3 flex flex-col items-center justify-center relative overflow-hidden group hover:border-orange-500/30 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          <span className="font-mono text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-orange-500 to-amber-500 select-none [font-variant-numeric:tabular-nums]">
            {padZero(time.hours)}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mt-1 select-none">Giờ</span>
        </div>

        {/* Minutes Card */}
        <div className="bg-card border border-border shadow-sm rounded-xl p-3 flex flex-col items-center justify-center relative overflow-hidden group hover:border-amber-500/30 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          <span className="font-mono text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-amber-500 to-yellow-500 select-none [font-variant-numeric:tabular-nums]">
            {padZero(time.minutes)}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mt-1 select-none">Phút</span>
        </div>

        {/* Seconds Card */}
        <div className="bg-card border border-border shadow-sm rounded-xl p-3 flex flex-col items-center justify-center relative overflow-hidden group hover:border-rose-500/30 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          <span className="font-mono text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-rose-500 to-yellow-500 select-none [font-variant-numeric:tabular-nums]">
            {padZero(time.seconds)}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mt-1 select-none">Giây</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs font-medium text-muted-foreground px-1">
          <span>Chặng đường ôn thi THPT 2027</span>
          <span className="font-mono font-bold text-foreground [font-variant-numeric:tabular-nums]">
            {time.progress.toFixed(6)}%
          </span>
        </div>
        <div className="h-2.5 w-full bg-secondary rounded-full overflow-hidden p-[1px] border border-border/60">
          <div 
            className="h-full rounded-full bg-gradient-to-r from-rose-500 via-orange-500 to-yellow-500 transition-all duration-1000 ease-out" 
            style={{ width: `${time.progress}%` }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground text-center">
          Thời gian đã trôi qua kể từ khi bắt đầu lộ trình học lớp 10 (12/06/2024)
        </p>
      </div>

      {/* Motivational Message */}
      <div className="bg-muted/40 border border-border/60 rounded-xl p-4 flex items-start gap-3">
        <Sparkles className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-foreground">Lời khuyên hôm nay</span>
          <p className="text-xs text-muted-foreground italic leading-relaxed">
            &ldquo;{quote}&rdquo;
          </p>
        </div>
      </div>
    </div>
  )
}
