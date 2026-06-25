'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  LiveKitRoom,
  useParticipants,
  useLocalParticipant,
  useDataChannel,
  useRoomContext,
} from '@livekit/components-react'
import { Track, ParticipantEvent } from 'livekit-client'
import {
  Mic, MicOff, Hand, Users, MessageSquare, Send, Loader2,
  Crown, Video, Settings, LogOut, Volume2, CheckCircle2, XCircle,
  Radio, Copy, Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import HlsPlayer from '@/components/live/HlsPlayer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/lib/auth-context'

// ─── Types ───────────────────────────────────────────────
interface RoomInfo {
  token: string
  livekitUrl: string
  hlsUrl: string
  roomName: string
  sessionTitle: string
  sessionStatus: string
  isAdmin: boolean
}

interface ChatMessage {
  id: string
  userId: string
  userName: string
  text: string
  time: number
}

interface HandRaiser {
  userId: string
  userName: string
  time: number
}

// ─── Data channel message protocol ───────────────────────
type MsgType = 'chat' | 'raise_hand' | 'lower_hand' | 'mic_approved' | 'mic_revoked'

function encode(type: MsgType, payload: Record<string, unknown>) {
  return new TextEncoder().encode(JSON.stringify({ type, ...payload }))
}

function decode(data: Uint8Array) {
  try { return JSON.parse(new TextDecoder().decode(data)) } catch { return null }
}

// ─── Main export ─────────────────────────────────────────
export default function ClassroomPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const sessionId = params.id as string

  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Admin: start stream modal
  const [startResult, setStartResult] = useState<{ rtmpUrl: string; hlsUrl: string } | null>(null)
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
      setStartResult({ rtmpUrl: data.rtmpUrl, hlsUrl: data.hlsUrl })
      // Re-fetch token now that room exists
      await fetchToken()
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Lỗi', description: err.message })
    } finally {
      setStarting(false)
    }
  }

  const copyRtmp = () => {
    if (!startResult) return
    navigator.clipboard.writeText(startResult.rtmpUrl)
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
            <div className="space-y-1">
              <p className="text-xs font-bold text-muted-foreground uppercase">RTMP URL — Dán vào Meld Studio</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-background border rounded-lg px-3 py-2 font-mono truncate">
                  {startResult.rtmpUrl}
                </code>
                <Button size="icon" variant="outline" className="h-9 w-9 shrink-0" onClick={copyRtmp}>
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Sau khi dán vào Meld Studio và bắt đầu stream, học sinh sẽ thấy video của bạn trong vài giây.
            </p>
            <Button
              onClick={() => window.location.reload()}
              className="w-full"
            >
              Vào phòng dạy học
            </Button>
          </div>
        )}
      </div>
    )
  }

  return (
    <LiveKitRoom
      serverUrl={roomInfo.livekitUrl}
      token={roomInfo.token}
      connect={true}
      video={false}
      audio={false}
      className="h-[calc(100vh-4rem)] flex flex-col"
    >
      <ClassroomContent
        sessionId={sessionId}
        roomInfo={roomInfo}
      />
    </LiveKitRoom>
  )
}

