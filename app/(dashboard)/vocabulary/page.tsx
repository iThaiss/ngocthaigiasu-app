'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Languages, Sparkles, Users, BookOpen, Target, Brain,
  Clock, CheckCircle2, Loader2, Search, Filter, Plus,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface VocabSet {
  id: string
  name: string
  description: string | null
  topic: string | null
  subtopic_code: string | null
  word_count: number
  question_count: number
  is_public: boolean
  is_ai_generated: boolean
  is_system: boolean
  featured: boolean
  likes: number
  progress: {
    total: number
    mastered: number
    due_today: number
  }
}

const SUBTOPIC_ICONS: Record<string, string> = {
  'E2X.01': '🔤',
  'E2X.02': '📐',
  'E2X.03': '🔗',
  'E2X.04': '💬',
  'E2X.05': '↔️',
  'E2X.06': '📖',
  'E2X.07': '🗂️',
  'E2X.08': '🌐',
}

const SUBTOPIC_COLORS = [
  'from-violet-500/10 to-purple-500/5 border-violet-200 dark:border-violet-800',
  'from-blue-500/10 to-indigo-500/5 border-blue-200 dark:border-blue-800',
  'from-emerald-500/10 to-teal-500/5 border-emerald-200 dark:border-emerald-800',
  'from-orange-500/10 to-amber-500/5 border-orange-200 dark:border-orange-800',
  'from-rose-500/10 to-pink-500/5 border-rose-200 dark:border-rose-800',
  'from-cyan-500/10 to-sky-500/5 border-cyan-200 dark:border-cyan-800',
  'from-yellow-500/10 to-amber-500/5 border-yellow-200 dark:border-yellow-800',
  'from-indigo-500/10 to-violet-500/5 border-indigo-200 dark:border-indigo-800',
]

function VocabSetCard({ set, index }: { set: VocabSet; index: number }) {
  const color = SUBTOPIC_COLORS[index % SUBTOPIC_COLORS.length]
  const icon = set.subtopic_code ? SUBTOPIC_ICONS[set.subtopic_code] ?? '📚' : '🤖'
  const progressPct = set.word_count > 0
    ? Math.round((set.progress.mastered / set.word_count) * 100)
    : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link href={`/vocabulary/${set.id}`}>
        <Card className={cn(
          'group cursor-pointer border bg-gradient-to-br transition-all hover:shadow-md hover:-translate-y-0.5',
          color
        )}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="text-2xl">{icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                    {set.name}
                  </h3>
                  <div className="flex shrink-0 gap-1">
                    {set.featured && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-0">
                        ⭐ Featured
                      </Badge>
                    )}
                    {set.is_ai_generated && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-violet-500/15 text-violet-600 dark:text-violet-400 border-0">
                        AI
                      </Badge>
                    )}
                  </div>
                </div>

                {set.description && (
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{set.description}</p>
                )}

                {/* Stats row */}
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    {set.word_count} từ
                  </span>
                  <span className="flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    {set.question_count} câu hỏi
                  </span>
                  {set.progress.due_today > 0 && (
                    <span className="flex items-center gap-1 text-orange-500">
                      <Clock className="h-3 w-3" />
                      {set.progress.due_today} cần ôn
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                {set.word_count > 0 && (
                  <div className="mt-2">
                    <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                      <span>{set.progress.mastered}/{set.word_count} đã học</span>
                      <span>{progressPct}%</span>
                    </div>
                    <Progress value={progressPct} className="h-1.5" />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  )
}

export default function VocabularyPage() {
  const [sets, setSets] = useState<VocabSet[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const fetchSets = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/vocabulary?filter=${filter}`)
      const data = await res.json()
      setSets(data.sets ?? [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    fetchSets()
  }, [fetchSets])

  const filteredSets = sets.filter((s) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      s.name.toLowerCase().includes(q) ||
      (s.topic ?? '').toLowerCase().includes(q) ||
      (s.subtopic_code ?? '').toLowerCase().includes(q)
    )
  })

  // Split system sets and user/community sets
  const systemSets = filteredSets.filter((s) => s.is_system)
  const otherSets = filteredSets.filter((s) => !s.is_system)

  // Global stats
  const totalWords = sets.reduce((a, s) => a + s.word_count, 0)
  const totalMastered = sets.reduce((a, s) => a + s.progress.mastered, 0)
  const totalDue = sets.reduce((a, s) => a + s.progress.due_today, 0)

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
            <Languages className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Từ vựng Tiếng Anh</h1>
            <p className="text-sm text-muted-foreground">Học theo chủ đề, luyện tập với AI</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/vocabulary/ai">
            <Button size="sm" className="gap-1.5">
              <Sparkles className="h-4 w-4" />
              AI Tạo từ vựng
            </Button>
          </Link>
          <Link href="/vocabulary/community">
            <Button size="sm" variant="outline" className="gap-1.5">
              <Users className="h-4 w-4" />
              Cộng đồng
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Stats bar */}
      {!loading && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-3 gap-3"
        >
          {[
            { icon: BookOpen, label: 'Tổng từ vựng', value: totalWords.toLocaleString(), color: 'text-blue-500' },
            { icon: CheckCircle2, label: 'Đã học', value: totalMastered.toLocaleString(), color: 'text-emerald-500' },
            { icon: Clock, label: 'Cần ôn hôm nay', value: totalDue.toString(), color: totalDue > 0 ? 'text-orange-500' : 'text-muted-foreground' },
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

      {/* Search + Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm bộ từ vựng…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-36">
            <Filter className="h-4 w-4 mr-1.5" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="system">Hệ thống</SelectItem>
            <SelectItem value="mine">Của tôi</SelectItem>
            <SelectItem value="community">Cộng đồng</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && (
        <>
          {/* System sets (E2X taxonomy) */}
          {systemSets.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Brain className="h-4 w-4 text-violet-500" />
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Bộ từ vựng luyện thi THPT
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {systemSets.map((s, i) => (
                  <VocabSetCard key={s.id} set={s} index={i} />
                ))}
              </div>
            </section>
          )}

          {/* User AI / community sets */}
          {otherSets.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-emerald-500" />
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Bộ từ do AI tạo & cộng đồng
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {otherSets.map((s, i) => (
                  <VocabSetCard key={s.id} set={s} index={i} />
                ))}
                {/* Create new CTA */}
                <Link href="/vocabulary/ai">
                  <Card className="h-full border-dashed border-2 cursor-pointer hover:border-primary/50 hover:bg-accent/30 transition-all">
                    <CardContent className="p-4 flex flex-col items-center justify-center gap-2 min-h-[120px] text-muted-foreground hover:text-foreground">
                      <Plus className="h-6 w-6" />
                      <p className="text-sm font-medium">Tạo bộ từ mới</p>
                      <p className="text-xs text-center">Dùng AI để tạo từ vựng theo chủ đề bạn muốn</p>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </section>
          )}

          {/* Empty state */}
          {filteredSets.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              {search ? (
                <>
                  <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>Không tìm thấy bộ từ vựng nào cho &ldquo;{search}&rdquo;</p>
                </>
              ) : (
                <>
                  <Languages className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>Chưa có bộ từ vựng nào</p>
                  <Link href="/vocabulary/ai">
                    <Button className="mt-4 gap-2">
                      <Sparkles className="h-4 w-4" />
                      Tạo bộ từ đầu tiên
                    </Button>
                  </Link>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
