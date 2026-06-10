'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  BookOpen,
  Lock,
  ChevronRight,
  Layers,
  FileText,
  Crown,
  Loader2,
  Route,
  Clock3,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/lib/auth-context'
import { cn } from '@/lib/utils'

interface Course {
  id: string
  name: string
  description: string | null
  slug: string
  order_index: number
  chapter_count: number
  lesson_count: number
  completed: number
}

export default function LearningPage() {
  const { isVip } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/learning/courses')
      .then((r) => r.json())
      .then((d) => setCourses(d.courses ?? []))
      .finally(() => setLoading(false))
  }, [])

  const primaryCourse = courses.find((course) => course.slug === 'nen-tang') ?? courses[0]
  const otherCourses = courses.filter((course) => course.id !== primaryCourse?.id)

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <header className="rounded-lg border bg-card px-5 py-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
              <BookOpen className="h-5 w-5 text-violet-500" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold leading-tight">Học tập</h1>
                <Badge variant="secondary" className="gap-1">
                  <Sparkles className="h-3.5 w-3.5" />
                  Toán 12
                </Badge>
              </div>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Hiện tại tập trung vào một lộ trình chính: xây nền công thức, dạng bài và flashcard ôn lại bằng FSRS.
              </p>
            </div>
          </div>

          {!isVip && (
            <Link href="/payment">
              <Button size="sm" className="shrink-0 gap-1.5 bg-yellow-500 font-semibold text-black hover:bg-yellow-600">
                <Crown className="h-4 w-4" />
                Nâng cấp VIP
              </Button>
            </Link>
          )}
        </div>
      </header>

      {loading ? (
        <div className="flex h-56 items-center justify-center rounded-lg border bg-card">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : primaryCourse ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border border-violet-500/25 bg-gradient-to-br from-violet-500/10 via-card to-card p-5 shadow-sm"
          >
            <div className="flex flex-col gap-5 md:flex-row md:items-start">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-violet-500">
                <Route className="h-6 w-6" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge className="bg-violet-500/15 text-violet-600 hover:bg-violet-500/15 dark:text-violet-300">
                    Đang mở
                  </Badge>
                  <Badge variant="outline">Lộ trình chính</Badge>
                </div>

                <h2 className="text-xl font-bold leading-snug">{primaryCourse.name}</h2>
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  {primaryCourse.description ?? 'Xây nền Toán 12 từ công thức, dạng bài, lỗi sai đến luyện tập.'}
                </p>

                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  <div className="rounded-md border bg-background/60 px-3 py-2">
                    <p className="text-xs text-muted-foreground">Chương</p>
                    <p className="mt-0.5 text-lg font-bold">{primaryCourse.chapter_count}</p>
                  </div>
                  <div className="rounded-md border bg-background/60 px-3 py-2">
                    <p className="text-xs text-muted-foreground">Bài học</p>
                    <p className="mt-0.5 text-lg font-bold">{primaryCourse.lesson_count}</p>
                  </div>
                  <div className="rounded-md border bg-background/60 px-3 py-2">
                    <p className="text-xs text-muted-foreground">Đã hoàn thành</p>
                    <p className="mt-0.5 text-lg font-bold">{primaryCourse.completed}</p>
                  </div>
                </div>

                {primaryCourse.lesson_count > 0 && (
                  <div className="mt-4 space-y-1.5">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{primaryCourse.completed}/{primaryCourse.lesson_count} bài đã học</span>
                      <span>{Math.round((primaryCourse.completed / primaryCourse.lesson_count) * 100)}%</span>
                    </div>
                    <Progress value={Math.round((primaryCourse.completed / primaryCourse.lesson_count) * 100)} className="h-1.5" />
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Link href={isVip ? `/learning/${primaryCourse.slug}` : '/payment'}>
                <Button className="gap-1.5">
                  Vào học
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
              {!isVip && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Lock className="h-3.5 w-3.5" />
                  Cần VIP để học trọn lộ trình
                </div>
              )}
            </div>
          </motion.section>

          <aside className="space-y-3">
            <div className="rounded-lg border bg-card p-4">
              <h3 className="flex items-center gap-2 text-sm font-bold">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Cách học trong lộ trình
              </h3>
              <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                <p className="flex gap-2"><span className="text-foreground">1.</span>Đọc lý thuyết ngắn.</p>
                <p className="flex gap-2"><span className="text-foreground">2.</span>Ôn flashcard công thức.</p>
                <p className="flex gap-2"><span className="text-foreground">3.</span>Làm bài tập và xem lỗi sai.</p>
              </div>
            </div>

            <div className="rounded-lg border bg-card p-4">
              <h3 className="flex items-center gap-2 text-sm font-bold">
                <Clock3 className="h-4 w-4 text-muted-foreground" />
                Lộ trình tiếp theo
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Các lộ trình còn lại đang được khóa để tập trung hoàn thiện nền tảng trước.
              </p>
            </div>
          </aside>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <BookOpen className="mb-3 h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">Chưa có khóa học nào</p>
        </div>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-bold">Lộ trình sắp tới</h2>
            <p className="text-sm text-muted-foreground">Các mục này chưa mở, chỉ hiển thị để học sinh biết hướng phát triển.</p>
          </div>
          <Badge variant="outline" className="gap-1">
            <Clock3 className="h-3.5 w-3.5" />
            Coming soon
          </Badge>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {otherCourses.map((course) => (
            <div
              key={course.id}
              className={cn(
                'relative overflow-hidden rounded-lg border border-slate-800 bg-black/80 p-4 text-slate-300',
                'opacity-55 grayscale'
              )}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
              <div className="relative">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-white/5">
                    <Lock className="h-4 w-4 text-slate-400" />
                  </div>
                  <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[11px] text-slate-400">Upcoming</span>
                </div>
                <h3 className="font-semibold text-slate-100">{course.name}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">
                  {course.description ?? 'Lộ trình này đang được biên soạn và sẽ mở sau.'}
                </p>
                <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <Layers className="h-3.5 w-3.5" />
                    {course.chapter_count} chương
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" />
                    {course.lesson_count} bài
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
