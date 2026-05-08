'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Plus, Search, Filter, Edit, Trash2, BookOpen, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { useAuth } from '@/lib/auth-context'
import { MOCK_QUESTIONS, Difficulty } from '@/lib/mock-data'
import { formatDateShort } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  'Nhận biết': 'success',
  'Thông hiểu': 'info',
  'Vận dụng': 'warning',
  'Vận dụng cao': 'destructive',
}

export default function QuestionsPage() {
  const { role } = useAuth()
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [diffFilter, setDiffFilter] = useState<string>('all')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [questions, setQuestions] = useState(MOCK_QUESTIONS)

  if (role === 'student') {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Bạn không có quyền truy cập trang này.</p>
      </div>
    )
  }

  const filtered = questions.filter((q) => {
    const matchSearch = q.title.toLowerCase().includes(search.toLowerCase()) || q.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
    const matchDiff = diffFilter === 'all' || q.difficulty === diffFilter
    return matchSearch && matchDiff
  })

  const handleDelete = () => {
    if (!deleteId) return
    setQuestions((prev) => prev.filter((q) => q.id !== deleteId))
    setDeleteId(null)
    toast({ title: 'Đã xóa câu hỏi', description: 'Câu hỏi đã được xóa khỏi hệ thống.', variant: 'destructive' })
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý câu hỏi</h1>
          <p className="text-muted-foreground mt-1">{questions.length} câu hỏi trong hệ thống</p>
        </div>
        <Link href="/questions/new">
          <Button className="gap-2"><Plus className="h-4 w-4" /> Tạo câu hỏi mới</Button>
        </Link>
      </motion.div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm câu hỏi hoặc tag..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={diffFilter} onValueChange={setDiffFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Độ khó" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả độ khó</SelectItem>
                <SelectItem value="Nhận biết">Nhận biết</SelectItem>
                <SelectItem value="Thông hiểu">Thông hiểu</SelectItem>
                <SelectItem value="Vận dụng">Vận dụng</SelectItem>
                <SelectItem value="Vận dụng cao">Vận dụng cao</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tiêu đề</TableHead>
                  <TableHead className="hidden md:table-cell">Độ khó</TableHead>
                  <TableHead className="hidden lg:table-cell">Tags</TableHead>
                  <TableHead className="hidden lg:table-cell">Trạng thái</TableHead>
                  <TableHead className="hidden md:table-cell">Ngày tạo</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Không tìm thấy câu hỏi nào
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((q) => (
                    <TableRow key={q.id}>
                      <TableCell>
                        <div className="flex items-start gap-2">
                          <BookOpen className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                          <p className="font-medium text-sm leading-tight line-clamp-2">{q.title}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant={DIFFICULTY_COLORS[q.difficulty] as never} className="text-xs">
                          {q.difficulty}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {q.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                          ))}
                          {q.tags.length > 2 && <Badge variant="outline" className="text-xs">+{q.tags.length - 2}</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant={q.status === 'Active' ? 'success' : 'secondary'} className="text-xs">
                          {q.status === 'Active' ? 'Đang dùng' : 'Ẩn'}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {formatDateShort(q.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/questions/${q.id}/edit`}>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => setDeleteId(q.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>

      {/* Delete Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa câu hỏi</DialogTitle>
            <DialogDescription>
              Bạn có chắc muốn xóa câu hỏi này không? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Hủy</Button>
            <Button variant="destructive" onClick={handleDelete}>Xóa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
