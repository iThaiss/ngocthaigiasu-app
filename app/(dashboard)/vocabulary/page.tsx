'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertCircle,
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronDown,
  Clock,
  Flame,
  Heart,
  Languages,
  Plus,
  RotateCw,
  Search,
  Sparkles,
  Target,
  Users,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import {
  getGroupForTopic,
  getPrimaryLevel,
  GroupConfig,
  LEVEL_TABS,
  LevelKey,
  TOPIC_TO_GROUP,
  VOCAB_GROUPS,
} from '@/lib/vocabulary-taxonomy'

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
  progress: { total: number; mastered: number; due_today: number }
}

type LaneKey = 'continue' | 'foundation' | 'advanced' | 'exam' | 'expert'

const LEVEL_COLOR: Record<LevelKey, string> = {
  all: '',
  B1: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  B2: 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
  C1: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
}

const LEARNING_LANES: {
  key: LaneKey
  title: string
  description: string
  icon: typeof BookOpen
  pick: (set: VocabSet) => boolean
}[] = [
  {
    key: 'continue',
    title: 'Học tiếp hôm nay',
    description: 'Ưu tiên các bộ đang có từ cần ôn hoặc đã học dở.',
    icon: Clock,
    pick: (set) => set.progress.due_today > 0 || set.progress.total > 0,
  },
  {
    key: 'foundation',
    title: 'Nền tảng chắc',
    description: 'B1 đến đầu B2: từ phổ biến, dễ dùng trong đọc hiểu và viết câu.',
    icon: BookOpen,
    pick: (set) => getPrimaryLevel(set.description) === 'B1',
  },
  {
    key: 'advanced',
    title: 'Mở rộng học thuật',
    description: 'B2: chủ đề xã hội, khoa học, kinh tế, công nghệ.',
    icon: Brain,
    pick: (set) => getPrimaryLevel(set.description) === 'B2',
  },
  {
    key: 'exam',
    title: 'Kỹ năng làm đề',
    description: 'Collocation, phrasal verb, word family, connectors, traps.',
    icon: Target,
    pick: (set) => {
      const group = getGroupForTopic(set.topic)
      return Boolean(group && ['contextual-meaning', 'word-partnerships', 'verb-patterns', 'connectors-logic', 'word-families', 'exam-traps'].includes(group.key))
    },
  },
  {
    key: 'expert',
    title: 'C1-C2 chuyên sâu',
    description: 'Từ học thuật khó, sắc thái nghĩa và chủ đề nâng cao.',
    icon: Sparkles,
    pick: (set) => getPrimaryLevel(set.description) === 'C1',
  },
]

function displayTitle(set: VocabSet) {
  return set.name
}

function displaySubtitle(set: VocabSet) {
  if (set.topic && set.topic !== set.name) return set.topic
  return set.description
}

function VocabSetCard({ set, index, compact = false }: { set: VocabSet; index: number; compact?: boolean }) {
  const level = getPrimaryLevel(set.description)
  const lc = LEVEL_COLOR[level]
  const progressPct = set.word_count > 0 ? Math.round((set.progress.mastered / set.word_count) * 100) : 0
  const group = getGroupForTopic(set.topic)

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.025 }}>
      <Link href={`/vocabulary/${set.id}`}>
        <Card className="group h-full cursor-pointer border bg-card transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
          <CardContent className={cn('flex h-full flex-col gap-3', compact ? 'p-3' : 'p-4')}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="line-clamp-2 text-sm font-semibold leading-snug transition-colors group-hover:text-primary">
                  {displayTitle(set)}
                </h3>
                {displaySubtitle(set) && (
                  <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{displaySubtitle(set)}</p>
                )}
              </div>
              {set.progress.due_today > 0 ? (
                <Badge variant="secondary" className="shrink-0 border-0 bg-orange-500/15 px-1.5 py-0 text-[10px] text-orange-600 dark:text-orange-300">
                  {set.progress.due_today} ôn
                </Badge>
              ) : set.featured ? (
                <Badge variant="secondary" className="shrink-0 border-0 bg-yellow-500/15 px-1.5 py-0 text-[10px] text-yellow-700 dark:text-yellow-300">
                  Nổi bật
                </Badge>
              ) : null}
            </div>

            <div className="mt-auto flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className={cn('h-5 border-0 px-1.5 py-0 text-[10px]', lc)}>
                {level === 'C1' ? 'C1-C2' : level}
              </Badge>
              {group && (
                <span className={cn('text-xs font-medium', group.accent)}>{group.label}</span>
              )}
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <BookOpen className="h-3 w-3" />{set.word_count} từ
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Target className="h-3 w-3" />{set.question_count} câu
              </span>
              {!set.is_system && set.likes > 0 && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Heart className="h-3 w-3" />{set.likes}
                </span>
              )}
            </div>

            {set.progress.total > 0 && (
              <div>
                <div className="mb-1 flex justify-between text-[10px] text-muted-foreground">
                  <span>{set.progress.mastered}/{set.word_count} đã học</span>
                  <span>{progressPct}%</span>
                </div>
                <Progress value={progressPct} className="h-1.5" />
              </div>
            )}
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  )
}

