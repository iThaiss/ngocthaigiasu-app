'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  AlertCircle,
  BookMarked,
  BookOpen,
  CheckCircle2,
  Clock,
  FileQuestion,
  Loader2,
  RotateCw,
  Search,
  Target,
  Trophy,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface Passage {
  id: string
  title: string
  title_vi: string | null
  topic: string
  topic_vi: string | null
  level: string
  word_count: number
  question_count: number
  progress: { completed: boolean; score: number; total: number }
}

type LevelFilter = 'Tất cả' | 'B1' | 'B2' | 'C1'
type TypeFilter = 'all' | '8q' | '10q'

const LEVEL_TABS: LevelFilter[] = ['Tất cả', 'B1', 'B2', 'C1']

const TYPE_TABS: { key: TypeFilter; label: string; description: string }[] = [
  { key: 'all', label: 'Tất cả', description: 'Toàn bộ bài đọc' },
  { key: '8q', label: '8 câu', description: 'Bài đọc chuẩn câu 23-30' },
  { key: '10q', label: '10 câu', description: 'Bài đọc chuẩn câu 31-40' },
]

const LEVEL_COLOR: Record<string, string> = {
  B1: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  B2: 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
  C1: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
}

function getPassageType(questionCount: number): TypeFilter | 'other' {
  if (questionCount === 8) return '8q'
  if (questionCount === 10) return '10q'
  return 'other'
}

function estimatedMinutes(questionCount: number, wordCount: number) {
  if (questionCount >= 10) return 14
  if (questionCount >= 8) return 11
  return Math.max(6, Math.round(wordCount / 45))
}

function scorePercent(passage: Passage) {
  return passage.progress.total > 0
    ? Math.round((passage.progress.score / passage.progress.total) * 100)
    : 0
}

function PassageCard({ passage, index, compact = false }: { passage: Passage; index: number; compact?: boolean }) {
  const lc = LEVEL_COLOR[passage.level] ?? 'bg-muted text-muted-foreground'
  const pct = scorePercent(passage)
  const type = getPassageType(passage.question_count)
  const isExamFormat = type === '8q' || type === '10q'

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.025 }}>
      <Link href={`/reading/${passage.id}`}>
        <Card className="group h-full cursor-pointer border bg-card transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
          <CardContent className={cn('flex h-full flex-col gap-3', compact ? 'p-3' : 'p-4')}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="line-clamp-2 text-sm font-semibold leading-snug transition-colors group-hover:text-primary">
                  {passage.title}
                </h3>
                <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                  {passage.topic_vi || passage.topic}
                </p>
              </div>
              {passage.progress.completed ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              ) : (
                <Badge variant="secondary" className="shrink-0 border-0 text-[10px]">Mới</Badge>
              )}
            </div>

            <div className="mt-auto flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className={cn('h-5 border-0 px-1.5 py-0 text-[10px]', lc)}>
                {passage.level}
              </Badge>
              <Badge variant="outline" className={cn('h-5 px-1.5 py-0 text-[10px]', isExamFormat ? 'border-primary/30 text-primary' : 'text-muted-foreground')}>
                {isExamFormat ? `${passage.question_count} câu` : `${passage.question_count} câu cũ`}
              </Badge>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <BookOpen className="h-3 w-3" />{passage.word_count} từ
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />{estimatedMinutes(passage.question_count, passage.word_count)} phút
              </span>
            </div>

            {passage.progress.completed && (
              <div>
                <div className="mb-1 flex justify-between text-[10px] text-muted-foreground">
                  <span>{passage.progress.score}/{passage.progress.total} đúng</span>
                  <span>{pct}%</span>
                </div>
                <Progress value={pct} className="h-1.5" />
              </div>
            )}
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  )
}

