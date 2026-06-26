'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useLocalParticipant,
} from '@livekit/components-react'
import {
  Mic, MicOff, Hand, Users, MessageSquare, Send, Loader2,
  Crown, Video, LogOut, CheckCircle2, XCircle,
  Radio, Copy, Check, BarChart3, VolumeX, Timer, Plus, Megaphone,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import HlsPlayer from '@/components/live/HlsPlayer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'

// ─── Types ───────────────────────────────────────────────
interface RoomInfo {
  token: string
  livekitUrl: string
  hlsUrl: string
  roomName: string
  sessionTitle: string
  sessionStatus: string
  isAdmin: boolean
  userId: string
  userName: string
  userAvatar?: string
}

interface ChatMessage {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  text: string
  time: number
  isReaction?: boolean
}

interface HandRaiser {
  userId: string
  userName: string
  time: number
}

interface OnlineUser {
  userId: string
  userName: string
  userAvatar?: string
  isAdmin: boolean
}

// ─── Main export ─────────────────────────────────────────
export default function ClassroomPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const sessionId = params.id as string

  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Admin: start stream
  const [startResult, setStartResult] = useState<{ rtmpUrl: string; streamKey: string; hlsUrl: string } | null>(null)
  const [starting, setStarting] = useState(false)
  const [copied, setCopied] = useState(false)

  const fetchToken = useCallback(async () => {
    try {
      const res = await fetch(`/api/live/${sessionId}/token`)
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Không thể vào phòng học')
      }
      const data = await res.json()
      setRoomInfo(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  useEffect(() => {
    fetchToken()
  }, [fetchToken])

  const handleStartStream = async () => {
    setStarting(true)
    try {
      const res = await fetch(`/api/admin/live/${sessionId}/start`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setStartResult({ rtmpUrl: data.rtmpUrl, streamKey: data.streamKey, hlsUrl: data.hlsUrl })
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Lỗi', description: err.message })
    } finally {
      setStarting(false)
    }
  }

  const copyKey = () => {
    if (!startResult) return
    navigator.clipboard.writeText(startResult.streamKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Đang kết nối phòng học...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <div className="text-center space-y-4 max-w-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 mx-auto">
            <XCircle className="h-7 w-7 text-destructive" />
          </div>
          <div>
            <h2 className="font-bold text-lg">Không thể vào lớp học</h2>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
          <Button onClick={() => router.push('/live')}>Quay lại lịch học</Button>
        </div>
      </div>
    )
  }

  if (!roomInfo) return null

  // Admin: buổi học chưa bắt đầu → hiện nút "Mở lớp"
  if (roomInfo.isAdmin && roomInfo.sessionStatus !== 'live') {
    return (
      <div className="max-w-lg mx-auto space-y-6 py-12">
        <div className="text-center space-y-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/10 mx-auto">
            <Radio className="h-7 w-7 text-rose-500" />
          </div>
          <h1 className="text-xl font-bold">{roomInfo.sessionTitle}</h1>
          <p className="text-sm text-muted-foreground">Buổi học chưa được mở. Bắt đầu để tạo phòng và nhận link RTMP cho Meld Studio.</p>
        </div>

        {!startResult ? (
          <Button
            onClick={handleStartStream}
            disabled={starting}
            className="w-full bg-rose-500 hover:bg-rose-600 text-white gap-2 h-12 text-base font-bold"
          >
            {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Radio className="h-4 w-4" />}
            Mở lớp học
          </Button>
        ) : (
          <div className="space-y-4 rounded-xl border p-5 bg-muted/30">
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-semibold text-sm">Phòng học đã tạo thành công!</span>
            </div>
            <div className="space-y-2">
              <div className="space-y-1">
                <p className="text-xs font-bold text-muted-foreground uppercase">Stream URL</p>
                <code className="block text-xs bg-background border rounded-lg px-3 py-2 font-mono truncate">
                  {startResult.rtmpUrl}
                </code>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-muted-foreground uppercase">Stream Key (cố định)</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-background border rounded-lg px-3 py-2 font-mono">
                    {startResult.streamKey}
                  </code>
                  <Button size="icon" variant="outline" className="h-9 w-9 shrink-0" onClick={copyKey}>
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Sau khi dán vào Meld Studio và bắt đầu stream, học sinh sẽ thấy video của bạn trong vài giây.
            </p>
            <Button onClick={() => window.location.reload()} className="w-full">
              Vào phòng dạy học
            </Button>
          </div>
        )}
      </div>
    )
  }

  return <ClassroomContent sessionId={sessionId} roomInfo={roomInfo} />
}

// ─── Mic layer (chỉ mount khi cần dùng mic — giữ slot LiveKit tối thiểu) ───
function MicController({ publishMic }: { publishMic: boolean }) {
  const { localParticipant } = useLocalParticipant()
  useEffect(() => {
    if (!localParticipant) return
    localParticipant.setMicrophoneEnabled(publishMic).catch(() => {})
  }, [localParticipant, publishMic])
  return null
}

function MicLayer({
  serverUrl, token, publishMic,
}: { serverUrl: string; token: string; publishMic: boolean }) {
  if (!serverUrl || !token) return null
  return (
    <LiveKitRoom serverUrl={serverUrl} token={token} connect audio={false} video={false}>
      <RoomAudioRenderer />
      <MicController publishMic={publishMic} />
    </LiveKitRoom>
  )
}

// ─── Classroom Content ───────────────────────────────────
function ClassroomContent({
  sessionId,
  roomInfo,
}: {
  sessionId: string
  roomInfo: RoomInfo
}) {
  const { toast } = useToast()
  const router = useRouter()
  const me = {
    userId: roomInfo.userId,
    userName: roomInfo.userName,
    userAvatar: roomInfo.userAvatar,
    isAdmin: roomInfo.isAdmin,
  }

  const [mobileTab, setMobileTab] = useState<'video' | 'chat' | 'people'>('video')
  const [online, setOnline] = useState<OnlineUser[]>([])
  const [speakers, setSpeakers] = useState<Set<string>>(new Set())

  // Mic state
  const [adminMic, setAdminMic] = useState(false)   // admin bật/tắt mic của mình
  const [micApproved, setMicApproved] = useState(false) // học sinh được duyệt nói
  const [speaking, setSpeaking] = useState(false)   // học sinh đang bật mic

  const chatStorageKey = `live_chat_${sessionId}`
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window === 'undefined') return []
    try { return JSON.parse(localStorage.getItem(chatStorageKey) ?? '[]') } catch { return [] }
  })
  const [chatInput, setChatInput] = useState('')
  const [handRaisers, setHandRaisers] = useState<HandRaiser[]>([])
  const [handRaised, setHandRaised] = useState(false)
  const [reactionCounts, setReactionCounts] = useState({ understood: 0, confused: 0 })
  const [announcement, setAnnouncement] = useState<string | null>(null)
  const [announcementInput, setAnnouncementInput] = useState('')
  const [slowMode, setSlowMode] = useState(false)
  const [lastChatTime, setLastChatTime] = useState(0)
  const [activePoll, setActivePoll] = useState<{ question: string; options: string[]; votes: Record<string, string[]> } | null>(null)
  const [pollQuestion, setPollQuestion] = useState('')
  const [pollOptions, setPollOptions] = useState(['', ''])
  const [myVote, setMyVote] = useState<string | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  // ── Xử lý message đến (ref để tránh stale closure mà không phải resubscribe) ──
  const handleMsg = (data: any) => {
    if (!data?.type) return

    if (data.type === 'chat' || data.type === 'reaction') {
      setMessages(prev => {
        if (prev.some(m => m.id === `${data.userId}-${data.time}`)) return prev
        return [...prev, {
          id: `${data.userId}-${data.time}`,
          userId: data.userId,
          userName: data.userName,
          userAvatar: data.userAvatar,
          text: data.text,
          time: data.time,
          isReaction: data.type === 'reaction',
        }]
      })
      if (data.type === 'reaction') {
        setReactionCounts(prev => ({
          ...prev,
          [data.text === '1' ? 'understood' : 'confused']:
            prev[data.text === '1' ? 'understood' : 'confused'] + 1,
        }))
      }
    } else if (data.type === 'raise_hand') {
      setHandRaisers(prev => prev.some(h => h.userId === data.userId)
        ? prev
        : [...prev, { userId: data.userId, userName: data.userName, time: data.time }])
      if (me.isAdmin) toast({ title: `✋ ${data.userName} giơ tay`, description: 'Học sinh muốn phát biểu' })
    } else if (data.type === 'lower_hand') {
      setHandRaisers(prev => prev.filter(h => h.userId !== data.userId))
    } else if (data.type === 'mic_approved') {
      setSpeakers(prev => new Set(prev).add(data.forUserId))
      if (data.forUserId === me.userId) {
        setMicApproved(true)
        setHandRaised(false)
        toast({ title: '🎤 Bạn được phép phát biểu', description: 'Bấm "Bật mic" để nói' })
      }
    } else if (data.type === 'mic_revoked') {
      setSpeakers(prev => { const n = new Set(prev); n.delete(data.forUserId); return n })
      if (data.forUserId === me.userId) {
        setMicApproved(false)
        setSpeaking(false)
        toast({ description: 'Giáo viên đã tắt quyền nói của bạn' })
      }
    } else if (data.type === 'kicked') {
      if (data.forUserId === me.userId) {
        toast({ variant: 'destructive', description: 'Bạn đã bị mời khỏi lớp học' })
        setTimeout(() => router.push('/live'), 1500)
      }
    } else if (data.type === 'announcement') {
      setAnnouncement(data.text || null)
    } else if (data.type === 'poll') {
      setActivePoll({ question: data.question, options: data.options, votes: {} })
      setMyVote(null)
    } else if (data.type === 'poll_vote') {
      setActivePoll(prev => {
        if (!prev) return null
        const votes = { ...prev.votes }
        const opt = data.option as string
        if (!votes[opt]) votes[opt] = []
        if (!votes[opt].includes(data.userId)) votes[opt] = [...votes[opt], data.userId]
        return { ...prev, votes }
      })
    } else if (data.type === 'end_session') {
      if (!me.isAdmin) {
        toast({ description: 'Buổi học đã kết thúc' })
        setTimeout(() => router.push('/live'), 1500)
      }
    }
  }
  const handlerRef = useRef(handleMsg)
  handlerRef.current = handleMsg

  // ── Kết nối Supabase Realtime (broadcast + presence) ──
  useEffect(() => {
    const ch = supabase.channel(`live-${sessionId}`, {
      config: { broadcast: { self: false }, presence: { key: me.userId } },
    })

    ch.on('broadcast', { event: 'msg' }, ({ payload }) => handlerRef.current(payload))
    ch.on('presence', { event: 'sync' }, () => {
      const state = ch.presenceState() as Record<string, any[]>
      const users: OnlineUser[] = Object.values(state)
        .map(arr => arr[0])
        .filter(Boolean)
        .map(m => ({ userId: m.userId, userName: m.userName, userAvatar: m.userAvatar, isAdmin: m.isAdmin }))
      setOnline(users)
    })

    ch.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await ch.track({
          userId: me.userId,
          userName: me.userName,
          userAvatar: me.userAvatar ?? '',
          isAdmin: me.isAdmin,
        })
      }
    })

    channelRef.current = ch
    return () => {
      supabase.removeChannel(ch)
      channelRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, me.userId])

  const broadcast = useCallback((type: string, payload: Record<string, unknown>) => {
    channelRef.current?.send({ type: 'broadcast', event: 'msg', payload: { type, ...payload } })
  }, [])

  // Persist chat + scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    try { localStorage.setItem(chatStorageKey, JSON.stringify(messages.slice(-200))) } catch {}
  }, [messages, chatStorageKey])

  // ── Số học sinh (không tính admin) ──
  const studentCount = online.filter(u => !u.isAdmin).length

  // ── Actions ──
  const sendChat = () => {
    const text = chatInput.trim()
    if (!text) return
    if (slowMode && !me.isAdmin && Date.now() - lastChatTime < 5000) {
      toast({ description: 'Chế độ chậm: chờ 5 giây giữa các tin nhắn' })
      return
    }
    const time = Date.now()
    broadcast('chat', { userId: me.userId, userName: me.userName, userAvatar: me.userAvatar, text, time })
    setMessages(prev => [...prev, { id: `${me.userId}-${time}`, userId: me.userId, userName: me.userName, userAvatar: me.userAvatar, text, time }])
    setChatInput('')
    setLastChatTime(time)
  }

  const sendReaction = (value: '1' | '0') => {
    const time = Date.now()
    broadcast('reaction', { userId: me.userId, userName: me.userName, userAvatar: me.userAvatar, text: value, time })
    setMessages(prev => [...prev, { id: `${me.userId}-${time}`, userId: me.userId, userName: me.userName, userAvatar: me.userAvatar, text: value, time, isReaction: true }])
    setReactionCounts(prev => ({
      ...prev,
      [value === '1' ? 'understood' : 'confused']: prev[value === '1' ? 'understood' : 'confused'] + 1,
    }))
  }

  const toggleHand = () => {
    const nowRaised = !handRaised
    setHandRaised(nowRaised)
    broadcast(nowRaised ? 'raise_hand' : 'lower_hand', {
      userId: me.userId, userName: me.userName, time: Date.now(),
    })
  }

  const toggleMic = () => {
    if (me.isAdmin) {
      setAdminMic(v => !v)
      return
    }
    if (!micApproved) {
      toast({ description: 'Giơ tay và chờ giáo viên cho phép trước khi bật mic' })
      return
    }
    setSpeaking(v => !v)
  }

  // Admin controls (qua broadcast — không tốn slot LiveKit)
  const approveMic = (userId: string) => {
    broadcast('mic_approved', { forUserId: userId })
    setSpeakers(prev => new Set(prev).add(userId))
    setHandRaisers(prev => prev.filter(h => h.userId !== userId))
  }
  const revokeMic = (userId: string) => {
    broadcast('mic_revoked', { forUserId: userId })
    setSpeakers(prev => { const n = new Set(prev); n.delete(userId); return n })
  }
  const kick = (userId: string) => {
    broadcast('kicked', { forUserId: userId })
    toast({ description: 'Đã mời học sinh khỏi lớp' })
  }
  const muteAll = () => {
    online.filter(u => !u.isAdmin).forEach(u => broadcast('mic_revoked', { forUserId: u.userId }))
    setSpeakers(new Set())
    toast({ description: 'Đã tắt mic tất cả học sinh' })
  }

  const sendAnnouncement = () => {
    const text = announcementInput.trim()
    if (!text) return
    broadcast('announcement', { text })
    setAnnouncement(text)
    setAnnouncementInput('')
  }
  const clearAnnouncement = () => {
    broadcast('announcement', { text: '' })
    setAnnouncement(null)
  }

  const createPoll = () => {
    const q = pollQuestion.trim()
    const opts = pollOptions.map(o => o.trim()).filter(Boolean)
    if (!q || opts.length < 2) {
      toast({ description: 'Cần câu hỏi và ít nhất 2 lựa chọn' })
      return
    }
    broadcast('poll', { question: q, options: opts })
    setActivePoll({ question: q, options: opts, votes: {} })
    setPollQuestion('')
    setPollOptions(['', ''])
    setMyVote(null)
  }
  const votePoll = (option: string) => {
    if (myVote) return
    broadcast('poll_vote', { userId: me.userId, option })
    setMyVote(option)
    setActivePoll(prev => {
      if (!prev) return null
      const votes = { ...prev.votes }
      if (!votes[option]) votes[option] = []
      votes[option] = [...votes[option], me.userId]
      return { ...prev, votes }
    })
  }

  const endSession = async () => {
    if (!confirm('Kết thúc buổi học? Tất cả học sinh sẽ bị ngắt kết nối.')) return
    broadcast('end_session', {})
    try {
      await fetch(`/api/admin/live/${sessionId}/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'end_session', participantIdentity: '' }),
      })
    } catch {}
    window.location.href = '/live'
  }

  // Có cần kết nối LiveKit không (chỉ admin hoặc HS đang nói)
  const audioActive = me.isAdmin || speaking
  const publishMic = me.isAdmin ? adminMic : speaking
  const micButtonOn = me.isAdmin ? adminMic : speaking

  // ─── Chat panel ──────────────────────────────────────
  const chatPanel = (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-border/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Chat</span>
        </div>
        {me.isAdmin && (reactionCounts.understood > 0 || reactionCounts.confused > 0) && (
          <div className="flex items-center gap-2 text-[10px]">
            <span className="text-emerald-600">Hiểu {reactionCounts.understood}</span>
            <span className="text-rose-500">Chưa {reactionCounts.confused}</span>
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 min-h-0">
        {messages.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-8">Chưa có tin nhắn nào</p>
        )}
        {messages.map(msg => (
          <div key={msg.id} className={cn('flex gap-2', msg.isReaction && 'opacity-70')}>
            {msg.userAvatar && !msg.isReaction ? (
              <img src={msg.userAvatar} alt="" className="h-7 w-7 rounded-full shrink-0 object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className={cn(
                'h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0',
                msg.isReaction
                  ? msg.text === '1' ? 'bg-emerald-500/20 text-emerald-600' : 'bg-rose-500/20 text-rose-500'
                  : 'bg-primary/10 text-primary'
              )}>
                {msg.isReaction ? (msg.text === '1' ? '✓' : '?') : (msg.userName[0] ?? 'H').toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-[11px] font-semibold text-foreground truncate">{msg.userName}</span>
                <span className="text-[9px] text-muted-foreground shrink-0">
                  {new Date(msg.time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed break-words">
                {msg.isReaction ? (msg.text === '1' ? 'Hiểu bài' : 'Chưa hiểu') : msg.text}
              </p>
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      <div className="p-2 border-t border-border/60 space-y-2">
        <div className="flex gap-2">
          <input
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChat()}
            placeholder="Nhắn tin..."
            className="flex-1 text-xs rounded-lg border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <Button size="icon" className="h-9 w-9 shrink-0" onClick={sendChat}>
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
        {!me.isAdmin && (
          <div className="flex gap-1.5">
            <Button size="sm" variant="outline" className="flex-1 h-8 text-[11px] gap-1 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10" onClick={() => sendReaction('1')}>
              <CheckCircle2 className="h-3.5 w-3.5" /> Hiểu bài
            </Button>
            <Button size="sm" variant="outline" className="flex-1 h-8 text-[11px] gap-1 text-rose-500 border-rose-500/30 hover:bg-rose-500/10" onClick={() => sendReaction('0')}>
              <XCircle className="h-3.5 w-3.5" /> Chưa hiểu
            </Button>
          </div>
        )}
      </div>
    </div>
  )

  // ─── People panel ─────────────────────────────────────
  const peoplePanel = (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-border/60 flex items-center gap-2">
        <Users className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {studentCount} học sinh online
        </span>
      </div>

      {handRaisers.length > 0 && (
        <div className="border-b border-border/60 p-2 space-y-1.5">
          <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1">
            <Hand className="h-3 w-3" /> Đang giơ tay
          </p>
          {handRaisers.map(h => (
            <div key={h.userId} className="flex items-center justify-between rounded-lg bg-amber-500/10 px-2 py-1.5">
              <span className="text-xs font-medium truncate mr-2">{h.userName}</span>
              {me.isAdmin && (
                <div className="flex gap-1 shrink-0">
                  <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] text-emerald-600 hover:bg-emerald-500/10" onClick={() => approveMic(h.userId)}>
                    <Mic className="h-3 w-3 mr-1" /> Cho phép
                  </Button>
                  <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] text-muted-foreground hover:bg-muted" onClick={() => setHandRaisers(prev => prev.filter(x => x.userId !== h.userId))}>
                    <XCircle className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-0">
        {online.map(p => {
          const isSpeaker = speakers.has(p.userId)
          return (
            <div key={p.userId} className="group flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/40 transition-colors">
              {p.userAvatar ? (
                <img src={p.userAvatar} alt="" className="h-6 w-6 rounded-full shrink-0 object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 bg-muted text-muted-foreground">
                  {(p.userName ?? 'H')[0].toUpperCase()}
                </div>
              )}
              <span className="text-xs truncate flex-1 flex items-center gap-1">
                {p.userName ?? 'Học sinh'}
                {p.isAdmin && <Crown className="h-3 w-3 text-yellow-500" />}
              </span>
              {isSpeaker && <Mic className="h-3 w-3 text-emerald-500 shrink-0" />}
              {me.isAdmin && !p.isAdmin && (
                <div className="flex gap-0.5 shrink-0 opacity-0 group-hover:opacity-100">
                  {isSpeaker && (
                    <Button size="icon" variant="ghost" className="h-5 w-5" title="Tắt quyền nói" onClick={() => revokeMic(p.userId)}>
                      <MicOff className="h-3 w-3" />
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" className="h-5 w-5 text-destructive" title="Mời ra" onClick={() => kick(p.userId)}>
                    <XCircle className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      {/* Mic layer — chỉ kết nối LiveKit khi cần */}
      {audioActive && (
        <MicLayer serverUrl={roomInfo.livekitUrl} token={roomInfo.token} publishMic={publishMic} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/60 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Badge variant="destructive" className="gap-1 text-[10px] shrink-0 animate-pulse">
            <span className="h-1.5 w-1.5 bg-white rounded-full" /> LIVE
          </Badge>
          <span className="text-sm font-semibold truncate">{roomInfo.sessionTitle}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-xs text-muted-foreground hidden sm:block">{studentCount} học sinh</span>
          {me.isAdmin && (
            <Button size="sm" variant="destructive" className="h-7 text-xs gap-1 ml-2" onClick={endSession}>
              <LogOut className="h-3 w-3" /> Kết thúc
            </Button>
          )}
        </div>
      </div>

      {/* Announcement banner */}
      {announcement && (
        <div className="shrink-0 px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-2">
          <Megaphone className="h-3.5 w-3.5 text-amber-600 shrink-0" />
          <p className="text-xs font-medium text-amber-700 dark:text-amber-400 flex-1">{announcement}</p>
          {me.isAdmin && (
            <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={clearAnnouncement}>
              <XCircle className="h-3 w-3" />
            </Button>
          )}
        </div>
      )}

      {/* Active poll */}
      {activePoll && (
        <div className="shrink-0 px-4 py-2 bg-primary/5 border-b border-primary/20 space-y-1.5">
          <p className="text-xs font-bold flex items-center gap-1.5">
            <BarChart3 className="h-3.5 w-3.5 text-primary" /> {activePoll.question}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {activePoll.options.map(opt => {
              const count = activePoll.votes[opt]?.length ?? 0
              const total = Object.values(activePoll.votes).reduce((s, v) => s + v.length, 0)
              const pct = total > 0 ? Math.round((count / total) * 100) : 0
              return (
                <Button key={opt} size="sm" variant={myVote === opt ? 'default' : 'outline'} className="h-7 text-[11px] gap-1" onClick={() => votePoll(opt)} disabled={!!myVote}>
                  {opt} {(me.isAdmin || myVote) && <span className="text-[10px] opacity-70">({count} · {pct}%)</span>}
                </Button>
              )
            })}
          </div>
          {me.isAdmin && (
            <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => setActivePoll(null)}>Đóng poll</Button>
          )}
        </div>
      )}

      {/* Main layout */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Mobile tab bar */}
          <div className="flex md:hidden border-b border-border/60 shrink-0">
            {(['video', 'chat', 'people'] as const).map(tab => (
              <button key={tab} onClick={() => setMobileTab(tab)}
                className={cn('flex-1 py-2 text-[11px] font-semibold transition-colors flex items-center justify-center gap-1',
                  mobileTab === tab ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground')}>
                {tab === 'video' && <><Video className="h-3.5 w-3.5" /> Video</>}
                {tab === 'chat' && <><MessageSquare className="h-3.5 w-3.5" /> Chat</>}
                {tab === 'people' && <><Users className="h-3.5 w-3.5" /> {studentCount}</>}
              </button>
            ))}
          </div>

          {/* Video area */}
          <div className={cn('bg-black overflow-hidden md:flex-1', mobileTab === 'video' ? 'flex-1' : 'hidden md:flex')}>
            <HlsPlayer src={roomInfo.hlsUrl} className="w-full h-full" />
          </div>

          {/* Mobile panels */}
          <div className={cn('flex-1 overflow-hidden md:hidden', mobileTab === 'chat' ? 'flex flex-col' : 'hidden')}>
            {chatPanel}
          </div>
          <div className={cn('flex-1 overflow-hidden md:hidden', mobileTab === 'people' ? 'flex flex-col' : 'hidden')}>
            {peoplePanel}
          </div>
        </div>

        {/* Desktop sidebar */}
        <div className="hidden md:flex flex-col w-72 border-l border-border/60 shrink-0 overflow-hidden">
          <div className="flex-[3] border-b border-border/60 overflow-hidden flex flex-col">{chatPanel}</div>
          <div className="flex-[2] overflow-hidden flex flex-col">{peoplePanel}</div>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="shrink-0 border-t border-border/60 px-4 py-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button size="sm" variant={micButtonOn ? 'default' : 'outline'}
            className={cn('gap-1.5 h-9', !me.isAdmin && !micApproved && 'opacity-50')}
            onClick={toggleMic}>
            {micButtonOn ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline text-xs">
              {micButtonOn ? 'Tắt mic' : me.isAdmin || micApproved ? 'Bật mic' : 'Cần được duyệt'}
            </span>
          </Button>

          {!me.isAdmin && (
            <Button size="sm" variant={handRaised ? 'default' : 'outline'}
              className={cn('gap-1.5 h-9', handRaised && 'bg-amber-500 hover:bg-amber-600 border-amber-500')}
              onClick={toggleHand}>
              <Hand className="h-3.5 w-3.5" />
              <span className="hidden sm:inline text-xs">{handRaised ? 'Hạ tay' : 'Giơ tay'}</span>
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {micApproved && !me.isAdmin && (
            <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30 bg-emerald-500/10">
              Được phép nói
            </Badge>
          )}
          {me.isAdmin && (
            <>
              <Badge variant="outline" className="text-[10px] hidden sm:flex">
                <Users className="h-2.5 w-2.5 mr-1" /> {studentCount}
              </Badge>
              <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={muteAll} title="Tắt mic tất cả">
                <VolumeX className="h-3 w-3" /><span className="hidden sm:inline">Mute all</span>
              </Button>
              <Button size="sm" variant={slowMode ? 'default' : 'outline'} className="h-7 text-[10px] gap-1" onClick={() => setSlowMode(!slowMode)} title="Chế độ chậm (5s)">
                <Timer className="h-3 w-3" /><span className="hidden sm:inline">Slow</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Admin: announcement & poll */}
      {me.isAdmin && (
        <div className="shrink-0 border-t border-border/60 px-4 py-1.5 flex flex-wrap items-center gap-2 bg-muted/20">
          <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
            <Megaphone className="h-3 w-3 text-muted-foreground shrink-0" />
            <input value={announcementInput} onChange={e => setAnnouncementInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendAnnouncement()}
              placeholder="Ghim thông báo..."
              className="flex-1 text-[11px] bg-transparent border-none outline-none placeholder:text-muted-foreground/50" />
            <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]" onClick={sendAnnouncement}>Ghim</Button>
          </div>
          <div className="h-4 w-px bg-border hidden sm:block" />
          <div className="flex items-center gap-1.5 flex-wrap">
            <BarChart3 className="h-3 w-3 text-muted-foreground shrink-0" />
            <input value={pollQuestion} onChange={e => setPollQuestion(e.target.value)} placeholder="Câu hỏi poll..."
              className="w-28 text-[11px] bg-transparent border-none outline-none placeholder:text-muted-foreground/50" />
            {pollOptions.map((opt, i) => (
              <input key={i} value={opt} onChange={e => setPollOptions(prev => prev.map((o, j) => j === i ? e.target.value : o))}
                placeholder={`Đáp án ${i + 1}`}
                className="w-16 text-[11px] bg-transparent border-b border-border outline-none placeholder:text-muted-foreground/50" />
            ))}
            {pollOptions.length < 4 && (
              <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => setPollOptions(p => [...p, ''])}>
                <Plus className="h-3 w-3" />
              </Button>
            )}
            <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]" onClick={createPoll}>Tạo</Button>
          </div>
        </div>
      )}
    </div>
  )
}
