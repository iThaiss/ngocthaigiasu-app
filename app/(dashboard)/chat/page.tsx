'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MessageCircle, Send, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'

interface ChatRoom {
  id: string
  name: string
  unread: number
}

interface ChatMessage {
  id: string
  roomId: string
  author: string
  avatar?: string
  content: string
  time: string
  isOwn?: boolean
}

const CHAT_ROOMS: ChatRoom[] = [
  { id: 'math', name: 'Hỏi đáp Toán', unread: 3 },
  { id: 'physics', name: 'Hỏi đáp Lý', unread: 0 },
  { id: 'chemistry', name: 'Hỏi đáp Hóa', unread: 1 },
  { id: 'general', name: 'Chung', unread: 5 },
]

const MOCK_MESSAGES: ChatMessage[] = [
  { id: '1', roomId: 'math', author: 'Minh Tuấn', content: 'Mọi người ơi, bài tích phân này làm thế nào ạ?', time: '09:15', isOwn: false },
  { id: '2', roomId: 'math', author: 'Lan Anh', content: 'Bạn dùng phương pháp đổi biến u nhé, đặt u = x²+1', time: '09:17', isOwn: false },
  { id: '3', roomId: 'math', author: 'Minh Tuấn', content: 'À hiểu rồi, cảm ơn bạn nhiều!', time: '09:18', isOwn: false },
  { id: '4', roomId: 'math', author: 'Hoàng Long', content: 'Hàm mũ và logarit phần 3 trang 47 ai làm được không?', time: '09:32', isOwn: false },
  { id: '5', roomId: 'math', author: 'Bạn', content: 'Mình làm được, bạn chụp đề lên đây nhé', time: '09:35', isOwn: true },
  { id: '6', roomId: 'physics', author: 'Thu Hà', content: 'Định luật Faraday áp dụng thế nào trong bài này?', time: '10:00', isOwn: false },
  { id: '7', roomId: 'physics', author: 'Văn Đức', content: 'Bạn xem lại công thức EMF = -dΦ/dt là ra ngay ấy.', time: '10:03', isOwn: false },
  { id: '8', roomId: 'chemistry', author: 'Ngọc Mai', content: 'Phản ứng este hóa điều kiện là gì ạ?', time: '11:10', isOwn: false },
  { id: '9', roomId: 'general', author: 'Admin', content: 'Chào mừng mọi người đến với cộng đồng học tập!', time: '08:00', isOwn: false },
  { id: '10', roomId: 'general', author: 'Quang Huy', content: 'Exam tháng này khi nào vậy ạ?', time: '08:30', isOwn: false },
]

export default function ChatPage() {
  const { user } = useAuth()
  const [activeRoom, setActiveRoom] = useState('math')
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_MESSAGES)
  const bottomRef = useRef<HTMLDivElement>(null)

  const roomMessages = messages.filter((m) => m.roomId === activeRoom)
  const currentRoom = CHAT_ROOMS.find((r) => r.id === activeRoom)!

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeRoom, messages])

  const handleSend = () => {
    if (!input.trim()) return
    const newMsg: ChatMessage = {
      id: String(Date.now()),
      roomId: activeRoom,
      author: user?.name ?? 'Bạn',
      avatar: user?.image ?? undefined,
      content: input.trim(),
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      isOwn: true,
    }
    setMessages((prev) => [...prev, newMsg])
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageCircle className="h-6 w-6" /> Chat cộng đồng
        </h1>
        <p className="text-muted-foreground mt-1">Trao đổi và hỏi đáp cùng các học sinh khác</p>
      </motion.div>

      {/* Demo banner */}
      <div className="flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/30 dark:border-yellow-800 p-3 text-sm text-yellow-700 dark:text-yellow-300">
        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
        <span>Tính năng chat realtime đang được phát triển. Hiện tại hiển thị demo.</span>
      </div>

      {/* Chat layout */}
      <div className="grid md:grid-cols-4 gap-4 flex-1 min-h-0" style={{ height: 'calc(100vh - 280px)' }}>
        {/* Room list */}
        <Card className="md:col-span-1 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-border">
            <p className="text-sm font-semibold text-muted-foreground">Phòng chat</p>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {CHAT_ROOMS.map((room) => (
              <button
                key={room.id}
                onClick={() => setActiveRoom(room.id)}
                className={cn(
                  'w-full flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all text-left',
                  activeRoom === room.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent text-muted-foreground hover:text-accent-foreground'
                )}
              >
                <span className="truncate"># {room.name}</span>
                {room.unread > 0 && (
                  <Badge
                    variant={activeRoom === room.id ? 'secondary' : 'destructive'}
                    className="ml-2 shrink-0 h-5 min-w-5 flex items-center justify-center text-[10px]"
                  >
                    {room.unread}
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </Card>

        {/* Chat panel */}
        <Card className="md:col-span-3 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-2 p-3 border-b border-border shrink-0">
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
            <p className="font-semibold text-sm"># {currentRoom.name}</p>
          </div>

          {/* Messages */}
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {roomMessages.map((msg, i) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={cn('flex items-end gap-2', msg.isOwn && 'flex-row-reverse')}
              >
                {!msg.isOwn && (
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarImage src={msg.avatar} alt={msg.author} />
                    <AvatarFallback className="text-[10px]">{msg.author.charAt(0)}</AvatarFallback>
                  </Avatar>
                )}
                {msg.isOwn && (
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? 'Bạn'} />
                    <AvatarFallback className="text-[10px]">{(user?.name ?? 'B').charAt(0)}</AvatarFallback>
                  </Avatar>
                )}
                <div className={cn('flex flex-col max-w-[70%]', msg.isOwn && 'items-end')}>
                  {!msg.isOwn && (
                    <p className="text-xs text-muted-foreground mb-1 ml-1">{msg.author}</p>
                  )}
                  <div
                    className={cn(
                      'rounded-2xl px-3 py-2 text-sm leading-relaxed',
                      msg.isOwn
                        ? 'bg-primary text-primary-foreground rounded-br-sm'
                        : 'bg-muted text-foreground rounded-bl-sm'
                    )}
                  >
                    {msg.content}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1 mx-1">{msg.time}</p>
                </div>
              </motion.div>
            ))}
            <div ref={bottomRef} />
          </CardContent>

          {/* Input */}
          <div className="p-3 border-t border-border shrink-0">
            <div className="flex gap-2">
              <Input
                placeholder={`Nhắn tin vào #${currentRoom.name}...`}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1"
              />
              <Button size="icon" onClick={handleSend} disabled={!input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
