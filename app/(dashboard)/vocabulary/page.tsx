'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Languages, Sparkles, Users, BookOpen, Target, Brain,
  Clock, CheckCircle2, Search, Plus, ChevronDown,
  Flame, Heart, AlertCircle, RotateCw,
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
  progress: { total: number; mastered: number; due_today: number }
}

// ── Level tab config ───────────────────────────────────────────
type LevelKey = 'all' | 'B1' | 'B2' | 'C1'

const LEVEL_TABS: { key: LevelKey; label: string; sublabel: string; color: string; bg: string }[] = [
  { key: 'all', label: 'Tất cả',       sublabel: '',           color: 'text-foreground',    bg: 'bg-muted' },
  { key: 'B1',  label: 'B1',           sublabel: 'Nền tảng',   color: 'text-green-600',     bg: 'bg-green-500/10' },
  { key: 'B2',  label: 'B2',           sublabel: 'Nâng cao',   color: 'text-yellow-600',    bg: 'bg-yellow-500/10' },
  { key: 'C1',  label: 'C1–C2',        sublabel: 'Chuyên sâu', color: 'text-orange-600',    bg: 'bg-orange-500/10' },
]

/** Extract primary level from description, e.g. "...— B2-C1 —..." or a single "B1". */
function getPrimaryLevel(description: string | null): LevelKey {
  if (!description) return 'B2'
  // Prefer a range like "B1-B2"; otherwise fall back to the first standalone CEFR token.
  const range = description.match(/([ABC][12])-([ABC][12])/)
  const start = range ? range[1] : description.match(/\b([ABC][12])\b/)?.[1]
  if (!start) return 'B2'
  if (start === 'A1' || start === 'A2' || start === 'B1') return 'B1'
  if (start === 'B2') return 'B2'
  return 'C1' // C1 / C2
}

// ── Topic → Group config ───────────────────────────────────────
interface GroupConfig {
  key: string; label: string; icon: string
  accent: string; bg: string; border: string
  topics: string[]
}

const GROUPS: GroupConfig[] = [
  { key: 'Con người & Xã hội', label: 'People & Society', icon: '🧑‍🤝‍🧑',
    accent: 'text-violet-500', bg: 'bg-violet-500/8 hover:bg-violet-500/12', border: 'border-violet-200 dark:border-violet-800',
    topics: ['Family & Relationships','Education & Learning','Work & Career','Health & Medicine',
             'Emotions & Personality','Gender & Equality','Community & Social Issues','Culture & Traditions',
             'Law & Justice','Mental Health & Well-being','Migration & Refugees'] },
  { key: 'Thế giới tự nhiên', label: 'Nature & World', icon: '🌿',
    accent: 'text-emerald-500', bg: 'bg-emerald-500/8 hover:bg-emerald-500/12', border: 'border-emerald-200 dark:border-emerald-800',
    topics: ['Environment & Climate Change','Nature & Wildlife','Natural Disasters',
             'Food & Nutrition','Energy & Natural Resources','Agriculture & Farming'] },
  { key: 'Khoa học & Công nghệ', label: 'Science & Technology', icon: '🔬',
    accent: 'text-blue-500', bg: 'bg-blue-500/8 hover:bg-blue-500/12', border: 'border-blue-200 dark:border-blue-800',
    topics: ['Science & Research','Technology & Innovation','Digital & Internet',
             'Space & Astronomy','Medicine & Biotechnology','Artificial Intelligence & Robots','Engineering & Infrastructure'] },
  { key: 'Kinh tế & Chính trị', label: 'Economy & Politics', icon: '💼',
    accent: 'text-amber-500', bg: 'bg-amber-500/8 hover:bg-amber-500/12', border: 'border-amber-200 dark:border-amber-800',
    topics: ['Business & Economics','Politics & Government','Globalization & Trade',
             'Media & Journalism','Finance & Banking','International Relations'] },
  { key: 'Cuộc sống hàng ngày', label: 'Daily Life', icon: '🏡',
    accent: 'text-rose-500', bg: 'bg-rose-500/8 hover:bg-rose-500/12', border: 'border-rose-200 dark:border-rose-800',
    topics: ['Travel & Transport','Housing & Urban Life','Sports & Recreation',
             'Arts & Entertainment','Shopping & Consumerism','Fashion & Lifestyle','Music & Performing Arts'] },
  { key: 'Tư duy & Ngôn ngữ', label: 'Thought & Language', icon: '🧠',
    accent: 'text-cyan-500', bg: 'bg-cyan-500/8 hover:bg-cyan-500/12', border: 'border-cyan-200 dark:border-cyan-800',
    topics: ['Communication & Language','Philosophy & Ethics','History & Civilization',
             'Psychology & Behavior','Academic & Formal Language','Literature & Writing','Religion & Beliefs'] },
  { key: 'Kỹ năng từ vựng', label: 'Exam Vocabulary Skills', icon: '📝',
    accent: 'text-indigo-500', bg: 'bg-indigo-500/8 hover:bg-indigo-500/12', border: 'border-indigo-200 dark:border-indigo-800',
    topics: ['Collocations in Context','Phrasal Verbs','Synonyms & Antonyms in Context',
             'Word Formation & Word Form','Discourse Markers & Linking Words','Prepositions & Fixed Phrases'] },
]

