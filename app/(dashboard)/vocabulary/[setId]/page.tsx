'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, BookOpen, Layers, Target, Brain, Clock, CheckCircle2,
  Loader2, Share2, Heart, Bookmark, Volume2, ChevronLeft, ChevronRight,
  RotateCcw, ThumbsUp, ThumbsDown, Zap, List, Shuffle, Globe,
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

// ---- Types ----
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
  reps: number
  lapses: number
  last_review: string | null
}

// =====================================================
// Tab 1: Word List
// =====================================================
function WordListTab({ words }: { words: Word[] }) {
  const [search, setSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState('all')

  const filtered = words.filter((w) => {
    const q = search.toLowerCase()
    const matchSearch = !q || w.word.toLowerCase().includes(q) ||
      (w.definition_vi ?? '').toLowerCase().includes(q)
    const matchLevel = levelFilter === 'all' || w.level === levelFilter
    return matchSearch && matchLevel
  })

  const levels = Array.from(new Set(words.map((w) => w.level).filter(Boolean)))

  const playAudio = async (word: string) => {
    const res = await fetch(`/api/dictionary?word=${encodeURIComponent(word)}`)
    const data = await res.json()
    const url = data?.entry?.audio_url
    if (url) {
      const audio = new Audio(url)
      audio.play().catch(() => {})
    }
  }

  return (
    <div className="space-y-3">
      {/* Filters */}
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
              {levels.map((l) => (
                <SelectItem key={l!} value={l!}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Word table */}
      <div className="rounded-xl border divide-y overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground text-sm">Không tìm thấy từ nào</div>
        ) : (
          filtered.map((w) => (
            <div key={w.id} className="px-4 py-3 hover:bg-accent/30 transition-colors">
              <div className="flex items-start gap-3">
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
                    {w.level && (
                      <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                        {w.level}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-foreground/80 mt-0.5">{w.definition_vi}</p>
                  {w.example_sentence && (
                    <p className="text-xs text-muted-foreground italic mt-0.5">&ldquo;{w.example_sentence}&rdquo;</p>
                  )}
                  {((w.synonyms?.length ?? 0) > 0 || (w.antonyms?.length ?? 0) > 0) && (
                    <div className="flex gap-3 mt-1 text-xs">
                      {(w.synonyms?.length ?? 0) > 0 && (
                        <span>
                          <span className="text-emerald-500 font-medium">≈</span>{' '}
                          {w.synonyms!.join(', ')}
                        </span>
                      )}
                      {(w.antonyms?.length ?? 0) > 0 && (
                        <span>
                          <span className="text-red-400 font-medium">≠</span>{' '}
                          {w.antonyms!.join(', ')}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => playAudio(w.word)}
                  className="shrink-0 p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground"
                >
                  <Volume2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// =====================================================
// Tab 2: Flashcard
// =====================================================
function FlashcardTab({ words, setId, progress }: {
  words: Word[]
  setId: string
  progress: ProgressRecord[]
}) {
  const [deck, setDeck] = useState<Word[]>([])
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [knownIds, setKnownIds] = useState<Set<string>>(new Set())
  const [unknownIds, setUnknownIds] = useState<Set<string>>(new Set())
  const [finished, setFinished] = useState(false)
  const [shuffled, setShuffled] = useState(false)

  useEffect(() => {
    setDeck(shuffled ? [...words].sort(() => Math.random() - 0.5) : [...words])
    setIndex(0)
    setFlipped(false)
    setFinished(false)
  }, [words, shuffled])

  const current = deck[index]

  const go = (dir: 1 | -1) => {
    setFlipped(false)
    setTimeout(() => {
      const next = index + dir
      if (next >= deck.length) {
        setFinished(true)
      } else if (next < 0) {
        // do nothing
      } else {
        setIndex(next)
      }
    }, 150)
  }

  const markKnown = () => {
    setKnownIds((s) => new Set([...s, current.word]))
    go(1)
  }
  const markUnknown = () => {
    setUnknownIds((s) => new Set([...s, current.word]))
    go(1)
  }

  const restart = () => {
    setIndex(0)
    setFlipped(false)
    setFinished(false)
    setKnownIds(new Set())
    setUnknownIds(new Set())
  }

  if (deck.length === 0) return (
    <div className="text-center py-12 text-muted-foreground">Bộ từ này chưa có từ nào</div>
  )

  if (finished) return (
    <div className="text-center py-12 space-y-4">
      <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-500" />
      <h3 className="text-lg font-semibold">Hoàn thành lượt học!</h3>
      <p className="text-muted-foreground text-sm">
        Đã thuộc: <span className="text-emerald-500 font-medium">{knownIds.size}</span> từ{' '}
        · Chưa thuộc: <span className="text-red-400 font-medium">{unknownIds.size}</span> từ
      </p>
      <div className="flex gap-2 justify-center">
        <Button onClick={restart} variant="outline" className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Học lại
        </Button>
        {unknownIds.size > 0 && (
          <Button onClick={() => {
            setDeck(deck.filter((w) => unknownIds.has(w.word)))
            restart()
          }} className="gap-2">
            <Target className="h-4 w-4" />
            Ôn {unknownIds.size} từ chưa thuộc
          </Button>
        )}
      </div>
    </div>
  )

  const progressPct = Math.round(((index) / deck.length) * 100)

  return (
    <div className="space-y-4 max-w-xl mx-auto">
      {/* Top controls */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{index + 1} / {deck.length}</span>
        <Button
          variant="ghost" size="sm"
          className="gap-1.5 h-7"
          onClick={() => setShuffled((s) => !s)}
        >
          <Shuffle className={cn('h-3.5 w-3.5', shuffled && 'text-primary')} />
          {shuffled ? 'Ngẫu nhiên' : 'Theo thứ tự'}
        </Button>
      </div>

      <Progress value={progressPct} className="h-1.5" />

      {/* Flashcard */}
      <div
        className="relative h-56 cursor-pointer select-none"
        onClick={() => setFlipped((f) => !f)}
        style={{ perspective: 1000 }}
      >
        <motion.div
          className="relative w-full h-full"
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 rounded-2xl border bg-card flex flex-col items-center justify-center p-6 backface-hidden shadow-sm"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <p className="text-xs text-muted-foreground mb-3">Nghĩa tiếng Anh là gì?</p>
            <p className="text-3xl font-bold text-center">{current?.word}</p>
            {current?.pronunciation && (
              <p className="mt-2 text-muted-foreground">{current.pronunciation}</p>
            )}
            <p className="mt-4 text-xs text-muted-foreground">Nhấn để lật thẻ</p>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 rounded-2xl border bg-primary/5 flex flex-col items-center justify-center p-6 backface-hidden shadow-sm"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <div className="flex items-center gap-2 mb-2">
              {current?.part_of_speech && (
                <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                  {current.part_of_speech}
                </Badge>
              )}
              {current?.level && (
                <Badge variant="secondary" className="text-xs">{current.level}</Badge>
              )}
            </div>
            <p className="text-2xl font-bold text-center">{current?.definition_vi}</p>
            {current?.example_sentence && (
              <p className="mt-3 text-sm text-muted-foreground italic text-center line-clamp-2">
                &ldquo;{current.example_sentence}&rdquo;
              </p>
            )}
            {((current?.synonyms?.length ?? 0) > 0) && (
              <p className="mt-2 text-xs text-emerald-500">≈ {current!.synonyms!.slice(0,3).join(', ')}</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Action buttons */}
      <AnimatePresence>
        {flipped && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="flex gap-3"
          >
            <Button
              className="flex-1 gap-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-200 dark:border-red-900"
              variant="outline"
              onClick={markUnknown}
            >
              <ThumbsDown className="h-4 w-4" />
              Chưa thuộc
            </Button>
            <Button
              className="flex-1 gap-2 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-200 dark:border-emerald-900"
              variant="outline"
              onClick={markKnown}
            >
              <ThumbsUp className="h-4 w-4" />
              Đã thuộc
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => go(-1)} disabled={index === 0}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <p className="text-xs text-muted-foreground">
          ✅ {knownIds.size} · ❌ {unknownIds.size}
        </p>
        <Button variant="outline" size="sm" onClick={() => go(1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// =====================================================
// Tab 3: Quiz
// =====================================================
function QuizTab({ questions }: { questions: Question[] }) {
  const [deck, setDeck] = useState<Question[]>([])
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    setDeck([...questions].sort(() => Math.random() - 0.5).slice(0, Math.min(questions.length, 15)))
    setIndex(0)
    setSelected(null)
    setScore(0)
    setFinished(false)
  }, [questions])

  const current = deck[index]

  const handleSelect = (opt: string) => {
    if (selected) return
    setSelected(opt)
    if (opt === current?.correct_answer) setScore((s) => s + 1)
  }

  const next = () => {
    setSelected(null)
    if (index + 1 >= deck.length) {
      setFinished(true)
    } else {
      setIndex((i) => i + 1)
    }
  }

  const restart = () => {
    setDeck([...questions].sort(() => Math.random() - 0.5).slice(0, Math.min(questions.length, 15)))
    setIndex(0)
    setSelected(null)
    setScore(0)
    setFinished(false)
  }

  if (deck.length === 0) return (
    <div className="text-center py-12 text-muted-foreground">Bộ từ này chưa có câu hỏi luyện tập</div>
  )

  if (finished) {
    const pct = Math.round((score / deck.length) * 100)
    return (
      <div className="text-center py-12 space-y-4 max-w-sm mx-auto">
        <div className="text-5xl">{pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '📚'}</div>
        <h3 className="text-xl font-bold">
          {score}/{deck.length} câu đúng ({pct}%)
        </h3>
        <p className="text-sm text-muted-foreground">
          {pct >= 80 ? 'Xuất sắc! Bạn nắm rất vững bộ từ này.' :
           pct >= 50 ? 'Khá tốt! Tiếp tục ôn luyện thêm nhé.' :
           'Hãy ôn lại Flashcard trước rồi thử Quiz lại.'}
        </p>
        <Button onClick={restart} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Làm lại
        </Button>
      </div>
    )
  }

  const opts = [
    { key: 'A', text: current?.option_a },
    { key: 'B', text: current?.option_b },
    { key: 'C', text: current?.option_c },
    { key: 'D', text: current?.option_d },
  ].filter((o) => o.text)

  return (
    <div className="space-y-4 max-w-xl mx-auto">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Câu {index + 1}/{deck.length}</span>
        <span>✅ {score} đúng</span>
      </div>
      <Progress value={Math.round((index / deck.length) * 100)} className="h-1.5" />

      {/* Question */}
      <Card className="border">
        <CardContent className="p-4">
          <div className="flex items-start gap-2 mb-1">
            <Badge variant="outline" className="text-[10px] shrink-0 border-primary/20 text-primary">
              {current?.question_type}
            </Badge>
            <Badge variant="secondary" className="text-[10px] shrink-0">
              {current?.difficulty}
            </Badge>
          </div>
          <p className="font-medium leading-relaxed mt-2">{current?.question_text}</p>
        </CardContent>
      </Card>

      {/* Options */}
      <div className="grid gap-2">
        {opts.map((o) => {
          const isCorrect = o.key === current?.correct_answer
          const isSelected = selected === o.key
          return (
            <button
              key={o.key}
              onClick={() => handleSelect(o.key)}
              disabled={!!selected}
              className={cn(
                'w-full text-left rounded-xl border px-4 py-3 text-sm font-medium transition-all',
                !selected && 'hover:bg-accent hover:border-primary/30',
                selected && isCorrect && 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300',
                selected && isSelected && !isCorrect && 'bg-red-500/10 border-red-500 text-red-600',
                selected && !isSelected && !isCorrect && 'opacity-50',
              )}
            >
              <span className="mr-2 inline-block w-5 h-5 rounded-full border text-center text-xs leading-5 font-bold">
                {o.key}
              </span>
              {o.text}
            </button>
          )
        })}
      </div>

      {/* Explanation + Next */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            {current?.explanation && (
              <div className="rounded-xl bg-muted/50 p-3 text-sm text-muted-foreground">
                💡 {current.explanation}
              </div>
            )}
            <Button onClick={next} className="w-full mt-2">
              {index + 1 >= deck.length ? 'Xem kết quả' : 'Câu tiếp theo →'}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// =====================================================
// Tab 4: Spaced Repetition (FSRS)
// =====================================================
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
  const { toast } = useToast()

  useEffect(() => {
    const now = new Date().toISOString()
    const progressMap = new Map(initProgress.map((p) => [p.word, p]))

    // Due words: either new (no progress) or due date passed
    const due = words
      .map((w) => ({
        word: w,
        record: progressMap.get(w.word) ?? null,
      }))
      .filter(({ record }) => !record || record.due <= now)
      .slice(0, 20) // max 20 per session

    setDueWords(due)
  }, [words, initProgress])

  const current = dueWords[index]

  const handleRate = async (rating: 'Again' | 'Hard' | 'Good' | 'Easy') => {
    if (!current || loading) return
    setLoading(true)

    try {
      // Import ts-fsrs dynamically to avoid SSR issues
      const { fsrs, createEmptyCard, Rating, State } = await import('ts-fsrs')
      const f = fsrs()

      // Rating.Again = 1, Hard = 2, Good = 3, Easy = 4 — all are valid Grade values
      const ratingMap: Record<string, number> = {
        Again: Rating.Again,
        Hard: Rating.Hard,
        Good: Rating.Good,
        Easy: Rating.Easy,
      }

      // Build card from existing progress or new empty card
      const card = current.record
        ? {
            due: new Date(current.record.due),
            stability: current.record.stability,
            difficulty: 0,
            elapsed_days: 0,
            scheduled_days: 0,
            reps: current.record.reps,
            lapses: current.record.lapses,
            state: current.record.state === 'New' ? State.New
              : current.record.state === 'Learning' ? State.Learning
              : current.record.state === 'Review' ? State.Review : State.Relearning,
            last_review: current.record.last_review ? new Date(current.record.last_review) : null,
          }
        : createEmptyCard()

      const fsrsRating = ratingMap[rating] as typeof Rating.Again | typeof Rating.Hard | typeof Rating.Good | typeof Rating.Easy
      const result = f.next(card as Parameters<typeof f.next>[0], new Date(), fsrsRating)
      const newCard = result.card

      // Save to DB
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

      // Move to next
      setFlipped(false)
      setTimeout(() => {
        if (index + 1 >= dueWords.length) {
          setFinished(true)
        } else {
          setIndex((i) => i + 1)
        }
      }, 150)
    } catch {
      toast({ title: 'Lỗi lưu tiến độ', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  if (dueWords.length === 0) return (
    <div className="text-center py-12 space-y-3">
      <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-500" />
      <h3 className="font-semibold">Không có từ nào cần ôn hôm nay!</h3>
      <p className="text-sm text-muted-foreground">Hệ thống sẽ nhắc bạn khi đến hạn ôn.</p>
    </div>
  )

  if (finished) return (
    <div className="text-center py-12 space-y-3">
      <Zap className="h-12 w-12 mx-auto text-yellow-500" />
      <h3 className="font-semibold">Xong buổi ôn luyện!</h3>
      <p className="text-sm text-muted-foreground">Đã ôn {dueWords.length} từ. Hệ thống sẽ lên lịch ôn lại tự động.</p>
    </div>
  )

  return (
    <div className="space-y-4 max-w-xl mx-auto">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Clock className="h-4 w-4" />
          Cần ôn: {dueWords.length} từ
        </span>
        <span>{index + 1}/{dueWords.length}</span>
      </div>
      <Progress value={Math.round((index / dueWords.length) * 100)} className="h-1.5" />

      {/* Card */}
      <div
        className="relative h-52 cursor-pointer select-none"
        onClick={() => !flipped && setFlipped(true)}
        style={{ perspective: 1000 }}
      >
        <motion.div
          className="relative w-full h-full"
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 rounded-2xl border bg-card flex flex-col items-center justify-center p-6 shadow-sm"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <p className="text-xs text-muted-foreground mb-2">
              {current?.record ? `Ôn lần ${current.record.reps + 1}` : 'Từ mới'}
            </p>
            <p className="text-3xl font-bold">{current?.word.word}</p>
            {current?.word.pronunciation && (
              <p className="mt-1 text-muted-foreground">{current.word.pronunciation}</p>
            )}
            <p className="mt-4 text-xs text-muted-foreground">Nhấn để xem nghĩa</p>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 rounded-2xl border bg-primary/5 flex flex-col items-center justify-center p-6 shadow-sm"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <p className="text-2xl font-bold text-center">{current?.word.definition_vi}</p>
            {current?.word.example_sentence && (
              <p className="mt-2 text-sm text-muted-foreground italic text-center line-clamp-2">
                &ldquo;{current.word.example_sentence}&rdquo;
              </p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Rating buttons */}
      <AnimatePresence>
        {flipped && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-4 gap-2"
          >
            {[
              { label: 'Quên rồi', rating: 'Again' as const, color: 'bg-red-500/10 text-red-500 border-red-200 dark:border-red-900 hover:bg-red-500/20' },
              { label: 'Khó', rating: 'Hard' as const, color: 'bg-orange-500/10 text-orange-500 border-orange-200 dark:border-orange-900 hover:bg-orange-500/20' },
              { label: 'Nhớ được', rating: 'Good' as const, color: 'bg-blue-500/10 text-blue-500 border-blue-200 dark:border-blue-900 hover:bg-blue-500/20' },
              { label: 'Dễ!', rating: 'Easy' as const, color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-900 hover:bg-emerald-500/20' },
            ].map(({ label, rating, color }) => (
              <Button
                key={rating}
                variant="outline"
                size="sm"
                disabled={loading}
                className={cn('text-xs font-medium', color)}
                onClick={() => handleRate(rating)}
              >
                {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : label}
              </Button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// =====================================================
// Main Page
// =====================================================
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

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const togglePublic = async () => {
    if (!data) return
    const res = await fetch(`/api/vocabulary/${setId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_public: !data.set.is_public }),
    })
    if (res.ok) {
      setData((d) => d ? { ...d, set: { ...d.set, is_public: !d.set.is_public } } : null)
      toast({ title: data.set.is_public ? 'Đã đặt thành riêng tư' : 'Đã công khai cho cộng đồng' })
    }
  }

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  )

  if (!data) return null

  const { set, words, questions, progress } = data

  const progressPct = set.word_count > 0
    ? Math.round((progress.filter((p) => p.state === 'Review' || p.state === 'Relearning').length / set.word_count) * 100)
    : 0

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Button variant="ghost" size="sm" className="gap-1.5 mb-3 -ml-1" onClick={() => router.push('/vocabulary')}>
          <ArrowLeft className="h-4 w-4" />
          Từ vựng
        </Button>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-2xl font-bold">{set.name}</h1>
              {set.is_ai_generated && (
                <Badge variant="secondary" className="bg-violet-500/15 text-violet-600 dark:text-violet-400 border-0">
                  ✨ AI
                </Badge>
              )}
              {set.is_public && (
                <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-0">
                  <Globe className="h-3 w-3 mr-1" />
                  Công khai
                </Badge>
              )}
            </div>
            {set.description && (
              <p className="text-sm text-muted-foreground">{set.description}</p>
            )}

            {/* Stats */}
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5" />
                {set.word_count} từ
              </span>
              <span className="flex items-center gap-1">
                <Target className="h-3.5 w-3.5" />
                {set.question_count} câu hỏi
              </span>
              <span className="flex items-center gap-1">
                <Heart className="h-3.5 w-3.5" />
                {set.likes}
              </span>
            </div>

            {/* Progress */}
            {set.word_count > 0 && (
              <div className="mt-3 max-w-xs">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Đã học: {progress.filter((p) => p.state === 'Review' || p.state === 'Relearning').length}/{set.word_count}</span>
                  <span>{progressPct}%</span>
                </div>
                <Progress value={progressPct} className="h-1.5" />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 shrink-0">
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
      <Tabs defaultValue="wordlist">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="wordlist" className="gap-1.5 text-xs sm:text-sm">
            <List className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Từ vựng</span>
          </TabsTrigger>
          <TabsTrigger value="flashcard" className="gap-1.5 text-xs sm:text-sm">
            <Layers className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Flashcard</span>
          </TabsTrigger>
          <TabsTrigger value="quiz" className="gap-1.5 text-xs sm:text-sm">
            <Target className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Quiz</span>
          </TabsTrigger>
          <TabsTrigger value="spaced" className="gap-1.5 text-xs sm:text-sm">
            <Brain className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Ôn luyện</span>
          </TabsTrigger>
        </TabsList>

        <div className="mt-4">
          <TabsContent value="wordlist">
            <WordListTab words={words} />
          </TabsContent>
          <TabsContent value="flashcard">
            <FlashcardTab words={words} setId={set.id} progress={progress} />
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
