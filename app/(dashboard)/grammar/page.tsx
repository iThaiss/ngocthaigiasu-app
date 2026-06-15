'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen, Brain, CheckCircle2, ChevronDown, Loader2, Search,
  Target, Flame, Star,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface GrammarLesson {
  id: string
  topic_group: string
  topic_group_en: string
  topic_group_icon: string
  title: string
  title_vi: string
  level: string
  exercise_count: number
  order_index: number
  progress: { mastered: boolean; best_score: number; attempts: number }
}

const LEVEL_COLOR: Record<string, string> = {
  B1: 'bg-green-500/15 text-green-600 dark:text-green-400',
  B2: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400',
  C1: 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
  C2: 'bg-red-500/15 text-red-600 dark:text-red-400',
}

const GROUP_ACCENT: Record<string, { accent: string; bg: string; border: string }> = {
  'Verb Tenses':         { accent: 'text-primary', bg: 'bg-primary/8 hover:bg-primary/12',  border: 'border-primary/20' },
  'Conditionals':        { accent: 'text-blue-500',   bg: 'bg-blue-500/8 hover:bg-blue-500/12',      border: 'border-blue-200 dark:border-blue-800' },
  'Passive Voice':       { accent: 'text-emerald-500', bg: 'bg-emerald-500/8 hover:bg-emerald-500/12', border: 'border-emerald-200 dark:border-emerald-800' },
  'Relative Clauses':    { accent: 'text-cyan-500',    bg: 'bg-cyan-500/8 hover:bg-cyan-500/12',      border: 'border-cyan-200 dark:border-cyan-800' },
  'Modal Verbs':         { accent: 'text-amber-500',   bg: 'bg-amber-500/8 hover:bg-amber-500/12',    border: 'border-amber-200 dark:border-amber-800' },
  'Reported Speech':     { accent: 'text-rose-500',    bg: 'bg-rose-500/8 hover:bg-rose-500/12',      border: 'border-rose-200 dark:border-rose-800' },
  'Infinitive & Gerund': { accent: 'text-primary',  bg: 'bg-primary/8 hover:bg-primary/12',  border: 'border-primary/20' },
  'Articles & Prepositions':{ accent: 'text-teal-500', bg: 'bg-teal-500/8 hover:bg-teal-500/12',      border: 'border-teal-200 dark:border-teal-800' },
  'Conjunctions & Linking':{ accent: 'text-pink-500',  bg: 'bg-pink-500/8 hover:bg-pink-500/12',      border: 'border-pink-200 dark:border-pink-800' },
  'Advanced Structures': { accent: 'text-orange-500',  bg: 'bg-orange-500/8 hover:bg-orange-500/12',  border: 'border-orange-200 dark:border-orange-800' },
}

function LessonCard({ lesson, index }: { lesson: GrammarLesson; index: number }) {
  const lc = LEVEL_COLOR[lesson.level] ?? LEVEL_COLOR['B2']
  const mastered = lesson.progress.mastered

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}>
      <Link href={`/grammar/${lesson.id}`}>
        <Card className="group cursor-pointer border bg-card hover:shadow-md hover:-translate-y-0.5 transition-all">
          <CardContent className="p-4">
            <div className="flex items-start gap-2 mb-1.5">
              <h3 className="flex-1 font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                {lesson.title}
              </h3>
              {mastered && <Star className="h-3.5 w-3.5 shrink-0 text-yellow-500 fill-yellow-500 mt-0.5" />}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className={cn('text-[10px] px-1.5 py-0 h-4 border-0', lc)}>
                {lesson.level}
              </Badge>
              {lesson.exercise_count > 0 && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Target className="h-3 w-3" />{lesson.exercise_count} bài tập
                </span>
              )}
              {lesson.progress.attempts > 0 && (
                <span className={cn('text-xs flex items-center gap-1', mastered ? 'text-emerald-500' : 'text-orange-500')}>
                  <Flame className="h-3 w-3" />{lesson.progress.best_score}%
                </span>
              )}
            </div>

            {lesson.progress.attempts > 0 && (
              <div className="mt-2">
                <Progress value={lesson.progress.best_score} className="h-1.5" />
              </div>
            )}
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  )
}

