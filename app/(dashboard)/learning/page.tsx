'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { BookOpen, Lock, ChevronRight, Layers, FileText, Crown, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/lib/auth-context'

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

const COURSE_ICONS = ['🚀', '⚡', '📖', '🎯', '🏆']
const COURSE_COLORS = [
  'from-violet-500/10 to-purple-500/5 border-violet-500/20',
  'from-blue-500/10 to-indigo-500/5 border-blue-500/20',
  'from-emerald-500/10 to-teal-500/5 border-emerald-500/20',
  'from-orange-500/10 to-amber-500/5 border-orange-500/20',
  'from-rose-500/10 to-pink-500/5 border-rose-500/20',
]
const ICON_COLORS = [
  'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  'bg-rose-500/10 text-rose-600 dark:text-rose-400',
]

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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
          <BookOpen className="h-5 w-5 text-violet-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Học Tập</h1>
          <p className="text-muted-foreground text-sm">Lộ trình Toán 12 từ nền tảng đến bứt phá</p>
        </div>
      </motion.div>

      {!isVip && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card className="border-yellow-500/30 bg-yellow-500/5">
            <CardContent className="flex items-center justify-between gap-4 pt-4 pb-4">
              <div className="flex items-center gap-3">
                <Crown className="h-5 w-5 text-yellow-500 shrink-0" />
                <div>
                  <p className="font-medium text-sm">Yêu cầu VIP để học</p>
                  <p className="text-xs text-muted-foreground">Nâng cấp để truy cập toàn bộ bài học và giáo án</p>
                </div>
              </div>
              <Link href="/payment">
                <Button size="sm" className="shrink-0 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold">
                  Nâng cấp VIP
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Courses grid */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-4">
          {courses.map((course, idx) => {
            const progress = course.lesson_count > 0
              ? Math.round((course.completed / course.lesson_count) * 100)
              : 0

            return (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
              >
                <Link href={isVip ? `/learning/${course.slug}` : '/payment'}>
                  <Card className={`relative overflow-hidden border bg-gradient-to-r ${COURSE_COLORS[idx % COURSE_COLORS.length]} hover:shadow-md transition-all cursor-pointer group`}>
                    {!isVip && (
                      <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-xl">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <Lock className="h-4 w-4" /> VIP only
                        </div>
                      </div>
                    )}
                    <CardContent className="pt-5 pb-5">
                      <div className="flex items-start gap-4">
                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl ${ICON_COLORS[idx % ICON_COLORS.length]}`}>
                          {COURSE_ICONS[idx % COURSE_ICONS.length]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h2 className="text-base font-bold">{course.name}</h2>
                            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{course.description}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                            <span className="flex items-center gap-1">
                              <Layers className="h-3.5 w-3.5" /> {course.chapter_count} chương
                            </span>
                            <span className="flex items-center gap-1">
                              <FileText className="h-3.5 w-3.5" /> {course.lesson_count} bài
                            </span>
                          </div>
                          {course.lesson_count > 0 && (
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>{course.completed}/{course.lesson_count} bài đã học</span>
                                <span>{progress}%</span>
                              </div>
                              <Progress value={progress} className="h-1.5" />
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            )
          })}

          {courses.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Chưa có khoá học nào</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
