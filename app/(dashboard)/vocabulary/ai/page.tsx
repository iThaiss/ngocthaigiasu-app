'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, Wand2, Loader2, BookOpen, Target, ArrowRight,
  Lightbulb, ChevronDown, ChevronUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

const EXAMPLE_PROMPTS = [
  { label: '🌱 Môi trường B2', prompt: 'Từ vựng chủ đề Environment và Climate Change cấp độ B2, phù hợp đề thi THPT' },
  { label: '💻 Công nghệ B1', prompt: 'Từ vựng Technology và Social Media cấp độ B1-B2 cho học sinh THPT' },
  { label: '🏥 Sức khỏe B2', prompt: 'Từ vựng Health and Medicine cấp độ B2, bao gồm collocation thường gặp trong bài đọc' },
  { label: '🎓 Giáo dục B1', prompt: 'Từ vựng Education and Learning cấp độ B1, kèm từ đồng nghĩa và trái nghĩa' },
  { label: '💰 Kinh tế C1', prompt: 'Từ vựng Economy và Business cấp độ B2-C1 cho kỳ thi đại học' },
  { label: '🌍 Xã hội B2', prompt: 'Từ vựng Society and Culture cấp độ B2, tập trung vào collocations phổ biến' },
]

export default function AIVocabPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [prompt, setPrompt] = useState('')
  const [wordCount, setWordCount] = useState(15)
  const [loading, setLoading] = useState(false)
  const [showExamples, setShowExamples] = useState(true)

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({ title: 'Vui lòng nhập yêu cầu', variant: 'destructive' })
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/vocabulary/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), wordCount }),
      })
      const data = await res.json()

      if (!res.ok) {
        toast({ title: data.error ?? 'Lỗi tạo từ vựng', variant: 'destructive' })
        return
      }

      toast({
        title: '✅ Tạo thành công!',
        description: `${data.word_count} từ vựng · ${data.question_count} câu hỏi`,
      })

      router.push(`/vocabulary/${data.set_id}`)
    } catch {
      toast({ title: 'Lỗi kết nối', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
          <Sparkles className="h-5 w-5 text-violet-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">AI Tạo từ vựng</h1>
          <p className="text-sm text-muted-foreground">Mô tả chủ đề bạn muốn học, AI sẽ tạo bộ từ vựng + bài tập ngay lập tức</p>
        </div>
      </motion.div>

      {/* Main form */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardContent className="p-4 space-y-4">
            {/* Prompt input */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Yêu cầu của bạn
              </label>
              <Textarea
                placeholder="Ví dụ: Tạo từ vựng chủ đề Environment cấp độ B2 với collocation thường gặp trong đề thi THPT..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                className="resize-none"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Gợi ý: nêu chủ đề + cấp độ (A2/B1/B2/C1) + dạng bài muốn (collocation, synonym, fill-blank...)
              </p>
            </div>

            {/* Word count */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Số lượng từ</label>
                <span className="text-sm font-bold text-primary">{wordCount} từ</span>
              </div>
              <input
                type="range"
                min={5}
                max={30}
                step={5}
                value={wordCount}
                onChange={(e) => setWordCount(Number(e.target.value))}
                disabled={loading}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>5</span>
                <span>15</span>
                <span>30</span>
              </div>
            </div>

            {/* Generate button */}
            <Button
              className="w-full gap-2 h-11"
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang tạo từ vựng…
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4" />
                  Tạo bộ từ vựng
                  <ArrowRight className="h-4 w-4 ml-auto" />
                </>
              )}
            </Button>

            {loading && (
              <p className="text-center text-xs text-muted-foreground animate-pulse">
                Claude AI đang tạo từ vựng và bài tập cho bạn... (~5-10 giây)
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Example prompts */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <button
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground mb-3"
          onClick={() => setShowExamples((s) => !s)}
        >
          <Lightbulb className="h-4 w-4" />
          Gợi ý chủ đề
          {showExamples ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        <AnimatePresence>
          {showExamples && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-2 sm:grid-cols-3 gap-2"
            >
              {EXAMPLE_PROMPTS.map((ex) => (
                <button
                  key={ex.label}
                  onClick={() => setPrompt(ex.prompt)}
                  disabled={loading}
                  className={cn(
                    'text-left rounded-xl border px-3 py-2.5 text-xs hover:bg-accent hover:border-primary/30 transition-all',
                    prompt === ex.prompt && 'border-primary bg-primary/5'
                  )}
                >
                  <span className="font-medium">{ex.label}</span>
                  <p className="text-muted-foreground mt-0.5 line-clamp-2">{ex.prompt}</p>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* How it works */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Cách hoạt động</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Wand2, title: '1. Nhập yêu cầu', desc: 'Mô tả chủ đề và cấp độ bạn muốn học' },
            { icon: Sparkles, title: '2. AI tạo ngay', desc: 'Claude AI tạo từ vựng + phiên âm + bài tập' },
            { icon: BookOpen, title: '3. Học ngay', desc: 'Học Flashcard, Quiz, và Spaced Repetition' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="text-center p-3 rounded-xl border bg-muted/20">
              <Icon className="h-5 w-5 mx-auto mb-2 text-primary" />
              <p className="text-xs font-medium">{title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Tips */}
      <div className="rounded-xl bg-blue-500/5 border border-blue-200 dark:border-blue-900 p-4">
        <div className="flex items-start gap-2">
          <Badge variant="secondary" className="mt-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-0 shrink-0">
            Tips
          </Badge>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Nếu hài lòng với bộ từ đã tạo, nhấn <strong>Công khai</strong> để chia sẻ với học sinh khác</p>
            <p>• Bộ từ hay được cộng đồng like nhiều sẽ được admin <strong>Featured</strong></p>
            <p>• Mỗi tháng Free được tạo <strong>5 bộ</strong>, VIP Anh được tạo <strong>30 bộ</strong></p>
          </div>
        </div>
      </div>
    </div>
  )
}
