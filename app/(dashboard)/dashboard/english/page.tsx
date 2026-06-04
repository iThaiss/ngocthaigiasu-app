'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Languages, BookOpen, BookMarked, Sparkles, Flame,
  Loader2, ArrowRight, BookOpenCheck, BookmarkCheck,
  GraduationCap, AlertCircle, ChevronRight, Repeat, Star,
  FileText, CalendarRange
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth-context'

interface EnglishStats {
  vocab: { mastered: number; dueToday: number; setsStarted: number }
  grammar: { mastered: number; attempted: number; total: number }
  reading: { completed: number; total: number; avgScore: number }
}

export default function EnglishDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<EnglishStats | null>(null)
  const [streak, setStreak] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadData() {
      setLoading(true)
      setError('')
      try {
        const [statsRes, streakRes] = await Promise.all([
          fetch('/api/english-stats'),
          fetch('/api/streak?subject=english')
        ])

        if (!statsRes.ok) throw new Error('Không thể tải tiến độ Tiếng Anh')

        const statsJson = await statsRes.json()
        const streakJson = streakRes.ok ? await streakRes.json() : { streak: 0 }

        if (!cancelled) {
          setStats(statsJson)
          setStreak(streakJson.streak)
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

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Welcome & Streak Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Không gian Tiếng Anh
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

      {/* Hero Card: Vocab Reviews Due */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <Link href="/vocabulary">
          <Card className="overflow-hidden border-2 border-transparent bg-gradient-to-r from-rose-500/15 via-pink-500/10 to-transparent hover:border-rose-500/20 hover:shadow-lg transition-all cursor-pointer group relative">
            <div className="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-rose-500/10 to-transparent pointer-events-none" />
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2 flex-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                    <Repeat className="h-3.5 w-3.5" /> Ôn tập thông minh FSRS
                  </div>
                  <h3 className="text-lg font-bold">
                    {stats && stats.vocab.dueToday > 0 
                      ? `Bạn có ${stats.vocab.dueToday} từ vựng cần ôn hôm nay` 
                      : 'Hôm nay không có từ vựng nào đến hạn ôn'
                    }
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-xl">
                    {stats && stats.vocab.dueToday > 0
                      ? 'Áp dụng thuật toán lặp lại ngắt quãng (Spaced Repetition) giúp ghi nhớ sâu 90% từ vựng vĩnh viễn.'
                      : 'Tuyệt vời! Bạn đã hoàn thành việc ôn tập từ vựng hôm nay. Hãy học thêm từ mới để nâng cao vốn từ!'
                    }
                  </p>
                </div>
                
                <Button className="bg-rose-600 text-white hover:bg-rose-700 font-semibold gap-1 shrink-0 self-start md:self-auto group-hover:translate-x-1 transition-transform">
                  {stats && stats.vocab.dueToday > 0 ? 'Ôn tập ngay' : 'Học từ mới'} <ChevronRight className="h-4 w-4" />
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
            label: 'Từ vựng đã học', 
            value: stats?.vocab.mastered ?? 0, 
            icon: Languages, 
            color: 'text-rose-500', 
            bg: 'bg-rose-500/10',
            sub: `${stats?.vocab.setsStarted ?? 0} bộ từ đang học` 
          },
          { 
            label: 'Ngữ pháp hoàn thành', 
            value: stats ? `${stats.grammar.mastered}/${stats.grammar.total}` : '0/50', 
            icon: BookOpenCheck, 
            color: 'text-violet-500', 
            bg: 'bg-violet-500/10',
            sub: `${stats?.grammar.attempted ?? 0} chuyên đề đã luyện` 
          },
          { 
            label: 'Bài đọc đã làm', 
            value: stats ? `${stats.reading.completed}/${stats.reading.total}` : '0/0', 
            icon: BookMarked, 
            color: 'text-sky-500', 
            bg: 'bg-sky-500/10',
            sub: stats?.reading.avgScore ? `Điểm trung bình ${stats.reading.avgScore}%` : 'Chưa làm bài nào' 
          },
        ].map((stat, i) => (
          <motion.div 
            key={stat.label} 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.1 + i * 0.05 }}
          >
            <Card>
              <CardContent className="p-5 flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</p>
                  <p className={`text-2xl font-bold ${stat.color}`}>
                    {loading ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /> : stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{stat.sub}</p>
                </div>
                <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Grid: Quick Actions (Left) & AI feedback promotion (Right) */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Quick Actions (2/3) */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-lg font-bold tracking-tight">Kỹ năng học tập</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { 
                href: '/vocabulary', 
                icon: Languages, 
                label: 'Từ vựng', 
                desc: 'Học từ và luyện Flashcard', 
                color: 'from-rose-500/15 to-pink-500/10 text-rose-500 hover:border-rose-500/40 border-2 border-transparent' 
              },
              { 
                href: '/grammar', 
                icon: BookOpen, 
                label: 'Ngữ pháp', 
                desc: 'Chuyên đề và cấu trúc câu', 
                color: 'from-violet-500/15 to-purple-500/10 text-purple-500 hover:border-purple-500/40 border-2 border-transparent' 
              },
              { 
                href: '/reading', 
                icon: BookMarked, 
                label: 'Đọc hiểu', 
                desc: 'Đọc bài khóa, dịch từ tại chỗ', 
                color: 'from-sky-500/15 to-blue-500/10 text-sky-500 hover:border-sky-500/40 border-2 border-transparent' 
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

          {/* Additional Features Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <Link href="/vocabulary/ai">
              <Card className="border-dashed hover:border-rose-500/40 hover:bg-rose-500/5 transition-all cursor-pointer">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">AI Tạo bộ từ vựng</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Tạo set học từ chủ đề tự do của bạn</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
                </CardContent>
              </Card>
            </Link>

            <Link href="/vocabulary/community">
              <Card className="border-dashed hover:border-pink-500/40 hover:bg-pink-500/5 transition-all cursor-pointer">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-pink-500/10 text-pink-500">
                    <BookmarkCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Set từ cộng đồng</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Khám phá bộ từ vựng chia sẻ hữu ích</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* AI Feedback Promo (1/3) */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold tracking-tight">AI Đánh giá</h2>
          
          <Link href="/english-feedback">
            <Card className="overflow-hidden border-2 border-transparent bg-gradient-to-br from-rose-500/20 via-pink-500/5 to-background hover:border-rose-500/30 hover:shadow-lg transition-all duration-300 cursor-pointer h-full group">
              <CardHeader className="pb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-md">
                  <Sparkles className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <h3 className="font-bold text-base group-hover:text-rose-500 transition-colors">Nhận xét AI cá nhân hóa</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Hệ thống AI sẽ phân tích toàn bộ lịch sử học tập của bạn, chỉ ra điểm yếu ngữ pháp cụ thể và đề xuất các từ vựng cần bổ sung gấp.
                </p>
                <div className="pt-2 flex items-center text-xs font-semibold text-rose-500 gap-1">
                  Xem phân tích ngay <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Motivational banner */}
          <Card className="bg-gradient-to-br from-rose-600 to-pink-800 text-white">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-1.5 text-amber-300 text-xs font-bold uppercase tracking-wider">
                <Star className="h-4 w-4 fill-amber-300" /> Lời khuyên ôn tập
              </div>
              <p className="text-xs leading-relaxed text-rose-100 font-medium">
                &ldquo;Hãy mở không gian Tiếng Anh hàng ngày, ôn tập các từ vựng bị đến hạn (FSRS) trước, sau đó làm 1 bài đọc để học từ vựng trong văn cảnh.&rdquo;
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Study Utilities Section */}
      <div className="space-y-3 pt-6 border-t border-border/40">
        <h2 className="text-lg font-bold tracking-tight">Tiện ích học tập</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/saved-questions">
            <Card className="hover:shadow-md hover:border-rose-500/30 transition-all cursor-pointer h-full group">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500 group-hover:bg-rose-500/20 transition-colors">
                  <BookmarkCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Câu cần ôn tập</p>
                  <p className="text-xs text-muted-foreground">Các câu hỏi bạn đã lưu</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/documents">
            <Card className="hover:shadow-md hover:border-rose-500/30 transition-all cursor-pointer h-full group">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500 group-hover:bg-rose-500/20 transition-colors">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Tài liệu học tập</p>
                  <p className="text-xs text-muted-foreground">Tài liệu ôn tập Tiếng Anh</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/schedule">
            <Card className="hover:shadow-md hover:border-rose-500/30 transition-all cursor-pointer h-full group">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500 group-hover:bg-rose-500/20 transition-colors">
                  <CalendarRange className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Lịch học tập</p>
                  <p className="text-xs text-muted-foreground">Lịch thi Anh và sự kiện</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}
