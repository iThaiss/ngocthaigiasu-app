'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, BookOpen, Layers, Target, Brain, Clock, CheckCircle2,
  Loader2, Share2, Heart, Bookmark, Volume2, ChevronLeft, ChevronRight,
  RotateCcw, Zap, List, Shuffle, Globe, Sparkles, Star,
  TrendingUp, Info, ChevronDown, ChevronUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

// ─── Types ───────────────────────────────────────────────────────────────────

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
  likes: number
}

interface Word {
  id: string
  word: string
  pronunciation: string | null
  part_of_speech: string | null
  definition_vi: string
  definition_en: string | null
  level: string | null
  synonyms: string[] | null
  antonyms: string[] | null
  example_sentence: string | null
}

interface Question {
  id: string
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_answer: string
  explanation: string | null
  question_type: string
  difficulty: string
}

interface ProgressRecord {
  word: string
  state: string
  due: string
  stability: number
  difficulty_fsrs: number
  elapsed_days: number
  scheduled_days: number
  reps: number
  lapses: number
  last_review: string | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatInterval(days: number): string {
  if (days < 1 / 24) return `${Math.round(days * 24 * 60)} phút`
  if (days < 1) return `${Math.round(days * 24)} giờ`
  if (days === 1) return '1 ngày'
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

const LEVEL_COLOR: Record<string, string> = {
  A1: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  A2: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300',
  B1: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  B2: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  C1: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  C2: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}

function LevelBadge({ level }: { level: string | null }) {
  if (!level) return null
  return (
    <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-md', LEVEL_COLOR[level] ?? 'bg-muted text-muted-foreground')}>
      {level}
    </span>
  )
}

// ─── Tab 1: Word List ─────────────────────────────────────────────────────────

function WordListTab({ words }: { words: Word[] }) {
  const [search, setSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState('all')
  const [expanded, setExpanded] = useState<string | null>(null)

  const filtered = words.filter((w) => {
    const q = search.toLowerCase()
    const matchSearch = !q || w.word.toLowerCase().includes(q) ||
      (w.definition_vi ?? '').toLowerCase().includes(q) ||
      (w.definition_en ?? '').toLowerCase().includes(q)
    const matchLevel = levelFilter === 'all' || w.level === levelFilter
    return matchSearch && matchLevel
  })

  const levels = Array.from(new Set(words.map((w) => w.level).filter(Boolean)))

  const playAudio = async (word: string) => {
    try {
      const res = await fetch(`/api/dictionary?word=${encodeURIComponent(word)}`)
      const data = await res.json()
      const url = data?.entry?.audio_url
      if (url) new Audio(url).play().catch(() => {})
    } catch {}
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm từ vựng…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {levels.length > 1 && (
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-24">
              <SelectValue placeholder="Cấp độ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              {['A1','A2','B1','B2','C1','C2'].filter(l => levels.includes(l)).map((l) => (
                <SelectItem key={l} value={l}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} từ</p>

      <div className="rounded-xl border divide-y overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground text-sm">Không tìm thấy từ nào</div>
        ) : filtered.map((w) => (
          <div key={w.id}>
            <button
              className="w-full text-left px-4 py-3 hover:bg-accent/30 transition-colors"
              onClick={() => setExpanded(expanded === w.id ? null : w.id)}
            >
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{w.word}</span>
                    {w.pronunciation && (
                      <span className="text-xs text-muted-foreground">{w.pronunciation}</span>
                    )}
                    {w.part_of_speech && (
                      <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-primary/30 text-primary">
                        {w.part_of_speech}
                      </Badge>
                    )}
                    <LevelBadge level={w.level} />
                  </div>
                  <p className="text-sm text-foreground/80 mt-0.5 truncate">{w.definition_vi}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); playAudio(w.word) }}
                    className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground"
                  >
                    <Volume2 className="h-4 w-4" />
                  </button>
                  {expanded === w.id
                    ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
              </div>
            </button>

            <AnimatePresence>
              {expanded === w.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-3 pt-1 bg-muted/20 space-y-2 text-sm">
                    {w.definition_en && (
                      <p className="text-muted-foreground italic">{w.definition_en}</p>
                    )}
                    {w.example_sentence && (
                      <div className="rounded-lg bg-background border px-3 py-2">
                        <p className="text-xs text-muted-foreground mb-0.5">Ví dụ</p>
                        <p className="italic text-foreground/80">&ldquo;{w.example_sentence}&rdquo;</p>
                      </div>
                    )}
                    <div className="flex gap-4 text-xs flex-wrap">
                      {(w.synonyms?.length ?? 0) > 0 && (
                        <span>
                          <span className="text-emerald-500 font-medium">≈ Đồng nghĩa: </span>
                          {w.synonyms!.join(', ')}
                        </span>
                      )}
                      {(w.antonyms?.length ?? 0) > 0 && (
                        <span>
                          <span className="text-red-400 font-medium">≠ Trái nghĩa: </span>
                          {w.antonyms!.join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Tab 2: Flashcard (Learn mode) ───────────────────────────────────────────

function FlashcardTab({ words }: { words: Word[] }) {
  const [deck, setDeck] = useState<Word[]>([])
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [knownIds, setKnownIds] = useState<Set<string>>(new Set())
  const [unknownIds, setUnknownIds] = useState<Set<string>>(new Set())
  const [finished, setFinished] = useState(false)
  const [shuffled, setShuffled] = useState(false)
  const shownAt = useRef(Date.now())

  useEffect(() => {
    const d = shuffled ? [...words].sort(() => Math.random() - 0.5) : [...words]
    setDeck(d)
    setIndex(0)
    setFlipped(false)
    setFinished(false)
    setKnownIds(new Set())
    setUnknownIds(new Set())
  }, [words, shuffled])

  useEffect(() => {
    shownAt.current = Date.now()
  }, [index])

  const current = deck[index]

  const go = (dir: 1 | -1) => {
    setFlipped(false)
    setTimeout(() => {
      const next = index + dir
      if (next >= deck.length) setFinished(true)
      else if (next >= 0) setIndex(next)
    }, 150)
  }

  const markKnown = () => { setKnownIds((s) => new Set([...s, current.word])); go(1) }
  const markUnknown = () => { setUnknownIds((s) => new Set([...s, current.word])); go(1) }

  const restart = () => {
    setIndex(0); setFlipped(false); setFinished(false)
    setKnownIds(new Set()); setUnknownIds(new Set())
  }

  if (deck.length === 0) return <div className="text-center py-12 text-muted-foreground">Bộ từ này chưa có từ nào</div>

  if (finished) return (
    <div className="text-center py-12 space-y-4 max-w-sm mx-auto">
      <div className="text-5xl">{knownIds.size >= unknownIds.size ? '🎉' : '📚'}</div>
      <h3 className="text-lg font-semibold">Hoàn thành lượt học!</h3>
      <div className="flex justify-center gap-6 text-sm">
        <span className="text-emerald-500 font-medium">✅ {knownIds.size} đã thuộc</span>
        <span className="text-red-400 font-medium">❌ {unknownIds.size} chưa thuộc</span>
      </div>
      <div className="flex gap-2 justify-center flex-wrap">
        <Button onClick={restart} variant="outline" size="sm" className="gap-2">
          <RotateCcw className="h-4 w-4" /> Học lại từ đầu
        </Button>
        {unknownIds.size > 0 && (
          <Button size="sm" onClick={() => {
            setDeck(deck.filter((w) => unknownIds.has(w.word)))
            restart()
          }} className="gap-2">
            <Target className="h-4 w-4" /> Ôn {unknownIds.size} từ chưa thuộc
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">Dùng tab <strong>Ôn luyện</strong> để ôn theo lịch thông minh (FSRS)</p>
    </div>
  )

  const progressPct = Math.round((index / deck.length) * 100)

  return (
    <div className="space-y-4 max-w-xl mx-auto">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span className="font-medium">{index + 1} / {deck.length}</span>
        <Button variant="ghost" size="sm" className="gap-1.5 h-7" onClick={() => setShuffled((s) => !s)}>
          <Shuffle className={cn('h-3.5 w-3.5', shuffled && 'text-primary')} />
          {shuffled ? 'Ngẫu nhiên ✓' : 'Ngẫu nhiên'}
        </Button>
      </div>

      <Progress value={progressPct} className="h-1" />

      {/* Card */}
      <div className="relative h-64 cursor-pointer select-none" onClick={() => setFlipped((f) => !f)} style={{ perspective: 1200 }}>
        <motion.div
          className="relative w-full h-full"
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.38, ease: [0.4, 0, 0.2, 1] }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Front */}
          <div className="absolute inset-0 rounded-2xl border-2 bg-card flex flex-col items-center justify-center p-6 shadow-sm" style={{ backfaceVisibility: 'hidden' }}>
            <p className="text-xs text-muted-foreground mb-4 uppercase tracking-wide">Tiếng Anh</p>
            <p className="text-4xl font-bold text-center tracking-tight">{current?.word}</p>
            {current?.pronunciation && (
              <p className="mt-2 text-muted-foreground text-sm">{current.pronunciation}</p>
            )}
            {current?.part_of_speech && (
              <Badge variant="outline" className="mt-3 text-xs border-primary/30 text-primary">{current.part_of_speech}</Badge>
            )}
            <p className="mt-5 text-xs text-muted-foreground animate-pulse">Nhấn để xem nghĩa →</p>
          </div>

          {/* Back */}
          <div className="absolute inset-0 rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 flex flex-col justify-center p-5 shadow-sm overflow-y-auto" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {current?.part_of_speech && (
                <Badge variant="outline" className="text-xs border-primary/30 text-primary">{current.part_of_speech}</Badge>
              )}
              <LevelBadge level={current?.level ?? null} />
            </div>
            <p className="text-2xl font-bold text-center mb-2">{current?.definition_vi}</p>
            {current?.definition_en && (
              <p className="text-xs text-muted-foreground text-center italic mb-2">{current.definition_en}</p>
            )}
            {current?.example_sentence && (
              <div className="mt-1 rounded-lg bg-background/60 px-3 py-2">
                <p className="text-xs text-muted-foreground mb-0.5">Ví dụ</p>
                <p className="text-sm italic text-foreground/80">&ldquo;{current.example_sentence}&rdquo;</p>
              </div>
            )}
            {((current?.synonyms?.length ?? 0) > 0 || (current?.antonyms?.length ?? 0) > 0) && (
              <div className="flex gap-3 mt-2 text-xs flex-wrap justify-center">
                {(current?.synonyms?.length ?? 0) > 0 && (
                  <span><span className="text-emerald-500 font-medium">≈</span> {current!.synonyms!.slice(0,3).join(', ')}</span>
                )}
                {(current?.antonyms?.length ?? 0) > 0 && (
                  <span><span className="text-red-400 font-medium">≠</span> {current!.antonyms!.slice(0,3).join(', ')}</span>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Buttons */}
      <AnimatePresence>
        {flipped && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="flex gap-3">
            <Button
              className="flex-1 gap-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-200 dark:border-red-900"
              variant="outline" onClick={markUnknown}
            >
              ❌ Chưa thuộc
            </Button>
            <Button
              className="flex-1 gap-2 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-200 dark:border-emerald-900"
              variant="outline" onClick={markKnown}
            >
              ✅ Đã thuộc
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => go(-1)} disabled={index === 0}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-xs text-muted-foreground">✅ {knownIds.size} · ❌ {unknownIds.size}</span>
        <Button variant="outline" size="sm" onClick={() => go(1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// ─── Tab 3: Quiz ─────────────────────────────────────────────────────────────

function QuizTab({ questions, onWrongWord }: { questions: Question[]; onWrongWord?: (word: string) => void }) {
  const [deck, setDeck] = useState<Question[]>([])
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [wrongWords, setWrongWords] = useState<string[]>([])

  useEffect(() => {
    setDeck([...questions].sort(() => Math.random() - 0.5).slice(0, Math.min(questions.length, 15)))
    setIndex(0); setSelected(null); setScore(0); setFinished(false); setWrongWords([])
  }, [questions])

  const current = deck[index]

  const handleSelect = (opt: string) => {
    if (selected) return
    setSelected(opt)
    if (opt === current?.correct_answer) {
      setScore((s) => s + 1)
    } else {
      // Extract word from question for potential FSRS feedback
      const word = current?.question_text?.match(/["']([^"']+)["']/)?.[1] ?? ''
      if (word) setWrongWords((ws) => [...ws, word])
    }
  }

  const next = () => {
    setSelected(null)
    if (index + 1 >= deck.length) setFinished(true)
    else setIndex((i) => i + 1)
  }

  const restart = () => {
    setDeck([...questions].sort(() => Math.random() - 0.5).slice(0, Math.min(questions.length, 15)))
    setIndex(0); setSelected(null); setScore(0); setFinished(false); setWrongWords([])
  }

  if (deck.length === 0) return (
    <div className="text-center py-12 space-y-3 text-muted-foreground">
      <Target className="h-10 w-10 mx-auto opacity-30" />
      <p>Bộ từ này chưa có câu hỏi luyện tập</p>
      <p className="text-xs">Tạo bộ từ bằng AI để có câu hỏi tự động</p>
    </div>
  )

  if (finished) {
    const pct = Math.round((score / deck.length) * 100)
    return (
      <div className="text-center py-10 space-y-4 max-w-sm mx-auto">
        <div className="text-5xl">{pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '📚'}</div>
        <h3 className="text-xl font-bold">{score}/{deck.length} câu đúng</h3>
        <div className="relative h-3 rounded-full overflow-hidden bg-muted">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            className={cn('h-full rounded-full', pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500')}
          />
        </div>
        <p className="text-sm text-muted-foreground">
          {pct >= 80 ? 'Xuất sắc! Bạn nắm rất vững.' : pct >= 50 ? 'Khá tốt! Tiếp tục ôn thêm nhé.' : 'Hãy xem lại Flashcard trước.'}
        </p>
        <Button onClick={restart} className="gap-2">
          <RotateCcw className="h-4 w-4" /> Làm lại
        </Button>
        {pct < 100 && (
          <p className="text-xs text-muted-foreground">💡 Dùng tab <strong>Ôn luyện</strong> để ôn những từ chưa nắm với lịch thông minh</p>
        )}
      </div>
    )
  }

  const opts = [
    { key: 'A', text: current?.option_a },
    { key: 'B', text: current?.option_b },
    { key: 'C', text: current?.option_c },
    { key: 'D', text: current?.option_d },
  ].filter((o) => o.text)

  const isCorrect = selected === current?.correct_answer
  const difficultyColor = current?.difficulty === 'advanced' ? 'text-red-500' : current?.difficulty === 'intermediate' ? 'text-yellow-500' : 'text-emerald-500'

  return (
    <div className="space-y-4 max-w-xl mx-auto">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Câu <strong>{index + 1}</strong>/{deck.length}</span>
        <span className="flex items-center gap-1">
          <Star className="h-3.5 w-3.5 text-yellow-500" />
          {score} điểm
        </span>
      </div>
      <Progress value={Math.round((index / deck.length) * 100)} className="h-1" />

      {/* Question */}
      <Card className="border-2">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-[10px] border-primary/20 text-primary capitalize">{current?.question_type?.replace(/_/g, ' ')}</Badge>
            <span className={cn('text-[10px] font-semibold uppercase', difficultyColor)}>{current?.difficulty}</span>
          </div>
          <p className="font-medium leading-relaxed text-[15px]">{current?.question_text}</p>
        </CardContent>
      </Card>

      {/* Options */}
      <div className="grid gap-2">
        {opts.map((o) => {
          const isOptCorrect = o.key === current?.correct_answer
          const isOptSelected = selected === o.key
          return (
            <motion.button
              key={o.key}
              whileTap={!selected ? { scale: 0.98 } : {}}
              onClick={() => handleSelect(o.key)}
              disabled={!!selected}
              className={cn(
                'w-full text-left rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all duration-200',
                !selected && 'hover:bg-accent hover:border-primary/40 cursor-pointer',
                selected && isOptCorrect && 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300',
                selected && isOptSelected && !isOptCorrect && 'bg-red-500/10 border-red-500 text-red-600 dark:text-red-400',
                selected && !isOptSelected && !isOptCorrect && 'opacity-40',
              )}
            >
              <span className="mr-2.5 inline-flex items-center justify-center w-5 h-5 rounded-full border-2 text-[11px] font-bold">
                {o.key}
              </span>
              {o.text}
            </motion.button>
          )
        })}
      </div>

      {/* Feedback */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
            {/* Result banner */}
            <div className={cn(
              'rounded-xl px-4 py-2.5 text-sm font-medium flex items-center gap-2',
              isCorrect
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                : 'bg-red-500/10 text-red-600 dark:text-red-400'
            )}>
              {isCorrect ? '✅ Chính xác!' : `❌ Sai rồi! Đáp án đúng là ${current?.correct_answer}`}
            </div>

            {/* Explanation */}
            {current?.explanation && (
              <div className="rounded-xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground flex gap-2">
                <Info className="h-4 w-4 shrink-0 mt-0.5 text-blue-500" />
                <span>{current.explanation}</span>
              </div>
            )}

            <Button onClick={next} className="w-full">
              {index + 1 >= deck.length ? '🏁 Xem kết quả' : 'Câu tiếp theo →'}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Tab 4: Spaced Repetition (FSRS) ─────────────────────────────────────────

const RATING_CONFIG = [
  {
    key: 'Again' as const,
    label: 'Quên rồi',
    emoji: '😵',
    color: 'bg-red-500/10 text-red-500 border-red-200 dark:border-red-800 hover:bg-red-500/20',
    activeColor: 'border-red-500',
  },
  {
    key: 'Hard' as const,
    label: 'Khó nhớ',
    emoji: '😓',
    color: 'bg-orange-500/10 text-orange-500 border-orange-200 dark:border-orange-800 hover:bg-orange-500/20',
    activeColor: 'border-orange-500',
  },
  {
    key: 'Good' as const,
    label: 'Nhớ được',
    emoji: '😊',
    color: 'bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-800 hover:bg-blue-500/20',
    activeColor: 'border-blue-500',
  },
  {
    key: 'Easy' as const,
    label: 'Dễ!',
    emoji: '🚀',
    color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-500/20',
    activeColor: 'border-emerald-500',
  },
]

function SpacedRepetitionTab({ words, setId, progress: initProgress }: {
  words: Word[]
  setId: string
  progress: ProgressRecord[]
}) {
  const [dueWords, setDueWords] = useState<Array<{ word: Word; record: ProgressRecord | null }>>([])
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [finished, setFinished] = useState(false)
  const [loading, setLoading] = useState(false)
  const [intervals, setIntervals] = useState<Record<string, string>>({})
  const [sessionStats, setSessionStats] = useState({ again: 0, hard: 0, good: 0, easy: 0 })
  const { toast } = useToast()

  useEffect(() => {
    const now = new Date().toISOString()
    const progressMap = new Map(initProgress.map((p) => [p.word, p]))
    const due = words
      .map((w) => ({ word: w, record: progressMap.get(w.word) ?? null }))
      .filter(({ record }) => !record || record.due <= now)
      .slice(0, 20)
    setDueWords(due)
  }, [words, initProgress])

  // Pre-compute intervals when card flips
  useEffect(() => {
    if (!flipped) { setIntervals({}); return }
    const current = dueWords[index]
    if (!current) return

    const compute = async () => {
      try {
        const { fsrs, createEmptyCard, Rating, State } = await import('ts-fsrs')
        const f = fsrs()

        const stateMap: Record<string, number> = {
          New: State.New, Learning: State.Learning, Review: State.Review, Relearning: State.Relearning,
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
        const newIntervals: Record<string, string> = {}
        for (const { key, label } of RATING_CONFIG) {
          const ratingVal = Rating[key]
          const result = f.next(card as Parameters<typeof f.next>[0], now, ratingVal)
          newIntervals[key] = formatInterval(result.card.scheduled_days)
        }
        setIntervals(newIntervals)
      } catch (e) {
        console.error('FSRS preview error:', e)
      }
    }
    compute()
  }, [flipped, index, dueWords])

  const current = dueWords[index]

  const handleRate = async (rating: 'Again' | 'Hard' | 'Good' | 'Easy') => {
    if (!current || loading) return
    setLoading(true)

    // Update session stats
    setSessionStats((s) => ({ ...s, [rating.toLowerCase()]: s[rating.toLowerCase() as keyof typeof s] + 1 }))

    try {
      const { fsrs, createEmptyCard, Rating, State } = await import('ts-fsrs')
      const f = fsrs()

      const stateMap: Record<string, number> = {
        New: State.New, Learning: State.Learning, Review: State.Review, Relearning: State.Relearning,
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

      const ratingVal = Rating[rating]
      const result = f.next(card as Parameters<typeof f.next>[0], new Date(), ratingVal)
      const newCard = result.card

      await fetch('/api/vocabulary/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          setId,
          word: current.word.word,
          fsrsCard: {
            due: newCard.due.toISOString(),
            stability: newCard.stability,
            difficulty: newCard.difficulty,
            elapsed_days: newCard.elapsed_days,
            scheduled_days: newCard.scheduled_days,
            reps: newCard.reps,
            lapses: newCard.lapses,
            state: (['New', 'Learning', 'Review', 'Relearning'])[newCard.state] ?? 'Learning',
            last_review: new Date().toISOString(),
          },
        }),
      })

      setFlipped(false)
      setIntervals({})
      setTimeout(() => {
        if (index + 1 >= dueWords.length) setFinished(true)
        else setIndex((i) => i + 1)
      }, 180)
    } catch {
      toast({ title: 'Lỗi lưu tiến độ', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  // ── Stats summary (when no due words or all due words done) ──

  const totalReviewed = sessionStats.again + sessionStats.hard + sessionStats.good + sessionStats.easy

  if (dueWords.length === 0) return (
    <div className="text-center py-12 space-y-4 max-w-sm mx-auto">
      <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-500" />
      <h3 className="font-semibold text-lg">Không có từ nào cần ôn hôm nay!</h3>
      <p className="text-sm text-muted-foreground">Hệ thống FSRS sẽ nhắc bạn ôn đúng lúc cần thiết.</p>
      <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm text-left space-y-1">
        <p className="font-medium text-xs uppercase tracking-wide text-muted-foreground mb-2">Thống kê tiến độ</p>
        {(() => {
          const total = initProgress.length
          const mastered = initProgress.filter(p => p.state === 'Review').length
          const learning = initProgress.filter(p => p.state === 'Learning').length
          const newCount = words.length - total
          return (
            <>
              <p className="flex justify-between"><span>🆕 Từ mới chưa học</span><span className="font-medium">{newCount}</span></p>
              <p className="flex justify-between"><span>📖 Đang học</span><span className="font-medium">{learning}</span></p>
              <p className="flex justify-between"><span>✅ Đã nắm vững</span><span className="font-medium text-emerald-600">{mastered}</span></p>
            </>
          )
        })()}
      </div>
    </div>
  )

  if (finished) return (
    <div className="text-center py-10 space-y-4 max-w-sm mx-auto">
      <Zap className="h-12 w-12 mx-auto text-yellow-500" />
      <h3 className="font-semibold text-lg">Xong buổi ôn luyện! 🎉</h3>
      <p className="text-sm text-muted-foreground">Đã ôn <strong>{dueWords.length}</strong> từ. Lịch ôn tiếp đã được lên kế hoạch tự động.</p>

      {totalReviewed > 0 && (
        <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm text-left space-y-1.5">
          <p className="font-medium text-xs uppercase tracking-wide text-muted-foreground mb-2">Buổi học này</p>
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            {[
              { label: '😵 Quên', val: sessionStats.again, color: 'text-red-500' },
              { label: '😓 Khó', val: sessionStats.hard, color: 'text-orange-500' },
              { label: '😊 Nhớ được', val: sessionStats.good, color: 'text-blue-500' },
              { label: '🚀 Dễ', val: sessionStats.easy, color: 'text-emerald-500' },
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

  const w = current.word
  const rec = current.record
  const isNewWord = !rec || rec.state === 'New'
  const progressPct = Math.round((index / dueWords.length) * 100)

  return (
    <div className="space-y-4 max-w-xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Cần ôn: <strong>{dueWords.length}</strong> từ</span>
        </span>
        <div className="flex items-center gap-2">
          {isNewWord && (
            <Badge variant="secondary" className="text-[10px] bg-violet-500/15 text-violet-600 dark:text-violet-400 border-0">
              ✨ Từ mới
            </Badge>
          )}
          {rec && !isNewWord && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Ôn lần {rec.reps + 1}
            </span>
          )}
          <span className="text-sm text-muted-foreground">{index + 1}/{dueWords.length}</span>
        </div>
      </div>

      <Progress value={progressPct} className="h-1.5" />

      {/* Card */}
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
              <p className="text-xs text-muted-foreground mb-4 uppercase tracking-widest">Tiếng Anh</p>
              <p className="text-4xl font-bold text-center tracking-tight">{w.word}</p>
              {w.pronunciation && <p className="mt-2 text-muted-foreground">{w.pronunciation}</p>}
              {w.part_of_speech && (
                <Badge variant="outline" className="mt-3 border-primary/30 text-primary text-xs">{w.part_of_speech}</Badge>
              )}
              <motion.p
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="mt-5 text-xs text-muted-foreground"
              >
                Nhấn để xem nghĩa
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
              {/* Word + badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-lg">{w.word}</span>
                {w.pronunciation && <span className="text-sm text-muted-foreground">{w.pronunciation}</span>}
                {w.part_of_speech && (
                  <Badge variant="outline" className="text-xs border-primary/30 text-primary">{w.part_of_speech}</Badge>
                )}
                <LevelBadge level={w.level} />
              </div>

              {/* Definition */}
              <div>
                <p className="text-xl font-bold">{w.definition_vi}</p>
                {w.definition_en && <p className="text-sm text-muted-foreground italic mt-0.5">{w.definition_en}</p>}
              </div>

              {/* Example */}
              {w.example_sentence && (
                <div className="rounded-xl bg-background/70 border px-3 py-2.5">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Câu ví dụ</p>
                  <p className="text-sm italic text-foreground/80">&ldquo;{w.example_sentence}&rdquo;</p>
                </div>
              )}

              {/* Synonyms / antonyms */}
              {((w.synonyms?.length ?? 0) > 0 || (w.antonyms?.length ?? 0) > 0) && (
                <div className="flex gap-4 text-xs flex-wrap">
                  {(w.synonyms?.length ?? 0) > 0 && (
                    <span><span className="text-emerald-500 font-semibold">≈</span> {w.synonyms!.slice(0,4).join(' · ')}</span>
                  )}
                  {(w.antonyms?.length ?? 0) > 0 && (
                    <span><span className="text-red-400 font-semibold">≠</span> {w.antonyms!.slice(0,3).join(' · ')}</span>
                  )}
                </div>
              )}

              {/* FSRS stats */}
              {rec && !isNewWord && (
                <div className="flex gap-3 text-[10px] text-muted-foreground pt-1 border-t flex-wrap">
                  <span>⚡ Ổn định: {rec.stability.toFixed(1)} ngày</span>
                  <span>🔁 Đã ôn: {rec.reps} lần</span>
                  {rec.lapses > 0 && <span className="text-red-400">💔 Quên: {rec.lapses} lần</span>}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Rating buttons */}
      <AnimatePresence>
        {flipped && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-2"
          >
            <p className="text-xs text-center text-muted-foreground">Bạn nhớ từ này đến mức nào?</p>
            <div className="grid grid-cols-4 gap-2">
              {RATING_CONFIG.map(({ key, label, emoji, color }) => (
                <button
                  key={key}
                  disabled={loading}
                  onClick={() => handleRate(key)}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-xl border-2 py-2.5 px-1 transition-all font-medium text-xs',
                    'hover:-translate-y-0.5 hover:shadow-sm active:scale-95 disabled:opacity-50',
                    color
                  )}
                >
                  {loading
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <span className="text-lg leading-none">{emoji}</span>
                  }
                  <span className="leading-tight">{label}</span>
                  {intervals[key] && (
                    <span className="text-[10px] opacity-70">{intervals[key]}</span>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function VocabSetPage() {
  const { setId } = useParams<{ setId: string }>()
  const router = useRouter()
  const { toast } = useToast()

  const [data, setData] = useState<{
    set: VocabSet
    words: Word[]
    questions: Question[]
    progress: ProgressRecord[]
    user_has_liked: boolean
    user_has_saved: boolean
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/vocabulary/${setId}`)
      if (!res.ok) throw new Error('Not found')
      const d = await res.json()
      setData(d)
      setLiked(d.user_has_liked)
      setSaved(d.user_has_saved)
    } catch {
      toast({ title: 'Không thể tải bộ từ vựng', variant: 'destructive' })
      router.push('/vocabulary')
    } finally {
      setLoading(false)
    }
  }, [setId, router, toast])

  useEffect(() => { fetchData() }, [fetchData])

  const togglePublic = async () => {
    if (!data) return
    const res = await fetch(`/api/vocabulary/${setId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_public: !data.set.is_public }),
    })
    if (res.ok) {
      setData((d) => d ? { ...d, set: { ...d.set, is_public: !d.set.is_public } } : null)
      toast({ title: data.set.is_public ? 'Đã đặt thành riêng tư' : 'Đã công khai' })
    }
  }

  const toggleLike = async () => {
    const method = liked ? 'DELETE' : 'POST'
    await fetch(`/api/vocabulary/${setId}/like`, { method })
    setLiked(!liked)
    setData((d) => d ? { ...d, set: { ...d.set, likes: d.set.likes + (liked ? -1 : 1) } } : null)
  }

  const toggleSave = async () => {
    const method = saved ? 'DELETE' : 'POST'
    await fetch(`/api/vocabulary/${setId}/save`, { method })
    setSaved(!saved)
    toast({ title: saved ? 'Đã bỏ lưu' : 'Đã lưu vào danh sách của bạn' })
  }

  if (loading) return (
    <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  )

  if (!data) return null

  const { set, words, questions, progress } = data

  const masteredCount = progress.filter((p) => p.state === 'Review' || p.state === 'Relearning').length
  const progressPct = set.word_count > 0 ? Math.round((masteredCount / set.word_count) * 100) : 0
  const dueCount = progress.filter((p) => p.due && p.due <= new Date().toISOString()).length

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Button variant="ghost" size="sm" className="gap-1.5 mb-3 -ml-1" onClick={() => router.push('/vocabulary')}>
          <ArrowLeft className="h-4 w-4" /> Từ vựng
        </Button>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-2xl font-bold">{set.name}</h1>
              {set.is_ai_generated && (
                <Badge variant="secondary" className="bg-violet-500/15 text-violet-600 dark:text-violet-400 border-0 gap-1">
                  <Sparkles className="h-3 w-3" /> AI
                </Badge>
              )}
              {set.is_public && (
                <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-0 gap-1">
                  <Globe className="h-3 w-3" /> Công khai
                </Badge>
              )}
            </div>
            {set.description && <p className="text-sm text-muted-foreground">{set.description}</p>}

            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" />{set.word_count} từ</span>
              <span className="flex items-center gap-1"><Target className="h-3.5 w-3.5" />{set.question_count} câu hỏi</span>
              {dueCount > 0 && (
                <span className="flex items-center gap-1 text-orange-500 font-medium">
                  <Clock className="h-3.5 w-3.5" />{dueCount} cần ôn hôm nay
                </span>
              )}
              <span className="flex items-center gap-1 cursor-pointer hover:text-red-400 transition-colors" onClick={toggleLike}>
                <Heart className={cn('h-3.5 w-3.5', liked && 'fill-red-400 text-red-400')} />
                {set.likes}
              </span>
            </div>

            {set.word_count > 0 && (
              <div className="mt-3 max-w-xs space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Đã nắm vững: {masteredCount}/{set.word_count}</span>
                  <span className="font-medium">{progressPct}%</span>
                </div>
                <Progress value={progressPct} className="h-2" />
              </div>
            )}
          </div>

          <div className="flex gap-2 shrink-0 flex-wrap">
            <Button variant="outline" size="sm" onClick={toggleSave} className="gap-1.5">
              <Bookmark className={cn('h-4 w-4', saved && 'fill-current')} />
              {saved ? 'Đã lưu' : 'Lưu lại'}
            </Button>
            {!set.is_system && (
              <Button variant="outline" size="sm" onClick={togglePublic} className="gap-1.5">
                <Share2 className="h-4 w-4" />
                {set.is_public ? 'Đặt riêng tư' : 'Công khai'}
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue={dueCount > 0 ? 'spaced' : 'wordlist'}>
        <TabsList className="w-full grid grid-cols-4 h-10">
          <TabsTrigger value="wordlist" className="gap-1.5 text-xs sm:text-sm data-[state=active]:font-semibold">
            <List className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">Từ vựng</span>
          </TabsTrigger>
          <TabsTrigger value="flashcard" className="gap-1.5 text-xs sm:text-sm data-[state=active]:font-semibold">
            <Layers className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">Flashcard</span>
          </TabsTrigger>
          <TabsTrigger value="quiz" className="gap-1.5 text-xs sm:text-sm data-[state=active]:font-semibold">
            <Target className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">Quiz</span>
          </TabsTrigger>
          <TabsTrigger value="spaced" className="relative gap-1.5 text-xs sm:text-sm data-[state=active]:font-semibold">
            <Brain className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">Ôn luyện</span>
            {dueCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[9px] font-bold text-white">
                {dueCount > 9 ? '9+' : dueCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <div className="mt-4">
          <TabsContent value="wordlist">
            <WordListTab words={words} />
          </TabsContent>
          <TabsContent value="flashcard">
            <FlashcardTab words={words} />
          </TabsContent>
          <TabsContent value="quiz">
            <QuizTab questions={questions} />
          </TabsContent>
          <TabsContent value="spaced">
            <SpacedRepetitionTab words={words} setId={set.id} progress={progress} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
