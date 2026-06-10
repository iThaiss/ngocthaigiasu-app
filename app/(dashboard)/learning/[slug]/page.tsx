'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  FileText,
  Video,
  Loader2,
  Shapes,
  CalculatorIcon,
  CheckCircle2,
  Search,
  ListChecks,
  Layers,
  Dumbbell,
  PanelTopOpen,
  PanelTopClose,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface Lesson {
  id: string
  title: string
  topic: string | null
  video_url: string | null
  lesson_plan: Record<string, unknown> | null
  order_index: number
  completed?: boolean
  created_at: string
  exercise_count?: number
  key_rules?: string[] | null
  common_mistakes?: string[] | null
}

interface Chapter {
  id: string
  name: string
  description: string | null
  subject: 'toan_dai' | 'toan_hinh'
  order_index: number
  lessons: Lesson[]
}

interface Course {
  id: string
  name: string
  description: string | null
  slug: string
}

const SUBJECT_LABEL = { toan_dai: 'Toán Đại số', toan_hinh: 'Toán Hình học' }
const SUBJECT_STYLE = {
  toan_dai: 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-300',
  toan_hinh: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-300',
}

export default function CoursePage() {
  const params = useParams()
  const slug = params.slug as string

  const [course, setCourse] = useState<Course | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [query, setQuery] = useState('')

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/learning/${slug}`)
      if (!res.ok) {
        setErrorMessage(res.status === 401 ? 'Bạn cần đăng nhập lại để xem khóa học.' : 'Không tải được khóa học này.')
        return
      }
      const data = await res.json()
      setErrorMessage(null)
      setCourse(data.course)
      setChapters(data.chapters ?? [])
      setExpanded(new Set())
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => { fetchData() }, [fetchData])

  const stats = useMemo(() => {
    const lessons = chapters.flatMap((chapter) => chapter.lessons)
    const completed = lessons.filter((lesson) => lesson.completed).length
    const exercises = lessons.reduce((sum, lesson) => sum + (lesson.exercise_count ?? 0), 0)
    return {
      lessons: lessons.length,
      completed,
      exercises,
      progress: lessons.length > 0 ? Math.round((completed / lessons.length) * 100) : 0,
    }
  }, [chapters])

  const filteredChapters = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return chapters
    return chapters
      .map((chapter) => ({
        ...chapter,
        lessons: chapter.lessons.filter((lesson) => {
          const haystack = `${lesson.title} ${lesson.topic ?? ''} ${chapter.name}`.toLowerCase()
          return haystack.includes(term)
        }),
      }))
      .filter((chapter) => chapter.lessons.length > 0)
  }, [chapters, query])

  function toggleChapter(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function expandAll() {
    setExpanded(new Set(filteredChapters.map((chapter) => chapter.id)))
  }

  function collapseAll() {
    setExpanded(new Set())
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (errorMessage) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <BookOpen className="mb-3 h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">{errorMessage}</p>
        <Link href="/login" className="mt-3 text-sm text-primary hover:underline">Đăng nhập</Link>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <BookOpen className="mb-3 h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Khóa học không tồn tại</p>
        <Link href="/learning" className="mt-3 text-sm text-primary hover:underline">Quay lại</Link>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/learning" className="flex items-center gap-1 hover:text-foreground">
          <ChevronLeft className="h-3.5 w-3.5" />
          Học tập
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground">{course.name}</span>
      </div>

      <header className="rounded-lg border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
              <BookOpen className="h-6 w-6 text-violet-500" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold leading-tight">{course.name}</h1>
              {course.description && (
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">{course.description}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="outline" className="gap-1"><Layers className="h-3.5 w-3.5" />{chapters.length} chương</Badge>
                <Badge variant="outline" className="gap-1"><FileText className="h-3.5 w-3.5" />{stats.lessons} bài</Badge>
                <Badge variant="outline" className="gap-1"><Dumbbell className="h-3.5 w-3.5" />{stats.exercises} bài tập</Badge>
                <Badge variant="outline" className="gap-1"><ListChecks className="h-3.5 w-3.5" />Lý thuyết + vận dụng</Badge>
              </div>
            </div>
          </div>

          <div className="w-full rounded-lg border bg-muted/20 p-3 lg:w-64">
            <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
              <span>Tiến độ</span>
              <span>{stats.completed}/{stats.lessons} bài</span>
            </div>
            <Progress value={stats.progress} className="h-2" />
            <p className="mt-2 text-right text-sm font-semibold">{stats.progress}%</p>
          </div>
        </div>
      </header>

      <section className="rounded-lg border bg-card p-3 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm bài học, công thức, chủ đề..."
              className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={expandAll}>
              <PanelTopOpen className="h-4 w-4" />
              Mở hết
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={collapseAll}>
              <PanelTopClose className="h-4 w-4" />
              Thu gọn
            </Button>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        {filteredChapters.map((chapter, idx) => {
          const isOpen = expanded.has(chapter.id)
          const completed = chapter.lessons.filter((lesson) => lesson.completed).length
          const progress = chapter.lessons.length > 0 ? Math.round((completed / chapter.lessons.length) * 100) : 0

          return (
            <motion.div
              key={chapter.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="overflow-hidden rounded-lg border bg-card shadow-sm"
            >
              <button
                onClick={() => toggleChapter(chapter.id)}
                className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-muted/25"
              >
                <div className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                  chapter.subject === 'toan_dai' ? 'bg-blue-500/10' : 'bg-emerald-500/10'
                )}>
                  {chapter.subject === 'toan_dai'
                    ? <CalculatorIcon className="h-5 w-5 text-blue-500" />
                    : <Shapes className="h-5 w-5 text-emerald-500" />
                  }
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold leading-snug">{chapter.name}</span>
                    <Badge variant="outline" className={cn('text-[10px]', SUBJECT_STYLE[chapter.subject])}>
                      {SUBJECT_LABEL[chapter.subject]}
                    </Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span>{chapter.lessons.length} bài học</span>
                    <span>{completed} đã hoàn thành</span>
                    <span>{progress}%</span>
                  </div>
                </div>

                <div className="hidden w-24 sm:block">
                  <Progress value={progress} className="h-1.5" />
                </div>
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </motion.div>
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="overflow-hidden border-t"
                  >
                    <div className="divide-y divide-border">
                      {chapter.lessons.length === 0 ? (
                        <p className="px-4 py-4 text-center text-sm text-muted-foreground">Chưa có bài học</p>
                      ) : chapter.lessons.map((lesson, lessonIdx) => (
                        <Link
                          key={lesson.id}
                          href={`/learning/${slug}/${lesson.id}`}
                          className="group grid gap-2 px-4 py-3 transition-colors hover:bg-muted/25 sm:grid-cols-[32px_minmax(0,1fr)_auto]"
                        >
                          <div className={cn(
                            'flex h-8 w-8 items-center justify-center rounded-md text-xs font-semibold',
                            lesson.completed ? 'bg-emerald-500/15 text-emerald-500' : 'bg-primary/10 text-primary'
                          )}>
                            {lesson.completed ? <CheckCircle2 className="h-4 w-4" /> : lessonIdx + 1}
                          </div>

                          <div className="min-w-0">
                            <p className="text-sm font-medium leading-snug group-hover:text-primary">{lesson.title}</p>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              {lesson.topic && <span>{lesson.topic}</span>}
                              {(lesson.exercise_count ?? 0) > 0 && (
                                <span className="inline-flex items-center gap-1">
                                  <ListChecks className="h-3.5 w-3.5" />
                                  {lesson.exercise_count} câu luyện
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-center text-muted-foreground">
                            {lesson.video_url && <Video className="h-4 w-4 text-blue-500" />}
                            {lesson.lesson_plan && <FileText className="h-4 w-4 text-violet-500" />}
                            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}

        {filteredChapters.length === 0 && (
          <div className="rounded-lg border border-dashed py-12 text-center">
            <Search className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Không tìm thấy bài học phù hợp.</p>
          </div>
        )}
      </section>
    </div>
  )
}
