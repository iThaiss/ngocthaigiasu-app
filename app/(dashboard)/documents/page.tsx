'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FileText, Video, Eye, BookOpen, Info, Filter } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

type DocType = 'pdf' | 'video'

interface Document {
  id: string
  title: string
  subject: string
  type: DocType
}

const MOCK_DOCS: Document[] = [
  { id: '1', title: 'Đại số tổ hợp - Lý thuyết và bài tập', subject: 'Toán', type: 'pdf' },
  { id: '2', title: 'Giải tích - Hàm số & Đạo hàm', subject: 'Toán', type: 'video' },
  { id: '3', title: 'Khảo sát hàm số nâng cao', subject: 'Toán', type: 'pdf' },
  { id: '4', title: 'Tích phân và ứng dụng thực tế', subject: 'Toán', type: 'video' },
  { id: '5', title: 'IELTS Reading - Kỹ thuật làm bài', subject: 'Anh', type: 'pdf' },
  { id: '6', title: '50 Phrasal Verbs thông dụng nhất', subject: 'Anh', type: 'pdf' },
  { id: '7', title: 'Luyện nghe tiếng Anh giao tiếp cơ bản', subject: 'Anh', type: 'video' },
  { id: '8', title: 'Phương pháp ôn thi THPT Quốc Gia Anh', subject: 'Anh', type: 'pdf' },
  { id: '9', title: 'Điện từ trường - Công thức tổng hợp', subject: 'Lý', type: 'pdf' },
  { id: '10', title: 'Hóa hữu cơ - Phản ứng và chuỗi', subject: 'Hóa', type: 'video' },
  { id: '11', title: 'Văn học hiện đại Việt Nam', subject: 'Văn', type: 'pdf' },
]

const SUBJECT_MAP: Record<string, string> = {
  math: 'Toán',
  english: 'Anh',
  physics: 'Lý',
  chemistry: 'Hóa',
  literature: 'Văn',
}

const SUBJECT_COLORS: Record<string, string> = {
  Toán: 'text-primary bg-primary/10',
  Anh: 'text-rose-500 bg-rose-500/10',
  Lý: 'text-blue-500 bg-blue-500/10',
  Hóa: 'text-green-500 bg-green-500/10',
  Văn: 'text-orange-500 bg-orange-500/10',
}

export default function DocumentsPage() {
  const [activeSubject, setActiveSubject] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<'all' | 'pdf' | 'video'>('all')

  useEffect(() => {
    // Read from localStorage on mount
    const saved = localStorage.getItem('ngocthai_subject') || 'math'
    setActiveSubject(saved)
  }, [])

  const subjectName = activeSubject ? (SUBJECT_MAP[activeSubject] || 'Toán') : 'Toán'

  // Filter documents by both subject AND document type
  const filtered = MOCK_DOCS.filter((doc) => {
    const matchesSubject = doc.subject === subjectName
    const matchesType = typeFilter === 'all' || doc.type === typeFilter
    return matchesSubject && matchesType
  })

  const colorClass = SUBJECT_COLORS[subjectName] ?? 'text-gray-500 bg-gray-500/10'

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" /> Tài liệu học tập
        </h1>
        <p className="text-muted-foreground mt-1">
          Không gian tài liệu của bạn cho môn học: <strong className={activeSubject === 'english' ? 'text-rose-500' : 'text-primary'}>{subjectName}</strong>
        </p>
      </motion.div>

      {/* Filter by Type (PDF vs Video) */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground font-medium mr-2">Định dạng:</span>
        <div className="flex gap-2">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'pdf', label: 'PDF' },
            { id: 'video', label: 'Video' },
          ].map((type) => (
            <Button
              key={type.id}
              variant={typeFilter === type.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTypeFilter(type.id as 'all' | 'pdf' | 'video')}
              className="h-8 text-xs"
            >
              {type.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((doc, i) => {
          const Icon = doc.type === 'pdf' ? FileText : Video
          return (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="hover:shadow-md hover:border-primary/30 transition-all h-full">
                <CardContent className="pt-5 pb-4 flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${colorClass}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm leading-snug">{doc.title}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge variant="outline" className="text-[10px] py-0 px-1 border-0 bg-muted/65 text-muted-foreground capitalize">
                          {doc.type === 'pdf' ? 'PDF' : 'Video'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="w-full gap-2 mt-auto text-xs">
                    <Eye className="h-3.5 w-3.5" /> Xem tài liệu
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}

        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center border rounded-xl border-dashed">
            <FileText className="h-10 w-10 text-muted-foreground/60 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Chưa có tài liệu nào thuộc định dạng này.</p>
          </div>
        )}
      </div>

      {/* Notice */}
      <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800 p-4 text-sm text-blue-700 dark:text-blue-300">
        <Info className="h-4 w-4 shrink-0" />
        <span>Tính năng tự động đồng bộ tài liệu từ các bài giảng Lộ Trình đang được cập nhật.</span>
      </div>
    </div>
  )
}
