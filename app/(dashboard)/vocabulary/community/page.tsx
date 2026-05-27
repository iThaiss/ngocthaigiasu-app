'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Users, Heart, BookOpen, Target, Loader2, Search,
  Star, Sparkles, TrendingUp,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface VocabSet {
  id: string
  name: string
  description: string | null
  topic: string | null
  word_count: number
  question_count: number
  likes: number
  featured: boolean
  is_ai_generated: boolean
  progress: { total: number; mastered: number; due_today: number }
}

export default function CommunityPage() {
  const [sets, setSets] = useState<VocabSet[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'featured' | 'popular' | 'new'>('featured')

  const fetchSets = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/vocabulary?filter=community')
      const data = await res.json()
      setSets(data.sets ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSets()
  }, [fetchSets])

  const filtered = sets.filter((s) => {
    const q = search.toLowerCase()
    return !q || s.name.toLowerCase().includes(q) || (s.topic ?? '').toLowerCase().includes(q)
  })

  const sorted = [...filtered].sort((a, b) => {
    if (tab === 'featured') return (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || b.likes - a.likes
    if (tab === 'popular') return b.likes - a.likes
    return 0 // new = API order
  })

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
          <Users className="h-5 w-5 text-blue-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Cộng đồng từ vựng</h1>
          <p className="text-sm text-muted-foreground">Bộ từ vựng được tạo và chia sẻ bởi học sinh</p>
        </div>
      </motion.div>

      {/* Search + Tabs */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm bộ từ vựng…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex rounded-lg border p-0.5 bg-muted gap-0.5">
          {[
            { id: 'featured', label: '⭐ Featured', icon: Star },
            { id: 'popular', label: '🔥 Phổ biến', icon: TrendingUp },
            { id: 'new', label: '✨ Mới nhất', icon: Sparkles },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id as typeof tab)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                tab === id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && sorted.length === 0 && (
        <div className="text-center py-12 text-muted-foreground space-y-3">
          <Users className="h-10 w-10 mx-auto opacity-30" />
          <p>{search ? `Không tìm thấy kết quả cho "${search}"` : 'Chưa có bộ từ nào được chia sẻ'}</p>
          <Link href="/vocabulary/ai">
            <Button size="sm" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Tạo và chia sẻ bộ từ đầu tiên
            </Button>
          </Link>
        </div>
      )}

      {!loading && sorted.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sorted.map((s, i) => {
            const progressPct = s.word_count > 0
              ? Math.round((s.progress.mastered / s.word_count) * 100)
              : 0
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Link href={`/vocabulary/${s.id}`}>
                  <Card className="group cursor-pointer border hover:shadow-md hover:-translate-y-0.5 transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                          {s.name}
                        </h3>
                        <div className="flex shrink-0 gap-1">
                          {s.featured && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-0">
                              ⭐
                            </Badge>
                          )}
                          {s.is_ai_generated && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-violet-500/15 text-violet-600 dark:text-violet-400 border-0">
                              AI
                            </Badge>
                          )}
                        </div>
                      </div>

                      {s.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{s.description}</p>
                      )}

                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          {s.word_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          {s.question_count}
                        </span>
                        <span className="flex items-center gap-1 ml-auto">
                          <Heart className="h-3 w-3" />
                          {s.likes}
                        </span>
                      </div>

                      {s.word_count > 0 && progressPct > 0 && (
                        <div className="mt-2">
                          <Progress value={progressPct} className="h-1" />
                          <p className="text-[10px] text-muted-foreground mt-0.5">{progressPct}% đã học</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
