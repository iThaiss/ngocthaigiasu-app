'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { MessageCircle, Mail, Facebook, Send, Clock, ChevronDown, ChevronUp, HeadphonesIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'

const CONTACT_CHANNELS = [
  {
    icon: MessageCircle,
    label: 'Zalo',
    value: '0xxx xxx xxx',
    desc: 'Nhắn tin trực tiếp qua Zalo',
    color: 'text-blue-500 bg-blue-500/10',
    href: '#',
  },
  {
    icon: Mail,
    label: 'Email',
    value: 'support@ngocthaigiasu.id.vn',
    desc: 'Gửi email hỗ trợ',
    color: 'text-red-500 bg-red-500/10',
    href: '#',
  },
  {
    icon: Facebook,
    label: 'Facebook',
    value: 'fb.com/ngocthaigiasu',
    desc: 'Nhắn tin qua Facebook Page',
    color: 'text-indigo-500 bg-indigo-500/10',
    href: '#',
  },
]

const FAQS = [
  {
    q: 'Làm thế nào để nâng cấp VIP?',
    a: 'Vào mục "Nâng cấp VIP", chọn gói Tháng hoặc Năm, quét mã QR và chuyển khoản đúng nội dung. Hệ thống tự động nâng cấp sau khi xác nhận thanh toán.',
  },
  {
    q: 'Các phương thức thanh toán được hỗ trợ?',
    a: 'Hiện tại hỗ trợ chuyển khoản ngân hàng qua QR Code (VietQR). Hệ thống tự động xác nhận trong vài giây sau khi chuyển khoản.',
  },
  {
    q: 'VIP có những tính năng gì?',
    a: 'VIP cho phép sử dụng không giới hạn tính năng Giải toán AI, truy cập toàn bộ tài liệu học tập, và tham gia phòng chat hỏi đáp ưu tiên.',
  },
  {
    q: 'Chương trình hoa hồng hoạt động như thế nào?',
    a: 'Chia sẻ link giới thiệu của bạn. Khi bạn bè đăng ký và nâng cấp VIP qua link đó, bạn nhận 10 điểm hoa hồng (tương đương 10,000đ).',
  },
  {
    q: 'Làm gì nếu tôi gặp lỗi khi sử dụng?',
    a: 'Liên hệ ngay qua Zalo hoặc Email trong giờ hỗ trợ 8:00 - 22:00. Chúng tôi sẽ phản hồi trong vòng 30 phút.',
  },
]

export default function ContactPage() {
  const { toast } = useToast()
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [sending, setSending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.message) {
      toast({ title: 'Vui lòng điền đầy đủ thông tin', variant: 'destructive' })
      return
    }
    setSending(true)
    await new Promise((r) => setTimeout(r, 800))
    setSending(false)
    setForm({ name: '', email: '', subject: '', message: '' })
    toast({ title: 'Gửi thành công!', description: 'Chúng tôi sẽ phản hồi sớm nhất có thể.', variant: 'success' as never })
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <HeadphonesIcon className="h-6 w-6" /> Liên hệ &amp; Hỗ trợ
        </h1>
        <p className="text-muted-foreground mt-1">Chúng tôi luôn sẵn sàng giúp đỡ bạn</p>
      </motion.div>

      {/* Contact channels */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {CONTACT_CHANNELS.map((c, i) => {
          const Icon = c.icon
          return (
            <motion.div key={c.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <Card className="hover:shadow-md hover:border-primary/30 transition-all">
                <CardContent className="pt-5 pb-4 text-center space-y-2">
                  <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-xl ${c.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <p className="font-semibold text-sm">{c.label}</p>
                  <p className="text-xs text-muted-foreground">{c.value}</p>
                  <p className="text-xs text-muted-foreground">{c.desc}</p>
                  <Button size="sm" variant="outline" className="w-full" asChild>
                    <a href={c.href} target="_blank" rel="noopener noreferrer">Liên hệ</a>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Support hours */}
      <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
            <div>
              <p className="font-semibold text-sm text-green-700 dark:text-green-300">Giờ hỗ trợ</p>
              <p className="text-sm text-green-600 dark:text-green-400">8:00 - 22:00 hàng ngày (kể cả cuối tuần)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact form */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Send className="h-4 w-4" /> Gửi tin nhắn
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Họ tên *</Label>
                  <Input id="name" placeholder="Nguyễn Văn A" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" type="email" placeholder="example@gmail.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="subject">Chủ đề</Label>
                <Input id="subject" placeholder="Vấn đề cần hỗ trợ" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="message">Nội dung *</Label>
                <Textarea id="message" placeholder="Mô tả chi tiết vấn đề của bạn..." rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
              </div>
              <Button type="submit" disabled={sending} className="w-full gap-2">
                <Send className="h-4 w-4" />
                {sending ? 'Đang gửi...' : 'Gửi tin nhắn'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* FAQ */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Câu hỏi thường gặp</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border p-0">
            {FAQS.map((faq, i) => (
              <div key={i} className="px-6">
                <button
                  className="flex w-full items-center justify-between py-4 text-sm font-medium text-left gap-4 hover:text-primary transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span>{faq.q}</span>
                  {openFaq === i ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
                </button>
                {openFaq === i && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pb-4 text-sm text-muted-foreground"
                  >
                    {faq.a}
                  </motion.p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
