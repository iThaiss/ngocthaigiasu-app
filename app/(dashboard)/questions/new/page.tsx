'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Save, Eye, Upload, X, Plus, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/components/ui/use-toast'
import { Difficulty } from '@/lib/mock-data'

const ALL_TAGS = ['Giải tích', 'Đại số', 'Hình học', 'Lượng giác', 'Tích phân', 'Đạo hàm', 'Xác suất', 'Thống kê', 'Số phức', 'Giới hạn', 'Cực trị', 'Phương trình']
const DIFFICULTIES: Difficulty[] = ['Nhận biết', 'Thông hiểu', 'Vận dụng', 'Vận dụng cao']

interface FormErrors {
  title?: string
  content?: string
  answer?: string
  difficulty?: string
  tags?: string
  video?: string
}

export default function NewQuestionPage() {
  const { role } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '',
    content: '',
    answer: '',
    difficulty: '' as Difficulty | '',
    tags: [] as string[],
    videoUrl: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [tagInput, setTagInput] = useState('')

  if (role === 'student') {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Bạn không có quyền truy cập trang này.</p>
      </div>
    )
  }

  const validate = (): boolean => {
    const e: FormErrors = {}
    if (!form.title.trim()) e.title = 'Tiêu đề không được để trống'
    if (!form.content.trim()) e.content = 'Nội dung LaTeX không được để trống'
    if (!form.answer.trim()) e.answer = 'Đáp án không được để trống'
    if (!form.difficulty) e.difficulty = 'Vui lòng chọn độ khó'
    if (form.tags.length === 0) e.tags = 'Phải có ít nhất 1 tag'
    if (form.difficulty === 'Vận dụng cao' && !form.videoUrl.trim()) e.video = 'Câu VDC bắt buộc có video hướng dẫn'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setSaving(true)
    await new Promise((r) => setTimeout(r, 1200))
    setSaving(false)
    toast({ title: 'Tạo câu hỏi thành công!', description: 'Câu hỏi đã được lưu vào ngân hàng.', variant: 'success' as never })
    router.push('/questions')
  }

  const addTag = (tag: string) => {
    if (!form.tags.includes(tag)) {
      setForm({ ...form, tags: [...form.tags, tag] })
      setErrors({ ...errors, tags: undefined })
    }
  }

  const removeTag = (tag: string) => {
    setForm({ ...form, tags: form.tags.filter((t) => t !== tag) })
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">Tạo câu hỏi mới</h1>
        <p className="text-muted-foreground mt-1">Điền đầy đủ thông tin câu hỏi bên dưới</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardContent className="pt-6 space-y-5">
            {/* Title */}
            <div className="space-y-2">
              <Label>Tiêu đề <span className="text-destructive">*</span></Label>
              <Input
                value={form.title}
                onChange={(e) => { setForm({ ...form, title: e.target.value }); setErrors({ ...errors, title: undefined }) }}
                placeholder="VD: Tính đạo hàm của hàm số f(x) = x³ - 3x + 2"
                className={errors.title ? 'border-destructive' : ''}
              />
              {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
            </div>

            {/* Content (LaTeX) */}
            <div className="space-y-2">
              <Label>Nội dung (LaTeX) <span className="text-destructive">*</span></Label>
              <Tabs defaultValue="edit">
                <TabsList className="mb-2">
                  <TabsTrigger value="edit">Soạn thảo</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>
                <TabsContent value="edit">
                  <Textarea
                    value={form.content}
                    onChange={(e) => { setForm({ ...form, content: e.target.value }); setErrors({ ...errors, content: undefined }) }}
                    placeholder="VD: f(x) = x^3 - 3x + 2"
                    rows={4}
                    className={`font-mono ${errors.content ? 'border-destructive' : ''}`}
                  />
                </TabsContent>
                <TabsContent value="preview">
                  <div className="min-h-[100px] rounded-md border border-input bg-muted/30 p-3 font-mono text-sm">
                    {form.content || <span className="text-muted-foreground">Chưa có nội dung...</span>}
                  </div>
                </TabsContent>
              </Tabs>
              {errors.content && <p className="text-xs text-destructive">{errors.content}</p>}
            </div>

            {/* Answer */}
            <div className="space-y-2">
              <Label>Đáp án đúng <span className="text-destructive">*</span></Label>
              <Input
                value={form.answer}
                onChange={(e) => { setForm({ ...form, answer: e.target.value }); setErrors({ ...errors, answer: undefined }) }}
                placeholder="VD: f'(x) = 3x² - 3"
                className={errors.answer ? 'border-destructive' : ''}
              />
              {errors.answer && <p className="text-xs text-destructive">{errors.answer}</p>}
            </div>

            <Separator />

            {/* Difficulty */}
            <div className="space-y-2">
              <Label>Độ khó <span className="text-destructive">*</span></Label>
              <Select value={form.difficulty} onValueChange={(v) => { setForm({ ...form, difficulty: v as Difficulty }); setErrors({ ...errors, difficulty: undefined }) }}>
                <SelectTrigger className={errors.difficulty ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Chọn độ khó" />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTIES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.difficulty && <p className="text-xs text-destructive">{errors.difficulty}</p>}
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label>Chủ đề / Tags <span className="text-destructive">*</span></Label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {form.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                    {tag}
                    <button onClick={() => removeTag(tag)} className="hover:text-destructive"><X className="h-3 w-3" /></button>
                  </Badge>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {ALL_TAGS.filter((t) => !form.tags.includes(t)).map((tag) => (
                  <button key={tag} onClick={() => addTag(tag)} className="text-xs px-2 py-0.5 rounded border border-dashed border-border hover:border-primary hover:text-primary transition-colors">
                    + {tag}
                  </button>
                ))}
              </div>
              {errors.tags && <p className="text-xs text-destructive">{errors.tags}</p>}
            </div>

            {/* Video (required for VDC) */}
            {form.difficulty === 'Vận dụng cao' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2">
                <Label>
                  Video hướng dẫn <span className="text-destructive">*</span>
                  <span className="text-xs text-muted-foreground ml-2">(bắt buộc với VDC)</span>
                </Label>
                <Input
                  value={form.videoUrl}
                  onChange={(e) => { setForm({ ...form, videoUrl: e.target.value }); setErrors({ ...errors, video: undefined }) }}
                  placeholder="https://example.com/video.mp4"
                  className={errors.video ? 'border-destructive' : ''}
                />
                {errors.video && <p className="text-xs text-destructive">{errors.video}</p>}
              </motion.div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => router.push('/questions')}>Hủy</Button>
              <Button onClick={handleSubmit} disabled={saving} className="gap-2">
                {saving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" /> : <Save className="h-4 w-4" />}
                {saving ? 'Đang lưu...' : 'Lưu câu hỏi'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
