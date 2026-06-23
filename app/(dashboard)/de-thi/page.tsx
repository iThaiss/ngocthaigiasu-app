'use client'

import { useEffect, useState, useCallback } from 'react'
import { Loader2, BookOpen } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import ExamCard from '@/components/de-thi/ExamCard'
import AdminExamPanel from '@/components/de-thi/AdminExamPanel'

interface Exam {
  id: string
  title: string
  year: number | null
  pdf_url: string | null
  time_limit_minutes: number
  question_count: number
  max_score: number
  attempt_count: number
  avg_score: number | null
  status: 'draft' | 'published'
  solution_url: string | null
  handwritten_url: string | null
  my_submission: { score: number; submitted_at: string } | null
}

export default function DethiPage() {
  const { user, role } = useAuth()
  const isAdmin = role === 'admin'

  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)

  const fetchExams = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/de-thi')
      const data = await res.json()
      setExams(data.exams ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchExams() }, [fetchExams])

  const publishedExams = isAdmin ? exams : exams.filter((e) => e.status === 'published')

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <BookOpen className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Đề thi</h1>
          <p className="text-sm text-muted-foreground">Đề thi tốt nghiệp THPT — làm bài online, tính giờ, xem kết quả ngay</p>
        </div>
      </div>

      {isAdmin && (
        <AdminExamPanel
          exams={exams.map((e) => ({
            id: e.id,
            title: e.title,
            year: e.year,
            status: e.status,
            question_count: e.question_count,
            attempt_count: e.attempt_count,
            pdf_url: e.pdf_url,
            solution_url: e.solution_url,
            handwritten_url: e.handwritten_url,
          }))}
          onRefresh={fetchExams}
        />
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
        </div>
      ) : publishedExams.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
          <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Chưa có đề thi nào</p>
          <p className="text-sm mt-1">Admin sẽ sớm thêm đề thi mới</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {publishedExams.map((exam) => (
            <ExamCard key={exam.id} {...exam} />
          ))}
        </div>
      )}
    </div>
  )
}