function GroupFolder({
  icon, group, lessons, defaultOpen,
}: { icon: string; group: string; lessons: GrammarLesson[]; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? false)
  const style = GROUP_ACCENT[group] ?? { accent: 'text-primary', bg: 'bg-muted/50 hover:bg-muted', border: 'border-border' }

  const mastered = lessons.filter((l) => l.progress.mastered).length
  const attempted = lessons.filter((l) => l.progress.attempts > 0).length
  const totalEx = lessons.reduce((a, l) => a + l.exercise_count, 0)
  const masteredPct = lessons.length > 0 ? Math.round((mastered / lessons.length) * 100) : 0

  return (
    <div className={cn('rounded-xl border overflow-hidden', style.border)}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn('w-full flex items-center gap-3 px-4 py-3 text-left transition-colors', style.bg)}
      >
        <span className="text-xl">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn('font-semibold text-sm', style.accent)}>{group}</span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 border-0">
              {lessons.length} bài
            </Badge>
            <span className="text-xs text-muted-foreground">{totalEx} bài tập</span>
            {mastered > 0 && (
              <span className="text-xs text-emerald-500 flex items-center gap-0.5">
                <CheckCircle2 className="h-3 w-3" />{mastered}/{lessons.length} đã học
              </span>
            )}
          </div>
          {attempted > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <Progress value={masteredPct} className="h-1 flex-1 max-w-[120px]" />
              <span className="text-[10px] text-muted-foreground">{masteredPct}%</span>
            </div>
          )}
        </div>
        <ChevronDown className={cn('h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200', open && 'rotate-180')} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {lessons.map((l, i) => <LessonCard key={l.id} lesson={l} index={i} />)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function GrammarPage() {
  const [lessons, setLessons] = useState<GrammarLesson[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchLessons = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/grammar')
      const data = await res.json()
      setLessons(data.lessons ?? [])
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchLessons() }, [fetchLessons])

  const filtered = lessons.filter((l) => {
    if (!search) return true
    const q = search.toLowerCase()
    return l.title.toLowerCase().includes(q) || l.topic_group_en.toLowerCase().includes(q)
  })

  // Group by topic_group_en (English) preserving insertion order
  const groupMap = new Map<string, { icon: string; lessons: GrammarLesson[] }>()
  for (const l of filtered) {
    const groupKey = l.topic_group_en || l.topic_group
    if (!groupMap.has(groupKey)) {
      groupMap.set(groupKey, { icon: l.topic_group_icon ?? '📐', lessons: [] })
    }
    groupMap.get(groupKey)!.lessons.push(l)
  }
  const groups = Array.from(groupMap.entries())

  const totalLessons = lessons.length
  const masteredLessons = lessons.filter((l) => l.progress.mastered).length
  const inProgress = lessons.filter((l) => l.progress.attempts > 0 && !l.progress.mastered).length

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
          <BookOpen className="h-5 w-5 text-blue-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Ngữ pháp Tiếng Anh</h1>
          <p className="text-sm text-muted-foreground">50 bài học · lý thuyết + bài tập THPT/HSA/SPT</p>
        </div>
      </motion.div>

      {/* Stats */}
      {!loading && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-3 gap-3">
          {[
            { icon: BookOpen,     label: 'Tổng bài học',  value: totalLessons,    color: 'text-blue-500' },
            { icon: CheckCircle2, label: 'Đã học xong',   value: masteredLessons, color: 'text-emerald-500' },
            { icon: Brain,        label: 'Đang học',      value: inProgress,      color: inProgress > 0 ? 'text-amber-500' : 'text-muted-foreground' },
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

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Tìm bài học ngữ pháp…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-blue-500" />
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {groups.length} nhóm ngữ pháp · {totalLessons} bài học
            </h2>
          </div>

          {groups.map(([group, { icon, lessons: gLessons }], idx) => (
            <GroupFolder
              key={group}
              icon={icon}
              group={group}
              lessons={gLessons}
              defaultOpen={idx === 0}
            />
          ))}

          {filtered.length === 0 && search && (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>Không tìm thấy bài học nào cho &ldquo;{search}&rdquo;</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