const TOPIC_TO_GROUP: Record<string, string> = {}
for (const g of GROUPS) for (const t of g.topics) TOPIC_TO_GROUP[t] = g.key

const LEVEL_COLOR: Record<LevelKey, string> = {
  all: '',
  B1:  'bg-green-500/15 text-green-700 dark:text-green-400',
  B2:  'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400',
  C1:  'bg-orange-500/15 text-orange-700 dark:text-orange-400',
}

// ── Set card ───────────────────────────────────────────────────
function VocabSetCard({ set, index }: { set: VocabSet; index: number }) {
  const level = getPrimaryLevel(set.description)
  const lc = LEVEL_COLOR[level]
  const progressPct = set.word_count > 0
    ? Math.round((set.progress.mastered / set.word_count) * 100) : 0

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}>
      <Link href={`/vocabulary/${set.id}`}>
        <Card className="group cursor-pointer border bg-card hover:shadow-md hover:-translate-y-0.5 transition-all h-full">
          <CardContent className="p-4 flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors flex-1">
                {set.is_system && set.topic ? set.topic : set.name}
              </h3>
              {set.featured && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-0 shrink-0">⭐</Badge>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap mt-auto">
              <Badge variant="secondary" className={cn('text-[10px] px-1.5 py-0 h-4 border-0', lc)}>
                {level === 'C1' ? 'C1-C2' : level}
              </Badge>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <BookOpen className="h-3 w-3" />{set.word_count} từ
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Target className="h-3 w-3" />{set.question_count} câu
              </span>
              {set.progress.due_today > 0 && (
                <span className="flex items-center gap-1 text-orange-500 font-medium text-xs">
                  <Flame className="h-3 w-3" />{set.progress.due_today} cần ôn
                </span>
              )}
              {!set.is_system && set.likes > 0 && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Heart className="h-3 w-3" />{set.likes}
                </span>
              )}
            </div>

            {set.progress.total > 0 && (
              <div>
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

// ── Folder accordion ───────────────────────────────────────────
function FolderSection({ group, sets, defaultOpen = false, forceOpen = false }: { group: GroupConfig; sets: VocabSet[]; defaultOpen?: boolean; forceOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  // While searching the parent forces every folder open so matches aren't hidden.
  const isOpen = forceOpen || open
  const totalWords = sets.reduce((a, s) => a + s.word_count, 0)
  const totalMastered = sets.reduce((a, s) => a + s.progress.mastered, 0)
  const totalDue = sets.reduce((a, s) => a + s.progress.due_today, 0)
  const groupPct = totalWords > 0 ? Math.round((totalMastered / totalWords) * 100) : 0

  return (
    <div className={cn('rounded-xl border overflow-hidden', group.border)}>
      <button onClick={() => setOpen(v => !v)} aria-expanded={isOpen}
        className={cn('w-full flex items-center gap-3 px-4 py-3 text-left transition-colors', group.bg)}>
        <span className="text-xl" aria-hidden>{group.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn('font-semibold text-sm', group.accent)}>{group.key}</span>
            <span className="text-[10px] text-muted-foreground">{group.label}</span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 border-0">{sets.length} bộ</Badge>
            <span className="text-xs text-muted-foreground">{totalWords.toLocaleString()} từ</span>
            {totalDue > 0 && (
              <span className="flex items-center gap-0.5 text-xs text-orange-500 font-medium">
                <Flame className="h-3 w-3" />{totalDue} cần ôn
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
        <ChevronDown className={cn('h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200', isOpen && 'rotate-180')} />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div key="content"
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden">
            <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {sets.map((s, i) => <VocabSetCard key={s.id} set={s} index={i} />)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────
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
    }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchSets() }, [fetchSets])

  const isSearching = search.trim().length > 0

  // Filter by search — matches name, topic, description and the Vietnamese group label.
  const searchFiltered = sets.filter((s) => {
    if (!isSearching) return true
    const q = search.toLowerCase().trim()
    const groupLabel = s.topic ? (TOPIC_TO_GROUP[s.topic] ?? '') : ''
    return (
      s.name.toLowerCase().includes(q) ||
      (s.topic ?? '').toLowerCase().includes(q) ||
      (s.description ?? '').toLowerCase().includes(q) ||
      groupLabel.toLowerCase().includes(q)
    )
  })

  const systemSets = searchFiltered.filter(s => s.is_system)
  const otherSets  = searchFiltered.filter(s => !s.is_system)

  // Filter system sets by level tab — but while searching we show every level so
  // matches in other levels aren't silently dropped.
  const levelFiltered = (levelTab === 'all' || isSearching)
    ? systemSets
    : systemSets.filter(s => getPrimaryLevel(s.description) === levelTab)

  // Build folder groups
  const groupedTopics = new Set(GROUPS.flatMap(g => g.topics))
  const groupsWithSets = GROUPS.map(g => ({
    group: g,
    sets: levelFiltered.filter(s => s.topic && TOPIC_TO_GROUP[s.topic] === g.key),
  })).filter(g => g.sets.length > 0)

  const ungroupedSystem = levelFiltered.filter(s => !s.topic || !groupedTopics.has(s.topic))

  // Stats reflect the sets currently in view (after search + level filter) so the
  // numbers stay consistent with the list below.
  const visibleSets   = [...levelFiltered, ...otherSets]
  const totalWords    = visibleSets.reduce((a, s) => a + s.word_count, 0)
  const totalMastered = visibleSets.reduce((a, s) => a + s.progress.mastered, 0)
  const totalDue      = visibleSets.reduce((a, s) => a + s.progress.due_today, 0)

  // Count per level for tab badges
  const levelCount = (lk: LevelKey) =>
    lk === 'all' ? systemSets.length : systemSets.filter(s => getPrimaryLevel(s.description) === lk).length

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
            <Languages className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Từ vựng Tiếng Anh</h1>
            <p className="text-sm text-muted-foreground">Học theo trình độ & chủ đề, luyện tập với AI</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/vocabulary/ai">
            <Button size="sm" className="gap-1.5"><Sparkles className="h-4 w-4" />AI Tạo từ vựng</Button>
          </Link>
          <Link href="/vocabulary/community">
            <Button size="sm" variant="outline" className="gap-1.5"><Users className="h-4 w-4" />Cộng đồng</Button>
          </Link>
        </div>
      </motion.div>

      {/* Stats bar */}
      {!loading && !error && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-3 gap-3">
          {[
            { icon: BookOpen,     label: 'Tổng từ vựng',    value: totalWords.toLocaleString(), color: 'text-blue-500' },
            { icon: CheckCircle2, label: 'Đã học',           value: totalMastered.toLocaleString(), color: 'text-emerald-500' },
            { icon: Clock,        label: 'Cần ôn hôm nay',  value: totalDue.toString(), color: totalDue > 0 ? 'text-orange-500' : 'text-muted-foreground' },
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

      {/* Level tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {LEVEL_TABS.map((tab) => {
          const active = levelTab === tab.key
          const count = levelCount(tab.key)
          return (
            <button
              key={tab.key}
              onClick={() => setLevelTab(tab.key)}
              aria-pressed={active}
              className={cn(
                'flex flex-col items-center justify-center rounded-xl border px-3 py-2.5 transition-all text-center',
                active
                  ? cn('border-2 shadow-sm', tab.key === 'all' ? 'border-foreground/30 bg-foreground/5' : tab.bg, 'border-current')
                  : 'border-border hover:bg-accent'
              )}
            >
              {tab.key !== 'all' && (
                <span className={cn('text-lg font-black leading-none', active ? tab.color : 'text-muted-foreground')}>
                  {tab.label}
                </span>
              )}
              {tab.key === 'all' && (
                <span className={cn('text-xs font-semibold', active ? 'text-foreground' : 'text-muted-foreground')}>
                  Tất cả
                </span>
              )}
              {tab.sublabel && (
                <span className={cn('text-[10px] mt-0.5', active ? tab.color : 'text-muted-foreground')}>
                  {tab.sublabel}
                </span>
              )}
              <span className={cn('text-[10px] mt-1 font-medium', active ? 'text-foreground' : 'text-muted-foreground/60')}>
                {count} bộ
              </span>
            </button>
          )
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Tìm theo tên, chủ đề…" aria-label="Tìm bộ từ vựng" value={search}
          onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {loading && (
        <div className="space-y-3" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-xl border bg-card/50 px-4 py-3 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="h-6 w-6 rounded bg-muted" />
                <div className="h-4 w-40 rounded bg-muted" />
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
        <div className="space-y-3">
          {/* System sets grouped by topic folders */}
          {levelFiltered.length > 0 && (
            <section className="space-y-2.5">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-violet-500" />
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  {levelTab === 'all' ? `${levelFiltered.length} bộ từ vựng` : `${levelFiltered.length} bộ · ${levelTab === 'C1' ? 'C1–C2' : levelTab}`}
                </h2>
              </div>

              {groupsWithSets.map(({ group, sets: gSets }, idx) => (
                <FolderSection key={group.key} group={group} sets={gSets} defaultOpen={idx === 0} forceOpen={isSearching} />
              ))}

              {ungroupedSystem.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {ungroupedSystem.map((s, i) => <VocabSetCard key={s.id} set={s} index={i} />)}
                </div>
              )}
            </section>
          )}

          {levelFiltered.length === 0 && !isSearching && (
            <div className="text-center py-10 text-muted-foreground">
              <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>Chưa có bộ từ vựng nào ở trình độ này.</p>
            </div>
          )}

          {/* AI / Community sets */}
          {otherSets.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-2.5">
                <Sparkles className="h-4 w-4 text-emerald-500" />
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Bộ từ do AI tạo & cộng đồng
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {otherSets.map((s, i) => <VocabSetCard key={s.id} set={s} index={i} />)}
                <Link href="/vocabulary/ai">
                  <Card className="h-full border-dashed border-2 cursor-pointer hover:border-primary/50 hover:bg-accent/30 transition-all">
                    <CardContent className="p-4 flex flex-col items-center justify-center gap-2 min-h-[120px] text-muted-foreground">
                      <Plus className="h-6 w-6" />
                      <p className="text-sm font-medium">Tạo bộ từ mới</p>
                      <p className="text-xs text-center">Dùng AI tạo từ vựng theo chủ đề bạn muốn</p>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </section>
          )}

          {isSearching && levelFiltered.length === 0 && otherSets.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>Không tìm thấy &ldquo;{search}&rdquo;</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
