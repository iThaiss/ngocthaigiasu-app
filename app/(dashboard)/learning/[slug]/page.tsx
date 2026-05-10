'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen, ChevronLeft, ChevronDown, ChevronRight,
  FileText, Video, Loader2, Shapes, CalculatorIcon,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'

interface Lesson {
  id: string
  title: string
  topic: string | null
  video_url: string | null
  lesson_plan: Record<string, unknown> | null
  order_index: number
  created_at: string
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
  toan_dai: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  toan_hinh: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
}

export default function CoursePage() {
  const params = useParams()
  const slug = params.slug as string

  const [course, setCourse] = useState<Course | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/learning/${slug}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setCourse(data.course)
      setChapters(data.chapters ?? [])
      // Expand first chapter by default
      if (data.chapters?.length > 0) {
        setExpanded(new Set([data.chapters[0].id]))
      }
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => { fetchData() }, [fetchData])

  function toggleChapter(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <BookOpen className="h-12 w-12 text-muted-foreground mb-3" />
        <p className="text-muted-foreground">Khoá học không tồn tại</p>
        <Link href="/learning" className="mt-3 text-sm text-primary hover:underline">Quay lại</Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/learning" className="hover:text-foreground flex items-center gap-1">
          <ChevronLeft className="h-3.5 w-3.5" /> Học Tập
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground">{course.name}</span>
      </div>

      {/* Course header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-start gap-4 mb-2">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-500/10">
            <BookOpen className="h-6 w-6 text-violet-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{course.name}</h1>
            {course.description && (
              <p className="text-muted-foreground text-sm mt-1">{course.description}</p>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{chapters.length} chương · {chapters.reduce((s, c) => s + c.lessons.length, 0)} bài học</p>
      </motion.div>

      {/* Chapters */}
      <div className="space-y-3">
        {chapters.map((chapter, idx) => {
          const isOpen = expanded.has(chapter.id)
          return (
            <motion.div
              key={chapter.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06 }}
              className="rounded-xl border bg-card overflow-hidden"
            >
              {/* Chapter header */}
              <button
                onClick={() => toggleChapter(chapter.id)}
                className="flex w-full items-center gap-3 px-4 py-3.5 hover:bg-muted/30 transition-colors text-left"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                  {chapter.subject === 'toan_dai'
                    ? <CalculatorIcon className="h-4 w-4 text-blue-500" />
                    : <Shapes className="h-4 w-4 text-emerald-500" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{chapter.name}</span>
                    <Badge className={`text-[10px] ${SUBJECT_STYLE[chapter.subject]}`}>
                      {SUBJECT_LABEL[chapter.subject]}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{chapter.lessons.length} bài học</p>
                </div>
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </motion.div>
              </button>

              {/* Lessons */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="divide-y divide-border border-t">
                      {chapter.lessons.length === 0 ? (
                        <p className="px-4 py-4 text-sm text-muted-foreground text-center">Chưa có bài học</p>
                      ) : chapter.lessons.map((lesson) => (
                        <Link
                          key={lesson.id}
                          href={`/learning/${slug}/${lesson.id}`}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors group"
                        >
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/5">
                            <FileText className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                              {lesson.title}
                            </p>
                            <div className="flex items-center gap-3 mt-0.5">
                              {lesson.topic && (
                                <span className="text-[10px] text-muted-foreground">{lesson.topic}</span>
                              )}
                              <span className="text-[10px] text-muted-foreground">{formatDate(lesson.created_at)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {lesson.video_url && (
                              <Video className="h-3.5 w-3.5 text-blue-500" />
                            )}
                            {lesson.lesson_plan && (
                              <FileText className="h-3.5 w-3.5 text-violet-500" />
                            )}
                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
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
      </div>
    </div>
  )
}
