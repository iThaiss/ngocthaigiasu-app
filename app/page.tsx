'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Brain, Trophy, Users, BookOpen, ArrowRight, Star, Zap, Shield, CheckCircle, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { VIP_PLANS } from '@/lib/plans'

const FEATURES = [
  { icon: Brain, title: 'AI Giải Toán', desc: 'Upload ảnh bài toán, AI phân tích và giải từng bước chi tiết với LaTeX.', color: 'text-purple-500' },
  { icon: Trophy, title: 'Thi Thử Thực Chiến', desc: '50 câu hỏi, 90 phút, bảng xếp hạng real-time — y như thi THPT Quốc Gia.', color: 'text-yellow-500' },
  { icon: BookOpen, title: 'Ngân Hàng Câu Hỏi', desc: 'Hàng nghìn câu hỏi chất lượng cao được phân loại theo độ khó và chủ đề.', color: 'text-blue-500' },
  { icon: Users, title: 'Cộng Đồng Học Tập', desc: 'Trao đổi kinh nghiệm, lưu câu cần ôn và theo dõi tiến độ học tập.', color: 'text-green-500' },
  { icon: Zap, title: 'Học Mọi Lúc', desc: 'Responsive hoàn toàn — học trên điện thoại, máy tính bảng hay laptop.', color: 'text-orange-500' },
  { icon: Shield, title: 'Bảo Mật Tuyệt Đối', desc: 'Đăng nhập Google OAuth, dữ liệu được mã hóa và bảo vệ nghiêm ngặt.', color: 'text-red-500' },
]

const STATS = [
  { value: 'AI', label: 'Giải bài từng bước' },
  { value: '50', label: 'Câu / đề thi thử' },
  { value: '90', label: 'Phút luyện áp lực thi' },
  { value: '24/7', label: 'Tự học mọi lúc' },
]

const TESTIMONIALS = [
  { name: 'Nguyễn Minh Anh', school: 'THPT Chu Văn An', text: 'Nhờ ngocthaigiasu mình đã cải thiện điểm Toán từ 6 lên 9. AI giải bài rất dễ hiểu!', stars: 5 },
  { name: 'Trần Phú Quý', school: 'THPT Lê Quý Đôn', text: 'Tính năng thi thử giúp mình quen với áp lực thời gian. Bảng xếp hạng tạo động lực cực tốt.', stars: 5 },
  { name: 'Lê Thu Hương', school: 'THPT Nguyễn Thị Minh Khai', text: 'Mã giới thiệu giúp mình kiếm thêm thu nhập trong lúc học. Nền tảng tuyệt vời!', stars: 5 },
]

export default function LandingPage() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">NT</div>
            <span className="hidden sm:block">ngocthaigiasu.id.vn</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
            <Link href="/login">
              <Button variant="outline" size="sm">Đăng nhập</Button>
            </Link>
            <Link href="/login">
              <Button size="sm">Bắt đầu miễn phí</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl" />
        </div>
        <div className="container text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Badge variant="secondary" className="mb-6">
              <Zap className="h-3 w-3 mr-1" /> Powered by AI
            </Badge>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6">
              Gia sư Toán{' '}
              <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                thông minh nhất
              </span>
              <br />cho học sinh Việt Nam
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Chụp ảnh bài toán — AI giải ngay. Thi thử với bảng xếp hạng real-time.
              Luyện tập, lưu câu cần ôn và theo dõi tiến độ trong cùng một nơi.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/login">
                <Button size="lg" className="gap-2 text-base px-8">
                  Học miễn phí ngay <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/solve">
                <Button variant="outline" size="lg" className="text-base px-8">
                  Xem công cụ giải bài
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl md:text-4xl font-extrabold text-primary">{s.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Tất cả những gì bạn cần để học Toán</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">Từ giải bài tập đến thi thử, chúng tôi có đủ công cụ cho hành trình chinh phục Toán của bạn.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-muted ${f.color}`}>
                      <f.icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                    <p className="text-muted-foreground text-sm">{f.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">Học sinh nói gì về chúng tôi</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={t.name} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex mb-3">
                      {Array.from({ length: t.stars }).map((_, j) => (
                        <Star key={j} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">&quot;{t.text}&quot;</p>
                    <div>
                      <p className="font-semibold text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.school}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary/5 border-y border-border">
        <div className="container text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Sẵn sàng chinh phục Toán chưa?</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">Tham gia miễn phí ngay hôm nay. Không cần thẻ tín dụng.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/login">
                <Button size="lg" className="gap-2">
                  <CheckCircle className="h-4 w-4" /> Đăng ký miễn phí
                </Button>
              </Link>
              <Link href="/payment">
                <Button variant="outline" size="lg" className="gap-2">
                  <Trophy className="h-4 w-4" /> Nâng cấp VIP — {VIP_PLANS.monthly.costPoints} điểm/tháng
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© 2024 ngocthaigiasu.id.vn — Tất cả quyền được bảo lưu.</p>
          <div className="flex gap-4">
            <Link href="/login" className="hover:text-foreground transition-colors">Đăng nhập</Link>
            <Link href="/payment" className="hover:text-foreground transition-colors">VIP</Link>
            <Link href="/affiliate" className="hover:text-foreground transition-colors">Hoa hồng</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
