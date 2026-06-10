'use client'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import {
  ArrowLeft, BookOpen, CheckCircle2, XCircle, ChevronRight, ChevronDown,
  ChevronLeft, Star, Loader2, AlertCircle, RotateCcw, Target,
  Play, Lock, Crown, Download, Info, HelpCircle, Brain, Clock, Clock3, TrendingUp, Zap
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/use-toast'
import { renderLatex } from '@/lib/math-render'
import { cn } from '@/lib/utils'

// --- Types ---
interface Exercise {
  id: string
  question_text: string
  question_type: 'multiple_choice' | 'true_false' | 'short_answer'
  difficulty: string
  option_a?: string | null
  option_b?: string | null
  option_c?: string | null
  option_d?: string | null
  correct_answer?: string | null
  statements?: Array<{ label: string; text: string; answer: boolean }> | string | null
  numeric_answer?: number | null
  explanation?: string | null
}

interface Lesson {
  id: string
  chapter_id: string
  title: string
  title_vi: string | null
  topic: string | null
  level?: string
  content_md: string
  key_rules?: string[] | null
  common_mistakes?: string[] | null
  video_url: string | null
  video_source: string
  exercise_count?: number
  lesson_plan_html?: string | null
  created_at: string
  chapters: {
    name: string
    subject: string
    courses: { name: string; slug: string } | null
  } | null
}

interface LessonProgress {
  mastered: boolean
  best_score: number
  attempts: number
  last_practiced: string | null
}

interface MathFlashcard {
  id: string
  lesson_id: string
  card_kind: 'formula' | 'concept' | 'when_to_use' | 'mistake' | 'mini_example'
  front: string
  back: string
  hint?: string | null
  explanation?: string | null
  order_index: number
}

interface FsrsProgressRecord {
  item_id: string
  due: string
  stability: number
  difficulty_fsrs: number
  elapsed_days: number
  scheduled_days: number
  reps: number
  lapses: number
  state: string
  last_review: string | null
}

function formatInterval(days: number): string {
  if (days < 1 / 24) return `${Math.max(1, Math.round(days * 24 * 60))} phút`
  if (days < 1) return `${Math.round(days * 24)} giờ`
  if (Math.round(days) === 1) return '1 ngày'
  if (days < 7) return `${Math.round(days)} ngày`
  if (days < 30) {
    const weeks = Math.round(days / 7)
    return weeks === 1 ? '1 tuần' : `${weeks} tuần`
  }
  if (days < 365) {
    const months = Math.round(days / 30)
    return months === 1 ? '1 tháng' : `${months} tháng`
  }
  return `${Math.round(days / 365)} năm`
}

// --- Helper Functions ---
function getYouTubeEmbedUrl(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/)
  if (match) return `https://www.youtube.com/embed/${match[1]}?autoplay=1`
  return null
}

function getDriveEmbedUrl(url: string): string | null {
  const match = url.match(/drive\.google\.com\/file\/d\/([^/]+)/)
  if (match) return `https://drive.google.com/file/d/${match[1]}/preview?autoplay=1`
  return null
}

function getEmbedUrl(url: string): string | null {
  return getYouTubeEmbedUrl(url) ?? getDriveEmbedUrl(url) ?? null
}

function parseStatements(raw: Exercise['statements']) {
  if (!raw) return []
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as Array<{ label: string; text: string; answer: boolean }>
    } catch {
      return []
    }
  }
  return raw
}

function normalizeNumber(value: string): number {
  return Number(value.replace(',', '.').trim())
}

// --- Sub-components for LaTeX rendering ---
function LatexText({ text, className }: { text: string; className?: string }) {
  return <div className={cn("max-w-full min-w-0 overflow-x-auto scrollbar-none", className)} dangerouslySetInnerHTML={{ __html: renderLatex(text) }} />
}

function splitMarkdownSections(markdown: string) {
  const lines = markdown.split('\n')
  const intro: string[] = []
  const sections: Array<{ title: string; body: string }> = []
  let current: { title: string; body: string[] } | null = null

  for (const line of lines) {
    const heading = line.match(/^##\s+(.+)$/)
    if (heading) {
      if (current) sections.push({ title: current.title, body: current.body.join('\n').trim() })
      current = { title: heading[1].trim(), body: [] }
    } else if (current) {
      current.body.push(line)
    } else {
      intro.push(line)
    }
  }
  if (current) sections.push({ title: current.title, body: current.body.join('\n').trim() })

  return { intro: intro.join('\n').trim(), sections }
}

function TheoryMarkdown({ children, compact = false }: { children: string; compact?: boolean }) {
  return (
    <div className={cn(
      'prose dark:prose-invert max-w-none',
      compact ? 'prose-sm' : 'prose-sm md:prose-base',
      'prose-headings:font-bold prose-headings:text-foreground prose-p:text-foreground/85 prose-p:leading-7',
      'prose-ul:my-2 prose-li:my-1 prose-strong:text-foreground prose-strong:font-semibold',
      'prose-code:text-primary prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs',
      'prose-table:text-sm prose-th:bg-muted prose-th:font-semibold prose-blockquote:border-primary prose-blockquote:text-muted-foreground'
    )}>
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
        {children}
      </ReactMarkdown>
    </div>
  )
}

interface TikzFigure {
  id: string
  src: string
  title: string
  caption: string
  lessonKeywords: string[]
  sectionKeywords: string[]
}

const TIKZ_FIGURES: TikzFigure[] = [
  {
    id: 'line-oxyz-point-direction',
    src: '/math-diagrams/line-oxyz-point-direction.svg',
    title: 'Đường thẳng trong Oxyz',
    caption: 'Đặt cạnh phần xác định đường thẳng: điểm $A(x_0,y_0,z_0)$ cho vị trí, vectơ chỉ phương $\\vec u=(a,b,c)$ cho hướng đi.',
    lessonKeywords: ['đường thẳng', 'phương trình tham số', 'phương trình chính tắc', 'vectơ chỉ phương', 'oxyz'],
    sectionKeywords: ['điểm neo', 'vectơ chỉ phương', 'hướng đi', 'đường thẳng', 'tham số', 'chính tắc'],
  },
  {
    id: 'line-oxyz-parameter',
    src: '/math-diagrams/line-oxyz-parameter.svg',
    title: 'Ý nghĩa tham số',
    caption: 'Đặt cạnh phần giải thích tham số: khi $t$ thay đổi, điểm $M(t)=A+t\\vec u$ chạy dọc trên đường thẳng.',
    lessonKeywords: ['đường thẳng', 'phương trình tham số', 'phương trình chính tắc', 'vectơ chỉ phương', 'oxyz'],
    sectionKeywords: ['tham số', 't\\in', 'm(t)', 'a+t', 'điểm chạy', 'chính tắc'],
  },
  {
    id: 'variation-table',
    src: '/math-diagrams/variation-table.svg',
    title: 'Bảng biến thiên',
    caption: 'Đặt cạnh phần xét dấu đạo hàm: dấu $f\'(x)$ cho biết khoảng tăng, khoảng giảm và vị trí cực trị.',
    lessonKeywords: ['đồng biến', 'nghịch biến', 'cực trị', 'gtln', 'gtnn', 'khảo sát', 'bảng biến thiên'],
    sectionKeywords: ['đạo hàm', 'xét dấu', 'tăng', 'giảm', 'cực trị', 'lớn nhất', 'nhỏ nhất', 'bảng biến thiên'],
  },
  {
    id: 'asymptote-graph',
    src: '/math-diagrams/asymptote-graph.svg',
    title: 'Đồ thị và tiệm cận',
    caption: 'Đặt cạnh phần đọc đồ thị: đường đứt đoạn là tiệm cận, dùng để dự đoán dáng điệu khi $x$ tiến tới vô cực hoặc điểm loại.',
    lessonKeywords: ['tiệm cận', 'đồ thị', 'khảo sát'],
    sectionKeywords: ['tiệm cận', 'đồ thị', 'vô cực', 'dáng điệu', 'hàm phân thức'],
  },
  {
    id: 'derivative-tangent',
    src: '/math-diagrams/derivative-tangent.svg',
    title: 'Tiếp tuyến và đạo hàm',
    caption: 'Đặt cạnh phần ý nghĩa hình học: $f\'(x_0)$ là hệ số góc của tiếp tuyến tại $M(x_0,f(x_0))$.',
    lessonKeywords: ['đạo hàm', 'tiếp tuyến', 'vận tốc'],
    sectionKeywords: ['tiếp tuyến', 'hệ số góc', 'ý nghĩa hình học', 'vận tốc', 'đạo hàm'],
  },
  {
    id: 'integral-area',
    src: '/math-diagrams/integral-area.svg',
    title: 'Tích phân và diện tích',
    caption: 'Đặt cạnh phần ứng dụng tích phân: miền gạch là đại lượng tích lũy $\\int_a^b f(x)dx$.',
    lessonKeywords: ['nguyên hàm', 'tích phân', 'diện tích', 'tròn xoay', 'quãng đường'],
    sectionKeywords: ['diện tích', 'tích phân', 'quãng đường', 'thể tích', 'ứng dụng'],
  },
  {
    id: 'oxyz-axes',
    src: '/math-diagrams/oxyz-axes.svg',
    title: 'Hệ trục Oxyz',
    caption: 'Đặt cạnh phần tọa độ hóa: chiếu điểm xuống các trục để đọc tọa độ và dựng vectơ.',
    lessonKeywords: ['oxyz', 'vectơ', 'tọa độ', 'khoảng cách', 'góc', 'hình chiếu', 'đối xứng'],
    sectionKeywords: ['tọa độ', 'vectơ', 'hình chiếu', 'khoảng cách', 'góc', 'đối xứng'],
  },
  {
    id: 'plane-sphere',
    src: '/math-diagrams/plane-sphere.svg',
    title: 'Mặt phẳng và mặt cầu',
    caption: 'Đặt cạnh phần phương trình/tương giao: tâm $I$, bán kính $R$ và mặt phẳng $(P)$ quyết định vị trí tương đối.',
    lessonKeywords: ['mặt phẳng', 'mặt cầu', 'vị trí tương đối', 'tương giao'],
    sectionKeywords: ['mặt phẳng', 'mặt cầu', 'tâm', 'bán kính', 'tương giao', 'vị trí tương đối'],
  },
  {
    id: 'solid-geometry',
    src: '/math-diagrams/solid-geometry.svg',
    title: 'Hình không gian',
    caption: 'Đặt cạnh phần dựng hình: xác định đáy, chân đường cao $H$ và chiều cao $h$ trước khi tính góc, khoảng cách hoặc thể tích.',
    lessonKeywords: ['khối đa diện', 'thể tích', 'hình học không gian cổ điển'],
    sectionKeywords: ['đáy', 'đường cao', 'góc', 'khoảng cách', 'thể tích', 'hình không gian'],
  },
  {
    id: 'stats-grouped',
    src: '/math-diagrams/stats-grouped.svg',
    title: 'Mẫu ghép nhóm và tứ phân vị',
    caption: 'Đặt cạnh phần thống kê: cột biểu diễn tần số lớp, boxplot giúp nhìn trung vị và khoảng tứ phân vị $Q_3-Q_1$.',
    lessonKeywords: ['mẫu số liệu', 'thống kê', 'tứ phân vị', 'phương sai', 'độ lệch chuẩn', 'phân tán'],
    sectionKeywords: ['mẫu ghép nhóm', 'tần số', 'trung vị', 'tứ phân vị', 'phương sai', 'độ lệch chuẩn', 'phân tán'],
  },
  {
    id: 'probability-tree',
    src: '/math-diagrams/probability-tree.svg',
    title: 'Sơ đồ cây xác suất',
    caption: 'Đặt cạnh phần xác suất nhiều giai đoạn: mỗi nhánh nhân xác suất điều kiện, rồi cộng các đường đi cùng kết quả.',
    lessonKeywords: ['sơ đồ cây', 'bayes', 'xác suất', 'biến cố'],
    sectionKeywords: ['sơ đồ cây', 'xác suất', 'điều kiện', 'bayes', 'biến cố', 'nhánh'],
  },
]

function hasAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term))
}

