'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Sparkles, Clock, History, Badge as BadgeIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import Dropzone from '@/components/solve/Dropzone'
import { useAuth } from '@/lib/auth-context'
import { MOCK_STUDENT_PROGRESS, SolutionStep } from '@/lib/mock-data'
import { formatDate } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'

const MOCK_RESULT = {
  question: 'Tính đạo hàm của hàm số f(x) = x³ - 3x + 2',
  steps: [
    { step: 1, description: 'Áp dụng công thức đạo hàm cho từng hạng tử', latex: "(x^n)' = n \\cdot x^{n-1}" },
    { step: 2, description: 'Tính đạo hàm của x³:', latex: "(x^3)' = 3x^2" },
    { step: 3, description: 'Tính đạo hàm của -3x:', latex: "(-3x)' = -3" },
    { step: 4, description: 'Đạo hàm của hằng số bằng 0:', latex: "(2)' = 0" },
    { step: 5, description: 'Kết quả cuối cùng:', latex: "f'(x) = 3x^2 - 3" },
  ] as SolutionStep[],
  cached: false,
}

export default function SolvePage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [solving, setSolving] = useState(false)
  const [result, setResult] = useState<typeof MOCK_RESULT | null>(null)
  const [isCached, setIsCached] = useState(false)

  const history = MOCK_STUDENT_PROGRESS.filter((p) => p.userId === user?.id).slice(0, 5)

  const handleFileAccepted = useCallback((f: File, p: string) => {
    setFile(f)
    setPreview(p)
    setResult(null)
  }, [])

  const handleSolve = async () => {
    if (!file) {
      toast({ title: 'Lỗi', description: 'Vui lòng upload ảnh bài toán trước.', variant: 'destructive' })
      return
    }
    setSolving(true)
    await new Promise((r) => setTimeout(r, 2500))
    const cached = Math.random() > 0.6
    setIsCached(cached)
    setResult({ ...MOCK_RESULT, cached })
    setSolving(false)
    toast({ title: 'Giải xong!', description: cached ? 'Kết quả từ cache.' : 'AI đã phân tích và giải bài toán.', variant: 'success' as never })
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10">
            <Brain className="h-5 w-5 text-purple-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Giải toán AI</h1>
            <p className="text-muted-foreground text-sm">Upload ảnh bài toán — AI giải ngay từng bước</p>
          </div>
        </div>
      </motion.div>

      {/* Upload */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardContent className="pt-6 space-y-4">
            <Dropzone onFileAccepted={handleFileAccepted} disabled={solving} />
            <Button
              onClick={handleSolve}
              disabled={!file || solving}
              className="w-full gap-2 h-11"
            >
              {solving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  AI đang phân tích...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Giải bài
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border-primary/30">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Kết quả giải</CardTitle>
                  {isCached && (
                    <Badge variant="info" className="gap-1 text-xs">
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      Cached
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground font-medium">{result.question}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.steps.map((step, idx) => (
                  <motion.div
                    key={step.step}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex gap-3"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                      {step.step}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{step.description}</p>
                      {step.latex && (
                        <div className="math-block mt-1.5">
                          {step.latex}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-4 w-4" /> Lịch sử giải gần đây
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Chưa có bài giải nào</p>
            ) : (
              history.map((item, idx) => (
                <div key={item.id}>
                  {idx > 0 && <Separator className="mb-3" />}
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-500/10">
                      <Brain className="h-4 w-4 text-purple-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{item.question}</p>
                        {item.cached && <Badge variant="info" className="text-xs shrink-0">Cached</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {formatDate(item.solvedAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
