'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Languages, Sparkles, Users, BookOpen, Target, Brain,
  Clock, CheckCircle2, Loader2, Search, Plus, ChevronDown,
  Flame,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
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

// ── Group / Folder config ──────────────────────────────────────
interface GroupConfig {
  key: string
  label: string
  icon: string
  accent: string          // tailwind text color
  bg: string              // folder header bg
  border: string          // border
  topics: string[]        // English topic names belonging to this group
}

const GROUPS: GroupConfig[] = [
  {
    key: 'Con người & Xã hội',
    label: 'Con người & Xã hội',
    icon: '🧑‍🤝‍🧑',
    accent: 'text-violet-500',
    bg: 'bg-violet-500/8 hover:bg-violet-500/12',
    border: 'border-violet-200 dark:border-violet-800',
    topics: [
      'Family & Relationships', 'Education & Learning', 'Work & Career',
      'Health & Medicine', 'Emotions & Personality', 'Gender & Equality',
      'Community & Social Issues', 'Culture & Traditions',
      'Law & Justice', 'Mental Health & Well-being', 'Migration & Refugees',
    ],
  },
  {
    key: 'Thế giới tự nhiên',
    label: 'Thế giới tự nhiên',
    icon: '🌿',
    accent: 'text-emerald-500',
    bg: 'bg-emerald-500/8 hover:bg-emerald-500/12',
    border: 'border-emerald-200 dark:border-emerald-800',
    topics: [
      'Environment & Climate Change', 'Nature & Wildlife', 'Natural Disasters',
      'Food & Nutrition', 'Energy & Natural Resources', 'Agriculture & Farming',
    ],
  },
  {
    key: 'Khoa học & Công nghệ',
    label: 'Khoa học & Công nghệ',
    icon: '🔬',
    accent: 'text-blue-500',
    bg: 'bg-blue-500/8 hover:bg-blue-500/12',
    border: 'border-blue-200 dark:border-blue-800',
    topics: [
      'Science & Research', 'Technology & Innovation', 'Digital & Internet',
      'Space & Astronomy', 'Medicine & Biotechnology',
      'Artificial Intelligence & Robots', 'Engineering & Infrastructure',
    ],
  },
  {
    key: 'Kinh tế & Chính trị',
    label: 'Kinh tế & Chính trị',
    icon: '💼',
    accent: 'text-amber-500',
    bg: 'bg-amber-500/8 hover:bg-amber-500/12',
    border: 'border-amber-200 dark:border-amber-800',
    topics: [
      'Business & Economics', 'Politics & Government', 'Globalization & Trade',
      'Media & Journalism', 'Finance & Banking', 'International Relations',
    ],
  },
  {
    key: 'Cuộc sống hàng ngày',
    label: 'Cuộc sống hàng ngày',
    icon: '🏡',
    accent: 'text-rose-500',
    bg: 'bg-rose-500/8 hover:bg-rose-500/12',
    border: 'border-rose-200 dark:border-rose-800',
    topics: [
      'Travel & Transport', 'Housing & Urban Life', 'Sports & Recreation',
      'Arts & Entertainment', 'Shopping & Consumerism',
      'Fashion & Lifestyle', 'Music & Performing Arts',
    ],
  },
  {
    key: 'Tư duy & Ngôn ngữ',
    label: 'Tư duy & Ngôn ngữ',
    icon: '🧠',
    accent: 'text-cyan-500',
    bg: 'bg-cyan-500/8 hover:bg-cyan-500/12',
    border: 'border-cyan-200 dark:border-cyan-800',
    topics: [
      'Communication & Language', 'Philosophy & Ethics', 'History & Civilization',
      'Psychology & Behavior', 'Academic & Formal Language',
      'Literature & Writing', 'Religion & Beliefs',
    ],
  },
  {
    key: 'Kỹ năng từ vựng',
    label: 'Kỹ năng từ vựng thi',
    icon: '📝',
    accent: 'text-indigo-500',
    bg: 'bg-indigo-500/8 hover:bg-indigo-500/12',
    border: 'border-indigo-200 dark:border-indigo-800',
    topics: [
      'Collocations in Context', 'Phrasal Verbs',
      'Synonyms & Antonyms in Context', 'Word Formation & Word Form',
      'Discourse Markers & Linking Words', 'Prepositions & Fixed Phrases',
    ],
  },
]

// Map English topic → group key for fast lookup
const TOPIC_TO_GROUP: Record<string, string> = {}
for (const g of GROUPS) {
  for (const t of g.topics) {
    TOPIC_TO_GROUP[t] = g.key
  }
}

