'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Calculator, Languages, Send, Loader2, Sparkles } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'

export default function SubjectSelectPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [voteSubject, setVoteSubject] = useState('')
  const [isVoting, setIsVoting] = useState(false)

  const handleSelect = (subject: 'math' | 'english') => {
    localStorage.setItem('ngocthai_subject', subject)
    router.push(`/dashboard/${subject}`)
  }

  const handleVoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!voteSubject.trim()) return

    setIsVoting(true)
    try {
      const res = await fetch('/api/subject-vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectName: voteSubject.trim() }),
      })

      if (res.ok) {
        toast({
          title: 'Cảm ơn ý kiến của bạn!',
          description: `Chúng tôi đã ghi nhận lượt vote cho môn: ${voteSubject.trim()}`,
        })
        setVoteSubject('')
      } else {
        const error = await res.json()
        throw new Error(error.error || 'Có lỗi xảy ra')
      }
    } catch (err) {
      toast({
        title: 'Lỗi gửi vote',
        description: err instanceof Error ? err.message : 'Không thể gửi bình chọn',
        variant: 'destructive',
      })
    } finally {
      setIsVoting(false)
    }
  }

  return (
    <div className="flex min-h-[90vh] flex-col items-center justify-center px-4 py-8">
      {/* Title section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-12 text-center"
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-black text-2xl shadow-lg shadow-primary/20">
          NT
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Hôm nay bạn muốn học gì?
        </h1>
        <p className="mt-3 text-muted-foreground">
          Chọn không gian học tập riêng biệt để tập trung tối đa
        </p>
      </motion.div>

      {/* Subject cards grid */}
      <div className="grid w-full max-w-4xl gap-6 sm:grid-cols-2">
        {/* Math Card */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          whileHover={{ scale: 1.03, y: -4 }}
          className="cursor-pointer"
          onClick={() => handleSelect('math')}
        >
          <Card className="relative h-full overflow-hidden border-2 border-transparent bg-gradient-to-br from-primary/10 to-primary/5 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300">
            <div className="absolute top-0 right-0 -mr-6 -mt-6 h-24 w-24 rounded-full bg-primary/10 blur-xl" />
            <CardHeader className="pb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
                <Calculator className="h-6 w-6" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <CardTitle className="text-xl font-bold text-primary">
                Toán học
              </CardTitle>
              <CardDescription className="text-sm leading-relaxed text-muted-foreground">
                Giải bài tập AI tự động và ôn tập theo lộ trình cá nhân hóa chuẩn cấu trúc THPT Quốc gia.
              </CardDescription>
              <div className="pt-4 flex flex-wrap gap-1.5">
                {/* 'Thi thử' tạm ẩn — sẽ phát triển sau */}
                {['AI solver', 'Luyện tập'].map((t) => (
                  <Badge key={t} variant="secondary" className="bg-primary/10 text-primary border-0">
                    {t}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* English Card */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          whileHover={{ scale: 1.03, y: -4 }}
          className="cursor-pointer"
          onClick={() => handleSelect('english')}
        >
          <Card className="relative h-full overflow-hidden border-2 border-transparent bg-gradient-to-br from-rose-500/10 to-pink-600/5 hover:border-rose-500/40 hover:shadow-2xl hover:shadow-rose-500/10 transition-all duration-300">
            <div className="absolute top-0 right-0 -mr-6 -mt-6 h-24 w-24 rounded-full bg-rose-500/10 blur-xl" />
            <CardHeader className="pb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-pink-700 text-white shadow-md shadow-rose-500/20">
                <Languages className="h-6 w-6" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <CardTitle className="text-xl font-bold text-rose-600 dark:text-rose-400">
                Tiếng Anh
              </CardTitle>
              <CardDescription className="text-sm leading-relaxed text-muted-foreground">
                Học từ vựng với FSRS, nắm vững 50+ chuyên đề ngữ pháp và rèn luyện kỹ năng đọc hiểu chuyên sâu.
              </CardDescription>
              <div className="pt-4 flex flex-wrap gap-1.5">
                {['Từ vựng FSRS', 'Ngữ pháp', 'Đọc hiểu'].map((t) => (
                  <Badge key={t} variant="secondary" className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-0">
                    {t}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Suggestion voting area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mt-12 w-full max-w-xl"
      >
        <Card className="border border-border/40 bg-muted/30 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">Bạn cần học môn khác?</span>
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px] py-0 px-1.5">
                    Sắp ra mắt
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Gửi yêu cầu môn học bạn muốn hỗ trợ tiếp theo.
                </p>
              </div>

              <form onSubmit={handleVoteSubmit} className="flex flex-1 items-center gap-2 max-w-md">
                <Input
                  type="text"
                  placeholder="Ví dụ: Vật lý, Hóa học..."
                  value={voteSubject}
                  onChange={(e) => setVoteSubject(e.target.value)}
                  className="bg-background h-9 text-sm"
                  disabled={isVoting}
                  required
                />
                <Button type="submit" size="sm" className="h-9 px-3 shrink-0 gap-1" disabled={isVoting}>
                  {isVoting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      Gửi
                    </>
                  )}
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
