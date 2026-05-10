'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  BookOpen, ChevronLeft, ChevronRight, Download, Play,
  Crown, Lock, Loader2, FileText, AlertCircle,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/use-toast'

interface Lesson {
  id: string
  title: string
  topic: string | null
  video_url: string | null
  video_source: string
  lesson_plan_html: string | null
  lesson_plan: { duration?: number; title?: string } | null
  created_at: string
  chapters: {
    name: string
    subject: string
    courses: { name: string; slug: string } | null
  } | null
}

function getYouTubeEmbedUrl(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/)
  if (match) return `https://www.youtube.com/embed/${match[1]}`
  return null
}

function getDriveEmbedUrl(url: string): string | null {
  const match = url.match(/drive\.google\.com\/file\/d\/([^/]+)/)
  if (match) return `https://drive.google.com/file/d/${match[1]}/preview`
  return null
}

function getEmbedUrl(url: string): string | null {
  return getYouTubeEmbedUrl(url) ?? getDriveEmbedUrl(url) ?? null
}

export default function LessonPage() {
  const params = useParams()
  const slug = params.slug as string
  const lessonId = params.lessonId as string
  const { toast } = useToast()

  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [isVip, setIsVip] = useState(false)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  const fetchLesson = useCallback(async () => {
    try {
      const res = await fetch(`/api/learning/lessons/${lessonId}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setLesson(data.lesson)
      setIsVip(data.isVip)
    } finally {
      setLoading(false)
    }
  }, [lessonId])

  useEffect(() => { fetchLesson() }, [fetchLesson])

  async function handleDownloadPdf() {
    setExporting(true)
    try {
      const res = await fetch('/api/admin/learning/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId }),
      })
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `giao-an-${lesson?.title?.replace(/\s+/g, '-').toLowerCase() ?? lessonId}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast({ title: 'Xuất PDF thất bại', variant: 'destructive' })
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!lesson) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-3" />
        <p className="text-muted-foreground">Không tìm thấy bài học</p>
        <Link href={`/learning/${slug}`} className="mt-3 text-sm text-primary hover:underline">Quay lại</Link>
      </div>
    )
  }

  const embedUrl = lesson.video_url ? getEmbedUrl(lesson.video_url) : null
  const duration = lesson.lesson_plan?.duration ?? 90
  const courseName = lesson.chapters?.courses?.name ?? ''
  const chapterName = lesson.chapters?.name ?? ''

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
        <Link href="/learning" className="hover:text-foreground flex items-center gap-1">
          <ChevronLeft className="h-3.5 w-3.5" /> Học Tập
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/learning/${slug}`} className="hover:text-foreground">{courseName}</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground line-clamp-1">{lesson.title}</span>
      </div>

      {/* Title row */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold">{lesson.title}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {chapterName && <Badge variant="secondary" className="text-xs">{chapterName}</Badge>}
            {lesson.topic && <Badge variant="outline" className="text-xs">{lesson.topic}</Badge>}
            <span className="text-xs text-muted-foreground">⏱ {duration} phút</span>
          </div>
        </div>
        {isVip && lesson.lesson_plan_html && (
          <Button
            onClick={handleDownloadPdf}
            disabled={exporting}
            variant="outline"
            size="sm"
            className="gap-1.5 shrink-0"
          >
            {exporting
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Download className="h-3.5 w-3.5" />
            }
            Tải PDF
          </Button>
        )}
      </div>

      <Separator />

      {/* 2-column layout */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Lesson content (2/3) */}
        <div className="lg:col-span-2">
          {!isVip ? (
            /* VIP lock overlay */
            <Card className="border-yellow-500/30">
              <CardContent className="pt-6 pb-6">
                <div className="relative">
                  {/* Blurred preview */}
                  <div className="blur-md pointer-events-none select-none opacity-60 max-h-64 overflow-hidden">
                    <div className="space-y-4">
                      <div className="h-6 bg-muted rounded w-3/4" />
                      <div className="h-4 bg-muted rounded w-full" />
                      <div className="h-4 bg-muted rounded w-5/6" />
                      <div className="h-24 bg-blue-100 rounded" />
                      <div className="h-4 bg-muted rounded w-full" />
                      <div className="h-4 bg-muted rounded w-2/3" />
                      <div className="h-20 bg-yellow-100 rounded" />
                    </div>
                  </div>
                  {/* CTA */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center p-6">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-yellow-500/10">
                      <Lock className="h-7 w-7 text-yellow-500" />
                    </div>
                    <div>
                      <p className="font-bold text-lg">Nâng cấp VIP để xem</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Truy cập toàn bộ giáo án, bài tập và video bài giảng
                      </p>
                    </div>
                    <Link href="/payment">
                      <Button className="gap-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold mt-1">
                        <Crown className="h-4 w-4" />
                        Nâng cấp VIP ngay
                      </Button>
                    </Link>
                    <p className="text-xs text-muted-foreground">Chỉ từ 99,000đ/tháng</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : lesson.lesson_plan_html ? (
            /* Lesson HTML content */
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card>
                <CardContent className="pt-6 pb-6">
                  <div
                    className="lesson-content"
                    dangerouslySetInnerHTML={{ __html: lesson.lesson_plan_html }}
                  />
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            /* No plan yet */
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-3">
                <FileText className="h-12 w-12 text-muted-foreground" />
                <div>
                  <p className="font-medium">Giáo án đang được soạn</p>
                  <p className="text-sm text-muted-foreground mt-1">Bài học này sẽ có giáo án sau buổi học tiếp theo</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Video (1/3) */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardContent className="p-3">
              {embedUrl ? (
                <div className="space-y-3">
                  <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                    <iframe
                      src={embedUrl}
                      className="absolute inset-0 w-full h-full rounded-md"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={lesson.title}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Play className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="text-xs text-muted-foreground">Video bài giảng</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <Play className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">Video sẽ được cập nhật<br />sau buổi học</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation hints */}
          <Card className="bg-muted/30">
            <CardContent className="pt-4 pb-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Khoá học này</p>
              <Link href={`/learning/${slug}`} className="flex items-center gap-2 text-sm hover:text-primary transition-colors">
                <BookOpen className="h-3.5 w-3.5 shrink-0" />
                <span className="line-clamp-1">{courseName}</span>
              </Link>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 inline-flex items-center justify-center">›</span>
                {chapterName}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
