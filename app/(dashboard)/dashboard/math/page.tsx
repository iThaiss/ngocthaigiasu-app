'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Brain, Trophy, ArrowRight, Clock, Target, Flame,
  Loader2, GraduationCap, AlertCircle, BookmarkCheck,
  ChevronRight, CalendarRange, Star, Award, FileText,
  Sparkles
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/lib/auth-context'

interface DashboardData {
  stats: {
    totalSolves: number
    solvedToday: number
    solveLimit: number
    solveRemaining: number
    avgExamScore: number
    savedQuestions: number
    points: number
    isVip: boolean
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
  weakAreas: Array<{
    topic: string | null
    subtopic: string | null
    count: number
  }>
}

interface Course {
  id: string
  name: string
  lesson_count: number
  completed: number
  slug: string
}

export default function MathDashboard() {
  const { user } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [streak, setStreak] = useState<number>(0)
  const [activeCourse, setActiveCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadData() {
      setLoading(true)
      setError('')
      try {
        const [dashRes, streakRes, courseRes] = await Promise.all([
          fetch('/api/dashboard'),
          fetch('/api/streak?subject=math'),
          fetch('/api/learning/courses')
        ])

        if (!dashRes.ok) throw new Error('Không thể tải dữ liệu dashboard')
        
        const dashJson = await dashRes.json()
        const streakJson = streakRes.ok ? await streakRes.json() : { streak: 0 }
        const courseJson = courseRes.ok ? await courseRes.json() : { courses: [] }

        if (!cancelled) {
          setData(dashJson)
          setStreak(streakJson.streak)
          
          // Find first active/unfinished course
          const courses: Course[] = courseJson.courses || []
          const inProgress = courses.find(c => c.completed > 0 && c.completed < c.lesson_count)
          const notStarted = courses.find(c => c.completed === 0)
          setActiveCourse(inProgress || notStarted || courses[0] || null)
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Lỗi tải thông tin')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadData()
    return () => {
      cancelled = true
    }
  }, [])

  const stats = data?.stats
  const recentExams = data?.recentExams ?? []
  const topWeakArea = data?.weakAreas?.[0]
  
  const solveProgress = stats ? Math.min(100, Math.round((stats.solvedToday / Math.max(1, stats.solveLimit)) * 100)) : 0

  function formatRelativeTime(dateStr: string | null) {
    if (!dateStr) return ''
    const diff = Date.now() - new Date(dateStr).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return 'Vừa xong'
    if (minutes < 60) return `${minutes} phút trước`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} giờ trước`
    return `${Math.floor(hours / 24)} ngày trước`
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Welcome & Streak Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Không gian Toán học
          </h1>
          <p className="text-muted-foreground text-sm">Chào mừng trở lại, {user?.name?.split(' ').pop() || 'bạn'}</p>
        </div>

        {/* Dynamic Streak Badge */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2 self-start sm:self-auto bg-orange-500/10 border border-orange-500/20 px-3.5 py-1.5 rounded-full"
        >
          <Flame className="h-5 w-5 text-orange-500 fill-orange-500 animate-pulse" />
          <span className="text-orange-600 dark:text-orange-400 text-sm font-bold">
            {streak > 0 ? `${streak} ngày liên tiếp` : 'Bắt đầu streak ngay'}
          </span>
        </motion.div>
      </div>

      {error && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex items-center gap-3 pt-4 pb-4">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Hero: Continue Learning */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <Link href={activeCourse ? `/learning/${activeCourse.slug}` : '/learning'}>
          <Card className="overflow-hidden border-2 border-transparent bg-gradient-to-r from-violet-500/15 via-purple-500/10 to-transparent hover:border-purple-500/20 hover:shadow-lg transition-all cursor-pointer group relative">
            <div className="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-purple-500/10 to-transparent pointer-events-none" />
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2 flex-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-semibold">
                    <GraduationCap className="h-3.5 w-3.5" /> Lộ trình học tập
                  </div>
                  <h3 className="text-lg font-bold">
                    {activeCourse ? `Tiếp tục: ${activeCourse.name}` : 'Bắt đầu lộ trình Toán THPT QG'}
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-xl">
                    {activeCourse 
                      ? 'Nắm vững kiến thức trọng tâm với các bài học chi tiết và bài kiểm tra đánh giá năng lực.' 
                      : 'Học đầy đủ kiến thức Toán lớp 12 phục vụ cho kỳ thi tốt nghiệp THPT và đánh giá tư duy.'
                    }
                  </p>
                  
                  {activeCourse && activeCourse.lesson_count > 0 && (
                    <div className="pt-2 max-w-xs space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Đã hoàn thành {activeCourse.completed}/{activeCourse.lesson_count} bài</span>
                        <span>{Math.round((activeCourse.completed / activeCourse.lesson_count) * 100)}%</span>
                      </div>
                      <Progress 
                        value={Math.round((activeCourse.completed / activeCourse.lesson_count) * 100)} 
                        className="h-1.5 bg-purple-500/10" 
                      />
                    </div>
                  )}
                </div>
                
                <Button className="bg-purple-600 text-white hover:bg-purple-700 font-semibold gap-1 shrink-0 self-start md:self-auto group-hover:translate-x-1 transition-transform">
                  Học tiếp <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </Link>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { 
            label: 'Lượt giải toán AI', 
            value: stats ? `${stats.solvedToday}/${stats.solveLimit}` : '0/0', 
            icon: Brain, 
            color: 'text-purple-500', 
            bg: 'bg-purple-500/10',
            sub: stats ? `Đã dùng hôm nay (Tổng: ${stats.totalSolves} bài)` : 'Đang tải...',
            hasProgress: true,
            progressValue: solveProgress
          },
          { 
            label: 'Điểm TB thi thử', 
            value: stats ? `${stats.avgExamScore}/50` : '0/50', 
            icon: Trophy, 
            color: 'text-amber-500', 
            bg: 'bg-amber-500/10',
            sub: `${recentExams.length} bài gần đây` 
          },
          { 
            label: 'Câu hỏi đã lưu', 
            value: stats?.savedQuestions ?? 0, 
            icon: BookmarkCheck, 
            color: 'text-emerald-500', 
            bg: 'bg-emerald-500/10',
            sub: 'Bấm vào để xem lại' 
          },
        ].map((stat, i) => (
          <motion.div 
            key={stat.label} 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.1 + i * 0.05 }}
            className="h-full"
          >
            <Card className="h-full hover:shadow-md hover:border-purple-500/20 transition-all">
              <CardContent className="p-5 flex items-start justify-between h-full relative">
                <div className="space-y-1 flex-1 min-w-0 pr-2">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</p>
                  <p className={`text-2xl font-bold ${stat.color}`}>
                    {loading ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /> : stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{stat.sub}</p>
                  {stat.hasProgress && !loading && (
                    <div className="pt-1.5 max-w-[140px]">
                      <Progress value={stat.progressValue} className="h-1.5 bg-purple-500/10" />
                    </div>
                  )}
                </div>
                <div className={`p-2.5 rounded-xl ${stat.bg} shrink-0`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Solver limits integrated inside stats card above */}

      {/* Quick Actions & Recent Exams */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Quick Actions (2/3) */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-lg font-bold tracking-tight">Học tập hôm nay</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { 
                href: '/solve', 
                icon: Brain, 
                label: 'Giải toán AI', 
                desc: 'Chụp/upload ảnh bài toán', 
                color: 'from-violet-500/15 to-purple-500/10 text-purple-500 hover:border-purple-500/40 border-2 border-transparent' 
              },
              { 
                href: '/practice', 
                icon: Target, 
                label: 'Luyện tập', 
                desc: 'Làm câu hỏi theo chủ đề', 
                color: 'from-indigo-500/15 to-blue-500/10 text-indigo-500 hover:border-indigo-500/40 border-2 border-transparent' 
              },
              { 
                href: '/exam', 
                icon: Trophy, 
                label: 'Thi thử', 
                desc: 'Làm đề 50 câu/90 phút', 
                color: 'from-amber-500/15 to-yellow-500/10 text-amber-500 hover:border-amber-500/40 border-2 border-transparent' 
              },
            ].map((action, i) => (
              <motion.div 
                key={action.href} 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                transition={{ delay: 0.2 + i * 0.05 }}
              >
                <Link href={action.href}>
                  <Card className={`h-full cursor-pointer bg-gradient-to-br ${action.color} transition-all duration-300`}>
                    <CardContent className="p-4 space-y-3">
                      <div className="p-2 rounded-lg bg-background/80 w-fit">
                        <action.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">{action.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{action.desc}</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Weak areas card if any */}
          {topWeakArea && (
            <Link href="/practice">
              <Card className="border-dashed border-red-500/30 hover:border-red-500/50 transition-colors cursor-pointer bg-red-500/5">
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-red-500/10">
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-red-600 dark:text-red-400">Điểm yếu cần khắc phục</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Bạn đã trả lời sai {topWeakArea.count} lần ở chủ đề: <span className="font-medium text-foreground">{topWeakArea.subtopic || topWeakArea.topic}</span>
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </CardContent>
              </Card>
            </Link>
          )}

          {/* Recent AI Solves list snippet */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-4">
              <div className="space-y-0.5">
                <CardTitle className="text-base font-bold">Lịch sử giải toán AI</CardTitle>
                <CardDescription className="text-xs">Các bài toán bạn đã giải gần đây</CardDescription>
              </div>
              <Link href="/solve">
                <Button variant="ghost" size="sm" className="h-8 text-xs gap-0.5">
                  Xem tất cả <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">
              {loading && <p className="text-xs text-muted-foreground text-center py-4">Đang tải...</p>}
              {!loading && (!data?.recentSolves || data.recentSolves.length === 0) && (
                <p className="text-xs text-muted-foreground text-center py-4">Chưa có bài giải toán nào</p>
              )}
              {data?.recentSolves.map((solve) => (
                <div key={solve.id} className="flex gap-3.5 items-start border border-border/40 p-3.5 rounded-xl hover:border-purple-500/30 hover:bg-purple-500/5 transition-all duration-300">
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500 mt-0.5 shrink-0">
                    <Brain className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold truncate text-foreground">{solve.title}</p>
                      {solve.difficulty && (
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-purple-500/20 bg-purple-500/5 text-purple-600 dark:text-purple-400 font-semibold rounded-full shrink-0">
                          {solve.difficulty}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{solve.description}</p>
                    <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {formatRelativeTime(solve.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: AI Tutor (1/3) */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold tracking-tight">AI Phân tích & Hỗ trợ</h2>
          
          <Link href="/chat" className="block">
            <Card className="overflow-hidden border-2 border-transparent bg-gradient-to-br from-purple-500/20 via-violet-500/5 to-background hover:border-purple-500/30 hover:shadow-lg transition-all duration-300 cursor-pointer group">
              <CardHeader className="pb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-md">
                  <Sparkles className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <h3 className="font-bold text-base group-hover:text-purple-500 transition-colors">AI Gia sư Toán cá nhân</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Hệ thống AI hỗ trợ giải đáp mọi bài toán học búa, chỉ ra lỗ hổng kiến thức lý thuyết hình học/đại số và đề xuất bài tập ôn tập tối ưu.
                </p>
                <div className="pt-2 flex items-center text-xs font-semibold text-purple-500 gap-1">
                  Trò chuyện ngay <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Card className="bg-gradient-to-br from-purple-600 to-violet-800 text-white">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-1.5 text-amber-300 text-xs font-bold uppercase tracking-wider">
                <Star className="h-4 w-4 fill-amber-300" /> Bí quyết học tốt
              </div>
              <p className="text-xs leading-relaxed text-purple-100 font-medium">
                &ldquo;Học Toán hiệu quả bắt đầu bằng việc hiểu bản chất lý thuyết trong Lộ trình, sau đó giải đề thi thử để phát hiện phần kiến thức hổng.&rdquo;
              </p>
            </CardContent>
          </Card>

          <h2 className="text-lg font-bold tracking-tight pt-2">Kế hoạch thi thử</h2>
          <Card className="h-fit">
            <CardHeader className="py-4">
              <CardTitle className="text-base font-bold">Bài thi thử gần đây</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-4">
              {loading && <p className="text-xs text-muted-foreground text-center py-4">Đang tải...</p>}
              {!loading && recentExams.length === 0 && (
                <div className="text-center py-6 space-y-2">
                  <Award className="h-8 w-8 text-muted-foreground/60 mx-auto" />
                  <p className="text-xs text-muted-foreground">Bạn chưa thực hiện bài thi thử nào.</p>
                  <Link href="/exam">
                    <Button size="sm" variant="outline" className="text-xs mt-2">Làm đề thi ngay</Button>
                  </Link>
                </div>
              )}

              {recentExams.map((exam) => (
                <div key={exam.id} className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold flex items-center gap-1">
                      <Trophy className="h-3.5 w-3.5 text-amber-500" /> Đề thi thử
                    </span>
                    <Badge variant={exam.score >= 40 ? 'success' : exam.score >= 30 ? 'warning' : 'destructive'} className="text-xs px-2 py-0 border-0">
                      {exam.score}/{exam.totalQuestions}
                    </Badge>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Progress value={(exam.score / exam.totalQuestions) * 100} className="h-1.5 bg-muted" />
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap flex items-center gap-0.5">
                      <Clock className="h-3 w-3" /> {Math.floor(exam.timeTaken / 60)}p
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{formatRelativeTime(exam.completedAt)}</p>
                  <hr className="border-border/30 mt-2" />
                </div>
              ))}

              {!loading && recentExams.length > 0 && (
                <Link href="/exam">
                  <Button className="w-full text-xs font-semibold" variant="outline">
                    Thi thử đề mới <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Study Utilities Section */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold tracking-tight">Tiện ích học tập</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/saved-questions" className="block h-full">
            <Card className="hover:shadow-md hover:border-purple-500/30 transition-all cursor-pointer h-full group">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500 group-hover:bg-purple-500/20 transition-colors">
                  <BookmarkCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Câu cần ôn tập</p>
                  <p className="text-xs text-muted-foreground">Các câu hỏi bạn đã lưu</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/documents" className="block h-full">
            <Card className="hover:shadow-md hover:border-purple-500/30 transition-all cursor-pointer h-full group">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500 group-hover:bg-purple-500/20 transition-colors">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Tài liệu học tập</p>
                  <p className="text-xs text-muted-foreground">Tài liệu ôn tập Toán học</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/schedule" className="block h-full">
            <Card className="hover:shadow-md hover:border-purple-500/30 transition-all cursor-pointer h-full group">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500 group-hover:bg-purple-500/20 transition-colors">
                  <CalendarRange className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Lịch học tập</p>
                  <p className="text-xs text-muted-foreground">Lịch thi Toán và sự kiện</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}
