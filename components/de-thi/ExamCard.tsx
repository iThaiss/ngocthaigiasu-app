'use client'

import { Clock, Users, FileText, CheckCircle2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface ExamCardProps {
  id: string
  title: string
  year: number | null
  time_limit_minutes: number
  question_count: number
  max_score: number
  attempt_count: number
  avg_score: number | null
  status: 'draft' | 'published'
  my_submission: { score: number; submitted_at: string } | null
}

export default function ExamCard({
  id, title, year, time_limit_minutes, question_count, max_score,
  attempt_count, avg_score, status, my_submission,
}: ExamCardProps) {
  const done = my_submission !== null

  return (
    <Link href={`/de-thi/${id}`} className="block">
      <Card className={`transition-all hover:shadow-md hover:border-primary/40 cursor-pointer ${status === 'draft' ? 'opacity-60 border-dashed' : ''}`}>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold leading-tight line-clamp-2">{title}</p>
                {year && <p className="text-xs text-muted-foreground mt-0.5">Năm {year}</p>}
              </div>
            </div>
            <div className="shrink-0 flex flex-col items-end gap-1">
              {status === 'draft' && (
                <Badge variant="outline" className="text-xs">Nháp</Badge>
              )}
              {done && (
                <Badge className="bg-green-600 gap-1 text-xs">
                  <CheckCircle2 className="h-3 w-3" />
                  {my_submission!.score}/{max_score}đ
                </Badge>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" />
              {question_count} câu
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {time_limit_minutes} phút
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {attempt_count} lượt thi
            </span>
            {avg_score !== null && (
              <span className="font-medium text-foreground">
                TB {avg_score}/{max_score}đ
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
