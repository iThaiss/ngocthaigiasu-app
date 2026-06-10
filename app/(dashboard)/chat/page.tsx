'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2, MessageCircle, RefreshCw, Send, Trash2, ArrowLeft } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'

interface ChatRoom {
  id: string
  slug: string
  name: string
  description: string | null
  unread: number
  latestMessage: {
    id: string
    content: string
    authorName: string
    createdAt: string
  } | null
}

interface ChatMessage {
  id: string
  roomId: string
  userId: string
  authorName: string
  authorAvatarUrl: string | null
  content: string
  isHidden: boolean
  createdAt: string
}

interface ChatMessageRow {
  id: string
  room_id: string
  user_id: string
  author_name: string
  author_avatar_url: string | null
  content: string
  is_hidden: boolean
  created_at: string
}

function mapRealtimeMessage(row: ChatMessageRow): ChatMessage {
  return {
    id: row.id,
    roomId: row.room_id,
    userId: row.user_id,
    authorName: row.author_name,
    authorAvatarUrl: row.author_avatar_url,
    content: row.content,
    isHidden: row.is_hidden,
    createdAt: row.created_at,
  }
}

function mergeMessage(messages: ChatMessage[], message: ChatMessage) {
  if (message.isHidden) return messages.filter((item) => item.id !== message.id)
  if (messages.some((item) => item.id === message.id)) {
    return messages.map((item) => (item.id === message.id ? message : item))
  }
  return [...messages, message].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

function relativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Vừa xong'
  if (minutes < 60) return `${minutes} phút trước`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} giờ trước`
  return `${Math.floor(hours / 24)} ngày trước`
}

export default function ChatPage() {
  const { user, role } = useAuth()
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [activeRoomId, setActiveRoomId] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [roomsLoading, setRoomsLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [mobileShowChat, setMobileShowChat] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const isAdmin = role === 'admin'

  const currentRoom = useMemo(
    () => rooms.find((room) => room.id === activeRoomId) ?? null,
    [activeRoomId, rooms],
  )

  const fetchRooms = useCallback(async () => {
    setRoomsLoading(true)
    setError('')
    try {
      const res = await fetch('/api/chat/rooms')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Không tải được phòng chat')
      const nextRooms: ChatRoom[] = data.rooms ?? []
      setRooms(nextRooms)
      setActiveRoomId((prev) => prev || nextRooms[0]?.id || '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được phòng chat')
    } finally {
      setRoomsLoading(false)
    }
  }, [])

  const fetchMessages = useCallback(async (roomId: string) => {
    if (!roomId) return
    setMessagesLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/chat/messages?roomId=${encodeURIComponent(roomId)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Không tải được tin nhắn')
      setMessages(data.messages ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được tin nhắn')
    } finally {
      setMessagesLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRooms()
  }, [fetchRooms])

  useEffect(() => {
    if (!activeRoomId) return
    fetchMessages(activeRoomId)
  }, [activeRoomId, fetchMessages])

  useEffect(() => {
    if (!activeRoomId) return

    const channel = supabase
      .channel(`chat-room-${activeRoomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${activeRoomId}`,
        },
        (payload) => {
          const row = payload.new as ChatMessageRow | null
          if (!row?.id) return
          const nextMessage = mapRealtimeMessage(row)
          setMessages((prev) => mergeMessage(prev, nextMessage))
          setRooms((prev) => prev.map((room) => (
            room.id === nextMessage.roomId
              ? {
                ...room,
                latestMessage: {
                  id: nextMessage.id,
                  content: nextMessage.content,
                  authorName: nextMessage.authorName,
                  createdAt: nextMessage.createdAt,
                },
              }
              : room
          )))
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeRoomId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeRoomId, messages, messagesLoading])

  async function handleSend() {
    const content = input.trim()
    if (!content || !activeRoomId || sending) return
    setSending(true)
    setError('')

    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: activeRoomId, content }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Không gửi được tin nhắn')
      setMessages((prev) => mergeMessage(prev, data.message))
      setInput('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không gửi được tin nhắn')
    } finally {
      setSending(false)
    }
  }

  async function handleHideMessage(messageId: string) {
    if (!isAdmin) return
    setError('')
    try {
      const res = await fetch(`/api/chat/messages/${messageId}`, { method: 'PATCH' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Không ẩn được tin nhắn')
      setMessages((prev) => prev.filter((message) => message.id !== messageId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không ẩn được tin nhắn')
    }
  }

  return (
    <div className="flex h-full flex-col space-y-4">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <MessageCircle className="h-6 w-6" /> Chat cộng đồng
            </h1>
            <p className="mt-1 text-muted-foreground">Trao đổi trực tiếp trong các phòng học chung</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchRooms} disabled={roomsLoading}>
            {roomsLoading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-1.5 h-4 w-4" />}
            Tải lại
          </Button>
        </div>
      </motion.div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid flex-1 gap-4 md:grid-cols-4" style={{ minHeight: 'calc(100vh - 230px)' }}>
        <Card className={cn("flex flex-col overflow-hidden md:col-span-1", mobileShowChat && "hidden md:flex")}>
          <div className="border-b border-border p-3">
            <p className="text-sm font-semibold text-muted-foreground">Phòng chat</p>
          </div>
          <div className="flex-1 space-y-1 overflow-y-auto p-2">
            {roomsLoading && (
              <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Đang tải phòng...
              </div>
            )}
            {!roomsLoading && rooms.length === 0 && (
              <p className="px-3 py-2 text-sm text-muted-foreground">Chưa có phòng chat</p>
            )}
            {rooms.map((room) => (
              <button
                key={room.id}
                type="button"
                onClick={() => {
                  setActiveRoomId(room.id)
                  setMobileShowChat(true)
                }}
                className={cn(
                  'w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-all',
                  activeRoomId === room.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate"># {room.name}</span>
                  {room.unread > 0 && (
                    <Badge
                      variant={activeRoomId === room.id ? 'secondary' : 'destructive'}
                      className="h-5 min-w-5 shrink-0 justify-center text-[10px]"
                    >
                      {room.unread}
                    </Badge>
                  )}
                </div>
                {room.latestMessage && (
                  <p className="mt-1 truncate text-xs font-normal opacity-80">
                    {room.latestMessage.authorName}: {room.latestMessage.content}
                  </p>
                )}
              </button>
            ))}
          </div>
        </Card>

        <Card className={cn("flex min-h-0 flex-col overflow-hidden md:col-span-3", !mobileShowChat && "hidden md:flex")}>
          <div className="flex items-center gap-2 border-b border-border p-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileShowChat(false)}
              className="md:hidden gap-1 px-2 h-8 text-muted-foreground hover:text-foreground shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-xs">Phòng</span>
            </Button>
            <MessageCircle className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold"># {currentRoom?.name ?? 'Phòng chat'}</p>
              {currentRoom?.description && (
                <p className="truncate text-xs text-muted-foreground">{currentRoom.description}</p>
              )}
            </div>
          </div>

          <CardContent className="flex-1 space-y-4 overflow-y-auto p-4">
            {messagesLoading && (
              <div className="flex h-full min-h-48 items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Đang tải tin nhắn...
              </div>
            )}

            {!messagesLoading && messages.length === 0 && (
              <div className="flex h-full min-h-48 flex-col items-center justify-center text-center">
                <MessageCircle className="mb-3 h-10 w-10 text-muted-foreground/60" />
                <p className="font-medium">Chưa có tin nhắn</p>
                <p className="mt-1 text-sm text-muted-foreground">Hãy bắt đầu cuộc trò chuyện trong phòng này.</p>
              </div>
            )}

            {!messagesLoading && messages.map((message, index) => {
              const isOwn = message.userId === user?.id
              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.02, 0.2) }}
                  className={cn('group flex items-end gap-2', isOwn && 'flex-row-reverse')}
                >
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarImage src={message.authorAvatarUrl ?? undefined} alt={message.authorName} />
                    <AvatarFallback className="text-[10px]">{message.authorName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className={cn('flex max-w-[78%] flex-col', isOwn && 'items-end')}>
                    {!isOwn && (
                      <p className="mb-1 ml-1 text-xs text-muted-foreground">{message.authorName}</p>
                    )}
                    <div className="flex items-center gap-2">
                      {isAdmin && !isOwn && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                          onClick={() => handleHideMessage(message.id)}
                          title="Ẩn tin nhắn"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      )}
                      <div
                        className={cn(
                          'whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm leading-relaxed',
                          isOwn
                            ? 'rounded-br-sm bg-primary text-primary-foreground'
                            : 'rounded-bl-sm bg-muted text-foreground',
                        )}
                      >
                        {message.content}
                      </div>
                    </div>
                    <p className="mx-1 mt-1 text-[10px] text-muted-foreground" title={relativeTime(message.createdAt)}>
                      {formatTime(message.createdAt)}
                    </p>
                  </div>
                </motion.div>
              )
            })}
            <div ref={bottomRef} />
          </CardContent>

          <div className="shrink-0 border-t border-border p-3">
            <div className="flex gap-2">
              <Input
                placeholder={currentRoom ? `Nhắn tin vào #${currentRoom.name}...` : 'Chọn phòng để nhắn tin...'}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    handleSend()
                  }
                }}
                disabled={!activeRoomId || sending}
                maxLength={1000}
                className="flex-1"
              />
              <Button size="icon" onClick={handleSend} disabled={!input.trim() || !activeRoomId || sending}>
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">{input.length}/1000 ký tự</p>
          </div>
        </Card>
      </div>
    </div>
  )
}
