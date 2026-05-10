'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BookOpen, Layers, FileText, ChevronRight, Loader2 } from 'lucide-react'

interface Course {
  id: string
  name: string
  description: string | null
  slug: string
  order_index: number
  chapter_count: number
  lesson_count: number
}

const COURSE_COLORS = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-amber-600',
  'from-rose-500 to-pink-600',
]

export default function AdminLearningPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/learning/courses')
      .then((r) => r.json())
      .then((d) => setCourses(d.courses ?? []))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Quản lý Học Tập</h1>
          <p className="text-sm text-zinc-400 mt-1">5 khoá học · Click để quản lý chương và bài học</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {courses.map((course, idx) => (
          <Link
            key={course.id}
            href={`/admin/learning/${course.id}`}
            className="group relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 p-5 hover:border-zinc-600 transition-all"
          >
            {/* Gradient accent */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${COURSE_COLORS[idx % COURSE_COLORS.length]}`} />

            <div className="flex items-start justify-between gap-3 mt-1">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-zinc-500">Khoá {course.order_index}</span>
                </div>
                <h2 className="text-base font-bold text-zinc-100 mb-1">{course.name}</h2>
                <p className="text-sm text-zinc-400 line-clamp-2">{course.description ?? '—'}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-zinc-500 shrink-0 mt-1 group-hover:text-zinc-300 transition-colors" />
            </div>

            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-zinc-800 text-sm">
              <div className="flex items-center gap-1.5 text-zinc-400">
                <Layers className="h-3.5 w-3.5" />
                <span>{course.chapter_count} chương</span>
              </div>
              <div className="flex items-center gap-1.5 text-zinc-400">
                <FileText className="h-3.5 w-3.5" />
                <span>{course.lesson_count} bài</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {courses.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BookOpen className="h-12 w-12 text-zinc-600 mb-3" />
          <p className="text-zinc-400">Chưa có khoá học. Hãy chạy SQL schema để tạo dữ liệu ban đầu.</p>
        </div>
      )}
    </div>
  )
}