function getLessonFigures(lesson: Lesson) {
  // Temporarily disabled: TikZ figures will be curated and reintroduced later.
  return []
}

function getSectionFigures(section: { title: string; body: string }, figures: TikzFigure[], index: number) {
  const text = `${section.title} ${section.body}`.toLowerCase()
  const matched = figures.filter((figure) => hasAny(text, figure.sectionKeywords))
  if (matched.length > 0) return matched.slice(0, 2)
  if (index < figures.length && /công thức|định nghĩa|phương pháp|ví dụ|minh họa|ứng dụng/i.test(section.title)) {
    return [figures[index]]
  }
  return []
}

function InlineTikzFigures({ figures }: { figures: TikzFigure[] }) {
  if (figures.length === 0) return null

  return (
    <aside className="space-y-3">
      {figures.map((figure) => (
        <div key={figure.id} className="rounded-lg border bg-muted/10 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-bold uppercase tracking-wide text-primary">{figure.title}</p>
            <Badge variant="outline" className="h-5 text-[10px]">TikZ</Badge>
          </div>
          <div className="rounded-md border bg-white p-2">
            <Image
              src={figure.src}
              alt={figure.title}
              width={520}
              height={300}
              className="mx-auto h-auto max-h-52 w-full object-contain"
            />
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{figure.caption}</p>
        </div>
      ))}
    </aside>
  )
}

function getTheorySectionTone(title: string) {
  if (/lỗi|sai|nhầm|tránh/i.test(title)) {
    return {
      icon: AlertCircle,
      label: 'Bẫy cần tránh',
      frame: 'border-rose-500/25 bg-rose-500/[0.03]',
      header: 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
      badge: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
    }
  }

  if (/ví dụ|mẫu|áp dụng|luyện/i.test(title)) {
    return {
      icon: CheckCircle2,
      label: 'Nhìn mẫu làm',
      frame: 'border-emerald-500/25 bg-emerald-500/[0.03]',
      header: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
      badge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
    }
  }

  if (/khi nào|dùng|nhận biết|phương pháp|quy trình|cách/i.test(title)) {
    return {
      icon: Target,
      label: 'Khi nào dùng',
      frame: 'border-amber-500/25 bg-amber-500/[0.03]',
      header: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
      badge: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
    }
  }

  if (/công thức|định nghĩa|quy tắc|tính chất|dạng/i.test(title)) {
    return {
      icon: Brain,
      label: 'Flashcard được',
      frame: 'border-blue-500/25 bg-blue-500/[0.03]',
      header: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
      badge: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
    }
  }

  return {
    icon: BookOpen,
    label: 'Đọc nhanh',
    frame: 'border-violet-500/20 bg-violet-500/[0.03]',
    header: 'bg-violet-500/10 text-violet-700 dark:text-violet-300',
    badge: 'bg-violet-500/15 text-violet-700 dark:text-violet-300',
  }
}

