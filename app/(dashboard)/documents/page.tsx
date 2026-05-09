'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Video, Eye, BookOpen, Info } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

type Subject = 'all' | 'Toán' | 'Lý' | 'Hóa' | 'Văn' | 'Anh'
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
  { id: '3', title: 'Điện từ trường - Công thức tổng hợp', subject: 'Lý', type: 'pdf' },
  { id: '4', title: 'Hóa hữu cơ - Phản ứng và chuỗi', subject: 'Hóa', type: 'video' },
  { id: '5', title: 'Văn học hiện đại Việt Nam', subject: 'Văn', type: 'pdf' },
  { id: '6', title: 'IELTS Reading - Kỹ thuật làm bài', subject: 'Anh', type: 'pdf' },
]

const SUBJECTS: Subject[] = ['all', 'Toán', 'Lý', 'Hóa', 'Văn', 'Anh']

const SUBJECT_COLORS: Record<string, string> = {
  Toán: 'text-blue-500 bg-blue-500/10',
  Lý: 'text-purple-500 bg-purple-500/10',
  Hóa: 'text-green-500 bg-green-500/10',
  Văn: 'text-orange-500 bg-orange-500/10',
  Anh: 'text-pink-500 bg-pink-500/10',
}

export default function DocumentsPage() {
  const [filter, setFilter] = useState<Subject>('all')

  const filtered = filter === 'all' ? MOCK_DOCS : MOCK_DOCS.filter((d) => d.subject === filter)

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6" /> Tài liệu học tập
        </h1>
        <p className="text-muted-foreground mt-1">Tài liệu ôn thi theo từng môn học</p>
      </motion.div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {SUBJECTS.map((s) => (
          <Button
            key={s}
            variant={filter === s ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(s)}
          >
            {s === 'all' ? 'Tất cả' : s}
          </Button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((doc, i) => {
          const Icon = doc.type === 'pdf' ? FileText : Video
          const colorClass = SUBJECT_COLORS[doc.subject] ?? 'text-gray-500 bg-gray-500/10'
          return (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
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
                        <Badge variant="outline" className="text-xs">{doc.subject}</Badge>
                        <Badge variant="secondary" className="text-xs capitalize">{doc.type === 'pdf' ? 'PDF' : 'Video'}</Badge>
                      </div>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="w-full gap-2 mt-auto">
                    <Eye className="h-3.5 w-3.5" /> Xem
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Notice */}
      <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800 p-4 text-sm text-blue-700 dark:text-blue-300">
        <Info className="h-4 w-4 shrink-0" />
        Tính năng đang được cập nhật. Tài liệu đầy đủ sẽ sớm được bổ sung.
      </div>
    </div>
  )
}