// ─── Classroom Content (inside LiveKitRoom context) ───────
function ClassroomContent({
  sessionId,
  roomInfo,
}: {
  sessionId: string
  roomInfo: RoomInfo
}) {
  const { toast } = useToast()
  const { localParticipant } = useLocalParticipant()
  const participants = useParticipants()
  const room = useRoomContext()

  const [mobileTab, setMobileTab] = useState<'video' | 'chat' | 'people'>('video')
  const [micEnabled, setMicEnabled] = useState(false)
  const [handRaised, setHandRaised] = useState(false)
  const [canPublish, setCanPublish] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [handRaisers, setHandRaisers] = useState<HandRaiser[]>([])
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Listen for permission changes (admin approves mic)
  useEffect(() => {
    if (!localParticipant) return

    const onPermissionsChanged = () => {
      const perm = localParticipant.permissions
      const nowCanPublish = perm?.canPublish ?? false
      setCanPublish(nowCanPublish)
      if (nowCanPublish && !canPublish) {
        toast({ title: '🎤 Mic đã được bật', description: 'Giáo viên cho phép bạn phát biểu!' })
      }
    }

    localParticipant.on(ParticipantEvent.ParticipantPermissionsChanged, onPermissionsChanged)
    return () => {
      localParticipant.off(ParticipantEvent.ParticipantPermissionsChanged, onPermissionsChanged)
    }
  }, [localParticipant, canPublish, toast])

  // Toggle mic
  const toggleMic = useCallback(async () => {
    if (!canPublish && !roomInfo.isAdmin) {
      toast({ description: 'Giơ tay và chờ giáo viên cho phép trước khi bật mic' })
      return
    }
    try {
      await localParticipant.setMicrophoneEnabled(!micEnabled)
      setMicEnabled(!micEnabled)
    } catch {
      toast({ variant: 'destructive', description: 'Không thể bật mic' })
    }
  }, [canPublish, micEnabled, localParticipant, roomInfo.isAdmin, toast])

  // Data channel for chat + raise hand
  const { send } = useDataChannel('classroom', (msg) => {
    const data = decode(msg.payload)
    if (!data) return

    if (data.type === 'chat') {
      setMessages(prev => [...prev, {
        id: `${data.userId}-${data.time}`,
        userId: data.userId,
        userName: data.userName,
        text: data.text,
        time: data.time,
      }])
    } else if (data.type === 'raise_hand') {
      setHandRaisers(prev => {
        if (prev.some(h => h.userId === data.userId)) return prev
        return [...prev, { userId: data.userId, userName: data.userName, time: data.time }]
      })
      if (roomInfo.isAdmin) {
        toast({ title: `✋ ${data.userName} giơ tay`, description: 'Học sinh muốn phát biểu' })
      }
    } else if (data.type === 'lower_hand') {
      setHandRaisers(prev => prev.filter(h => h.userId !== data.userId))
    } else if (data.type === 'mic_approved' && data.forUserId === localParticipant?.identity) {
      toast({ title: '🎤 Mic đã được bật', description: 'Giáo viên cho phép bạn phát biểu!' })
    } else if (data.type === 'mic_revoked' && data.forUserId === localParticipant?.identity) {
      setMicEnabled(false)
      localParticipant?.setMicrophoneEnabled(false)
      toast({ description: 'Giáo viên đã tắt mic của bạn' })
    }
  })

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendChat = () => {
    const text = chatInput.trim()
    if (!text || !localParticipant) return

    const payload = {
      userId: localParticipant.identity,
      userName: localParticipant.name ?? 'Học sinh',
      text,
      time: Date.now(),
    }
    send(encode('chat', payload), { reliable: true })

    // Also add to local messages immediately
    setMessages(prev => [...prev, {
      id: `local-${Date.now()}`,
      userId: payload.userId,
      userName: payload.userName,
      text: payload.text,
      time: payload.time,
    }])
    setChatInput('')
  }

  const toggleHand = () => {
    if (!localParticipant) return
    const nowRaised = !handRaised
    setHandRaised(nowRaised)
    const type = nowRaised ? 'raise_hand' : 'lower_hand'
    send(encode(type, {
      userId: localParticipant.identity,
      userName: localParticipant.name ?? 'Học sinh',
      time: Date.now(),
    }), { reliable: true })
  }

  // Admin: approve/revoke mic, kick
  const adminControl = async (action: string, participantIdentity: string) => {
    try {
      await fetch(`/api/admin/live/${sessionId}/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, participantIdentity }),
      })
      if (action === 'approve_mic') {
        send(encode('mic_approved', { forUserId: participantIdentity }), { reliable: true })
        setHandRaisers(prev => prev.filter(h => h.userId !== participantIdentity))
      } else if (action === 'revoke_mic') {
        send(encode('mic_revoked', { forUserId: participantIdentity }), { reliable: true })
      } else if (action === 'kick') {
        toast({ description: `Đã xóa học sinh khỏi phòng học` })
      }
    } catch {
      toast({ variant: 'destructive', description: 'Lỗi điều khiển phòng học' })
    }
  }

  const endSession = async () => {
    if (!confirm('Kết thúc buổi học? Tất cả học sinh sẽ bị ngắt kết nối.')) return
    await adminControl('end_session', '')
    room.disconnect()
    window.location.href = '/live'
  }

  // ─── Chat panel ──────────────────────────────────────
  const chatPanel = (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-border/60 flex items-center gap-2">
        <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Chat</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        {messages.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-8">Chưa có tin nhắn nào</p>
        )}
        {messages.map(msg => (
          <div key={msg.id} className="space-y-0.5">
            <span className="text-[10px] font-semibold text-primary">{msg.userName}</span>
            <p className="text-xs text-foreground leading-relaxed">{msg.text}</p>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      <div className="p-2 border-t border-border/60 flex gap-2">
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
    </div>
  )

  // ─── Participants + raise hand panel ──────────────────
  const peoplePanel = (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-border/60 flex items-center gap-2">
        <Users className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {participants.length} học sinh
        </span>
      </div>

      {/* Raise hands queue */}
      {handRaisers.length > 0 && (
        <div className="border-b border-border/60 p-2 space-y-1.5">
          <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1">
            <Hand className="h-3 w-3" /> Đang giơ tay
          </p>
          {handRaisers.map(h => (
            <div key={h.userId} className="flex items-center justify-between rounded-lg bg-amber-500/10 px-2 py-1.5">
              <span className="text-xs font-medium truncate mr-2">{h.userName}</span>
              {roomInfo.isAdmin && (
                <div className="flex gap-1 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-[10px] text-emerald-600 hover:bg-emerald-500/10"
                    onClick={() => adminControl('approve_mic', h.userId)}
                  >
                    <Mic className="h-3 w-3 mr-1" /> Cho phép
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-[10px] text-muted-foreground hover:bg-muted"
                    onClick={() => setHandRaisers(prev => prev.filter(x => x.userId !== h.userId))}
                  >
                    <XCircle className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Participants list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-0">
        {participants.map(p => {
          const isRaisingHand = handRaisers.some(h => h.userId === p.identity)
          const isSpeaking = p.isSpeaking
          return (
            <div
              key={p.identity}
              className={cn(
                'flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors',
                isSpeaking ? 'bg-emerald-500/10' : 'hover:bg-muted/40'
              )}
            >
              <div className={cn(
                'h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0',
                isSpeaking ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground'
              )}>
                {(p.name ?? 'H')[0].toUpperCase()}
              </div>
              <span className="text-xs truncate flex-1">
                {p.name ?? 'Học sinh'}
                {isRaisingHand && ' ✋'}
              </span>
              {isSpeaking && <Volume2 className="h-3 w-3 text-emerald-500 shrink-0" />}
              {roomInfo.isAdmin && (
                <div className="flex gap-0.5 shrink-0 opacity-0 group-hover:opacity-100">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-5 w-5"
                    title="Tắt mic"
                    onClick={() => adminControl('revoke_mic', p.identity)}
                  >
                    <MicOff className="h-3 w-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-5 w-5 text-destructive"
                    title="Kick"
                    onClick={() => adminControl('kick', p.identity)}
                  >
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
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/60 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Badge variant="destructive" className="gap-1 text-[10px] shrink-0 animate-pulse">
            <span className="h-1.5 w-1.5 bg-white rounded-full" /> LIVE
          </Badge>
          <span className="text-sm font-semibold truncate">{roomInfo.sessionTitle}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-xs text-muted-foreground hidden sm:block">{participants.length} người</span>
          {roomInfo.isAdmin && (
            <Button
              size="sm"
              variant="destructive"
              className="h-7 text-xs gap-1 ml-2"
              onClick={endSession}
            >
              <LogOut className="h-3 w-3" /> Kết thúc
            </Button>
          )}
        </div>
      </div>

      {/* Main layout */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Video + mobile tabs */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Mobile tab bar */}
          <div className="flex md:hidden border-b border-border/60 shrink-0">
            {(['video', 'chat', 'people'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setMobileTab(tab)}
                className={cn(
                  'flex-1 py-2 text-[11px] font-semibold transition-colors flex items-center justify-center gap-1',
                  mobileTab === tab ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'
                )}
              >
                {tab === 'video' && <><Video className="h-3.5 w-3.5" /> Video</>}
                {tab === 'chat' && <><MessageSquare className="h-3.5 w-3.5" /> Chat</>}
                {tab === 'people' && <><Users className="h-3.5 w-3.5" /> {participants.length}</>}
              </button>
            ))}
          </div>

          {/* Video area */}
          <div
            className={cn(
              'bg-black overflow-hidden',
              // Desktop: always show, flex-1
              'md:flex-1',
              // Mobile: only show on video tab
              mobileTab === 'video' ? 'flex-1' : 'hidden md:flex'
            )}
          >
            <HlsPlayer src={roomInfo.hlsUrl} className="w-full h-full" />
          </div>

          {/* Mobile: chat/people panels */}
          <div className={cn('flex-1 overflow-hidden md:hidden', mobileTab === 'chat' ? 'flex flex-col' : 'hidden')}>
            {chatPanel}
          </div>
          <div className={cn('flex-1 overflow-hidden md:hidden', mobileTab === 'people' ? 'flex flex-col' : 'hidden')}>
            {peoplePanel}
          </div>
        </div>

        {/* Desktop right sidebar */}
        <div className="hidden md:flex flex-col w-72 border-l border-border/60 shrink-0 overflow-hidden">
          <div className="flex-[3] border-b border-border/60 overflow-hidden flex flex-col">
            {chatPanel}
          </div>
          <div className="flex-[2] overflow-hidden flex flex-col">
            {peoplePanel}
          </div>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="shrink-0 border-t border-border/60 px-4 py-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* Mic button */}
          <Button
            size="sm"
            variant={micEnabled ? 'default' : 'outline'}
            className={cn(
              'gap-1.5 h-9',
              !canPublish && !roomInfo.isAdmin && 'opacity-50 cursor-not-allowed'
            )}
            onClick={toggleMic}
          >
            {micEnabled ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline text-xs">
              {micEnabled ? 'Tắt mic' : canPublish || roomInfo.isAdmin ? 'Bật mic' : 'Cần được duyệt'}
            </span>
          </Button>

          {/* Raise hand (students only) */}
          {!roomInfo.isAdmin && (
            <Button
              size="sm"
              variant={handRaised ? 'default' : 'outline'}
              className={cn('gap-1.5 h-9', handRaised && 'bg-amber-500 hover:bg-amber-600 border-amber-500')}
              onClick={toggleHand}
            >
              <Hand className="h-3.5 w-3.5" />
              <span className="hidden sm:inline text-xs">{handRaised ? 'Hạ tay' : 'Giơ tay'}</span>
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {canPublish && !roomInfo.isAdmin && (
            <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30 bg-emerald-500/10">
              Mic đã được bật
            </Badge>
          )}
          {roomInfo.isAdmin && (
            <Badge variant="outline" className="text-[10px]">
              <Crown className="h-2.5 w-2.5 mr-1 text-yellow-500" /> Admin
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}
