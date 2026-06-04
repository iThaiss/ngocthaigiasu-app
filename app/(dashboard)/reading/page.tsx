'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  BookOpen, CheckCircle2, Loader2, Search, Target, BookMarked,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface Passage {
  id: string
  title: string
  title_vi: string
  topic: string
  topic_vi: string
  level: string
  word_count: number
  question_count: number
  progress: { completed: boolean; score: number; total: number }
}

const LEVEL_COLOR: Record<string, string> = {
  B1: 'bg-green-500/15 text-green-600 dark:text-green-400',
  B2: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400',
  C1: 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
}

const LEVEL_TABS = ['Tất cả', 'B1', 'B2', 'C1'] as const

function PassageCard({ passage, index }: { passage: Passage; index: number }) {
  const lc = LEVEL_COLOR[passage.level] ?? ''
  const scorePct = passage.progress.total > 0
    ? Math.round((passage.progress.score / passage.progress.total) * 100)
    : 0

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}>
      <Link href={`/reading/${passage.id}`}>
        <Card className="group cursor-pointer border bg-card hover:shadow-md hover:-translate-y-0.5 transition-all h-full">
          <CardContent className="p-4 flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors flex-1">
                {passage.title}
              </h3>
              {passage.progress.completed && (
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              )}
            </div>
            {passage.title_vi && (
              <p className="text-xs text-muted-foreground line-clamp-1">{passage.title_vi}</p>
            )}

            <div className="flex items-center gap-2 flex-wrap mt-auto">
              <Badge variant="secondary" className={cn('text-[10px] px-1.5 py-0 h-4 border-0', lc)}>
                {passage.level}
              </Badge>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <BookOpen className="h-3 w-3" />{passage.word_count} từ
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Target className="h-3 w-3" />{passage.question_count} câu
              </span>
            </div>

            {passage.progress.completed && (
              <div>
                <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                  <span>{passage.progress.score}/{passage.progress.total} đúng</span>
                  <span>{scorePct}%</span>
                </div>
                <Progress value={scorePct} className="h-1.5" />
              </div>
            )}
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  )
}

export default function ReadingPage() {
  const [passages, setPassages] = useState<Passage[]>([])
  const [loading, setLoading] = useState(true)
  const [levelFilter, setLevelFilter] = useState<string>('Tất cả')
  const [search, setSearch] = useState('')

  const fetchPassages = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (levelFilter !== 'Tất cả') params.set('level', levelFilter)
      const res = await fetch(`/api/reading?${params}`)
      const data = await res.json()
      setPassages(data.passages ?? [])
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [levelFilter])

  useEffect(() => { fetchPassages() }, [fetchPassages])

  const filtered = passages.filter((p) => {
    if (!search) return true
    const q = search.toLowerCase()
    return p.title.toLowerCase().includes(q) || p.topic.toLowerCase().includes(q) ||
           (p.topic_vi ?? '').toLowerCase().includes(q)
  })

  // Group by topic
  const grouped = new Map<string, Passage[]>()
  for (const p of filtered) {
    if (!grouped.has(p.topic)) grouped.set(p.topic, [])
    grouped.get(p.topic)!.push(p)
  }

  const totalPassages = passages.length
  const completed = passages.filter((p) => p.progress.completed).length

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
          <BookMarked className="h-5 w-5 text-amber-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Đọc hiểu Tiếng Anh</h1>
          <p className="text-sm text-muted-foreground">Luyện đọc hiểu chuẩn THPT · B1–C1</p>
        </div>
      </motion.div>

      {/* Stats */}
      {!loading && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-3 gap-3">
          {[
            { icon: BookOpen,     label: 'Tổng đoạn văn',  value: totalPassages, color: 'text-amber-500' },
            { icon: CheckCircle2, label: 'Đã hoàn thành',  value: completed,     color: 'text-emerald-500' },
            { icon: Target,       label: 'Chưa làm',       value: totalPassages - completed, color: totalPassages - completed > 0 ? 'text-blue-500' : 'text-muted-foreground' },
          ].map(({ icon: Icon, label, value, color }) => (
            <Card key={label} className="border">
              <CardContent className="p-3 flex items-center gap-2">
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

      {/* Search + Level Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm đoạn văn hoặc chủ đề…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1.5">
          {LEVEL_TABS.map((lv) => (
            <Button
              key={lv}
              size="sm"
              variant={levelFilter === lv ? 'default' : 'outline'}
              onClick={() => setLevelFilter(lv)}
              className="px-3"
            >
              {lv}
            </Button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && (
        <div className="space-y-6">
          {Array.from(grouped.entries()).map(([topic, tPassages]) => (
            <section key={topic}>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-sm font-semibold text-muted-foreground">{topic}</h2>
                <span className="text-xs text-muted-foreground">({tPassages.length})</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {tPassages.map((p, i) => <PassageCard key={p.id} passage={p} index={i} />)}
              </div>
            </section>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>{search ? `Không tìm thấy kết quả cho "${search}"` : 'Chưa có đoạn văn nào. Import dữ liệu trước nhé.'}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
