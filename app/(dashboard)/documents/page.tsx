'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  FileText, Eye, BookOpen, Search, Plus, Edit2, Trash2, Loader2,
  Folder, ChevronDown, ChevronRight, ExternalLink,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/components/ui/use-toast'

interface StudyDoc {
  id: string
  title: string
  subject: string
  drive_url: string
  folder_label: string | null
  view_count: number
  view_count_base: number
  created_at: string
}

const DEFAULT_FOLDER = '📁 Tài liệu Toán'

// Chuyển link Google Drive sang link nhúng preview. Trả null nếu không nhận diện được.
function driveEmbedUrl(url: string): string | null {
  if (!url) return null
  const byPath = url.match(/drive\.google\.com\/file\/d\/([^/]+)/)
  if (byPath) return `https://drive.google.com/file/d/${byPath[1]}/preview`
  const byId = url.match(/[?&]id=([^&]+)/)
  if (byId) return `https://drive.google.com/file/d/${byId[1]}/preview`
  // Google Docs/Sheets/Slides → thêm /preview
  const docs = url.match(/(docs\.google\.com\/[^/]+\/d\/[^/]+)/)
  if (docs) return `https://${docs[1]}/preview`
  return null
}

export default function DocumentsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const isAdmin = user?.role === 'admin'

  const [docs, setDocs] = useState<StudyDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({})
  const [viewer, setViewer] = useState<StudyDoc | null>(null)

  // Admin form
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<StudyDoc | null>(null)
  const [fTitle, setFTitle] = useState('')
  const [fUrl, setFUrl] = useState('')
  const [fFolder, setFFolder] = useState('')
  const [fBase, setFBase] = useState(0)
  const [saving, setSaving] = useState(false)

  const fetchDocs = useCallback(async () => {
    try {
      const res = await fetch('/api/documents?subject=math')
      const data = await res.json()
      setDocs(data.documents ?? [])
    } catch {
      toast({ variant: 'destructive', title: 'Lỗi tải tài liệu' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { fetchDocs() }, [fetchDocs])

  const openViewer = (doc: StudyDoc) => {
    setViewer(doc)
    // Tăng lượt xem (optimistic)
    setDocs(prev => prev.map(d => d.id === doc.id ? { ...d, view_count: d.view_count + 1 } : d))
    fetch(`/api/documents/${doc.id}/view`, { method: 'POST' }).catch(() => {})
  }

  const openCreate = () => {
    setEditing(null)
    setFTitle(''); setFUrl(''); setFFolder(''); setFBase(0)
    setDialogOpen(true)
  }
  const openEdit = (doc: StudyDoc) => {
    setEditing(doc)
    setFTitle(doc.title); setFUrl(doc.drive_url); setFFolder(doc.folder_label ?? ''); setFBase(doc.view_count_base ?? 0)
    setDialogOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fTitle.trim() || !fUrl.trim()) {
      toast({ variant: 'destructive', description: 'Nhập tiêu đề và link Drive' })
      return
    }
    if (!driveEmbedUrl(fUrl.trim())) {
      toast({ variant: 'destructive', description: 'Link Drive không hợp lệ (cần link file Google Drive)' })
      return
    }
    setSaving(true)
    try {
      const payload = { title: fTitle, drive_url: fUrl, folder_label: fFolder, view_count_base: fBase, subject: 'math' }
      const res = await fetch('/api/documents', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing ? { id: editing.id, ...payload } : payload),
      })
      if (!res.ok) throw new Error()
      toast({ title: editing ? 'Đã cập nhật' : 'Đã thêm tài liệu' })
      setDialogOpen(false)
      fetchDocs()
    } catch {
      toast({ variant: 'destructive', title: 'Lưu thất bại' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (doc: StudyDoc) => {
    if (!confirm(`Xóa tài liệu "${doc.title}"?`)) return
    try {
      const res = await fetch(`/api/documents?id=${doc.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast({ title: 'Đã xóa' })
      fetchDocs()
    } catch {
      toast({ variant: 'destructive', title: 'Xóa thất bại' })
    }
  }

  // Lọc theo tìm kiếm
  const filtered = docs.filter(d => d.title.toLowerCase().includes(search.toLowerCase().trim()))

  // Gom nhóm theo thư mục (giữ thứ tự mới nhất trước — docs đã sort từ API)
  const grouped: Record<string, StudyDoc[]> = {}
  for (const d of filtered) {
    const key = d.folder_label?.trim() || DEFAULT_FOLDER
    grouped[key] = [...(grouped[key] || []), d]
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" /> Tài liệu học tập
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Tài liệu môn <strong className="text-primary">Toán</strong></p>
        </motion.div>
        {isAdmin && (
          <Button onClick={openCreate} className="gap-1.5 self-start sm:self-auto">
            <Plus className="h-4 w-4" /> Thêm tài liệu
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm tài liệu theo tên..."
          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center border rounded-xl border-dashed">
          <FileText className="h-10 w-10 text-muted-foreground/60 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            {search ? 'Không tìm thấy tài liệu phù hợp.' : 'Chưa có tài liệu nào.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([label, list]) => {
            const isOpen = openFolders[label] ?? true
            return (
              <div key={label} className="rounded-xl border border-border/60 overflow-hidden">
                <button
                  onClick={() => setOpenFolders(prev => ({ ...prev, [label]: !isOpen }))}
                  className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
                >
                  <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    <Folder className="h-3.5 w-3.5" /> {label}
                    <span className="text-[10px] font-normal normal-case bg-border rounded-full px-2 py-0.5">{list.length} tài liệu</span>
                  </span>
                  {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                </button>
                {isOpen && (
                  <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 border-t border-border/40">
                    {list.map((doc) => {
                      const views = (doc.view_count ?? 0) + (doc.view_count_base ?? 0)
                      return (
                        <Card key={doc.id} className="hover:shadow-md hover:border-primary/30 transition-all">
                          <CardContent className="pt-4 pb-3 flex flex-col gap-3 h-full">
                            <div className="flex items-start gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-primary bg-primary/10">
                                <FileText className="h-5 w-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm leading-snug break-words">{doc.title}</p>
                                {views > 0 && (
                                  <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
                                    <Eye className="h-3 w-3" /> {views.toLocaleString('vi-VN')} lượt xem
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="mt-auto flex items-center gap-2">
                              <Button size="sm" variant="outline" className="flex-1 gap-2 text-xs" onClick={() => openViewer(doc)}>
                                <Eye className="h-3.5 w-3.5" /> Xem tài liệu
                              </Button>
                              {isAdmin && (
                                <>
                                  <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => openEdit(doc)}>
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(doc)}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Viewer modal */}
      <Dialog open={!!viewer} onOpenChange={(o) => !o && setViewer(null)}>
        <DialogContent className="max-w-4xl w-[95vw] p-3 sm:p-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base pr-6">
              <FileText className="h-4 w-4 text-primary shrink-0" />
              <span className="truncate">{viewer?.title}</span>
              {viewer && (
                <a href={viewer.drive_url} target="_blank" rel="noreferrer" className="ml-auto shrink-0 text-muted-foreground hover:text-foreground" title="Mở trong Drive">
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </DialogTitle>
          </DialogHeader>
          {viewer && (
            <div className="w-full h-[75vh] rounded-lg overflow-hidden bg-muted/20">
              <iframe
                src={driveEmbedUrl(viewer.drive_url) ?? undefined}
                className="w-full h-full"
                allow="autoplay"
                title={viewer.title}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Admin add/edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md w-[95vw]">
          <DialogHeader>
            <DialogTitle>{editing ? 'Sửa tài liệu' : 'Thêm tài liệu'}</DialogTitle>
            <DialogDescription>Dán link file Google Drive (PDF) đã chia sẻ dạng &quot;Bất kỳ ai có link&quot;.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-3 py-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase">Tiêu đề *</label>
              <input value={fTitle} onChange={(e) => setFTitle(e.target.value)} placeholder="VD: Chuyên đề Hàm số — Lý thuyết"
                className="w-full px-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" required />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase">Link Google Drive *</label>
              <input value={fUrl} onChange={(e) => setFUrl(e.target.value)} placeholder="https://drive.google.com/file/d/..."
                className="w-full px-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" required />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
                <Folder className="h-3 w-3" /> Thư mục (tùy chọn)
              </label>
              <input value={fFolder} onChange={(e) => setFFolder(e.target.value)} placeholder="VD: Chuyên đề Hàm số, Đề thi thử..."
                className="w-full px-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase">Lượt xem nền (tùy chọn)</label>
              <input type="number" min="0" value={fBase} onChange={(e) => setFBase(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Hủy</Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editing ? 'Lưu' : 'Thêm'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
