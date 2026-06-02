'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { Bell, Sun, Moon, Crown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/lib/auth-context'
import AppBreadcrumb from './Breadcrumb'

export default function Header() {
  const { theme, setTheme } = useTheme()
  const { user, isVip } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    async function fetchUnread() {
      try {
        const res = await fetch('/api/notifications')
        if (!res.ok || cancelled) return
        const data = await res.json()
        setUnreadCount(data.unreadCount ?? 0)
      } catch {
        // silent
      }
    }
    fetchUnread()
    const interval = setInterval(fetchUnread, 30000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [])

  return (
    <header
      className="sticky top-0 z-30 flex items-center gap-3 px-4 md:px-5 backdrop-blur-xl"
      style={{
        height: 'var(--topbar-height)',
        background: 'hsl(var(--surface-bg) / 0.9)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <div className="flex-1 min-w-0 pl-10 md:pl-0">
        <AppBreadcrumb />
      </div>

      <div className="flex items-center gap-1">
        {isVip && (
          <div className="hidden sm:flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold text-amber-400"
            style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.22)' }}
          >
            <Crown className="h-3 w-3" /> VIP
          </div>
        )}

        <Link href="/notifications">
          <Button variant="ghost" size="icon" className="relative h-8 w-8 text-muted-foreground hover:text-foreground">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Button>
        </Link>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        <Link href="/profile">
          <Avatar className="h-8 w-8 cursor-pointer ring-1 ring-border/40 hover:ring-primary/40 transition-all">
            <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? ''} />
            <AvatarFallback className="text-xs bg-gradient-rose text-white font-bold">
              {user?.name?.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </header>
  )
}
