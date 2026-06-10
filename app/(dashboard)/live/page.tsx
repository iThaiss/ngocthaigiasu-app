'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Video, Calendar, Clock, Users, ShieldAlert,
  Crown, Play, ExternalLink, AlertCircle, Loader2, Plus, Edit2, Trash2, BookOpen, Film
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/components/ui/use-toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog'

interface LiveClass {
  id: string
  title: string
  teacher: string
  start_time: string
  end_time: string
  status: 'upcoming' | 'live' | 'ended'
  subject: 'math' | 'english'
  meet_url?: string
  recording_url?: string
  document_url?: string
}

function SessionCountdown({ startTime }: { startTime: string }) {
  const [timeLeft, setTimeLeft] = useState<string>('')

  useEffect(() => {
    const target = new Date(startTime).getTime()
    if (isNaN(target)) return

    const updateTimer = () => {
      const diff = target - Date.now()
      if (diff <= 0) {
        setTimeLeft('Đã đến giờ học!')
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      if (days > 0) {
        setTimeLeft(`Bắt đầu sau ${days} ngày ${hours}h`)
      } else {
        setTimeLeft(
          `Bắt đầu sau ${hours.toString().padStart(2, '0')}:${minutes
            .toString()
            .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        )
      }
    }

    updateTimer()
    const timer = setInterval(updateTimer, 1000)
    return () => clearInterval(timer)
  }, [startTime])

  return (
    <span className="text-[11px] font-semibold text-rose-500 bg-rose-500/10 dark:bg-rose-500/20 px-2 py-0.5 rounded-full select-none animate-pulse">
      {timeLeft}
    </span>
  )
}

function formatSessionTime(startStr: string, endStr: string) {
  try {
    const start = new Date(startStr)
    const end = new Date(endStr)
    
    const dateStr = start.toLocaleDateString('vi-VN', {
      weekday: 'long',
      month: 'numeric',
      day: 'numeric'
    })
    
    const timeStr = `${start.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })} - ${end.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })}`
    
    return `${dateStr}, ${timeStr}`
  } catch {
    return 'Lỗi định dạng thời gian'
  }
}

export default function LiveClassPage() {
  const { user, isVip, isLoading: authLoading } = useAuth()
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(true)
  const [sessions, setSessions] = useState<LiveClass[]>([])
  const [activeTab, setActiveTab] = useState<'math' | 'english'>('math')
  
  // Dialog States
  const [isOpenDialog, setIsOpenDialog] = useState(false)
  const [editingSession, setEditingSession] = useState<LiveClass | null>(null)
  
  // Form States
  const [formTitle, setFormTitle] = useState('')
  const [formTeacher, setFormTeacher] = useState('Thầy Ngọc Thái')
  const [formStartTime, setFormStartTime] = useState('')
  const [formEndTime, setFormEndTime] = useState('')
  const [formStatus, setFormStatus] = useState<'upcoming' | 'live' | 'ended'>('upcoming')
  const [formSubject, setFormSubject] = useState<'math' | 'english'>('math')
  const [formMeetUrl, setFormMeetUrl] = useState('https://meet.google.com/')
  const [formRecordingUrl, setFormRecordingUrl] = useState('')
  const [formDocumentUrl, setFormDocumentUrl] = useState('')
  const [saving, setSaving] = useState(false)

  const isAdmin = user?.role === 'admin'

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/live')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setSessions(data)
    } catch {
      toast({
        variant: 'destructive',
        title: 'Lỗi tải lịch học',
        description: 'Không thể đồng bộ danh sách buổi học Live từ máy chủ.',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const savedSubject = localStorage.getItem('ngocthai_subject')
    if (savedSubject === 'english' || savedSubject === 'math') {
      setActiveTab(savedSubject)
    }
    fetchSessions()
  }, [])

  const openCreateDialog = () => {
    setEditingSession(null)
    setFormTitle('')
    setFormTeacher('Thầy Ngọc Thái')
    setFormStartTime('')
    setFormEndTime('')
    setFormStatus('upcoming')
    setFormSubject(activeTab)
    setFormMeetUrl('https://meet.google.com/')
    setFormRecordingUrl('')
    setFormDocumentUrl('')
    setIsOpenDialog(true)
  }

  const openEditDialog = (session: LiveClass) => {
    setEditingSession(session)
    setFormTitle(session.title)
    setFormTeacher(session.teacher)
    // Convert to datetime-local compatible string
    const toLocalISO = (isoStr: string) => {
      const d = new Date(isoStr)
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
      return d.toISOString().slice(0, 16)
    }
    setFormStartTime(toLocalISO(session.start_time))
    setFormEndTime(toLocalISO(session.end_time))
    setFormStatus(session.status)
    setFormSubject(session.subject)
    setFormMeetUrl(session.meet_url || '')
    setFormRecordingUrl(session.recording_url || '')
    setFormDocumentUrl(session.document_url || '')
    setIsOpenDialog(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formTitle || !formStartTime || !formEndTime || !formMeetUrl) {
      toast({
        variant: 'destructive',
        title: 'Điền thiếu thông tin',
        description: 'Vui lòng nhập đầy đủ các trường bắt buộc (*).',
      })
      return
    }

    setSaving(true)
    const payload = {
      title: formTitle,
      teacher: formTeacher,
      start_time: new Date(formStartTime).toISOString(),
      end_time: new Date(formEndTime).toISOString(),
      status: formStatus,
      subject: formSubject,
      meet_url: formMeetUrl,
      recording_url: formRecordingUrl || null,
      document_url: formDocumentUrl || null,
    }

    try {
      let res
      if (editingSession) {
        res = await fetch('/api/admin/live', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingSession.id, ...payload }),
        })
      } else {
        res = await fetch('/api/admin/live', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      if (!res.ok) throw new Error()
      
      toast({
        title: editingSession ? 'Cập nhật thành công' : 'Tạo buổi học thành công',
        description: `Buổi học Live đã được lưu trên cơ sở dữ liệu.`,
      })
      setIsOpenDialog(false)
      fetchSessions()
    } catch {
      toast({
        variant: 'destructive',
        title: 'Thao tác thất bại',
        description: 'Lỗi hệ thống khi lưu buổi học Live.',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa buổi học Live này?')) return

    try {
      const res = await fetch(`/api/admin/live?id=${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error()

      toast({
        title: 'Đã xóa buổi học',
        description: 'Lớp học trực tuyến đã được gỡ khỏi danh sách.',
      })
      fetchSessions()
    } catch {
      toast({
        variant: 'destructive',
        title: 'Không thể xóa',
        description: 'Gặp lỗi trong quá trình thực thi lệnh xóa.',
      })
    }
  }

  const handleStatusToggle = async (session: LiveClass, newStatus: 'upcoming' | 'live' | 'ended') => {
    try {
      const res = await fetch('/api/admin/live', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: session.id,
          title: session.title,
          teacher: session.teacher,
          start_time: session.start_time,
          end_time: session.end_time,
          status: newStatus,
          subject: session.subject,
          meet_url: session.meet_url || '',
          recording_url: session.recording_url || '',
          document_url: session.document_url || '',
        }),
      })
      if (!res.ok) throw new Error()
      
      toast({
        title: 'Đã cập nhật trạng thái',
        description: `Buổi học chuyển sang trạng thái: ${newStatus === 'live' ? 'Đang Live' : newStatus === 'ended' ? 'Đã kết thúc' : 'Sắp diễn ra'}.`,
      })
      fetchSessions()
    } catch {
      toast({
        variant: 'destructive',
        title: 'Cập nhật thất bại',
        description: 'Lỗi kết nối máy chủ.',
      })
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const filteredSessions = sessions.filter((s) => s.subject === activeTab)

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10">
            <Video className="h-5 w-5 text-rose-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Lớp Học Trực Tuyến</h1>
            <p className="text-muted-foreground text-sm">Tương tác trực tiếp qua Google Meet cùng thầy cô</p>
          </div>
        </div>
        
        {isAdmin && (
          <Button onClick={openCreateDialog} className="gap-1.5 self-start sm:self-auto bg-primary text-primary-foreground">
            <Plus className="h-4 w-4" /> Tạo buổi học Live
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border w-full">
        <button
          onClick={() => {
            setActiveTab('math')
            localStorage.setItem('ngocthai_subject', 'math')
          }}
          className={`flex-1 sm:flex-initial px-6 py-3 text-sm font-semibold transition-all border-b-2 -mb-[2px] ${
            activeTab === 'math'
              ? 'border-purple-500 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Môn Toán Học
        </button>
        <button
          onClick={() => {
            setActiveTab('english')
            localStorage.setItem('ngocthai_subject', 'english')
          }}
          className={`flex-1 sm:flex-initial px-6 py-3 text-sm font-semibold transition-all border-b-2 -mb-[2px] ${
            activeTab === 'english'
              ? 'border-teal-500 text-teal-600 dark:text-teal-400'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Môn Tiếng Anh
        </button>
      </div>

      {/* VIP Check */}
      {!isVip && !isAdmin ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-yellow-500/30 bg-gradient-to-br from-yellow-500/5 via-background to-amber-500/5 overflow-hidden relative">
            <CardContent className="p-8 text-center space-y-4 max-w-lg mx-auto">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-500/10 mx-auto text-yellow-500 animate-bounce">
                <Crown className="h-8 w-8 fill-current" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-lg font-bold">Yêu cầu tài khoản VIP để tham gia Live</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Lớp học Live trực tiếp và tương tác hai chiều qua Google Meet được mở độc quyền dành riêng cho các thành viên đăng ký VIP.
                </p>
              </div>
              <div className="pt-2">
                <Link href="/payment">
                  <Button size="lg" className="w-full sm:w-auto bg-yellow-500 hover:bg-yellow-600 text-black font-bold gap-2">
                    <Crown className="h-5 w-5 fill-current" />
                    Nâng cấp VIP ngay
                  </Button>
                </Link>
              </div>
              <p className="text-[10px] text-muted-foreground">Chỉ với chi phí rất nhỏ hàng tháng, học không giới hạn toàn bộ lộ trình và lớp Live.</p>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {/* Main content (2/3 width) */}
          <div className="md:col-span-2 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-primary" /> Lịch học {activeTab === 'math' ? 'Toán' : 'Tiếng Anh'} của bạn
            </h2>

            {filteredSessions.length === 0 ? (
              <div className="text-center py-12 border rounded-xl bg-muted/20 border-dashed">
                <Video className="h-8 w-8 text-muted-foreground/60 mx-auto mb-2" />
                <p className="text-sm font-medium text-muted-foreground">Chưa có lịch học Live nào được xếp tuần này.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSessions.map((session) => {
                  const isLive = session.status === 'live'
                  const isEnded = session.status === 'ended'
                  
                  return (
                    <Card
                      key={session.id}
                      className={`transition-all border ${
                        isLive
                          ? 'border-rose-500 shadow-md ring-1 ring-rose-500/20 bg-rose-500/5'
                          : 'bg-card'
                      }`}
                    >
                      <CardContent className="p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-2 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              {isLive && (
                                <Badge variant="destructive" className="bg-rose-500 gap-1 text-[10px] uppercase font-bold animate-pulse px-2 py-0 h-5">
                                  <span className="h-1.5 w-1.5 bg-white rounded-full inline-block" /> Đang Live
                                </Badge>
                              )}
                              {session.status === 'upcoming' && (
                                <>
                                  <Badge variant="secondary" className="text-[10px] uppercase font-semibold px-2 py-0 h-5">Chờ bắt đầu</Badge>
                                  <SessionCountdown startTime={session.start_time} />
                                </>
                              )}
                              {isEnded && (
                                <Badge variant="outline" className="text-[10px] uppercase font-semibold px-2 py-0 h-5 text-muted-foreground bg-muted/40">Đã kết thúc</Badge>
                              )}
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Users className="h-3.5 w-3.5" /> {session.teacher}
                              </span>
                            </div>
                            <h3 className="font-bold text-sm md:text-base leading-snug break-words">{session.title}</h3>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" /> {formatSessionTime(session.start_time, session.end_time)}
                            </p>
                          </div>

                          {/* Action Button */}
                          <div className="flex sm:flex-col items-center justify-between sm:justify-center gap-2 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0">
                            {isLive ? (
                              <a
                                href={`/api/live/join?id=${session.id}`}
                                className="w-full sm:w-auto"
                              >
                                <Button className="w-full sm:w-auto bg-rose-500 hover:bg-rose-600 text-white font-bold gap-1.5 h-10 shadow-sm">
                                  <Play className="h-4 w-4 fill-current" />
                                  Vào học ngay <ExternalLink className="h-3.5 w-3.5" />
                                </Button>
                              </a>
                            ) : isEnded ? (
                              <div className="flex gap-2 w-full sm:w-auto">
                                {session.recording_url && (
                                  <a href={session.recording_url} target="_blank" rel="noopener noreferrer" className="flex-1 sm:flex-initial">
                                    <Button variant="outline" size="sm" className="w-full gap-1 text-xs h-9 border-rose-200 text-rose-600 dark:border-rose-900 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20">
                                      <Film className="h-3.5 w-3.5" /> Xem lại
                                    </Button>
                                  </a>
                                )}
                                {session.document_url && (
                                  <a href={session.document_url} target="_blank" rel="noopener noreferrer" className="flex-1 sm:flex-initial">
                                    <Button variant="outline" size="sm" className="w-full gap-1 text-xs h-9">
                                      <BookOpen className="h-3.5 w-3.5" /> Tài liệu
                                    </Button>
                                  </a>
                                )}
                              </div>
                            ) : (
                              <Button disabled variant="outline" className="w-full sm:w-auto text-xs h-10 opacity-60">
                                Chưa mở phòng
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Admin Controls */}
                        {isAdmin && (
                          <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between gap-3 flex-wrap">
                            {/* Quick status gạt nhanh */}
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] uppercase font-bold text-muted-foreground">Admin Status:</span>
                              <Button
                                size="sm"
                                variant={session.status === 'upcoming' ? 'default' : 'outline'}
                                onClick={() => handleStatusToggle(session, 'upcoming')}
                                className="h-7 px-2 text-[10px]"
                              >
                                Sắp diễn ra
                              </Button>
                              <Button
                                size="sm"
                                variant={session.status === 'live' ? 'destructive' : 'outline'}
                                onClick={() => handleStatusToggle(session, 'live')}
                                className="h-7 px-2 text-[10px]"
                              >
                                Đang Live
                              </Button>
                              <Button
                                size="sm"
                                variant={session.status === 'ended' ? 'secondary' : 'outline'}
                                onClick={() => handleStatusToggle(session, 'ended')}
                                className="h-7 px-2 text-[10px]"
                              >
                                Kết thúc
                              </Button>
                            </div>

                            {/* Edit/Delete Buttons */}
                            <div className="flex items-center gap-1.5 ml-auto">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => openEditDialog(session)}
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleDelete(session.id)}
                                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>

          {/* Guidelines (1/3 width) */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 text-primary" /> Quy định & Hướng dẫn
            </h2>

            <Card className="border">
              <CardContent className="p-4 space-y-4 text-xs md:text-sm">
                <div className="space-y-2">
                  <p className="font-bold text-sm text-primary">Cách tham gia học:</p>
                  <ol className="list-decimal pl-4 space-y-1.5 leading-relaxed text-muted-foreground text-xs">
                    <li>Chuẩn bị sẵn giấy nháp, máy tính Casio và bút viết.</li>
                    <li>Bấm vào nút <strong>&quot;Vào học ngay&quot;</strong> ở các buổi học có nhãn màu đỏ.</li>
                    <li>Phòng học sử dụng Google Meet. Bạn sẽ được <strong>tự động duyệt vào lớp</strong> nếu có tài khoản VIP (ID hợp lệ).</li>
                  </ol>
                </div>

                <hr className="border-border/60" />

                <div className="space-y-2">
                  <p className="font-bold text-sm text-primary">Tương tác trực tiếp:</p>
                  <p className="text-muted-foreground leading-relaxed text-xs">
                    Bạn có thể gửi câu hỏi qua khung chat trong cuộc họp Google Meet. Giáo viên sẽ trực tiếp giải đáp, vẽ hình minh họa ngay trên bảng vẽ.
                  </p>
                </div>

                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 p-3 rounded-lg text-xs leading-relaxed flex gap-2">
                  <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>Nghiêm cấm chia sẻ link Google Meet ra bên ngoài để bảo vệ tối đa quyền lợi của thành viên VIP.</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={isOpenDialog} onOpenChange={setIsOpenDialog}>
        <DialogContent className="max-w-md w-[95vw]">
          <DialogHeader>
            <DialogTitle>{editingSession ? 'Chỉnh sửa buổi học Live' : 'Tạo buổi học Live mới'}</DialogTitle>
            <DialogDescription>
              Nhập các trường thông tin chi tiết của buổi học trực tuyến bên dưới.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 py-2">
            {/* Title */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase">Tiêu đề lớp học *</label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Nhập tiêu đề buổi học..."
                className="w-full px-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>

            {/* Teacher & Subject & Status */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Giáo viên *</label>
                <input
                  type="text"
                  value={formTeacher}
                  onChange={(e) => setFormTeacher(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Môn học *</label>
                <select
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value as 'math' | 'english')}
                  className="w-full px-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="math">Toán Học</option>
                  <option value="english">Tiếng Anh</option>
                </select>
              </div>
            </div>

            {/* Start Time & End Time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Bắt đầu *</label>
                <input
                  type="datetime-local"
                  value={formStartTime}
                  onChange={(e) => setFormStartTime(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Kết thúc *</label>
                <input
                  type="datetime-local"
                  value={formEndTime}
                  onChange={(e) => setFormEndTime(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>
            </div>

            {/* Status & Google Meet URL */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1 space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Trạng thái</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as 'upcoming' | 'live' | 'ended')}
                  className="w-full px-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="upcoming">Sắp diễn ra</option>
                  <option value="live">Đang Live</option>
                  <option value="ended">Kết thúc</option>
                </select>
              </div>

              <div className="col-span-2 space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Google Meet URL *</label>
                <input
                  type="url"
                  value={formMeetUrl}
                  onChange={(e) => setFormMeetUrl(e.target.value)}
                  placeholder="https://meet.google.com/..."
                  className="w-full px-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>
            </div>

            {/* Document & Recording URL */}
            <div className="space-y-3 border-t border-border/40 pt-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1 text-teal-600 dark:text-teal-400">
                  <Film className="h-3 w-3" /> Link Video Xem lại (Nếu có)
                </label>
                <input
                  type="url"
                  value={formRecordingUrl}
                  onChange={(e) => setFormRecordingUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/..."
                  className="w-full px-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1 text-purple-600 dark:text-purple-400">
                  <BookOpen className="h-3 w-3" /> Link Tài liệu học tập (Nếu có)
                </label>
                <input
                  type="url"
                  value={formDocumentUrl}
                  onChange={(e) => setFormDocumentUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/..."
                  className="w-full px-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpenDialog(false)}
                disabled={saving}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={saving} className="bg-primary text-primary-foreground">
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingSession ? 'Lưu thay đổi' : 'Tạo buổi học'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