function PracticeSection({ title, description, passages, emptyText }: {
  title: string
  description: string
  passages: Passage[]
  emptyText: string
}) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <Badge variant="secondary" className="border-0 text-[10px]">{passages.length} bài</Badge>
      </div>
      {passages.length > 0 ? (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {passages.map((passage, index) => (
            <PassageCard key={passage.id} passage={passage} index={index} compact />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          {emptyText}
        </div>
      )}
    </section>
  )
}

export default function ReadingPage() {
  const [passages, setPassages] = useState<Passage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('Tất cả')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [search, setSearch] = useState('')

  const fetchPassages = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const params = new URLSearchParams()
      if (levelFilter !== 'Tất cả') params.set('level', levelFilter)
      const res = await fetch(`/api/reading?${params}`)
      if (!res.ok) throw new Error(`Request failed: ${res.status}`)
      const data = await res.json()
      setPassages(data.passages ?? [])
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [levelFilter])

  useEffect(() => { fetchPassages() }, [fetchPassages])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return passages.filter((passage) => {
      const type = getPassageType(passage.question_count)
      const matchesType = typeFilter === 'all' || type === typeFilter
      const matchesSearch = !q || (
        passage.title.toLowerCase().includes(q) ||
        passage.topic.toLowerCase().includes(q) ||
        (passage.topic_vi ?? '').toLowerCase().includes(q) ||
        (passage.title_vi ?? '').toLowerCase().includes(q)
      )
      return matchesType && matchesSearch
    })
  }, [passages, search, typeFilter])

  const exam8 = filtered.filter((passage) => passage.question_count === 8)
  const exam10 = filtered.filter((passage) => passage.question_count === 10)
  const legacy = filtered.filter((passage) => ![8, 10].includes(passage.question_count))
  const completed = passages.filter((passage) => passage.progress.completed)
  const needsRetry = completed
    .filter((passage) => scorePercent(passage) < 75)
    .sort((a, b) => scorePercent(a) - scorePercent(b))
  const fresh = passages.filter((passage) => !passage.progress.completed && [8, 10].includes(passage.question_count))
  const today = [...needsRetry, ...fresh].slice(0, 3)
  const averageScore = completed.length > 0
    ? Math.round(completed.reduce((sum, passage) => sum + scorePercent(passage), 0) / completed.length)
    : 0

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
            <BookMarked className="h-5 w-5 text-amber-600 dark:text-amber-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Đọc hiểu Tiếng Anh</h1>
            <p className="text-sm text-muted-foreground">Luyện trọn bài 8 câu và 10 câu như đề thật.</p>
          </div>
        </div>
      </motion.div>

      {!loading && !error && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          {[
            { icon: FileQuestion, label: 'Bài 8 câu', value: exam8.length, color: 'text-sky-600 dark:text-sky-300' },
            { icon: Target, label: 'Bài 10 câu', value: exam10.length, color: 'text-rose-600 dark:text-rose-300' },
            { icon: CheckCircle2, label: 'Đã hoàn thành', value: completed.length, color: 'text-emerald-600 dark:text-emerald-300' },
            { icon: Trophy, label: 'Điểm TB', value: completed.length ? `${averageScore}%` : '-', color: 'text-amber-600 dark:text-amber-300' },
          ].map(({ icon: Icon, label, value, color }) => (
            <Card key={label} className="border">
              <CardContent className="flex items-center gap-3 p-3">
                <Icon className={cn('h-5 w-5 shrink-0', color)} />
                <div>
                  <p className="text-lg font-bold leading-tight">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      )}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {TYPE_TABS.map((tab) => {
          const active = typeFilter === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setTypeFilter(tab.key)}
              aria-pressed={active}
              className={cn(
                'rounded-xl border px-3 py-2.5 text-left transition-all',
                active ? 'border-primary/50 bg-primary/5 text-primary shadow-sm' : 'border-border text-muted-foreground hover:bg-accent'
              )}
            >
              <span className="block text-sm font-semibold">{tab.label}</span>
              <span className="mt-0.5 block text-[11px]">{tab.description}</span>
            </button>
          )
        })}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm bài đọc hoặc chủ đề..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          {LEVEL_TABS.map((level) => (
            <Button
              key={level}
              size="sm"
              variant={levelFilter === level ? 'default' : 'outline'}
              onClick={() => setLevelFilter(level)}
              className="shrink-0 px-3"
            >
              {level}
            </Button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && error && (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <AlertCircle className="h-10 w-10 text-rose-500/70" />
          <div>
            <p className="font-medium">Không tải được bài đọc</p>
            <p className="text-sm text-muted-foreground">Vui lòng kiểm tra đăng nhập/kết nối và thử lại.</p>
          </div>
          <Button size="sm" variant="outline" onClick={fetchPassages} className="gap-1.5">
            <RotateCw className="h-4 w-4" />Thử lại
          </Button>
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-7">
          {!search && typeFilter === 'all' && today.length > 0 && (
            <PracticeSection
              title="Luyện hôm nay"
              description="Ưu tiên bài chưa làm hoặc bài cần làm lại vì điểm dưới 75%."
              passages={today}
              emptyText="Bạn đã hoàn thành tốt các bài hiện có."
            />
          )}

          {(typeFilter === 'all' || typeFilter === '8q') && (
            <PracticeSection
              title="Reading 8 câu"
              description="Một bài đọc ngắn hơn, tập trung detail, vocabulary, reference, paraphrase và paragraph location."
              passages={exam8}
              emptyText="Chưa có bài 8 câu phù hợp bộ lọc hiện tại."
            />
          )}

          {(typeFilter === 'all' || typeFilter === '10q') && (
            <PracticeSection
              title="Reading 10 câu"
              description="Bài khó hơn, có summary, inference, sentence insertion và logic toàn bài."
              passages={exam10}
              emptyText="Chưa có bài 10 câu phù hợp bộ lọc hiện tại."
            />
          )}

          {typeFilter === 'all' && legacy.length > 0 && (
            <PracticeSection
              title="Bài cũ"
              description="Các bài chưa đúng format 8/10 câu, giữ lại để tham khảo hoặc migrate dần."
              passages={legacy}
              emptyText=""
            />
          )}

          {filtered.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              <BookOpen className="mx-auto mb-3 h-10 w-10 opacity-30" />
              <p>{search ? `Không tìm thấy kết quả cho "${search}"` : 'Chưa có bài đọc nào phù hợp bộ lọc.'}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
