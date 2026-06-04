'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Brain, Trophy, Bell, ArrowRight, Clock, Target, Flame,
  Wallet, BookmarkCheck, Crown, AlertCircle, Loader2, GraduationCap,
  BookOpen, Languages, Headphones, Repeat,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/lib/auth-context'

interface EnglishStats {
  vocab: { mastered: number; dueToday: number; setsStarted: number }
  grammar: { mastered: number; attempted: number; total: number }
  reading: { completed: number; total: number; avgScore: number }
}

interface DashboardData {
  stats: {
    totalSolves: number
    solvedToday: number
    solveLimit: number
    solveRemaining: number
    avgExamScore: number
    unreadNotifications: number
    savedQuestions: number
    points: number
    totalCommissionPoints: number
    isVip: boolean
    vipExpiresAt: string | null
  }
  recentSolves: Array<{
    id: string
    title: string
    description: string | null
    difficulty: string | null
    createdAt: string | null
  }>
  recentExams: Array<{
    id: string
    score: number
    totalQuestions: number
    timeTaken: number
    completedAt: string | null
  }>
  notifications: Array<{
    id: string
    title: string
    content: string
    type: string | null
    isRead: boolean
    createdAt: string | null
  }>
  weakAreas: Array<{
    topic: string | null
    subtopic: string | null
    count: number
  }>
}

