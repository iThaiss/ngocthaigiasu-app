'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Bell, CheckCheck, CreditCard, GitBranch, FileText, Cpu, Wrench } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/use-toast'

type NotificationType = 'payment' | 'commission' | 'exam' | 'solve' | 'system'

interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  content: string
  is_read: boolean
  created_at: string
}

const TYPE_CONFIG: Record<NotificationType, { icon: React.ElementType; color: string }> = {
  payment: { icon: CreditCard, color: 'text-green-500 bg-green-500/10' },
  commission: { icon: GitBranch, color: 'text-blue-500 bg-blue-500/10' },
  exam: { icon: FileText, color: 'text-yellow-500 bg-yellow-500/10' },
  solve: { icon: Cpu, color: 'text-purple-500 bg-purple-500/10' },
  system: { icon: Wrench, color: 'text-gray-500 bg-gray-500/10' },
}

function relativeTime(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Vừa xong'
  if (minutes < 60) return `${minutes} phút trước`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} giờ trước`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Hôm qua'
  if (days < 7) return `${days} ngày trước`
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(dateString))
}

function NotificationSkeleton() {
  return (
    <div className="flex items-start gap-4 p-4">
      <Skeleton className="h-10 w-10 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-1/4" />
      </div>
    </div>
  )
}

export default function NotificationsPage() {
  const { toast } = useToast()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('all')
  const [markingAll, setMarkingAll] = useState(false)

  const fetchNotifications = useCallback(async () => {
    const res = await fetch('/api/notifications')
    if (!res.ok) return
    const data = await res.json()
    setNotifications(data.notifications ?? [])
  }, [])

  useEffect(() => {
    fetchNotifications().finally(() => setLoading(false))
  }, [fetchNotifications])

  const unreadCount = notifications.filter((n) => !n.is_read).length

  const markRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
    await fetch('/api/notifications/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationId: id }),
    })
  }

  const markAllRead = async () => {
    setMarkingAll(true)
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    try {
      const res = await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      })
      if (!res.ok) throw new Error()
      toast({ title: 'Đã đánh dấu đọc tất cả' })
    } catch {
      toast({ title: 'Lỗi', description: 'Vui lòng thử lại.', variant: 'destructive' })
      fetchNotifications()
    } finally {
      setMarkingAll(false)
    }
  }

  const filtered = tab === 'unread' ? notifications.filter((n) => !n.is_read) : notifications

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6" /> Thông báo
            {unreadCount > 0 && <Badge variant="destructive">{unreadCount}</Badge>}
          </h1>
          <p className="text-muted-foreground mt-1">{notifications.length} thông báo tổng cộng</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" className="gap-2" onClick={markAllRead} disabled={markingAll}>
            <CheckCheck className="h-4 w-4" /> Đọc tất cả
          </Button>
        )}
      </motion.div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">Tất cả ({notifications.length})</TabsTrigger>
          <TabsTrigger value="unread">Chưa đọc ({unreadCount})</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          <Card>
            <CardContent className="p-0 divide-y divide-border">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => <NotificationSkeleton key={i} />)
              ) : filtered.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <Bell className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>Chưa có thông báo nào</p>
                </div>
              ) : (
                filtered.map((notif, idx) => {
                  const cfg = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.system
                  const Icon = cfg.icon
                  return (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      onClick={() => !notif.is_read && markRead(notif.id)}
                      className={`flex items-start gap-4 p-4 transition-colors cursor-pointer hover:bg-muted/50 ${
                        !notif.is_read ? 'bg-primary/5' : ''
                      }`}
                    >
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${cfg.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-medium ${!notif.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {notif.title}
                          </p>
                          {!notif.is_read && (
                            <div className="h-2 w-2 shrink-0 rounded-full bg-primary mt-1.5" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{notif.content}</p>
                        <p className="text-xs text-muted-foreground mt-1">{relativeTime(notif.created_at)}</p>
                      </div>
                    </motion.div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
