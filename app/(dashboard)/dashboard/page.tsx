'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Brain, Trophy, TrendingUp, Bell, ArrowRight, Clock, Target, Flame } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/lib/auth-context'
import { MOCK_EXAM_SESSIONS } from '@/lib/mock-data'

const SHORTCUTS = [
  { href: '/solve', icon: Brain, label: 'Giải toán AI', desc: 'Upload ảnh bài toán', color: 'bg-purple-500/10 text-purple-500' },
  { href: '/exam', icon: Trophy, label: 'Thi thử', desc: '50 câu / 90 phút', color: 'bg-yellow-500/10 text-yellow-500' },
  { href: '/notifications', icon: Bell, label: 'Thông báo', desc: 'Xem cập nhật mới', color: 'bg-blue-500/10 text-blue-500' },
  { href: '/affiliate', icon: TrendingUp, label: 'Hoa hồng', desc: 'Kiếm thêm thu nhập', color: 'bg-green-500/10 text-green-500' },
]

export default function DashboardPage() {
  const { user } = useAuth()

  const recentExams = MOCK_EXAM_SESSIONS.slice(0, 3)
  const avgScore = recentExams.length
    ? Math.round(recentExams.reduce((sum, e) => sum + e.score, 0) / recentExams.length)
    : 0

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">
          Xin chào, {user?.name?.split(' ').pop()} 👋
        </h1>
        <p className="text-muted-foreground mt-1">Chào mừng trở lại!</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Bài đã giải', value: 0, icon: Brain, color: 'text-purple-500', sub: 'bài toán' },
          { label: 'Điểm TB', value: `${avgScore}/50`, icon: Target, color: 'text-yellow-500', sub: 'điểm thi thử' },
          { label: 'Thông báo', value: 0, icon: Bell, color: 'text-blue-500', sub: 'chưa đọc' },
          { label: 'Hoa hồng', value: '0k', icon: TrendingUp, color: 'text-green-500', sub: 'VND nhận được' },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
                  </div>
                  <stat.icon className={`h-8 w-8 ${stat.color} opacity-80`} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Shortcuts */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Truy cập nhanh</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {SHORTCUTS.map((s, i) => (
            <motion.div key={s.href} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 + i * 0.05 }}>
              <Link href={s.href}>
                <Card className="hover:shadow-md hover:border-primary/30 transition-all cursor-pointer h-full">
                  <CardContent className="pt-4 pb-4">
                    <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg mb-3 ${s.color}`}>
                      <s.icon className="h-5 w-5" />
                    </div>
                    <p className="font-semibold text-sm">{s.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Exams */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Bài thi gần đây</CardTitle>
            <Link href="/exam"><Button variant="ghost" size="sm" className="h-7 text-xs gap-1">Thi ngay <ArrowRight className="h-3 w-3" /></Button></Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentExams.map((exam) => (
              <div key={exam.id} className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-yellow-500/10">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Đề thi thử</p>
                    <Badge variant={exam.score >= 40 ? 'success' : exam.score >= 30 ? 'warning' : 'destructive'}>
                      {exam.score}/50
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Progress value={(exam.score / 50) * 100} className="h-1.5 flex-1" />
                    <span className="text-xs text-muted-foreground shrink-0">
                      <Clock className="h-3 w-3 inline mr-0.5" />
                      {Math.floor(exam.timeSpent / 60)}p
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Notifications placeholder */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Thông báo mới</CardTitle>
            <Link href="/notifications"><Button variant="ghost" size="sm" className="h-7 text-xs gap-1">Xem tất cả <ArrowRight className="h-3 w-3" /></Button></Link>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center py-4">Không có thông báo mới</p>
          </CardContent>
        </Card>
      </div>

      {/* Study streak */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10">
              <Flame className="h-6 w-6 text-orange-500" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">Bắt đầu học hôm nay! 🔥</p>
              <p className="text-sm text-muted-foreground mt-0.5">Giải toán AI, thi thử, và nhiều hơn nữa.</p>
            </div>
            <Link href="/solve">
              <Button size="sm">Học ngay</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