function CountdownTimer() {
  const TARGET = new Date('2027-06-12T00:00:00+07:00')
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    const tick = () => {
      const diff = TARGET.getTime() - new Date().getTime()
      if (diff <= 0) return
      setTime({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="rounded-xl border border-red-500/20 bg-gradient-to-r from-red-500/10 to-orange-500/10 p-6 text-center">
      <p className="mb-4 text-sm font-medium text-red-400">⏰ Kỳ thi THPT Quốc Gia 2027</p>
      <div className="flex justify-center gap-3 sm:gap-4">
        {[
          { value: time.days, label: 'Ngày' },
          { value: time.hours, label: 'Giờ' },
          { value: time.minutes, label: 'Phút' },
          { value: time.seconds, label: 'Giây' },
        ].map(({ value, label }) => (
          <div key={label} className="flex flex-col items-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-red-500/30 bg-background">
              <span className="tabular-nums text-2xl font-bold">{String(value).padStart(2, '0')}</span>
            </div>
            <span className="mt-1 text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">12/06/2027</p>
    </div>
  )
}

const SHORTCUTS = [
  { href: '/learning', icon: GraduationCap, label: 'Học theo lộ trình', desc: 'Tiếp tục bài học', color: 'bg-violet-500/10 text-violet-500' },
  { href: '/solve', icon: Brain, label: 'Giải toán AI', desc: 'Upload ảnh bài toán', color: 'bg-purple-500/10 text-purple-500' },
  { href: '/practice', icon: Target, label: 'Luyện tập', desc: 'Làm câu theo chủ đề', color: 'bg-emerald-500/10 text-emerald-500' },
  { href: '/exam', icon: Trophy, label: 'Thi thử', desc: '50 câu / 90 phút', color: 'bg-yellow-500/10 text-yellow-500' },
]

function relativeTime(dateStr: string | null) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Vừa xong'
  if (minutes < 60) return `${minutes} phút trước`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} giờ trước`
  return `${Math.floor(hours / 24)} ngày trước`
}

function formatVipDate(dateStr: string | null) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('vi-VN')
}

export default function DashboardPage() {
  const { user, isVip } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [englishStats, setEnglishStats] = useState<EnglishStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function fetchDashboard() {
      setLoading(true)
      setError('')
      try {
        const [dashRes, engRes] = await Promise.all([
          fetch('/api/dashboard'),
          fetch('/api/english-stats'),
        ])
        if (!dashRes.ok) throw new Error('Không thể tải dữ liệu dashboard')
        const [dashJson, engJson] = await Promise.all([dashRes.json(), engRes.ok ? engRes.json() : null])
        if (!cancelled) {
          setData(dashJson)
          setEnglishStats(engJson)
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu dashboard')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchDashboard()
    return () => {
      cancelled = true
    }
  }, [])

  const stats = data?.stats
  const topWeakArea = data?.weakAreas?.[0]
  const solveProgress = stats ? Math.min(100, Math.round((stats.solvedToday / Math.max(1, stats.solveLimit)) * 100)) : 0

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">
              Xin chào, {user?.name?.split(' ').pop() || 'bạn'}
            </h1>
            <p className="text-muted-foreground mt-1">Tổng quan học tập và tài khoản hôm nay</p>
          </div>
          {isVip && (
            <Badge variant="warning" className="gap-1 py-1">
              <Crown className="h-3.5 w-3.5" />
              VIP{stats?.vipExpiresAt ? ` đến ${formatVipDate(stats.vipExpiresAt)}` : ''}
            </Badge>
          )}
        </div>
      </motion.div>

      {/* Countdown to THPTQG 2027 */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <CountdownTimer />
      </motion.div>

      {error && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex items-center gap-3 pt-4 pb-4">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Bài AI đã giải', value: stats?.totalSolves ?? 0, icon: Brain, color: 'text-purple-500', sub: `${stats?.solveRemaining ?? 0}/${stats?.solveLimit ?? 0} lượt còn lại` },
          { label: 'Điểm TB thi thử', value: `${stats?.avgExamScore ?? 0}/50`, icon: Target, color: 'text-yellow-500', sub: `${data?.recentExams.length ?? 0} bài gần đây` },
          { label: 'Thông báo', value: stats?.unreadNotifications ?? 0, icon: Bell, color: 'text-blue-500', sub: 'chưa đọc' },
          { label: 'Điểm ví', value: stats?.points ?? 0, icon: Wallet, color: 'text-green-500', sub: `${stats?.totalCommissionPoints ?? 0} điểm hoa hồng` },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className={`text-2xl font-bold mt-1 ${stat.color}`}>
                      {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : stat.value}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
                  </div>
                  <stat.icon className={`h-8 w-8 ${stat.color} opacity-80`} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardContent className="pt-5 pb-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div>
                <p className="font-semibold">Lượt giải toán AI hôm nay</p>
                <p className="text-sm text-muted-foreground">
                  Đã dùng {stats?.solvedToday ?? 0}/{stats?.solveLimit ?? 0} lượt
                </p>
              </div>
              <Link href="/solve">
                <Button size="sm" className="gap-1">
                  Giải bài <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
            <Progress value={solveProgress} className="h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 pt-5 pb-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
              <BookmarkCheck className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Câu cần ôn</p>
              <p className="text-2xl font-bold text-emerald-500">{stats?.savedQuestions ?? 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today plan */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Hôm nay nên làm gì</h2>
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

      <div className="grid gap-3 md:grid-cols-3">
        <Link href="/learning">
          <Card className="h-full border-violet-500/20 hover:border-violet-500/40 transition-colors">
            <CardContent className="flex items-start gap-3 pt-4 pb-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
                <GraduationCap className="h-5 w-5 text-violet-500" />
              </div>
              <div>
                <p className="text-sm font-semibold">Tiếp tục lộ trình</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Học bài mới trước khi luyện đề để giữ mạch kiến thức.</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href={stats?.savedQuestions ? '/saved-questions' : '/practice'}>
          <Card className="h-full border-emerald-500/20 hover:border-emerald-500/40 transition-colors">
            <CardContent className="flex items-start gap-3 pt-4 pb-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                <BookmarkCheck className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm font-semibold">Ôn điểm yếu</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {topWeakArea
                    ? `${topWeakArea.subtopic || topWeakArea.topic}: sai ${topWeakArea.count} câu gần đây.`
                    : stats?.savedQuestions
                      ? `${stats.savedQuestions} câu đang cần ôn lại.`
                      : 'Chưa có câu lưu, bắt đầu bằng một phiên luyện tập.'}
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href={data?.recentExams.length ? '/exam' : '/practice'}>
          <Card className="h-full border-yellow-500/20 hover:border-yellow-500/40 transition-colors">
            <CardContent className="flex items-start gap-3 pt-4 pb-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-yellow-500/10">
                <Trophy className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm font-semibold">Kiểm tra áp lực thi</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Làm đề 50 câu khi đã sẵn sàng, hoặc luyện ngắn trước.</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Exams */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Bài thi gần đây</CardTitle>
            <Link href="/exam"><Button variant="ghost" size="sm" className="h-7 text-xs gap-1">Thi ngay <ArrowRight className="h-3 w-3" /></Button></Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading && <p className="text-sm text-muted-foreground text-center py-4">Đang tải...</p>}
            {!loading && data?.recentExams.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Chưa có bài thi nào</p>
            )}
            {data?.recentExams.map((exam) => (
              <div key={exam.id} className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-yellow-500/10">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Đề thi thử</p>
                    <Badge variant={exam.score >= 40 ? 'success' : exam.score >= 30 ? 'warning' : 'destructive'} className="shrink-0">
                      {exam.score}/{exam.totalQuestions}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Progress value={(exam.score / Math.max(1, exam.totalQuestions)) * 100} className="h-1.5 flex-1" />
                    <span className="text-xs text-muted-foreground shrink-0">
                      <Clock className="h-3 w-3 inline mr-0.5" />
                      {Math.floor(exam.timeTaken / 60)}p
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{relativeTime(exam.completedAt)}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Thông báo mới</CardTitle>
            <Link href="/notifications"><Button variant="ghost" size="sm" className="h-7 text-xs gap-1">Xem tất cả <ArrowRight className="h-3 w-3" /></Button></Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading && <p className="text-sm text-muted-foreground text-center py-4">Đang tải...</p>}
            {!loading && data?.notifications.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Không có thông báo mới</p>
            )}
            {data?.notifications.map((notification) => (
              <div key={notification.id} className="flex gap-3 rounded-lg border border-border/60 p-3">
                <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${notification.isRead ? 'bg-muted-foreground/30' : 'bg-blue-500'}`} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{notification.title}</p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{notification.content}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">{relativeTime(notification.createdAt)}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Bài AI gần đây</CardTitle>
          <Link href="/solve"><Button variant="ghost" size="sm" className="h-7 text-xs gap-1">Xem lịch sử <ArrowRight className="h-3 w-3" /></Button></Link>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading && <p className="text-sm text-muted-foreground text-center py-4">Đang tải...</p>}
          {!loading && data?.recentSolves.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Chưa có bài giải AI nào</p>
          )}
          {data?.recentSolves.map((solve) => (
            <div key={solve.id} className="flex items-start gap-3 rounded-lg border border-border/60 p-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-500/10">
                <Brain className="h-4 w-4 text-purple-500" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">{solve.title}</p>
                  {solve.difficulty && <Badge variant="outline">{solve.difficulty}</Badge>}
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{solve.description}</p>
                <p className="mt-1 text-xs text-muted-foreground">{relativeTime(solve.createdAt)}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Study streak */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10">
              <Flame className="h-6 w-6 text-orange-500" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">
                {stats?.solvedToday ? `Hôm nay bạn đã giải ${stats.solvedToday} bài` : 'Bắt đầu học hôm nay'}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {stats?.solveRemaining
                  ? `Còn ${stats.solveRemaining} lượt AI để luyện thêm.`
                  : 'Thi thử, lưu câu cần ôn, và quay lại luyện tập đều đặn.'}
              </p>
            </div>
            <Link href="/solve">
              <Button size="sm">Học ngay</Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* English Learning Progress */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Languages className="h-5 w-5 text-rose-500" />
            Tiến độ Tiếng Anh
          </h2>
          <Link href="/vocabulary">
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
              Học ngay <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          {[
            {
              label: 'Từ vựng đã học',
              value: englishStats?.vocab.mastered ?? 0,
              sub: `${englishStats?.vocab.setsStarted ?? 0} bộ đang học`,
              icon: BookOpen,
              color: 'text-rose-500',
              bg: 'bg-rose-500/10',
              href: '/vocabulary',
            },
            {
              label: 'Ngữ pháp nắm vững',
              value: `${englishStats?.grammar.mastered ?? 0}/${englishStats?.grammar.total ?? 50}`,
              sub: `${englishStats?.grammar.attempted ?? 0} bài đã thử`,
              icon: GraduationCap,
              color: 'text-violet-500',
              bg: 'bg-violet-500/10',
              href: '/grammar',
            },
            {
              label: 'Bài đọc hoàn thành',
              value: `${englishStats?.reading.completed ?? 0}/${englishStats?.reading.total ?? 0}`,
              sub: englishStats?.reading.avgScore ? `Điểm TB ${englishStats.reading.avgScore}%` : 'Chưa có bài nào',
              icon: Headphones,
              color: 'text-sky-500',
              bg: 'bg-sky-500/10',
              href: '/reading',
            },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.07 }}>
              <Link href={stat.href}>
                <Card className="hover:shadow-md hover:border-primary/30 transition-all cursor-pointer h-full">
                  <CardContent className="pt-5 pb-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                        <p className={`text-2xl font-bold mt-1 ${stat.color}`}>
                          {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : stat.value}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
                      </div>
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bg}`}>
                        <stat.icon className={`h-5 w-5 ${stat.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Due today vocab card */}
        {(englishStats?.vocab.dueToday ?? 0) > 0 && (
          <Link href="/vocabulary">
            <Card className="border-rose-500/20 hover:border-rose-500/40 transition-colors cursor-pointer">
              <CardContent className="flex items-center gap-4 pt-4 pb-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-500/10">
                  <Repeat className="h-5 w-5 text-rose-500" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">
                    {englishStats!.vocab.dueToday} từ cần ôn hôm nay
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Ôn lại để không quên — spaced repetition FSRS
                  </p>
                </div>
                <Button size="sm" variant="outline" className="shrink-0 border-rose-500/30 text-rose-500 hover:bg-rose-500/10">
                  Ôn ngay <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </CardContent>
            </Card>
          </Link>
        )}
      </div>
    </div>
  )
}