function LearningLane({ title, description, icon: Icon, sets }: {
  title: string
  description: string
  icon: typeof BookOpen
  sets: VocabSet[]
}) {
  if (sets.length === 0) return null

  return (
    <section className="space-y-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">{title}</h2>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        <Badge variant="secondary" className="shrink-0 border-0 text-[10px]">{sets.length} bộ</Badge>
      </div>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {sets.slice(0, 6).map((set, index) => (
          <VocabSetCard key={set.id} set={set} index={index} compact />
        ))}
      </div>
    </section>
  )
}

function FolderSection({ group, sets, defaultOpen = false, forceOpen = false }: {
  group: GroupConfig
  sets: VocabSet[]
  defaultOpen?: boolean
  forceOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const isOpen = forceOpen || open
  const totalWords = sets.reduce((a, s) => a + s.word_count, 0)
  const totalMastered = sets.reduce((a, s) => a + s.progress.mastered, 0)
  const totalDue = sets.reduce((a, s) => a + s.progress.due_today, 0)
  const groupPct = totalWords > 0 ? Math.round((totalMastered / totalWords) * 100) : 0
  const Icon = group.icon

  return (
    <div className={cn('overflow-hidden rounded-xl border bg-card', group.border)}>
      <button
        onClick={() => setOpen((value) => !value)}
        aria-expanded={isOpen}
        className={cn('flex w-full items-center gap-3 px-4 py-3 text-left transition-colors', group.bg)}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background/70">
          <Icon className={cn('h-4 w-4', group.accent)} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn('text-sm font-semibold', group.accent)}>{group.label}</span>
            <Badge variant="secondary" className="h-5 border-0 px-1.5 py-0 text-[10px]">{sets.length} bộ</Badge>
            <span className="text-xs text-muted-foreground">{totalWords.toLocaleString()} từ</span>
            {totalDue > 0 && (
              <span className="flex items-center gap-0.5 text-xs font-medium text-orange-500">
                <Flame className="h-3 w-3" />{totalDue} cần ôn
              </span>
            )}
          </div>
          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{group.description}</p>
          {totalMastered > 0 && (
            <div className="mt-1 flex items-center gap-2">
              <Progress value={groupPct} className="h-1 max-w-[120px] flex-1" />
              <span className="text-[10px] text-muted-foreground">{groupPct}%</span>
            </div>
          )}
        </div>
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200', isOpen && 'rotate-180')} />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 gap-2.5 p-3 sm:grid-cols-2 lg:grid-cols-3">
              {sets.map((set, index) => (
                <VocabSetCard key={set.id} set={set} index={index} compact />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function VocabularyPage() {
  const [sets, setSets] = useState<VocabSet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState('')
  const [levelTab, setLevelTab] = useState<LevelKey>('all')

  const fetchSets = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await fetch('/api/vocabulary?filter=all')
      if (!res.ok) throw new Error(`Request failed: ${res.status}`)
      const data = await res.json()
      setSets(data.sets ?? [])
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchSets() }, [fetchSets])

  const isSearching = search.trim().length > 0
  const searchFiltered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return sets
    return sets.filter((set) => {
      const group = getGroupForTopic(set.topic)
      return (
        set.name.toLowerCase().includes(q) ||
        (set.topic ?? '').toLowerCase().includes(q) ||
        (set.description ?? '').toLowerCase().includes(q) ||
        (group?.label ?? '').toLowerCase().includes(q)
      )
    })
  }, [sets, search])

  const systemSets = searchFiltered.filter((set) => set.is_system)
  const otherSets = searchFiltered.filter((set) => !set.is_system)
  const levelFiltered = levelTab === 'all' || isSearching
    ? systemSets
    : systemSets.filter((set) => getPrimaryLevel(set.description) === levelTab)

  const groupedTopics = new Set(VOCAB_GROUPS.flatMap((group) => group.topics))
  const groupsWithSets = VOCAB_GROUPS.map((group) => ({
    group,
    sets: levelFiltered.filter((set) => set.topic && TOPIC_TO_GROUP[set.topic] === group.key),
  })).filter(({ sets }) => sets.length > 0)
  const ungroupedSystem = levelFiltered.filter((set) => !set.topic || !groupedTopics.has(set.topic))

  const visibleSets = [...levelFiltered, ...otherSets]
  const totalWords = visibleSets.reduce((a, set) => a + set.word_count, 0)
  const totalMastered = visibleSets.reduce((a, set) => a + set.progress.mastered, 0)
  const totalDue = visibleSets.reduce((a, set) => a + set.progress.due_today, 0)
  const levelCount = (key: LevelKey) => key === 'all' ? systemSets.length : systemSets.filter((set) => getPrimaryLevel(set.description) === key).length

  const laneBaseSets = levelTab === 'all' || isSearching ? systemSets : levelFiltered
  const laneSets = LEARNING_LANES.map((lane) => ({
    ...lane,
    sets: laneBaseSets.filter(lane.pick),
  })).filter((lane) => lane.key === 'continue' ? lane.sets.length > 0 : true)

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
            <Languages className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Từ vựng Tiếng Anh</h1>
            <p className="text-sm text-muted-foreground">Chọn một lộ trình nhỏ, học theo bộ, rồi ôn lại đúng hạn.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/vocabulary/ai">
            <Button size="sm" className="gap-1.5"><Sparkles className="h-4 w-4" />AI tạo bộ</Button>
          </Link>
          <Link href="/vocabulary/community">
            <Button size="sm" variant="outline" className="gap-1.5"><Users className="h-4 w-4" />Cộng đồng</Button>
          </Link>
        </div>
      </motion.div>

      {!loading && !error && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { icon: BookOpen, label: 'Từ trong màn này', value: totalWords.toLocaleString(), color: 'text-sky-600 dark:text-sky-300' },
            { icon: CheckCircle2, label: 'Đã nắm vững', value: totalMastered.toLocaleString(), color: 'text-emerald-600 dark:text-emerald-300' },
            { icon: Clock, label: 'Cần ôn hôm nay', value: totalDue.toString(), color: totalDue > 0 ? 'text-orange-500' : 'text-muted-foreground' },
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

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {LEVEL_TABS.map((tab) => {
          const active = levelTab === tab.key
          const count = levelCount(tab.key)
          return (
            <button
              key={tab.key}
              onClick={() => setLevelTab(tab.key)}
              aria-pressed={active}
              className={cn(
                'rounded-xl border px-3 py-2.5 text-center transition-all',
                active ? cn('border-current shadow-sm', tab.key === 'all' ? 'bg-foreground/5 text-foreground' : tab.bg, tab.color) : 'border-border text-muted-foreground hover:bg-accent'
              )}
            >
              <span className="block text-sm font-bold leading-tight">{tab.label}</span>
              <span className="mt-0.5 block text-[10px]">{tab.sublabel}</span>
              <span className="mt-1 block text-[10px] font-medium">{count} bộ</span>
            </button>
          )
        })}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Tìm tên bộ, chủ đề, nhóm kỹ năng..."
          aria-label="Tìm bộ từ vựng"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="pl-9"
        />
      </div>

      {loading && (
        <div className="space-y-3" aria-busy="true">
          {[0, 1, 2].map((index) => (
            <div key={index} className="rounded-xl border bg-card/50 px-4 py-3 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded bg-muted" />
                <div className="space-y-2">
                  <div className="h-4 w-44 rounded bg-muted" />
                  <div className="h-3 w-64 rounded bg-muted" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <AlertCircle className="h-10 w-10 text-rose-500/70" />
          <div>
            <p className="font-medium">Không tải được danh sách từ vựng</p>
            <p className="text-sm text-muted-foreground">Vui lòng kiểm tra kết nối và thử lại.</p>
          </div>
          <Button size="sm" variant="outline" onClick={fetchSets} className="gap-1.5">
            <RotateCw className="h-4 w-4" />Thử lại
          </Button>
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-7">
          {!isSearching && (
            <section className="space-y-5">
              {laneSets.map((lane) => (
                <LearningLane key={lane.key} title={lane.title} description={lane.description} icon={lane.icon} sets={lane.sets} />
              ))}
            </section>
          )}

          {levelFiltered.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {isSearching ? 'Kết quả tìm kiếm' : 'Khám phá theo nhóm'}
                </h2>
                <Badge variant="secondary" className="border-0 text-[10px]">{levelFiltered.length} bộ</Badge>
              </div>

              {groupsWithSets.map(({ group, sets: groupSets }, index) => (
                <FolderSection key={group.key} group={group} sets={groupSets} defaultOpen={isSearching || index < 2} forceOpen={isSearching} />
              ))}

              {ungroupedSystem.length > 0 && (
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {ungroupedSystem.map((set, index) => <VocabSetCard key={set.id} set={set} index={index} compact />)}
                </div>
              )}
            </section>
          )}

          {levelFiltered.length === 0 && !isSearching && (
            <div className="py-10 text-center text-muted-foreground">
              <BookOpen className="mx-auto mb-3 h-10 w-10 opacity-30" />
              <p>Chưa có bộ từ vựng nào ở trình độ này.</p>
            </div>
          )}

          {otherSets.length > 0 && (
            <section className="space-y-2.5">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-500" />
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Bộ do AI tạo & cộng đồng</h2>
              </div>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {otherSets.map((set, index) => <VocabSetCard key={set.id} set={set} index={index} compact />)}
                <Link href="/vocabulary/ai">
                  <Card className="h-full cursor-pointer border-2 border-dashed transition-all hover:border-primary/50 hover:bg-accent/30">
                    <CardContent className="flex min-h-[120px] flex-col items-center justify-center gap-2 p-4 text-muted-foreground">
                      <Plus className="h-6 w-6" />
                      <p className="text-sm font-medium">Tạo bộ từ mới</p>
                      <p className="text-center text-xs">Dùng AI tạo từ vựng theo chủ đề bạn muốn</p>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </section>
          )}

          {isSearching && levelFiltered.length === 0 && otherSets.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              <BookOpen className="mx-auto mb-3 h-10 w-10 opacity-30" />
              <p>Không tìm thấy &ldquo;{search}&rdquo;</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
