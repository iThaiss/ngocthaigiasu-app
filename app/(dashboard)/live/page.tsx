'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Video, Calendar, Clock, Users, ShieldAlert,
  Crown, Play, ExternalLink, AlertCircle, Loader2, Plus, Edit2, Trash2, BookOpen, Film,
  PencilLine, ClipboardList, BarChart3, ChevronDown, ChevronRight, Folder, Radio
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
import HomeworkRunner from '@/components/live/HomeworkRunner'
import type { HomeworkSlot, HomeworkSlotType } from '@/lib/homework-grading'

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
  recording_url_2?: string
  document_url?: string
  homework_file_url?: string
  homework_title?: string
  homework_answer_key?: HomeworkSlot[]
  view_count?: number
  view_count_base?: number
  session_type?: 'ly_thuyet' | 'chua_bt'
  folder_label?: string | null
  homework_recording_url?: string | null
  homework_document_url?: string | null
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

// Chuyển link record sang URL nhúng được. Trả null nếu không nhận diện được.
function getRecordingEmbedUrl(url: string): string | null {
  if (!url) return null
  const yt = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|live\/|shorts\/)|youtu\.be\/)([\w-]{11})/
  )
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}`
  const drive = url.match(/drive\.google\.com\/file\/d\/([^/]+)/)
  if (drive) return `https://drive.google.com/file/d/${drive[1]}/preview`
  return null
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
  const [replay, setReplay] = useState<{ title: string; url: string } | null>(null)
  const [btvnSessionId, setBtvnSessionId] = useState<string | null>(null)
  const [resultsSession, setResultsSession] = useState<LiveClass | null>(null)

  // Form States
  const [formTitle, setFormTitle] = useState('')
  const [formTeacher, setFormTeacher] = useState('Thầy Ngọc Thái')
  const [formStartTime, setFormStartTime] = useState('')
  const [formEndTime, setFormEndTime] = useState('')
  const [formStatus, setFormStatus] = useState<'upcoming' | 'live' | 'ended'>('upcoming')
  const [formSubject, setFormSubject] = useState<'math' | 'english'>('math')
  const [formMeetUrl, setFormMeetUrl] = useState('')
  const [formRecordingUrl, setFormRecordingUrl] = useState('')
  const [formRecordingUrl2, setFormRecordingUrl2] = useState('')
  const [formDocumentUrl, setFormDocumentUrl] = useState('')
  const [formHomeworkUrl, setFormHomeworkUrl] = useState('')
  const [formHomeworkTitle, setFormHomeworkTitle] = useState('')
  const [formAnswerKey, setFormAnswerKey] = useState<HomeworkSlot[]>([])
  const [formViewCountBase, setFormViewCountBase] = useState(0)
  const [formSessionType, setFormSessionType] = useState<'ly_thuyet' | 'chua_bt'>('ly_thuyet')
  const [formFolderLabel, setFormFolderLabel] = useState('')
  const [formHomeworkRecordingUrl, setFormHomeworkRecordingUrl] = useState('')
  const [formHomeworkDocumentUrl, setFormHomeworkDocumentUrl] = useState('')
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({})
  const [openedLyThuyet, setOpenedLyThuyet] = useState<Record<string, boolean>>({})
  const [submittedSessions, setSubmittedSessions] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set()
    try { return new Set(JSON.parse(localStorage.getItem('btvn_submitted') ?? '[]')) } catch { return new Set() }
  })
  const [saving, setSaving] = useState(false)

  const isAdmin = user?.role === 'admin'

  const markSubmitted = (sessionId: string) => {
    setSubmittedSessions((prev) => {
      const next = new Set([...prev, sessionId])
      try { localStorage.setItem('btvn_submitted', JSON.stringify([...next])) } catch {}
      return next
    })
  }

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
    setFormMeetUrl('')
    setFormRecordingUrl('')
    setFormRecordingUrl2('')
    setFormDocumentUrl('')
    setFormHomeworkUrl('')
    setFormHomeworkTitle('')
    setFormAnswerKey([])
    setFormViewCountBase(0)
    setFormSessionType('ly_thuyet')
    setFormFolderLabel('')
    setFormHomeworkRecordingUrl('')
    setFormHomeworkDocumentUrl('')
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
    setFormRecordingUrl2(session.recording_url_2 || '')
    setFormDocumentUrl(session.document_url || '')
    setFormHomeworkUrl(session.homework_file_url || '')
    setFormHomeworkTitle(session.homework_title || '')
    setFormAnswerKey(Array.isArray(session.homework_answer_key) ? session.homework_answer_key : [])
    setFormViewCountBase(session.view_count_base ?? 0)
    setFormSessionType(session.session_type ?? 'ly_thuyet')
    setFormFolderLabel(session.folder_label ?? '')
    setFormHomeworkRecordingUrl(session.homework_recording_url ?? '')
    setFormHomeworkDocumentUrl(session.homework_document_url ?? '')
    setIsOpenDialog(true)
  }

  // BTVN answer-key builder
  const addAnswerSlot = () => {
    setFormAnswerKey((prev) => [
      ...prev,
      { stt: prev.length + 1, type: 'multiple_choice', correct: 'A' },
    ])
  }
  const removeAnswerSlot = (index: number) => {
    setFormAnswerKey((prev) =>
      prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, stt: i + 1 }))
    )
  }
  const changeSlotType = (index: number, type: HomeworkSlotType) => {
    setFormAnswerKey((prev) => prev.map((s, i) => {
      if (i !== index) return s
      const correct = type === 'multiple_choice' ? 'A'
        : type === 'true_false' ? [true, true, true, true]
        : ''
      return { ...s, type, correct }
    }))
  }
  const changeSlotCorrect = (index: number, correct: string | boolean[]) => {
    setFormAnswerKey((prev) => prev.map((s, i) => (i === index ? { ...s, correct } : s)))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formTitle || !formStartTime || !formEndTime) {
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
      meet_url: formMeetUrl || null,
      recording_url: formRecordingUrl || null,
      recording_url_2: formRecordingUrl2 || null,
      document_url: formDocumentUrl || null,
      homework_file_url: formHomeworkUrl || null,
      homework_title: formHomeworkTitle || null,
      homework_answer_key: formAnswerKey.length > 0 ? formAnswerKey : null,
      view_count_base: formViewCountBase,
      session_type: formSessionType,
      folder_label: formFolderLabel.trim() || null,
      homework_recording_url: formHomeworkRecordingUrl || null,
      homework_document_url: formHomeworkDocumentUrl || null,
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

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.details || 'Lỗi hệ thống khi lưu buổi học Live.')
      }
      
      toast({
        title: editingSession ? 'Cập nhật thành công' : 'Tạo buổi học thành công',
        description: `Buổi học Live đã được lưu trên cơ sở dữ liệu.`,
      })
      setIsOpenDialog(false)
      fetchSessions()
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Thao tác thất bại',
        description: err.message || 'Lỗi hệ thống khi lưu buổi học Live.',
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

  const trackView = (id: string) => {
    fetch(`/api/live/${id}/view`, { method: 'POST' }).catch(() => {})
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
          recording_url_2: session.recording_url_2 || '',
          document_url: session.document_url || '',
          homework_file_url: session.homework_file_url || '',
          homework_title: session.homework_title || '',
          homework_answer_key: session.homework_answer_key ?? null,
          view_count_base: session.view_count_base ?? 0,
          session_type: session.session_type ?? 'ly_thuyet',
          homework_recording_url: session.homework_recording_url || '',
          homework_document_url: session.homework_document_url || '',
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

  const STATUS_PRIORITY: Record<string, number> = { live: 0, upcoming: 1, ended: 2 }
  const sortedSessions = [...filteredSessions].sort((a, b) => {
    const sp = STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status]
    if (sp !== 0) return sp
    const asc = a.status !== 'ended'
    const tA = new Date(a.start_time).getTime()
    const tB = new Date(b.start_time).getTime()
    return asc ? tA - tB : tB - tA
  })

  const liveSessions = sortedSessions.filter((s) => s.status === 'live')
  const upcomingSessions = sortedSessions.filter((s) => s.status === 'upcoming')
  const endedSessions = sortedSessions.filter((s) => s.status === 'ended')

  const renderCard = (session: LiveClass) => {
    const isLive = session.status === 'live'
    const isEnded = session.status === 'ended'
    return (
      <Card
        key={session.id}
        className={`transition-all border ${
          isLive ? 'border-rose-500 shadow-md ring-1 ring-rose-500/20 bg-rose-500/5' : 'bg-card'
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
                {session.session_type && (
                  <span className={`text-[10px] font-bold px-2 py-0 h-5 rounded-full border flex items-center ${
                    session.session_type === 'ly_thuyet'
                      ? 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400'
                      : 'bg-orange-500/10 text-orange-600 border-orange-500/20 dark:text-orange-400'
                  }`}>
                    {session.session_type === 'ly_thuyet' ? '📖 Lý thuyết' : '✏️ Chữa BT'}
                  </span>
                )}
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" /> {session.teacher}
                </span>
              </div>
              <h3 className="font-bold text-sm md:text-base leading-snug break-words">{session.title}</h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> {formatSessionTime(session.start_time, session.end_time)}
              </p>
              {((session.view_count ?? 0) + (session.view_count_base ?? 0)) > 0 && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-primary" />
                  <span className="font-semibold text-primary">{((session.view_count ?? 0) + (session.view_count_base ?? 0)).toLocaleString('vi-VN')}</span> học sinh đã tham gia
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 w-full sm:w-auto sm:justify-end">
              {/* Vào học — chỉ live */}
              {isLive && (
                <Link href={`/live/${session.id}`} onClick={() => trackView(session.id)}>
                  <Button className="bg-rose-500 hover:bg-rose-600 text-white font-bold gap-1.5 h-9 shadow-sm text-sm">
                    <Play className="h-4 w-4 fill-current" />
                    Vào học ngay
                  </Button>
                </Link>
              )}
              {/* Admin: mở lớp khi upcoming */}
              {isAdmin && !isLive && !isEnded && (
                <Link href={`/live/${session.id}`}>
                  <Button variant="outline" size="sm" className="gap-1.5 border-rose-500/40 text-rose-600 hover:bg-rose-500/10">
                    <Radio className="h-3.5 w-3.5" />
                    Mở lớp học
                  </Button>
                </Link>
              )}

              {/* Nút Lý thuyết — hiện nếu có record hoặc bản viết tay */}
              {(session.recording_url || session.document_url) && (
                <div className="relative">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => setOpenedLyThuyet((p) => ({ ...p, [session.id]: !p[session.id] }))}
                  >
                    <BookOpen className="h-3.5 w-3.5" /> Lý thuyết
                  </Button>
                  {openedLyThuyet[session.id] && (
                    <div className="absolute bottom-full mb-1 left-0 flex gap-1 p-1 rounded-lg border bg-card shadow-lg z-10 whitespace-nowrap">
                      {session.recording_url && (() => {
                        const embed = getRecordingEmbedUrl(session.recording_url)
                        return embed ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="gap-1.5"
                            onClick={() => { trackView(session.id); setReplay({ title: session.title, url: session.recording_url! }) }}
                          >
                            <Play className="h-3.5 w-3.5" /> Record
                          </Button>
                        ) : (
                          <a href={session.recording_url} target="_blank" rel="noreferrer">
                            <Button size="sm" variant="ghost" className="gap-1.5">
                              <Play className="h-3.5 w-3.5" /> Record
                            </Button>
                          </a>
                        )
                      })()}
                      {session.recording_url_2 && (() => {
                        const embed2 = getRecordingEmbedUrl(session.recording_url_2)
                        return embed2 ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="gap-1.5"
                            onClick={() => { trackView(session.id); setReplay({ title: `${session.title} — Phần 2`, url: session.recording_url_2! }) }}
                          >
                            <Play className="h-3.5 w-3.5" /> Phần 2
                          </Button>
                        ) : (
                          <a href={session.recording_url_2} target="_blank" rel="noreferrer">
                            <Button size="sm" variant="ghost" className="gap-1.5">
                              <Play className="h-3.5 w-3.5" /> Phần 2
                            </Button>
                          </a>
                        )
                      })()}
                      {session.document_url && (
                        <a href={session.document_url} target="_blank" rel="noreferrer">
                          <Button size="sm" variant="ghost" className="gap-1.5">
                            <PencilLine className="h-3.5 w-3.5" /> Bản viết tay
                          </Button>
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Nộp / Xem giải BTVN */}
              {session.homework_file_url && (
                <Button
                  size="sm"
                  variant={submittedSessions.has(session.id) ? 'outline' : 'default'}
                  className="gap-1.5"
                  onClick={() => { trackView(session.id); setBtvnSessionId(session.id) }}
                >
                  <ClipboardList className="h-3.5 w-3.5" />
                  {submittedSessions.has(session.id) ? 'Xem giải BTVN' : 'Nộp BTVN'}
                </Button>
              )}

              {/* Upcoming chưa có gì */}
              {!isLive && !isEnded && !session.recording_url && !session.document_url && !session.homework_file_url && (
                <Button disabled variant="outline" className="text-xs h-9 opacity-60">
                  Chưa mở phòng
                </Button>
              )}
            </div>
          </div>

          {/* Admin Controls */}
          {isAdmin && (
            <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Admin Status:</span>
                <Button size="sm" variant={session.status === 'upcoming' ? 'default' : 'outline'} onClick={() => handleStatusToggle(session, 'upcoming')} className="h-7 px-2 text-[10px]">Sắp diễn ra</Button>
                <Button size="sm" variant={session.status === 'live' ? 'destructive' : 'outline'} onClick={() => handleStatusToggle(session, 'live')} className="h-7 px-2 text-[10px]">Đang Live</Button>
                <Button size="sm" variant={session.status === 'ended' ? 'secondary' : 'outline'} onClick={() => handleStatusToggle(session, 'ended')} className="h-7 px-2 text-[10px]">Kết thúc</Button>
              </div>
              <div className="flex items-center gap-1.5 ml-auto">
                {session.homework_file_url && (
                  <Button size="sm" variant="outline" onClick={() => setResultsSession(session)} className="h-8 gap-1 text-[10px]">
                    <BarChart3 className="h-3.5 w-3.5" /> Kết quả BTVN
                  </Button>
                )}
                <Button size="icon" variant="ghost" onClick={() => openEditDialog(session)} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => handleDelete(session.id)} className="h-8 w-8 text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

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
              ? 'border-primary text-primary'
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
              <div className="space-y-6">
                {/* Section: Đang diễn ra */}
                {liveSessions.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-rose-500 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 bg-rose-500 rounded-full animate-pulse inline-block" /> Đang diễn ra
                    </p>
                    {liveSessions.map((session) => renderCard(session))}
                  </div>
                )}

                {/* Section: Sắp diễn ra */}
                {upcomingSessions.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" /> Sắp diễn ra
                    </p>
                    {upcomingSessions.map((session) => renderCard(session))}
                  </div>
                )}

                {/* Section: Đã kết thúc — grouped by folder_label */}
                {endedSessions.length > 0 && (() => {
                  const grouped: Record<string, LiveClass[]> = {}
                  for (const s of endedSessions) {
                    const key = s.folder_label?.trim() || '📼 Buổi đã kết thúc'
                    grouped[key] = [...(grouped[key] || []), s]
                  }
                  return Object.entries(grouped).map(([label, sessions]) => {
                    const isOpen = openFolders[label] ?? false
                    return (
                      <div key={label} className="rounded-xl border border-border/60 overflow-hidden">
                        <button
                          onClick={() => setOpenFolders((prev) => ({ ...prev, [label]: !isOpen }))}
                          className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
                        >
                          <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                            <Folder className="h-3.5 w-3.5" /> {label}
                            <span className="text-[10px] font-normal normal-case bg-border rounded-full px-2 py-0.5">{sessions.length} buổi</span>
                          </span>
                          {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                        </button>
                        {isOpen && (
                          <div className="p-3 space-y-3 border-t border-border/40">
                            {sessions.map((session) => renderCard(session))}
                          </div>
                        )}
                      </div>
                    )
                  })
                })()}
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
        <DialogContent className="max-w-md w-[95vw] max-h-[90vh] overflow-y-auto">
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

            {/* Session Type & Folder Label */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Loại buổi học</label>
                <select
                  value={formSessionType}
                  onChange={(e) => setFormSessionType(e.target.value as 'ly_thuyet' | 'chua_bt')}
                  className="w-full px-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="ly_thuyet">📖 Lý thuyết</option>
                  <option value="chua_bt">✏️ Chữa bài tập</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
                  <Folder className="h-3 w-3" /> Thư mục (tùy chọn)
                </label>
                <input
                  type="text"
                  value={formFolderLabel}
                  onChange={(e) => setFormFolderLabel(e.target.value)}
                  placeholder="VD: Tháng 6, Chuyên đề..."
                  className="w-full px-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
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
                <label className="text-xs font-bold text-muted-foreground uppercase">Google Meet URL (Để trống để tự tạo)</label>
                <input
                  type="url"
                  value={formMeetUrl}
                  onChange={(e) => setFormMeetUrl(e.target.value)}
                  placeholder="https://meet.google.com/..."
                  className="w-full px-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            {/* Document & Recording URL */}
            <div className="space-y-3 border-t border-border/40 pt-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1 text-teal-600 dark:text-teal-400">
                  <Film className="h-3 w-3" /> Link Video Xem lại — Phần 1 (Nếu có)
                </label>
                <input
                  type="url"
                  value={formRecordingUrl}
                  onChange={(e) => setFormRecordingUrl(e.target.value)}
                  placeholder="https://youtu.be/... hoặc https://drive.google.com/..."
                  className="w-full px-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1 text-teal-600 dark:text-teal-400">
                  <Film className="h-3 w-3" /> Link Video Xem lại — Phần 2 (Nếu có)
                </label>
                <input
                  type="url"
                  value={formRecordingUrl2}
                  onChange={(e) => setFormRecordingUrl2(e.target.value)}
                  placeholder="https://youtu.be/... hoặc https://drive.google.com/..."
                  className="w-full px-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1 text-primary">
                  <PencilLine className="h-3 w-3" /> Link File viết tay (Nếu có)
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

            {/* BTVN */}
            <div className="space-y-3 border-t border-border/40 pt-3">
              <p className="text-xs font-black uppercase flex items-center gap-1 text-primary">
                <ClipboardList className="h-3.5 w-3.5" /> Bài tập về nhà (BTVN)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Tên BTVN</label>
                  <input
                    type="text"
                    value={formHomeworkTitle}
                    onChange={(e) => setFormHomeworkTitle(e.target.value)}
                    placeholder="VD: BTVN buổi 3 — Tích phân"
                    className="w-full px-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Link đề BTVN (PDF/Drive)</label>
                  <input
                    type="url"
                    value={formHomeworkUrl}
                    onChange={(e) => setFormHomeworkUrl(e.target.value)}
                    placeholder="https://drive.google.com/file/d/..."
                    className="w-full px-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1 text-rose-600 dark:text-rose-400">
                  <Play className="h-3 w-3" /> Link record giải BTVN (sau khi nộp)
                </label>
                <input
                  type="url"
                  value={formHomeworkRecordingUrl}
                  onChange={(e) => setFormHomeworkRecordingUrl(e.target.value)}
                  placeholder="https://youtu.be/... hoặc https://drive.google.com/..."
                  className="w-full px-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1 text-rose-600 dark:text-rose-400">
                  <PencilLine className="h-3 w-3" /> Link bản viết tay lời giải (sau khi nộp)
                </label>
                <input
                  type="url"
                  value={formHomeworkDocumentUrl}
                  onChange={(e) => setFormHomeworkDocumentUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/..."
                  className="w-full px-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Bảng đáp án */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Bảng đáp án ({formAnswerKey.length} câu)</label>
                  <Button type="button" size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={addAnswerSlot}>
                    <Plus className="h-3.5 w-3.5" /> Thêm câu
                  </Button>
                </div>
                {formAnswerKey.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">Chưa có câu nào. Bấm &quot;Thêm câu&quot; để tạo ô nhập đáp án.</p>
                )}
                <div className="space-y-2">
                  {formAnswerKey.map((slot, idx) => (
                    <div key={idx} className="flex flex-wrap items-center gap-2 rounded-lg border border-border/60 bg-muted/30 p-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">{slot.stt}</span>
                      <select
                        value={slot.type}
                        onChange={(e) => changeSlotType(idx, e.target.value as HomeworkSlotType)}
                        className="text-xs rounded-md border bg-background px-2 py-1.5"
                      >
                        <option value="multiple_choice">Trắc nghiệm</option>
                        <option value="true_false">Đúng/Sai</option>
                        <option value="short_answer">Trả lời ngắn</option>
                      </select>

                      {/* Đáp án đúng theo loại */}
                      {slot.type === 'multiple_choice' && (
                        <div className="flex gap-1">
                          {['A', 'B', 'C', 'D'].map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => changeSlotCorrect(idx, c)}
                              className={`h-7 w-7 rounded-md border text-xs font-bold ${slot.correct === c ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'}`}
                            >{c}</button>
                          ))}
                        </div>
                      )}
                      {slot.type === 'true_false' && (
                        <div className="flex flex-wrap gap-2">
                          {['a', 'b', 'c', 'd'].map((lab, i) => {
                            const arr = Array.isArray(slot.correct) ? slot.correct : [true, true, true, true]
                            return (
                              <div key={i} className="flex items-center gap-0.5">
                                <span className="text-[10px] font-bold text-muted-foreground">{lab}</span>
                                <button type="button" onClick={() => { const n = [...arr]; n[i] = true; changeSlotCorrect(idx, n) }}
                                  className={`h-6 w-6 rounded text-[10px] font-bold border ${arr[i] === true ? 'bg-emerald-500 text-white border-emerald-500' : 'border-border'}`}>Đ</button>
                                <button type="button" onClick={() => { const n = [...arr]; n[i] = false; changeSlotCorrect(idx, n) }}
                                  className={`h-6 w-6 rounded text-[10px] font-bold border ${arr[i] === false ? 'bg-rose-500 text-white border-rose-500' : 'border-border'}`}>S</button>
                              </div>
                            )
                          })}
                        </div>
                      )}
                      {slot.type === 'short_answer' && (
                        <input
                          type="text"
                          inputMode="decimal"
                          value={typeof slot.correct === 'string' ? slot.correct : ''}
                          onChange={(e) => changeSlotCorrect(idx, e.target.value)}
                          placeholder="Đáp án (số)"
                          className="text-xs rounded-md border bg-background px-2 py-1.5 w-28"
                        />
                      )}

                      <button type="button" onClick={() => removeAnswerSlot(idx)} className="ml-auto text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Social proof */}
            <div className="space-y-1 border-t border-border/40 pt-3">
              <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
                <Users className="h-3 w-3" /> Số học sinh (nền) — hiển thị cộng thêm vào lượt thật
              </label>
              <input
                type="number"
                min="0"
                value={formViewCountBase}
                onChange={(e) => setFormViewCountBase(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
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

      {/* Replay video player */}
      <Dialog open={!!replay} onOpenChange={(open) => !open && setReplay(null)}>
        <DialogContent className="max-w-3xl p-3 sm:p-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base pr-6">
              <Film className="h-4 w-4 text-rose-500 shrink-0" />
              <span className="truncate">{replay?.title}</span>
            </DialogTitle>
          </DialogHeader>
          {replay && (
            <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
              <iframe
                src={getRecordingEmbedUrl(replay.url) ?? undefined}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={replay.title}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* BTVN runner (học sinh làm bài) */}
      {btvnSessionId && (
        <HomeworkRunner
          sessionId={btvnSessionId}
          open={!!btvnSessionId}
          onClose={() => setBtvnSessionId(null)}
          onSubmitted={() => markSubmitted(btvnSessionId)}
          initiallySubmitted={submittedSessions.has(btvnSessionId)}
        />
      )}

      {/* Kết quả BTVN (admin) */}
      {resultsSession && (
        <HomeworkResultsDialog
          session={resultsSession}
          onClose={() => setResultsSession(null)}
        />
      )}
    </div>
  )
}

interface HwResult {
  id: string
  student_name: string | null
  student_email: string | null
  score: number
  max_score: number
  correct_count: number
  total_count: number
  time_spent_seconds: number | null
  created_at: string
}

function HomeworkResultsDialog({ session, onClose }: { session: LiveClass; onClose: () => void }) {
  const [loading, setLoading] = useState(true)
  const [results, setResults] = useState<HwResult[]>([])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/admin/live/homework-results?sessionId=${session.id}`)
        const data = await res.json()
        if (!cancelled) setResults(data.results ?? [])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [session.id])

  const fmtTime = (s: number | null) => {
    if (!s) return '—'
    const m = Math.floor(s / 60)
    const sec = Math.round(s % 60)
    return `${m}p${sec.toString().padStart(2, '0')}`
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base pr-6">
            <BarChart3 className="h-4 w-4 text-primary shrink-0" />
            <span className="truncate">Kết quả BTVN — {session.homework_title || session.title}</span>
          </DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : results.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Chưa có học sinh nào nộp bài.</p>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Học sinh</th>
                  <th className="px-3 py-2 text-center font-medium">Điểm</th>
                  <th className="px-3 py-2 text-center font-medium">Đúng</th>
                  <th className="px-3 py-2 text-center font-medium">Thời gian</th>
                  <th className="px-3 py-2 text-right font-medium">Nộp lúc</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {results.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/30">
                    <td className="px-3 py-2">
                      <p className="font-medium truncate max-w-[180px]">{r.student_name || 'Học sinh'}</p>
                      <p className="text-[11px] text-muted-foreground truncate max-w-[180px]">{r.student_email}</p>
                    </td>
                    <td className="px-3 py-2 text-center font-bold text-primary">{r.score}/{r.max_score}</td>
                    <td className="px-3 py-2 text-center">{r.correct_count}/{r.total_count}</td>
                    <td className="px-3 py-2 text-center text-muted-foreground">{fmtTime(r.time_spent_seconds)}</td>
                    <td className="px-3 py-2 text-right text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