// ── Set card ──────────────────────────────────────────────────
function VocabSetCard({ set, index }: { set: VocabSet; index: number }) {
  const progressPct = set.word_count > 0
    ? Math.round((set.progress.mastered / set.word_count) * 100)
    : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <Link href={`/vocabulary/${set.id}`}>
        <Card className="group cursor-pointer border bg-card hover:shadow-md hover:-translate-y-0.5 transition-all">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                {set.name}
              </h3>
              <div className="flex shrink-0 gap-1">
                {set.featured && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-0">
                    ⭐
                  </Badge>
                )}
              </div>
            </div>

            {set.description && (
              <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{set.description}</p>
            )}

            {/* Stats row */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                {set.word_count} từ
              </span>
              <span className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                {set.question_count} câu
              </span>
              {set.progress.due_today > 0 && (
                <span className="flex items-center gap-1 text-orange-500 font-medium">
                  <Flame className="h-3 w-3" />
                  {set.progress.due_today} cần ôn
                </span>
              )}
            </div>

            {/* Progress bar */}
            {set.progress.total > 0 && (
              <div className="mt-2.5">
                <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
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

// ── Folder accordion ──────────────────────────────────────────
function FolderSection({
  group,
  sets,
  defaultOpen = true,
}: {
  group: GroupConfig
  sets: VocabSet[]
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  const totalWords = sets.reduce((a, s) => a + s.word_count, 0)
  const totalMastered = sets.reduce((a, s) => a + s.progress.mastered, 0)
  const totalDue = sets.reduce((a, s) => a + s.progress.due_today, 0)
  const groupPct = totalWords > 0 ? Math.round((totalMastered / totalWords) * 100) : 0

  return (
    <div className={cn('rounded-xl border overflow-hidden', group.border)}>
      {/* Header / toggle */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
          group.bg
        )}
      >
        <span className="text-xl">{group.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn('font-semibold text-sm', group.accent)}>{group.label}</span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 border-0">
              {sets.length} bộ
            </Badge>
            <span className="text-xs text-muted-foreground">{totalWords.toLocaleString()} từ</span>
            {totalDue > 0 && (
              <span className="flex items-center gap-0.5 text-xs text-orange-500 font-medium">
                <Flame className="h-3 w-3" />
                {totalDue} cần ôn
              </span>
            )}
          </div>
          {totalMastered > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <Progress value={groupPct} className="h-1 flex-1 max-w-[120px]" />
              <span className="text-[10px] text-muted-foreground">{groupPct}%</span>
            </div>
          )}
        </div>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
      </button>

      {/* Content */}
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
              {sets.map((s, i) => (
                <VocabSetCard key={s.id} set={s} index={i} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────
export default function VocabularyPage() {
  const [sets, setSets] = useState<VocabSet[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchSets = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/vocabulary?filter=all')
      const data = await res.json()
      setSets(data.sets ?? [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSets()
  }, [fetchSets])

  const filteredSets = sets.filter((s) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      s.name.toLowerCase().includes(q) ||
      (s.topic ?? '').toLowerCase().includes(q)
    )
  })

  const systemSets = filteredSets.filter((s) => s.is_system)
  const otherSets = filteredSets.filter((s) => !s.is_system)

  // Build groups with their sets
  const groupsWithSets = GROUPS.map((g) => ({
    group: g,
    sets: systemSets.filter((s) => {
      const grpKey = s.topic ? TOPIC_TO_GROUP[s.topic] : undefined
      return grpKey === g.key
    }),
  })).filter((g) => g.sets.length > 0)

  // Ungrouped system sets (topic not in any group)
  const groupedTopics = new Set(GROUPS.flatMap((g) => g.topics))
  const ungroupedSystem = systemSets.filter(
    (s) => !s.topic || !groupedTopics.has(s.topic)
  )

  // Stats
  const totalWords = sets.reduce((a, s) => a + s.word_count, 0)
  const totalMastered = sets.reduce((a, s) => a + s.progress.mastered, 0)
  const totalDue = sets.reduce((a, s) => a + s.progress.due_today, 0)

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-4"
      >
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

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Tìm bộ từ vựng hoặc chủ đề…"
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
        <div className="space-y-3">
          {/* System sets — grouped into folders */}
          {systemSets.length > 0 && (
            <section className="space-y-2.5">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-violet-500" />
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Bộ từ vựng luyện thi THPT — {systemSets.length} chủ đề
                </h2>
              </div>

              {groupsWithSets.map(({ group, sets: gSets }, idx) => (
                <FolderSection
                  key={group.key}
                  group={group}
                  sets={gSets}
                  defaultOpen={idx === 0}
                />
              ))}

              {ungroupedSystem.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {ungroupedSystem.map((s, i) => (
                    <VocabSetCard key={s.id} set={s} index={i} />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* User AI / community sets */}
          {(otherSets.length > 0 || systemSets.length === 0) && (
            <section>
              {otherSets.length > 0 && (
                <div className="flex items-center gap-2 mb-2.5">
                  <Sparkles className="h-4 w-4 text-emerald-500" />
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Bộ từ do AI tạo & cộng đồng
                  </h2>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {otherSets.map((s, i) => (
                  <VocabSetCard key={s.id} set={s} index={i} />
                ))}
                {/* Create CTA */}
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
          {filteredSets.length === 0 && search && (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>Không tìm thấy bộ từ vựng nào cho &ldquo;{search}&rdquo;</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
