'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Bell, CheckCheck, CreditCard, GitBranch, FileText, Cpu, Wrench, Filter } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/lib/auth-context'
import { MOCK_NOTIFICATIONS, NotificationType } from '@/lib/mock-data'
import { formatDate } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'

const TYPE_CONFIG: Record<NotificationType, { icon: React.ElementType; label: string; color: string }> = {
  payment: { icon: CreditCard, label: 'Thanh toán', color: 'text-green-500 bg-green-500/10' },
  commission: { icon: GitBranch, label: 'Hoa hồng', color: 'text-blue-500 bg-blue-500/10' },
  exam: { icon: FileText, label: 'Thi thử', color: 'text-yellow-500 bg-yellow-500/10' },
  solve: { icon: Cpu, label: 'Giải toán', color: 'text-purple-500 bg-purple-500/10' },
  system: { icon: Wrench, label: 'Hệ thống', color: 'text-gray-500 bg-gray-500/10' },
}

export default function NotificationsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [notifications, setNotifications] = useState(
    MOCK_NOTIFICATIONS.filter((n) => n.userId === user?.id)
  )
  const [tab, setTab] = useState('all')

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    toast({ title: 'Đã đánh dấu đọc tất cả', variant: 'success' as never })
  }

  const markRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
  }

  const filtered = notifications.filter((n) => {
    if (tab === 'unread') return !n.isRead
    return true
  })

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
          <Button variant="outline" size="sm" className="gap-2" onClick={markAllRead}>
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
              {filtered.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <Bell className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>Không có thông báo nào</p>
                </div>
              ) : (
                filtered.map((notif, idx) => {
                  const cfg = TYPE_CONFIG[notif.type]
                  const Icon = cfg.icon
                  return (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => !notif.isRead && markRead(notif.id)}
                      className={`flex items-start gap-4 p-4 transition-colors cursor-pointer ${
                        notif.isRead ? '' : 'bg-primary/5 hover:bg-primary/8'
                      } hover:bg-muted/50`}
                    >
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${cfg.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-medium ${!notif.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {notif.title}
                          </p>
                          {!notif.isRead && (
                            <div className="h-2 w-2 shrink-0 rounded-full bg-primary mt-1.5" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{notif.content}</p>
                        <p className="text-xs text-muted-foreground mt-1">{formatDate(notif.createdAt)}</p>
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