function TheorySection({
  section,
  index,
  isOpen,
  onToggle,
}: {
  section: { title: string; body: string }
  index: number
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <section className="overflow-hidden rounded-lg border bg-background">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/35"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold leading-snug md:text-base">{section.title}</h3>
        </div>
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', isOpen && 'rotate-180')} />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden border-t"
          >
            <div className="px-4 py-4">
              <TheoryMarkdown>{section.body}</TheoryMarkdown>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

function MathTheoryView({ lesson }: { lesson: Lesson }) {
  const { intro, sections } = splitMarkdownSections(lesson.content_md)
  const visibleSections = sections.length > 0 ? sections : [{ title: 'Nội dung chính', body: lesson.content_md }]
  const [openQuickSections, setOpenQuickSections] = useState<Set<string>>(new Set())
  const [openTheorySections, setOpenTheorySections] = useState<Set<number>>(new Set())

  function toggleQuickSection(key: string) {
    setOpenQuickSections((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  function toggleTheorySection(index: number) {
    setOpenTheorySections((prev) => {
      const next = new Set(prev)
      next.has(index) ? next.delete(index) : next.add(index)
      return next
    })
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-muted/25 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Lý thuyết trọng tâm</p>
        <h2 className="mt-1 text-lg font-bold leading-snug">{lesson.title}</h2>
        {lesson.title_vi && lesson.title_vi !== lesson.title && (
          <p className="mt-0.5 text-sm text-muted-foreground">{lesson.title_vi}</p>
        )}
      </div>

      <div className="space-y-2">
        {intro && (
          <section className="overflow-hidden rounded-lg border bg-background">
            <button
              type="button"
              onClick={() => toggleQuickSection('intro')}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/35"
            >
              <BookOpen className="h-4 w-4 text-primary" />
              <span className="flex-1 text-sm font-semibold">Mở nhanh ý tưởng bài học</span>
              <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', openQuickSections.has('intro') && 'rotate-180')} />
            </button>
            <AnimatePresence initial={false}>
              {openQuickSections.has('intro') && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="overflow-hidden border-t"
                >
                  <div className="px-4 py-4">
                    <TheoryMarkdown compact>{intro}</TheoryMarkdown>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        )}

        {lesson.key_rules && lesson.key_rules.length > 0 && (
          <section className="overflow-hidden rounded-lg border border-emerald-500/20 bg-emerald-500/5">
            <button
              type="button"
              onClick={() => toggleQuickSection('rules')}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-emerald-500/10"
            >
              <Target className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="flex-1 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                Cần nhớ ({lesson.key_rules.length})
              </span>
              <ChevronDown className={cn('h-4 w-4 text-emerald-700/70 transition-transform dark:text-emerald-300/70', openQuickSections.has('rules') && 'rotate-180')} />
            </button>
            <AnimatePresence initial={false}>
              {openQuickSections.has('rules') && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="overflow-hidden border-t border-emerald-500/20"
                >
                  <ul className="space-y-2 px-4 py-4 text-sm leading-relaxed">
                    {lesson.key_rules.map((rule, idx) => (
                      <li key={idx} className="flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                        <LatexText text={rule} />
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        )}

        {lesson.common_mistakes && lesson.common_mistakes.length > 0 && (
          <section className="overflow-hidden rounded-lg border border-rose-500/20 bg-rose-500/5">
            <button
              type="button"
              onClick={() => toggleQuickSection('mistakes')}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-rose-500/10"
            >
              <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
              <span className="flex-1 text-sm font-semibold text-rose-700 dark:text-rose-300">
                Dễ sai ({lesson.common_mistakes.length})
              </span>
              <ChevronDown className={cn('h-4 w-4 text-rose-700/70 transition-transform dark:text-rose-300/70', openQuickSections.has('mistakes') && 'rotate-180')} />
            </button>
            <AnimatePresence initial={false}>
              {openQuickSections.has('mistakes') && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="overflow-hidden border-t border-rose-500/20"
                >
                  <ul className="space-y-2 px-4 py-4 text-sm leading-relaxed">
                    {lesson.common_mistakes.map((mistake, idx) => (
                      <li key={idx} className="rounded-md bg-background/70 p-2">
                        <LatexText text={mistake} />
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        )}
      </div>

      <div className="space-y-3">
        {visibleSections.map((section, idx) => (
          <TheorySection
            key={`${section.title}-${idx}`}
            section={section}
            index={idx}
            isOpen={openTheorySections.has(idx)}
            onToggle={() => toggleTheorySection(idx)}
          />
        ))}
      </div>
    </div>
  )
}

const MATH_RATING_CONFIG = [
  {
    key: 'Again' as const,
    label: 'Quên rồi',
    emoji: '😵',
    color: 'bg-red-500/10 text-red-500 border-red-200 dark:border-red-800 hover:bg-red-500/20',
  },
  {
    key: 'Hard' as const,
    label: 'Khó nhớ',
    emoji: '😓',
    color: 'bg-orange-500/10 text-orange-500 border-orange-200 dark:border-orange-800 hover:bg-orange-500/20',
  },
  {
    key: 'Good' as const,
    label: 'Nhớ được',
    emoji: '😊',
    color: 'bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-800 hover:bg-blue-500/20',
  },
  {
    key: 'Easy' as const,
    label: 'Dễ',
    emoji: '🚀',
    color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-500/20',
  },
]

function kindLabel(kind: MathFlashcard['card_kind']) {
  const labels: Record<MathFlashcard['card_kind'], string> = {
    formula: 'Công thức',
    concept: 'Khái niệm',
    when_to_use: 'Khi nào dùng',
    mistake: 'Lỗi sai',
    mini_example: 'Ví dụ nhỏ',
  }
  return labels[kind] ?? 'Thẻ ôn'
}

function MathFlashcardReviewTab({
  cards,
  progress,
  onProgressSaved,
}: {
  cards: MathFlashcard[]
  progress: FsrsProgressRecord[]
  onProgressSaved: (record: FsrsProgressRecord) => void
}) {
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [finished, setFinished] = useState(false)
  const [loading, setLoading] = useState(false)
  const [intervals, setIntervals] = useState<Record<string, string>>({})
  const [sessionStats, setSessionStats] = useState({ again: 0, hard: 0, good: 0, easy: 0 })
  const { toast } = useToast()

  const dueCards = useMemo(() => {
    const progressMap = new Map(progress.map((p) => [p.item_id, p]))
    const nowIso = new Date().toISOString()
    return cards
      .map((card) => ({ card, record: progressMap.get(card.id) ?? null }))
      .filter(({ record }) => !record || record.due <= nowIso)
      .slice(0, 20)
  }, [cards, progress])

  const current = dueCards[index]

  useEffect(() => {
    setIndex(0)
    setFlipped(false)
    setFinished(false)
    setSessionStats({ again: 0, hard: 0, good: 0, easy: 0 })
  }, [cards, progress])

  useEffect(() => {
    if (!flipped || !current) {
      setIntervals({})
      return
    }

    const computeIntervals = async () => {
      try {
        const { fsrs, createEmptyCard, Rating, State } = await import('ts-fsrs')
        const f = fsrs()
        const stateMap: Record<string, number> = {
          New: State.New,
          Learning: State.Learning,
          Review: State.Review,
          Relearning: State.Relearning,
        }
        const card = current.record ? {
          due: new Date(current.record.due),
          stability: current.record.stability ?? 0,
          difficulty: current.record.difficulty_fsrs ?? 0,
          elapsed_days: current.record.elapsed_days ?? 0,
          scheduled_days: current.record.scheduled_days ?? 0,
          reps: current.record.reps ?? 0,
          lapses: current.record.lapses ?? 0,
          state: stateMap[current.record.state] ?? State.New,
          last_review: current.record.last_review ? new Date(current.record.last_review) : undefined,
        } : createEmptyCard()

        const now = new Date()
        const nextIntervals: Record<string, string> = {}
        for (const { key } of MATH_RATING_CONFIG) {
          const result = f.next(card as Parameters<typeof f.next>[0], now, Rating[key])
          const diffDays = (result.card.due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          nextIntervals[key] = formatInterval(Math.max(0, diffDays))
        }
        setIntervals(nextIntervals)
      } catch (err) {
        console.error('[MathFlashcardReviewTab] interval preview failed:', err)
      }
    }

    computeIntervals()
  }, [flipped, current])

  const handleRate = async (rating: 'Again' | 'Hard' | 'Good' | 'Easy') => {
    if (!current || loading) return
    setLoading(true)
    setSessionStats((stats) => ({ ...stats, [rating.toLowerCase()]: stats[rating.toLowerCase() as keyof typeof stats] + 1 }))
    try {
      const { fsrs, createEmptyCard, Rating, State } = await import('ts-fsrs')
      const f = fsrs()
      const stateMap: Record<string, number> = {
        New: State.New,
        Learning: State.Learning,
        Review: State.Review,
        Relearning: State.Relearning,
      }
      const sourceCard = current.record ? {
        due: new Date(current.record.due),
        stability: current.record.stability ?? 0,
        difficulty: current.record.difficulty_fsrs ?? 0,
        elapsed_days: current.record.elapsed_days ?? 0,
        scheduled_days: current.record.scheduled_days ?? 0,
        reps: current.record.reps ?? 0,
        lapses: current.record.lapses ?? 0,
        state: stateMap[current.record.state] ?? State.New,
        last_review: current.record.last_review ? new Date(current.record.last_review) : undefined,
      } : createEmptyCard()

      const result = f.next(sourceCard as Parameters<typeof f.next>[0], new Date(), Rating[rating])
      const nextCard = result.card
      const nextRecord: FsrsProgressRecord = {
        item_id: current.card.id,
        due: nextCard.due.toISOString(),
        stability: nextCard.stability,
        difficulty_fsrs: nextCard.difficulty,
        elapsed_days: nextCard.elapsed_days,
        scheduled_days: nextCard.scheduled_days,
        reps: nextCard.reps,
        lapses: nextCard.lapses,
        state: (['New', 'Learning', 'Review', 'Relearning'])[nextCard.state] ?? 'Learning',
        last_review: new Date().toISOString(),
      }

      const res = await fetch('/api/learning/math/flashcards/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId: current.card.id,
          fsrsCard: {
            due: nextRecord.due,
            stability: nextRecord.stability,
            difficulty: nextRecord.difficulty_fsrs,
            elapsed_days: nextRecord.elapsed_days,
            scheduled_days: nextRecord.scheduled_days,
            reps: nextRecord.reps,
            lapses: nextRecord.lapses,
            state: nextRecord.state,
            last_review: nextRecord.last_review,
          },
        }),
      })

      if (!res.ok) throw new Error('save failed')

      onProgressSaved(nextRecord)
      setFlipped(false)
      setIntervals({})
      if (index + 1 >= dueCards.length) setFinished(true)
      else setIndex((i) => i + 1)
    } catch (err) {
      console.error('[MathFlashcardReviewTab] save failed:', err)
      toast({ title: 'Lưu lịch ôn thất bại', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  if (cards.length === 0) {
    return (
      <Card className="border border-dashed">
        <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center text-muted-foreground">
          <Brain className="h-10 w-10 opacity-40" />
          <p className="text-sm">Bài này chưa có flashcard ôn công thức.</p>
        </CardContent>
      </Card>
    )
  }

  if (dueCards.length === 0 || finished) {
    return (
      <Card className="border border-emerald-500/20 bg-emerald-500/5">
        <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <CheckCircle2 className="h-11 w-11 text-emerald-500" />
          <div>
            <p className="font-bold">Hôm nay chưa có thẻ cần ôn.</p>
            <p className="mt-1 text-sm text-muted-foreground">FSRS sẽ nhắc lại khi thẻ bắt đầu dễ quên.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/20 px-4 py-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Ôn bằng FSRS</p>
          <p className="text-sm text-muted-foreground">Thẻ {index + 1}/{dueCards.length} cần ôn hôm nay</p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Clock3 className="h-3.5 w-3.5" />
          {cards.length} thẻ
        </Badge>
      </div>

      <Card className="overflow-hidden border shadow-sm">
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center justify-between gap-2">
            <Badge variant="secondary">{kindLabel(current.card.card_kind)}</Badge>
            {current.record?.state && <Badge variant="outline">{current.record.state}</Badge>}
          </div>

          <div className="min-h-40 rounded-lg border bg-background p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {flipped ? 'Đáp án' : 'Câu hỏi'}
            </p>
            {flipped ? (
              <div className="space-y-3">
                <TheoryMarkdown compact>{current.card.back}</TheoryMarkdown>
                {current.card.explanation && (
                  <div className="rounded-md bg-muted/50 p-3 text-sm">
                    <TheoryMarkdown compact>{current.card.explanation}</TheoryMarkdown>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <LatexText text={current.card.front} className="text-lg font-semibold leading-relaxed" />
                {current.card.hint && (
                  <p className="rounded-md bg-primary/5 px-3 py-2 text-sm text-muted-foreground">
                    Gợi ý: {current.card.hint}
                  </p>
                )}
              </div>
            )}
          </div>

          {!flipped ? (
            <Button className="w-full" onClick={() => setFlipped(true)}>
              Lật thẻ
            </Button>
          ) : (
            <div className="grid gap-2 sm:grid-cols-4">
              {MATH_RATING_CONFIG.map((item) => (
                <Button
                  key={item.key}
                  type="button"
                  variant="outline"
                  disabled={loading}
                  onClick={() => handleRate(item.key)}
                  className={cn('h-auto flex-col gap-1 border py-3', item.color)}
                >
                  <span className="font-semibold">{item.label}</span>
                  <span className="text-[11px] opacity-75">{intervals[item.key] ?? '...'}</span>
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function MathFlashcardReviewTabEnglishStyle({
  cards,
  progress,
  onProgressSaved,
}: {
  cards: MathFlashcard[]
  progress: FsrsProgressRecord[]
  onProgressSaved: (record: FsrsProgressRecord) => void
}) {
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [finished, setFinished] = useState(false)
  const [loading, setLoading] = useState(false)
  const [intervals, setIntervals] = useState<Record<string, string>>({})
  const [sessionStats, setSessionStats] = useState({ again: 0, hard: 0, good: 0, easy: 0 })
  const { toast } = useToast()

  const dueCards = useMemo(() => {
    const progressMap = new Map(progress.map((p) => [p.item_id, p]))
    const nowIso = new Date().toISOString()
    return cards
      .map((card) => ({ card, record: progressMap.get(card.id) ?? null }))
      .filter(({ record }) => !record || record.due <= nowIso)
      .slice(0, 20)
  }, [cards, progress])

  const current = dueCards[index]

  useEffect(() => {
    setIndex(0)
    setFlipped(false)
    setFinished(false)
    setSessionStats({ again: 0, hard: 0, good: 0, easy: 0 })
  }, [cards, progress])

  useEffect(() => {
    if (!flipped || !current) {
      setIntervals({})
      return
    }

    const computeIntervals = async () => {
      try {
        const { fsrs, createEmptyCard, Rating, State } = await import('ts-fsrs')
        const f = fsrs()
        const stateMap: Record<string, number> = {
          New: State.New,
          Learning: State.Learning,
          Review: State.Review,
          Relearning: State.Relearning,
        }
        const sourceCard = current.record ? {
          due: new Date(current.record.due),
          stability: current.record.stability ?? 0,
          difficulty: current.record.difficulty_fsrs ?? 0,
          elapsed_days: current.record.elapsed_days ?? 0,
          scheduled_days: current.record.scheduled_days ?? 0,
          reps: current.record.reps ?? 0,
          lapses: current.record.lapses ?? 0,
          state: stateMap[current.record.state] ?? State.New,
          last_review: current.record.last_review ? new Date(current.record.last_review) : undefined,
        } : createEmptyCard()

        const now = new Date()
        const nextIntervals: Record<string, string> = {}
        for (const { key } of MATH_RATING_CONFIG) {
          const result = f.next(sourceCard as Parameters<typeof f.next>[0], now, Rating[key])
          const diffDays = (result.card.due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          nextIntervals[key] = formatInterval(Math.max(0, diffDays))
        }
        setIntervals(nextIntervals)
      } catch (err) {
        console.error('[MathFlashcardReviewTabEnglishStyle] interval preview failed:', err)
      }
    }

    computeIntervals()
  }, [flipped, current])

  const handleRate = async (rating: 'Again' | 'Hard' | 'Good' | 'Easy') => {
    if (!current || loading) return
    setLoading(true)
    setSessionStats((stats) => ({ ...stats, [rating.toLowerCase()]: stats[rating.toLowerCase() as keyof typeof stats] + 1 }))

    try {
      const { fsrs, createEmptyCard, Rating, State } = await import('ts-fsrs')
      const f = fsrs()
      const stateMap: Record<string, number> = {
        New: State.New,
        Learning: State.Learning,
        Review: State.Review,
        Relearning: State.Relearning,
      }
      const sourceCard = current.record ? {
        due: new Date(current.record.due),
        stability: current.record.stability ?? 0,
        difficulty: current.record.difficulty_fsrs ?? 0,
        elapsed_days: current.record.elapsed_days ?? 0,
        scheduled_days: current.record.scheduled_days ?? 0,
        reps: current.record.reps ?? 0,
        lapses: current.record.lapses ?? 0,
        state: stateMap[current.record.state] ?? State.New,
        last_review: current.record.last_review ? new Date(current.record.last_review) : undefined,
      } : createEmptyCard()

      const result = f.next(sourceCard as Parameters<typeof f.next>[0], new Date(), Rating[rating])
      const nextCard = result.card
      const nextRecord: FsrsProgressRecord = {
        item_id: current.card.id,
        due: nextCard.due.toISOString(),
        stability: nextCard.stability,
        difficulty_fsrs: nextCard.difficulty,
        elapsed_days: nextCard.elapsed_days,
        scheduled_days: nextCard.scheduled_days,
        reps: nextCard.reps,
        lapses: nextCard.lapses,
        state: (['New', 'Learning', 'Review', 'Relearning'])[nextCard.state] ?? 'Learning',
        last_review: new Date().toISOString(),
      }

      const res = await fetch('/api/learning/math/flashcards/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId: current.card.id,
          fsrsCard: {
            due: nextRecord.due,
            stability: nextRecord.stability,
            difficulty: nextRecord.difficulty_fsrs,
            elapsed_days: nextRecord.elapsed_days,
            scheduled_days: nextRecord.scheduled_days,
            reps: nextRecord.reps,
            lapses: nextRecord.lapses,
            state: nextRecord.state,
            last_review: nextRecord.last_review,
          },
        }),
      })

      if (!res.ok) throw new Error('save failed')

      onProgressSaved(nextRecord)
      setFlipped(false)
      setIntervals({})
      if (index + 1 >= dueCards.length) setFinished(true)
      else setIndex((i) => i + 1)
    } catch (err) {
      console.error('[MathFlashcardReviewTabEnglishStyle] save failed:', err)
      toast({ title: 'Lưu lịch ôn thất bại', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const totalReviewed = sessionStats.again + sessionStats.hard + sessionStats.good + sessionStats.easy

  if (cards.length === 0) return (
    <div className="text-center py-12 space-y-4 max-w-sm mx-auto">
      <Brain className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
      <h3 className="font-semibold text-lg">Bài này chưa có flashcard</h3>
      <p className="text-sm text-muted-foreground">Flashcard công thức sẽ được thêm vào sau khi nội dung bài học được cập nhật.</p>
    </div>
  )

  if (dueCards.length === 0) return (
    <div className="text-center py-12 space-y-4 max-w-sm mx-auto">
      <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-500" />
      <h3 className="font-semibold text-lg">Không có thẻ nào cần ôn hôm nay!</h3>
      <p className="text-sm text-muted-foreground">Hệ thống FSRS sẽ nhắc bạn ôn đúng lúc cần thiết.</p>
      <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm text-left space-y-1">
        <p className="font-medium text-xs uppercase tracking-wide text-muted-foreground mb-2">Thống kê tiến độ</p>
        {(() => {
          const mastered = progress.filter(p => p.state === 'Review').length
          const learning = progress.filter(p => p.state === 'Learning' || p.state === 'Relearning').length
          const newCount = cards.length - progress.length
          return (
            <>
              <p className="flex justify-between"><span>Thẻ mới chưa học</span><span className="font-medium">{newCount}</span></p>
              <p className="flex justify-between"><span>Đang học</span><span className="font-medium">{learning}</span></p>
              <p className="flex justify-between"><span>Đã nắm vững</span><span className="font-medium text-emerald-600">{mastered}</span></p>
            </>
          )
        })()}
      </div>
    </div>
  )

  if (finished) return (
    <div className="text-center py-10 space-y-4 max-w-sm mx-auto">
      <Zap className="h-12 w-12 mx-auto text-yellow-500" />
      <h3 className="font-semibold text-lg">Xong buổi ôn luyện!</h3>
      <p className="text-sm text-muted-foreground">Đã ôn <strong>{dueCards.length}</strong> thẻ. Lịch ôn tiếp đã được lên kế hoạch tự động.</p>
      {totalReviewed > 0 && (
        <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm text-left space-y-1.5">
          <p className="font-medium text-xs uppercase tracking-wide text-muted-foreground mb-2">Buổi học này</p>
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            {[
              { label: 'Quên', val: sessionStats.again, color: 'text-red-500' },
              { label: 'Khó', val: sessionStats.hard, color: 'text-orange-500' },
              { label: 'Nhớ được', val: sessionStats.good, color: 'text-blue-500' },
              { label: 'Dễ', val: sessionStats.easy, color: 'text-emerald-500' },
            ].map(({ label, val, color }) => val > 0 && (
              <p key={label} className="flex justify-between gap-2">
                <span>{label}</span>
                <span className={cn('font-bold', color)}>{val}</span>
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  const card = current.card
  const rec = current.record
  const isNewCard = !rec || rec.state === 'New'
  const progressPct = Math.round((index / dueCards.length) * 100)

  return (
    <div className="space-y-4 max-w-xl mx-auto">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Cần ôn: <strong>{dueCards.length}</strong> thẻ</span>
        </span>
        <div className="flex items-center gap-2">
          {isNewCard && (
            <Badge variant="secondary" className="text-[10px] bg-violet-500/15 text-violet-600 dark:text-violet-400 border-0">
              Thẻ mới
            </Badge>
          )}
          {rec && !isNewCard && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Ôn lần {rec.reps + 1}
            </span>
          )}
          <span className="text-sm text-muted-foreground">{index + 1}/{dueCards.length}</span>
        </div>
      </div>

      <Progress value={progressPct} className="h-1.5" />

      <div
        className="relative cursor-pointer select-none"
        style={{ perspective: 1200, height: flipped ? 'auto' : '220px', minHeight: '220px' }}
        onClick={() => !flipped && setFlipped(true)}
      >
        <AnimatePresence mode="wait">
          {!flipped ? (
            <motion.div
              key="front"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.18 }}
              className="absolute inset-0 rounded-2xl border-2 bg-card flex flex-col items-center justify-center p-6 shadow-sm"
            >
              <p className="text-xs text-muted-foreground mb-4 uppercase tracking-widest">{kindLabel(card.card_kind)}</p>
              <LatexText text={card.front} className="text-2xl font-bold text-center tracking-tight leading-snug" />
              {card.hint && <p className="mt-3 max-w-sm text-center text-sm text-muted-foreground">{card.hint}</p>}
              <motion.p
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="mt-5 text-xs text-muted-foreground"
              >
                Nhấn để xem đáp án
              </motion.p>
            </motion.div>
          ) : (
            <motion.div
              key="back"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="rounded-2xl border-2 border-primary/25 bg-gradient-to-br from-primary/5 via-background to-primary/5 p-5 shadow-sm space-y-3"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-xs border-primary/30 text-primary">{kindLabel(card.card_kind)}</Badge>
                {rec && !isNewCard && (
                  <span className="text-[11px] text-muted-foreground bg-muted/60 rounded-full px-2 py-0.5">
                    Đã ôn {rec.reps} lần
                  </span>
                )}
                {rec && rec.lapses > 0 && (
                  <span className="text-[11px] text-red-400 bg-red-500/10 rounded-full px-2 py-0.5">
                    Từng quên {rec.lapses} lần
                  </span>
                )}
              </div>

              <div className="rounded-xl bg-background/70 border px-3 py-2.5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Đáp án</p>
                <TheoryMarkdown compact>{card.back}</TheoryMarkdown>
              </div>

              {card.explanation && (
                <div className="rounded-xl bg-background/70 border px-3 py-2.5">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Giải thích</p>
                  <TheoryMarkdown compact>{card.explanation}</TheoryMarkdown>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {flipped && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            <p className="text-xs text-center text-muted-foreground font-medium">Bạn nhớ thẻ này đến mức nào?</p>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold text-center text-red-500/80 uppercase tracking-widest">Chưa nhớ</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {MATH_RATING_CONFIG.slice(0, 2).map(({ key, label, emoji, color }) => (
                    <button
                      key={key}
                      disabled={loading}
                      onClick={() => handleRate(key)}
                      className={cn(
                        'flex flex-col items-center gap-1.5 rounded-xl border-2 py-3 px-1 transition-all',
                        'hover:-translate-y-0.5 hover:shadow-md active:scale-95 disabled:opacity-50',
                        color
                      )}
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span className="text-2xl leading-none">{emoji}</span>}
                      <span className="text-xs font-semibold leading-tight">{label}</span>
                      {intervals[key] && <span className="text-[11px] font-medium opacity-80">{intervals[key]}</span>}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold text-center text-emerald-500/80 uppercase tracking-widest">Đã nhớ</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {MATH_RATING_CONFIG.slice(2, 4).map(({ key, label, emoji, color }) => (
                    <button
                      key={key}
                      disabled={loading}
                      onClick={() => handleRate(key)}
                      className={cn(
                        'flex flex-col items-center gap-1.5 rounded-xl border-2 py-3 px-1 transition-all',
                        'hover:-translate-y-0.5 hover:shadow-md active:scale-95 disabled:opacity-50',
                        color
                      )}
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span className="text-2xl leading-none">{emoji}</span>}
                      <span className="text-xs font-semibold leading-tight">{label}</span>
                      {intervals[key] && <span className="text-[11px] font-medium opacity-80">{intervals[key]}</span>}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function LessonPage() {
  const params = useParams()
  const slug = params.slug as string
  const lessonId = params.lessonId as string
  const { toast } = useToast()

  // General State
  const [lessonType, setLessonType] = useState<'math' | 'legacy'>('math')
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [progress, setProgress] = useState<LessonProgress | null>(null)
  const [flashcards] = useState<MathFlashcard[]>([])
  const [flashcardProgress, setFlashcardProgress] = useState<FsrsProgressRecord[]>([])
  const [isVip, setIsVip] = useState(false)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'theory' | 'practice' | 'summary' | 'video'>('theory')

  // Video Preview Limitation State
  const [videoStarted, setVideoStarted] = useState(false)
  const [videoRemainingSeconds, setVideoRemainingSeconds] = useState(180) // 3 minutes trial
  const [videoExpired, setVideoExpired] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Practice State
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [mcqSelected, setMcqSelected] = useState<string | null>(null)
  const [shortAnswerText, setShortAnswerText] = useState('')
  const [tfAnswers, setTfAnswers] = useState<Record<string, boolean>>({})
  const [sessionRecords, setSessionRecords] = useState<Array<{ id: string; correct: boolean; answer: string }>>([])
  const [submitted, setSubmitted] = useState(false)
  const [savingProgress, setSavingProgress] = useState(false)

  // Legacy Export State
  const [exportingPdf, setExportingPdf] = useState(false)

  // Fetching Data with Fallback
  const fetchLessonData = useCallback(async () => {
    setLoading(true)
    try {
      // 1. Try to fetch from math foundational lessons API
      const res = await fetch(`/api/learning/math/${lessonId}`)
      const data = await res.json()
      
      if (res.ok && data.lesson) {
        setLesson(data.lesson)
        setExercises(data.exercises ?? [])
        setProgress(data.progress)
        setIsVip(data.isVip)
        setLessonType('math')
      } else {
        // 2. Fallback to legacy lessons API
        const legacyRes = await fetch(`/api/learning/lessons/${lessonId}`)
        if (!legacyRes.ok) throw new Error('Not found')
        const legacyData = await legacyRes.json()
        setLesson(legacyData.lesson)
        setIsVip(legacyData.isVip)
        setLessonType('legacy')
        setTab('theory') // Legacy always starts with theory
      }
    } catch (err) {
      console.error('[LessonPage] Fetch error:', err)
      setLesson(null)
    } finally {
      setLoading(false)
    }
  }, [lessonId])

  useEffect(() => {
    fetchLessonData()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [fetchLessonData])

  // Video Trial Timer
  useEffect(() => {
    if (videoStarted && !isVip && !videoExpired) {
      timerRef.current = setInterval(() => {
        setVideoRemainingSeconds((prev) => {
          if (prev <= 1) {
            setVideoExpired(true)
            if (timerRef.current) clearInterval(timerRef.current)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [videoStarted, isVip, videoExpired])

  const startVideoTrial = () => {
    setVideoStarted(true)
  }

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  // --- Practice Logic ---
  const currentEx = exercises[currentIdx]
  const currentStatements = currentEx ? parseStatements(currentEx.statements) : []

  const resetPractice = () => {
    setCurrentIdx(0)
    setAnswered(false)
    setIsCorrect(null)
    setMcqSelected(null)
    setShortAnswerText('')
    setTfAnswers({})
    setSessionRecords([])
    setSubmitted(false)
  }

  const handleCheckAnswer = () => {
    if (!currentEx || answered) return

    let correct = false
    let answerText = ''

    if (currentEx.question_type === 'multiple_choice') {
      if (!mcqSelected) return
      answerText = mcqSelected
      correct = mcqSelected === currentEx.correct_answer
    } else if (currentEx.question_type === 'short_answer') {
      if (!shortAnswerText.trim()) return
      answerText = shortAnswerText.trim()
      const val = normalizeNumber(answerText)
      const target = currentEx.numeric_answer ?? Number.NaN
      correct = Number.isFinite(val) && Number.isFinite(target) && Math.abs(val - target) <= 0.01
    } else if (currentEx.question_type === 'true_false') {
      if (currentStatements.some((s) => tfAnswers[s.label] === undefined)) return
      answerText = JSON.stringify(tfAnswers)
      correct = currentStatements.every((s) => tfAnswers[s.label] === s.answer)
    }

    setIsCorrect(correct)
    setAnswered(true)
    setSessionRecords((prev) => [...prev, { id: currentEx.id, correct, answer: answerText }])
  }

  const handleNextEx = () => {
    setAnswered(false)
    setIsCorrect(null)
    setMcqSelected(null)
    setShortAnswerText('')
    setTfAnswers({})

    if (currentIdx + 1 >= exercises.length) {
      handleSubmitPractice()
    } else {
      setCurrentIdx((prev) => prev + 1)
    }
  }

  const handleSubmitPractice = async () => {
    setSavingProgress(true)
    const correctCount = sessionRecords.filter((r) => r.correct).length
    try {
      const res = await fetch(`/api/learning/math/${lessonId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score: correctCount, total: exercises.length })
      })
      if (res.ok) {
        const data = await res.json()
        setProgress((prev) => prev ? {
          ...prev,
          best_score: data.best_score,
          mastered: data.mastered,
          attempts: prev.attempts + 1
        } : null)
      }
    } catch (err) {
      console.error('[LessonPage] Submit practice error:', err)
    } finally {
      setSavingProgress(false)
      setSubmitted(true)
    }
  }

  // --- Legacy PDF Export ---
  async function handleDownloadPdf() {
    setExportingPdf(true)
    try {
      const res = await fetch('/api/admin/learning/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId })
      })
      if (!res.ok) throw new Error()
      const { html } = await res.json()
      const w = window.open('', '_blank')
      if (!w) throw new Error('popup blocked')
      w.document.write(html)
      w.document.close()
      w.focus()
      setTimeout(() => w.print(), 800)
    } catch {
      toast({ title: 'Xuất PDF thất bại', variant: 'destructive' })
    } finally {
      setExportingPdf(false)
    }
  }

  // Loading indicator
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Lesson not found
  if (!lesson) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-3 text-muted-foreground">
        <AlertCircle className="h-10 w-10 opacity-30" />
        <p>Không tìm thấy bài học này</p>
        <Link href={`/learning/${slug}`}><Button variant="outline" size="sm">← Quay lại</Button></Link>
      </div>
    )
  }

  const courseName = lesson.chapters?.courses?.name ?? ''
  const chapterName = lesson.chapters?.name ?? ''
  const embedUrl = lesson.video_url ? getEmbedUrl(lesson.video_url) : null
  const duration = 45 // Default foundational duration

  return (
    <div className="max-w-6xl mx-auto space-y-5 px-3 md:px-0">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground flex-wrap">
        <Link href="/learning" className="hover:text-foreground flex items-center gap-1">
          <ChevronLeft className="h-3.5 w-3.5" /> Học Tập
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link href={`/learning/${slug}`} className="hover:text-foreground truncate max-w-[150px] md:max-w-none">{courseName}</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-medium truncate max-w-[200px] md:max-w-none">{lesson.title}</span>
      </div>

      {/* Header Row */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-2xl">📐</span>
            <h1 className="text-xl md:text-2xl font-bold leading-tight">{lesson.title}</h1>
          </div>
          {lesson.title_vi && <p className="text-xs md:text-sm text-muted-foreground mt-0.5">{lesson.title_vi}</p>}
          <div className="flex items-center gap-2 mt-2 flex-wrap text-xs">
            {chapterName && <Badge variant="secondary" className="px-2 py-0 h-5">{chapterName}</Badge>}
            {lesson.topic && <Badge variant="outline" className="px-2 py-0 h-5">{lesson.topic}</Badge>}
            {lesson.level && (
              <Badge variant="outline" className={cn('px-2 py-0 h-5 text-[10px]',
                lesson.level === 'nhan_biet' ? 'bg-green-500/10 text-green-600 border-green-500/20' :
                lesson.level === 'thong_hieu' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' :
                'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
              )}>
                {lesson.level === 'nhan_biet' ? 'Nhận biết' : lesson.level === 'thong_hieu' ? 'Thông hiểu' : 'Vận dụng'}
              </Badge>
            )}
            <span className="text-muted-foreground flex items-center gap-1">⏱ {duration} phút</span>
            {progress?.mastered && (
              <span className="text-emerald-500 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5 fill-current text-white bg-emerald-500 rounded-full" /> Đã hoàn thành ({progress.best_score}%)
              </span>
            )}
          </div>
        </div>

        {/* Legacy PDF Download Button */}
        {lessonType === 'legacy' && isVip && (
          <Button onClick={handleDownloadPdf} disabled={exportingPdf} variant="outline" size="sm" className="gap-1.5 shrink-0">
            {exportingPdf ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            Tải PDF
          </Button>
        )}
      </div>

      <Separator />

      {/* Main 2-Column Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Panel: Theory/Exercises Tabs (2/3 width) */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Math Foundational Tab Triggers */}
          {lessonType === 'math' && (
            <div className="flex gap-1 border-b pb-0 overflow-x-auto">
              {([
                { key: 'theory', label: '📖 Lý thuyết' },
                { key: 'practice', label: `✏️ Bài tập vận dụng (${exercises.length})` },
                { key: 'video', label: '🎬 Video bài giảng', mobileOnly: true },
              ] as const).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={cn(
                    'px-4 py-2 text-xs md:text-sm font-medium border-b-2 transition-colors whitespace-nowrap -mb-px',
                    tab === key
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* TAB CONTENT: THEORY */}
          {tab === 'theory' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {lessonType === 'math' ? (
                /* Math Markdown rendering with KaTeX support */
                <Card className="border shadow-sm">
                  <CardContent className="pt-6 pb-6">
                    {lesson.content_md ? (
                      <MathTheoryView lesson={lesson} />
                    ) : (
                      <p className="text-center py-10 text-muted-foreground text-sm">Nội dung bài học đang được biên soạn...</p>
                    )}
                  </CardContent>
                </Card>
              ) : (
                /* Legacy Lesson plan rendering */
                <Card className="border">
                  <CardContent className="pt-6 pb-6">
                    {!isVip ? (
                      <div className="relative">
                        <div className="blur-md pointer-events-none select-none opacity-40 max-h-64 overflow-hidden">
                          <div className="space-y-4">
                            <div className="h-6 bg-muted rounded w-3/4" />
                            <div className="h-4 bg-muted rounded w-full" />
                            <div className="h-4 bg-muted rounded w-5/6" />
                            <div className="h-24 bg-blue-100 rounded" />
                          </div>
                        </div>
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center p-6 bg-background/50">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500/10">
                            <Lock className="h-6 w-6 text-yellow-600" />
                          </div>
                          <div>
                            <p className="font-bold text-base">Nâng cấp VIP để xem giáo án</p>
                            <p className="text-xs text-muted-foreground mt-1">Học trọn vẹn toàn bộ lý thuyết và tải tài liệu PDF</p>
                          </div>
                          <Link href="/payment"><Button size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold mt-1"><Crown className="h-3.5 w-3.5 mr-1" /> Nâng cấp VIP</Button></Link>
                        </div>
                      </div>
                    ) : lesson.lesson_plan_html ? (
                      <div className="lesson-content prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: lesson.lesson_plan_html }} />
                    ) : lesson.content_md ? (
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{lesson.content_md}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-center py-10 text-muted-foreground text-sm">Giáo án đang được chuẩn bị...</p>
                    )}
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}

          {/* TAB CONTENT: PRACTICE (Math Only) */}
          {tab === 'practice' && lessonType === 'math' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {exercises.length === 0 ? (
                <Card className="border border-dashed p-10 text-center text-muted-foreground">
                  <Target className="h-10 w-10 mx-auto opacity-35 mb-2" />
                  <p>Hệ thống bài tập đang được cập nhật thêm.</p>
                </Card>
              ) : submitted ? (
                /* PRACTICE SUMMARY / REVIEW MODE */
                <div className="space-y-4">
                  <Card className={cn('border-2 shadow-sm',
                    (sessionRecords.filter(r => r.correct).length / exercises.length) >= 0.8 ? 'border-emerald-500/50 bg-emerald-500/5' :
                    (sessionRecords.filter(r => r.correct).length / exercises.length) >= 0.5 ? 'border-yellow-500/50 bg-yellow-500/5' :
                    'border-red-500/50 bg-red-500/5'
                  )}>
                    <CardContent className="p-6 text-center">
                      <div className="text-4xl mb-2">
                        {(sessionRecords.filter(r => r.correct).length / exercises.length) >= 0.8 ? '🎉' :
                         (sessionRecords.filter(r => r.correct).length / exercises.length) >= 0.5 ? '👍' : '💪'}
                      </div>
                      <p className="text-xl font-bold">Kết quả: {sessionRecords.filter(r => r.correct).length}/{exercises.length} câu đúng</p>
                      <p className="text-xs text-muted-foreground mt-1 mb-4">
                        {(sessionRecords.filter(r => r.correct).length / exercises.length) >= 0.8
                          ? 'Tuyệt vời! Bạn đã hoàn thành xuất sắc bài tập của chuyên đề này.'
                          : 'Tốt! Tuy nhiên hãy xem lại các lỗi sai và giải lại lý thuyết để đạt trên 80%.'}
                      </p>
                      <Progress value={(sessionRecords.filter(r => r.correct).length / exercises.length) * 100} className="h-2 mb-4" />
                      <div className="flex gap-2 justify-center flex-wrap">
                        <Button variant="outline" size="sm" onClick={resetPractice} className="gap-1"><RotateCcw className="h-3.5 w-3.5" /> Làm lại</Button>
                        <Button variant="outline" size="sm" onClick={() => setTab('theory')} className="gap-1"><BookOpen className="h-3.5 w-3.5" /> Ôn lại lý thuyết</Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Review Questions list */}
                  <div className="space-y-4">
                    <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Giải chi tiết câu hỏi</h3>
                    {exercises.map((ex, i) => {
                      const rec = sessionRecords.find((r) => r.id === ex.id)
                      const isCorrectAnswer = rec?.correct ?? false
                      const statements = parseStatements(ex.statements)

                      return (
                        <Card key={ex.id} className={cn('border shadow-sm', isCorrectAnswer ? 'border-emerald-500/20' : 'border-red-500/20')}>
                          <CardContent className="p-4 space-y-3">
                            <div className="flex items-start gap-2">
                              {isCorrectAnswer ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                              )}
                              <div className="text-sm font-medium leading-relaxed">
                                <span className="font-bold">Câu {i + 1}:</span> <LatexText text={ex.question_text} className="inline" />
                              </div>
                            </div>

                            {/* Render Answer UI in Review */}
                            {ex.question_type === 'multiple_choice' && (
                              <div className="grid gap-1.5 pl-6">
                                {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                                  const text = ex[`option_${opt.toLowerCase()}` as keyof Exercise] as string
                                  const isCorrectOpt = opt === ex.correct_answer
                                  const isSelectedOpt = opt === rec?.answer
                                  return (
                                    <div key={opt} className={cn('flex items-center gap-2 text-xs p-2 rounded border',
                                      isCorrectOpt ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300' :
                                      isSelectedOpt && !isCorrectOpt ? 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300' : 'border-border/60 text-muted-foreground'
                                    )}>
                                      <span className="font-bold">{opt}.</span>
                                      <LatexText text={text} />
                                    </div>
                                  )
                                })}
                              </div>
                            )}

                            {ex.question_type === 'short_answer' && (
                              <div className="pl-6 text-xs space-y-1">
                                <p className="text-muted-foreground">Đáp án của bạn: <strong className={isCorrectAnswer ? 'text-emerald-500' : 'text-red-500'}>{rec?.answer ?? 'Không nhập'}</strong></p>
                                <p>Đáp án đúng: <strong>{ex.numeric_answer}</strong></p>
                              </div>
                            )}

                            {ex.question_type === 'true_false' && (
                              <div className="pl-6 space-y-1.5">
                                {statements.map((s) => {
                                  const userVal = rec?.answer ? (JSON.parse(rec.answer) as Record<string, boolean>)[s.label] : undefined
                                  const isValCorrect = userVal === s.answer
                                  return (
                                    <div key={s.label} className={cn('text-xs border p-2 rounded flex justify-between items-center',
                                      isValCorrect ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300' : 'border-red-500/20 bg-red-500/5 text-red-700 dark:text-red-300'
                                    )}>
                                      <div className="flex gap-1.5">
                                        <span className="font-bold">{s.label})</span>
                                        <LatexText text={s.text} />
                                      </div>
                                      <span className="font-semibold">
                                        {userVal !== undefined ? (userVal ? 'Đúng' : 'Sai') : 'Chưa chọn'}
                                        {` (Đáp án: ${s.answer ? 'Đúng' : 'Sai'})`}
                                      </span>
                                    </div>
                                  )
                                })}
                              </div>
                            )}

                            {ex.explanation && (
                              <div className="pl-6 border-t pt-3 mt-2 text-xs text-muted-foreground">
                                <p className="font-bold text-foreground flex items-center gap-1"><Info className="h-3.5 w-3.5 text-blue-500" /> Giải thích:</p>
                                <LatexText text={ex.explanation} className="mt-1" />
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              ) : (
                /* PRACTICE ACTIVE CAROUSEL */
                <div className="space-y-4">
                  {/* Status Bar */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-medium">Bài tập chuyên đề: Câu {currentIdx + 1}/{exercises.length}</span>
                    <Badge variant="secondary" className="px-2 py-0 text-[10px] capitalize h-5">{currentEx.question_type.replace('_', ' ')}</Badge>
                  </div>
                  <Progress value={((currentIdx + 1) / exercises.length) * 100} className="h-1.5" />

                  {/* Exercise Card */}
                  <Card className="border shadow-sm">
                    <CardContent className="p-5 space-y-4">
                      {/* Question Text */}
                      <div className="text-sm font-semibold leading-relaxed">
                        <LatexText text={currentEx.question_text} />
                      </div>

                      {/* Question Inputs */}
                      {currentEx.question_type === 'multiple_choice' && (
                        <div className="grid gap-2">
                          {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                            const text = currentEx[`option_${opt.toLowerCase()}` as keyof Exercise] as string
                            if (!text) return null
                            const isSelected = mcqSelected === opt
                            const isCorrectOpt = opt === currentEx.correct_answer
                            return (
                              <button
                                key={opt}
                                disabled={answered}
                                onClick={() => setMcqSelected(opt)}
                                className={cn(
                                  'w-full flex items-start gap-3 px-4 py-3 rounded-lg border text-sm text-left transition-all',
                                  !answered && isSelected && 'border-primary bg-primary/5',
                                  !answered && !isSelected && 'hover:bg-accent border-border/80',
                                  answered && isCorrectOpt && 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300',
                                  answered && isSelected && !isCorrectOpt && 'bg-red-500/10 border-red-500 text-red-600 dark:text-red-400',
                                  answered && !isSelected && !isCorrectOpt && 'opacity-40 border-border/60'
                                )}
                              >
                                <span className={cn(
                                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold border',
                                  !answered && isSelected ? 'border-primary bg-primary text-white' : 'border-border'
                                )}>{opt}</span>
                                <LatexText text={text} className="flex-1 -mt-0.5" />
                              </button>
                            )
                          })}
                        </div>
                      )}

                      {currentEx.question_type === 'short_answer' && (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={shortAnswerText}
                            onChange={(e) => setShortAnswerText(e.target.value)}
                            disabled={answered}
                            placeholder="Nhập kết quả số (ví dụ: 2.5 hoặc -1)"
                            className="w-full h-11 border rounded-lg px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary bg-background"
                          />
                          <p className="text-[10px] text-muted-foreground">Hỗ trợ nhập dấu phẩy hoặc chấm cho số thập phân.</p>
                        </div>
                      )}

                      {currentEx.question_type === 'true_false' && (
                        <div className="space-y-3">
                          {currentStatements.map((s) => (
                            <div key={s.label} className="border border-border/60 rounded-lg p-3 space-y-2.5">
                              <div className="flex gap-2 text-xs md:text-sm">
                                <span className="font-bold">{s.label})</span>
                                <LatexText text={s.text} />
                              </div>
                              <div className="flex gap-2">
                                {[true, false].map((val) => {
                                  const isSelected = tfAnswers[s.label] === val
                                  const isCorrectTF = s.answer === val
                                  return (
                                    <button
                                      key={String(val)}
                                      disabled={answered}
                                      onClick={() => setTfAnswers((prev) => ({ ...prev, [s.label]: val }))}
                                      className={cn('flex-1 py-1.5 text-xs font-semibold rounded-md border transition-all',
                                        !answered && isSelected && 'border-primary bg-primary text-white',
                                        !answered && !isSelected && 'hover:bg-accent border-border/80 text-foreground',
                                        answered && isCorrectTF && isSelected && 'bg-emerald-500/10 border-emerald-500 text-emerald-600',
                                        answered && !isCorrectTF && isSelected && 'bg-red-500/10 border-red-500 text-red-500',
                                        answered && !isSelected && 'opacity-40 border-border/50'
                                      )}
                                    >
                                      {val ? 'Đúng' : 'Sai'}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Explanation Reveal */}
                      {answered && (
                        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                          className={cn('p-3 rounded-lg border text-xs leading-relaxed space-y-2',
                            isCorrect ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-800 dark:text-emerald-300' : 'border-red-500/30 bg-red-500/5 text-red-800 dark:text-red-300'
                          )}>
                          <p className="font-bold flex items-center gap-1">
                            {isCorrect ? '✅ Trả lời chính xác!' : '❌ Câu trả lời chưa chính xác.'}
                          </p>
                          {currentEx.question_type === 'multiple_choice' && !isCorrect && (
                            <p>Đáp án đúng: <strong className="text-emerald-500">{currentEx.correct_answer}</strong></p>
                          )}
                          {currentEx.question_type === 'short_answer' && !isCorrect && (
                            <p>Đáp án đúng: <strong className="text-emerald-500">{currentEx.numeric_answer}</strong></p>
                          )}
                          {currentEx.explanation && (
                            <div className="border-t pt-2 mt-2">
                              <p className="font-bold text-foreground">Giải chi tiết:</p>
                              <LatexText text={currentEx.explanation} className="mt-1" />
                            </div>
                          )}
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Navigation Buttons */}
                  <div className="flex justify-between items-center">
                    <Button variant="outline" size="sm" onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))} disabled={currentIdx === 0}>
                      <ChevronLeft className="h-4 w-4 mr-1" /> Trước
                    </Button>

                    {!answered ? (
                      <Button onClick={handleCheckAnswer} size="sm">Kiểm tra</Button>
                    ) : (
                      <Button onClick={handleNextEx} size="sm" disabled={savingProgress} className="gap-1">
                        {savingProgress ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        {currentIdx + 1 >= exercises.length ? 'Xem kết quả 🏁' : 'Câu tiếp theo'} <ChevronRight className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB CONTENT: SUMMARY (Math Only) */}
          {tab === 'summary' && lessonType === 'math' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {/* Key Rules Card */}
              {lesson.key_rules && lesson.key_rules.length > 0 && (
                <Card className="border shadow-sm border-l-4 border-l-emerald-500">
                  <CardContent className="p-4 space-y-3">
                    <h3 className="font-bold text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4" /> Quy tắc quan trọng học nhanh
                    </h3>
                    <ul className="space-y-2 text-xs md:text-sm pl-4 list-decimal leading-relaxed">
                      {lesson.key_rules.map((rule, idx) => (
                        <li key={idx}><LatexText text={rule} className="inline" /></li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Common Mistakes Card */}
              {lesson.common_mistakes && lesson.common_mistakes.length > 0 && (
                <Card className="border shadow-sm border-l-4 border-l-rose-500">
                  <CardContent className="p-4 space-y-3">
                    <h3 className="font-bold text-sm text-rose-500 flex items-center gap-1.5">
                      <AlertCircle className="h-4 w-4" /> Lỗi sai thường gặp khi giải đề
                    </h3>
                    <ul className="space-y-2.5 text-xs md:text-sm">
                      {lesson.common_mistakes.map((mistake, idx) => (
                        <li key={idx} className="bg-muted p-2 rounded border border-border/60">
                          <LatexText text={mistake} />
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {(!lesson.key_rules || lesson.key_rules.length === 0) && (!lesson.common_mistakes || lesson.common_mistakes.length === 0) && (
                <Card className="border border-dashed p-10 text-center text-muted-foreground">
                  <BookOpen className="h-10 w-10 mx-auto opacity-35 mb-2" />
                  <p>Tóm tắt bài học đang được chuẩn bị.</p>
                </Card>
              )}
            </motion.div>
          )}

          {/* TAB CONTENT: VIDEO (Mobile view only) */}
          {tab === 'video' && lessonType === 'math' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="lg:hidden">
              <Card className="border shadow-sm overflow-hidden">
                <CardContent className="p-3 space-y-3">
                  {embedUrl ? (
                    !videoStarted ? (
                      /* Play Cover */
                      <div className="relative w-full aspect-video bg-muted rounded-md flex flex-col items-center justify-center p-6 text-center cursor-pointer hover:bg-muted/80 transition-all border" onClick={startVideoTrial}>
                        <div className="h-14 w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                          <Play className="h-7 w-7 fill-current" />
                        </div>
                        <p className="font-bold text-sm">Xem video bài giảng</p>
                        {!isVip && <p className="text-[10px] text-muted-foreground mt-1">Dành cho tài khoản miễn phí: Xem thử 3 phút</p>}
                      </div>
                    ) : videoExpired ? (
                      /* Block Card */
                      <div className="w-full aspect-video bg-amber-50/50 dark:bg-amber-950/10 rounded-md flex flex-col items-center justify-center p-6 text-center border border-yellow-500/20">
                        <Lock className="h-10 w-10 text-yellow-600 mb-2" />
                        <p className="font-bold text-sm text-yellow-800 dark:text-yellow-400">Thời gian xem thử kết thúc</p>
                        <p className="text-xs text-muted-foreground mt-1 mb-3 max-w-xs">Nâng cấp tài khoản VIP để xem đầy đủ video và học trọn vẹn lộ trình toán học.</p>
                        <Link href="/payment"><Button size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-xs"><Crown className="h-3.5 w-3.5 mr-1" /> Nâng cấp VIP</Button></Link>
                      </div>
                    ) : (
                      /* Real Video Iframe Player */
                      <div className="space-y-2">
                        {!isVip && (
                          <div className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 text-xs px-3 py-1.5 rounded-md flex justify-between items-center border border-yellow-500/20">
                            <span className="font-medium flex items-center gap-1"><Info className="h-3.5 w-3.5 text-yellow-600" /> Bản xem thử 3 phút</span>
                            <span className="font-bold font-mono bg-yellow-500/20 px-2 py-0.5 rounded text-[11px]">{formatTime(videoRemainingSeconds)}</span>
                          </div>
                        )}
                        <div className="relative w-full aspect-video">
                          <iframe
                            src={embedUrl}
                            className="absolute inset-0 w-full h-full rounded-md border"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
                      <Play className="h-10 w-10 text-muted-foreground opacity-30" />
                      <p className="text-xs text-muted-foreground">Bài học này chưa được cập nhật video bài giảng.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

        </div>

        {/* Right Panel: Video & Course Syllabus Overview (1/3 width) */}
        <div className="lg:col-span-1 space-y-4">
          
          {/* Video Card (Only visible on large screens for Math) */}
          <Card className={cn('overflow-hidden', lessonType === 'math' && 'hidden lg:block')}>
            <CardContent className="p-3">
              {embedUrl ? (
                !videoStarted ? (
                  /* Play Cover */
                  <div className="relative w-full aspect-video bg-muted rounded-md flex flex-col items-center justify-center p-6 text-center cursor-pointer hover:bg-muted/80 transition-all border group" onClick={startVideoTrial}>
                    <div className="h-14 w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                      <Play className="h-7 w-7 fill-current" />
                    </div>
                    <p className="font-bold text-sm">Xem video bài giảng</p>
                    {!isVip && <p className="text-[10px] text-muted-foreground mt-1">Dành cho tài khoản miễn phí: Xem thử 3 phút</p>}
                  </div>
                ) : videoExpired ? (
                  /* Block Card */
                  <div className="w-full aspect-video bg-amber-50/50 dark:bg-amber-950/10 rounded-md flex flex-col items-center justify-center p-6 text-center border border-yellow-500/20">
                    <Lock className="h-10 w-10 text-yellow-600 mb-2" />
                    <p className="font-bold text-sm text-yellow-800 dark:text-yellow-400">Thời gian xem thử kết thúc</p>
                    <p className="text-xs text-muted-foreground mt-1 mb-3 max-w-xs">Nâng cấp tài khoản VIP để xem đầy đủ video và học trọn vẹn lộ trình toán học.</p>
                    <Link href="/payment"><Button size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-xs"><Crown className="h-3.5 w-3.5 mr-1" /> Nâng cấp VIP</Button></Link>
                  </div>
                ) : (
                  /* Real Video Iframe Player */
                  <div className="space-y-2">
                    {!isVip && (
                      <div className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 text-xs px-3 py-1.5 rounded-md flex justify-between items-center border border-yellow-500/20">
                        <span className="font-medium flex items-center gap-1"><Info className="h-3.5 w-3.5 text-yellow-600" /> Bản xem thử 3 phút</span>
                        <span className="font-bold font-mono bg-yellow-500/20 px-2 py-0.5 rounded text-[11px]">{formatTime(videoRemainingSeconds)}</span>
                      </div>
                    )}
                    <div className="relative w-full aspect-video">
                      <iframe
                        src={embedUrl}
                        className="absolute inset-0 w-full h-full rounded-md border"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
                  <Play className="h-10 w-10 text-muted-foreground opacity-30" />
                  <p className="text-xs text-muted-foreground">Bài học này chưa được cập nhật video bài giảng.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Syllabus Quick Info Card */}
          <Card className="bg-muted/30 border shadow-none">
            <CardContent className="pt-4 pb-4 space-y-2.5 text-xs md:text-sm">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Khóa học hiện tại</p>
              <Link href={`/learning/${slug}`} className="flex items-center gap-2 text-sm font-semibold hover:text-primary transition-colors">
                <BookOpen className="h-4 w-4 shrink-0 text-primary" />
                <span className="line-clamp-1">{courseName}</span>
              </Link>
              {chapterName && (
                <p className="text-muted-foreground flex items-center gap-1.5">
                  <span className="text-primary font-bold">›</span> {chapterName}
                </p>
              )}
            </CardContent>
          </Card>
          
        </div>
      </div>
    </div>
  )
}
