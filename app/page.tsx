'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Brain,
  Trophy,
  BookOpen,
  ArrowRight,
  Star,
  Zap,
  CheckCircle,
  Moon,
  Sun,
  Calculator,
  Languages,
  Camera,
  BarChart3,
  Users,
  Repeat2,
  FileText,
  GraduationCap,
  Sparkles,
  ChevronRight,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { SUBJECT_PLANS } from '@/lib/plans'

// ─── Data ────────────────────────────────────────────────────────────────────

const STATS = [
  { value: '1,000+', label: 'Học sinh đang dùng' },
  { value: '10,000+', label: 'Câu hỏi Toán' },
  { value: 'B1→C2', label: 'Tiếng Anh đủ cấp độ' },
  { value: '4.9★', label: 'Đánh giá trung bình' },
]

const MATH_FEATURES = [
  {
    icon: Camera,
    title: 'AI Giải Toán',
    desc: 'Chụp ảnh bài toán — AI phân tích và giải từng bước với LaTeX chi tiết.',
    color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  },
  {
    icon: Sparkles,
    title: 'AI Gia Sư Toán',
    desc: 'AI phân tích điểm yếu, gợi ý bài tập ôn luyện phù hợp theo từng chủ đề.',
    color: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  {
    icon: BookOpen,
    title: 'Ngân Hàng Câu Hỏi',
    desc: '10,000+ câu hỏi phân loại theo độ khó và chủ đề, cập nhật liên tục.',
    color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  },
]

const ENGLISH_FEATURES = [
  {
    icon: Brain,
    title: 'Từ Vựng Theo Level',
    desc: 'Học từ vựng B1, B2, C1-C2 theo chủ đề. AI tạo ví dụ, AI kiểm tra phát âm.',
    color: 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400',
  },
  {
    icon: Repeat2,
    title: 'Spaced Repetition',
    desc: 'Thuật toán FSRS giúp bạn nhớ từ lâu hơn — ôn đúng lúc, không quên.',
    color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  },
  {
    icon: FileText,
    title: 'Grammar & Reading',
    desc: 'Ngữ pháp tương tác từng điểm + đọc hiểu đa thể loại — full skills IELTS.',
    color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
  },
]

const STEPS = [
  {
    icon: GraduationCap,
    title: 'Đăng ký miễn phí',
    desc: 'Đăng nhập bằng Google OAuth trong vài giây. Không cần thẻ ngân hàng.',
  },
  {
    icon: BookOpen,
    title: 'Chọn môn & bắt đầu',
    desc: 'Học Toán, Tiếng Anh hoặc cả hai. Tự chọn level và chủ đề phù hợp.',
  },
  {
    icon: BarChart3,
    title: 'Theo dõi tiến độ',
    desc: 'Dashboard hiển thị streak, điểm thi, từ đã học — biết mình đang ở đâu.',
  },
]

const TESTIMONIALS = [
  {
    name: 'Nguyễn Minh Anh',
    school: 'THPT Chu Văn An',
    text: 'Nhờ ngocthaigiasu mình cải thiện điểm Toán từ 6 lên 9. AI giải bài rất dễ hiểu, từng bước rõ ràng!',
    avatar: 'MA',
    stars: 5,
  },
  {
    name: 'Trần Phú Quý',
    school: 'THPT Lê Quý Đôn',
    text: 'Luyện tập theo chủ đề giúp mình chắc kiến thức hơn hẳn. Bộ từ vựng tiếng Anh B2 rất chất!',
    avatar: 'PQ',
    stars: 5,
  },
  {
    name: 'Lê Thu Hương',
    school: 'THPT Nguyễn Thị Minh Khai',
    text: 'Spaced repetition cực hay — học 1 lần nhớ rất lâu. Giao diện đẹp, dùng trên điện thoại mượt.',
    avatar: 'TH',
    stars: 5,
  },
]

const PRICING = [
  {
    id: 'free',
    name: 'Miễn phí',
    price: '0đ',
    period: 'mãi mãi',
    badge: null,
    highlight: false,
    features: SUBJECT_PLANS.free.features,
    cta: 'Học ngay',
    href: '/login',
  },
  {
    id: 'combo_monthly',
    name: 'Combo Tháng',
    price: '129,000đ',
    period: '/tháng',
    badge: 'Phổ biến',
    highlight: false,
    features: SUBJECT_PLANS.combo_monthly.features,
    cta: 'Dùng thử ngay',
    href: '/payment',
  },
  {
    id: 'combo_6months',
    name: 'Combo 6 Tháng',
    price: '599,000đ',
    period: '/6 tháng (~99k/tháng)',
    badge: 'Tiết kiệm nhất',
    highlight: true,
    features: SUBJECT_PLANS.combo_6months.features,
    cta: 'Tiết kiệm nhất',
    href: '/payment',
  },
]

const FAQS = [
  {
    q: 'AI giải toán có chính xác không?',
    a: 'Chúng tôi dùng Claude Sonnet — mô hình AI hàng đầu của Anthropic, cho độ chính xác cao với bài toán THPT. Mỗi bước được trình bày bằng LaTeX rõ ràng để bạn kiểm tra dễ dàng.',
  },
  {
    q: 'Học tiếng Anh phù hợp với trình độ nào?',
    a: 'Nền tảng hỗ trợ từ B1 đến C2 (tương đương IELTS 4.0–8.0+). Bạn chọn level phù hợp khi bắt đầu, hệ thống sẽ điều chỉnh nội dung theo tiến độ.',
  },
  {
    q: 'Có thể dùng trên điện thoại không?',
    a: 'Hoàn toàn có. Giao diện responsive 100% — học mượt trên điện thoại, máy tính bảng, hoặc laptop. Không cần cài app thêm.',
  },
  {
    q: 'Gói Combo có bao gồm cả Toán lẫn Tiếng Anh không?',
    a: 'Đúng vậy! Gói Combo mở khóa toàn bộ tính năng Toán VIP và Tiếng Anh VIP cùng lúc, với giá rẻ hơn mua riêng từng môn.',
  },
  {
    q: 'Có thể hủy hoặc hoàn tiền không?',
    a: 'Gói theo kỳ (tháng, 6 tháng) không tự động gia hạn. Nếu có vấn đề, liên hệ hỗ trợ qua email trong vòng 7 ngày để được xem xét hoàn tiền.',
  },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function MathMockup() {
  return (
    <div className="rounded-2xl border bg-card shadow-xl p-4 w-full max-w-xs">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-2 w-2 rounded-full bg-red-400" />
        <div className="h-2 w-2 rounded-full bg-yellow-400" />
        <div className="h-2 w-2 rounded-full bg-green-400" />
        <span className="text-xs text-muted-foreground ml-1">AI Giải Toán</span>
      </div>
      <div className="rounded-lg bg-muted/60 p-3 text-xs font-mono mb-3 text-center">
        x² - 5x + 6 = 0
      </div>
      <div className="space-y-1.5 text-xs text-muted-foreground">
        {[
          { n: '1', text: 'Tìm Δ = b² - 4ac = 25 - 24 = 1' },
          { n: '2', text: 'x₁ = (5+1)/2 = 3' },
          { n: '3', text: 'x₂ = (5-1)/2 = 2' },
        ].map((s) => (
          <p key={s.n} className="flex items-center gap-1.5">
            <span className="shrink-0 h-4 w-4 rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400 flex items-center justify-center text-[10px] font-bold">
              {s.n}
            </span>
            {s.text}
          </p>
        ))}
      </div>
      <div className="mt-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-2 text-xs text-green-700 dark:text-green-400 font-medium text-center">
        ✓ Nghiệm: x = 2 và x = 3
      </div>
    </div>
  )
}

function VocabMockup() {
  return (
    <div className="rounded-2xl border bg-card shadow-xl p-4 w-full max-w-xs">
      <div className="flex items-center justify-between mb-3">
        <Badge variant="secondary" className="text-[10px]">B2 · Môi trường</Badge>
        <span className="text-[10px] text-muted-foreground">12/40 từ</span>
      </div>
      <div className="rounded-xl bg-gradient-to-br from-teal-50 to-blue-50 dark:from-teal-900/20 dark:to-blue-900/20 border border-teal-100 dark:border-teal-800 p-4 text-center mb-3">
        <p className="text-2xl font-bold text-teal-700 dark:text-teal-300 mb-1">sustainable</p>
        <p className="text-xs text-muted-foreground">/səˈsteɪnəbl/ · adj</p>
        <p className="text-sm mt-2 text-foreground font-medium">bền vững</p>
      </div>
      <p className="text-xs text-muted-foreground italic mb-3 text-center">
        &quot;We need <strong className="text-foreground not-italic">sustainable</strong> energy sources.&quot;
      </p>
      <div className="flex gap-2">
        <button className="flex-1 rounded-lg border text-xs py-1.5 text-red-500 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
          Chưa nhớ
        </button>
        <button className="flex-1 rounded-lg border text-xs py-1.5 text-green-600 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
          Đã nhớ ✓
        </button>
      </div>
    </div>
  )
}

// ─── Social Icons (official paths from simple-icons) ──────────────────────────
const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="#0866FF">
    <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z"/>
  </svg>
)

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="#000000">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
  </svg>
)

const ZaloIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="#0068FF">
    <path d="M12.49 10.2722v-.4496h1.3467v6.3218h-.7704a.576.576 0 01-.5763-.5729l-.0006.0005a3.273 3.273 0 01-1.9372.6321c-1.8138 0-3.2844-1.4697-3.2844-3.2823 0-1.8125 1.4706-3.2822 3.2844-3.2822a3.273 3.273 0 011.9372.6321l.0006.0005zM6.9188 7.7896v.205c0 .3823-.051.6944-.2995 1.0605l-.03.0343c-.0542.0615-.1815.206-.2421.2843L2.024 14.8h4.8948v.7682a.5764.5764 0 01-.5767.5761H0v-.3622c0-.4436.1102-.6414.2495-.8476L4.8582 9.23H.1922V7.7896h6.7266zm8.5513 8.3548a.4805.4805 0 01-.4803-.4798v-7.875h1.4416v8.3548H15.47zM20.6934 9.6C22.52 9.6 24 11.0807 24 12.9044c0 1.8252-1.4801 3.306-3.3066 3.306-1.8264 0-3.3066-1.4808-3.3066-3.306 0-1.8237 1.4802-3.3044 3.3066-3.3044zm-10.1412 5.253c1.0675 0 1.9324-.8645 1.9324-1.9312 0-1.065-.865-1.9295-1.9324-1.9295s-1.9324.8644-1.9324 1.9295c0 1.0667.865 1.9312 1.9324 1.9312zm10.1412-.0033c1.0737 0 1.945-.8707 1.945-1.9453 0-1.073-.8713-1.9436-1.945-1.9436-1.0753 0-1.945.8706-1.945 1.9436 0 1.0746.8697 1.9453 1.945 1.9453z"/>
  </svg>
)

const SOCIAL_GROUPS = [
  {
    label: 'Toán học',
    color: 'text-purple-500',
    links: [
      { platform: 'Facebook', href: 'https://www.facebook.com/ngocthaigiasu',  },
      { platform: 'TikTok',   href: 'https://www.tiktok.com/@ngocthaigiasu',   },
      { platform: 'Zalo',     href: 'https://zalo.me/g/9c8n1hgb0zul5pbislww', },
    ],
  },
  {
    label: 'Tiếng Anh',
    color: 'text-teal-500',
    links: [
      { platform: 'Facebook', href: 'https://www.facebook.com/ngocthaitutor',  },
      { platform: 'TikTok',   href: 'https://www.tiktok.com/@ngocthaitutor',   },
      { platform: 'Zalo',     href: 'https://zalo.me/g/ihbz7lmenl8cbricsn2b', },
    ],
  },
]

// ─── Page ────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="min-h-screen bg-background">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <img src="/logo-light.png" className="h-11 w-auto object-contain block dark:hidden" alt="ngocthaigiasu" />
            <img src="/logo-dark.png" className="h-11 w-auto object-contain hidden dark:block" alt="ngocthaigiasu" />
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Tính năng</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Bảng giá</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="Chuyển theme"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
            <Link href="/login">
              <Button variant="outline" size="sm">Đăng nhập</Button>
            </Link>
            <Link href="/login">
              <Button size="sm" className="gap-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white border-0 shadow">
                Học miễn phí <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden py-16 md:py-24">
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-[900px] rounded-full bg-gradient-to-b from-purple-100/60 via-indigo-50/40 to-transparent dark:from-purple-900/20 dark:via-indigo-900/10 blur-3xl" />
        </div>

        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge className="mb-5 gap-1.5 bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700 hover:bg-purple-100">
                <Sparkles className="h-3 w-3" /> Dành cho học sinh THPT ôn thi Đại học
              </Badge>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight mb-5">
                Ôn thi Đại học{' '}
                <span className="block">Toán & Tiếng Anh</span>
                <span className="bg-gradient-to-r from-purple-600 via-indigo-500 to-blue-500 bg-clip-text text-transparent">
                  với học phí... tiểu học
                </span>
              </h1>

              <p className="text-lg text-muted-foreground mb-6">
                AI giải Toán từng bước · Từ vựng Anh B1→C2 · Luyện đề chuẩn cấu trúc
              </p>

              {/* Social links ngang dưới subtext */}
              <div className="flex flex-wrap items-center gap-3 mb-8">
                <span className="text-xs text-muted-foreground font-medium">Cộng đồng:</span>
                {SOCIAL_GROUPS.map((group) => (
                  <div key={group.label} className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-bold ${group.color}`}>{group.label}</span>
                    {group.links.map((link) => (
                      <a
                        key={`hero-${group.label}-${link.platform}`}
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`${link.platform} — ${group.label}`}
                        className="w-8 h-8 rounded-full border border-border bg-background flex items-center justify-center transition-all duration-200 hover:scale-110 hover:shadow-md"
                      >
                        {link.platform === 'Facebook' && <FacebookIcon />}
                        {link.platform === 'TikTok'   && <TikTokIcon />}
                        {link.platform === 'Zalo'     && <ZaloIcon />}
                      </a>
                    ))}
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/login">
                  <Button size="lg" className="gap-2 text-base px-7 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white border-0 shadow-lg shadow-purple-200 dark:shadow-purple-900/30">
                    Bắt đầu miễn phí <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <a href="#features">
                  <Button variant="outline" size="lg" className="text-base px-7">
                    Xem tính năng
                  </Button>
                </a>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="h-4 w-4 text-green-500" /> Miễn phí mãi mãi
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="h-4 w-4 text-green-500" /> Không cần thẻ ngân hàng
                </span>
              </div>
            </motion.div>

            {/* Right: floating mockups */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="hidden lg:flex justify-end"
            >
              <div className="relative w-full max-w-sm h-80">
                <div className="absolute top-0 right-0 rotate-[3deg]">
                  <VocabMockup />
                </div>
                <div className="absolute bottom-0 left-0 rotate-[-2deg] z-10">
                  <MathMockup />
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="border-y border-border bg-muted/40">
        <div className="container py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {STATS.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <p className="text-2xl md:text-3xl font-extrabold text-foreground">{s.value}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 2-Pillar Overview ── */}
      <section id="features" className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Tất cả trong một nơi</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Hai môn học, một nền tảng — học tập toàn diện hơn bao giờ hết.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <Card className="h-full border-2 border-purple-100 dark:border-purple-900/40 hover:border-purple-300 dark:hover:border-purple-700 transition-colors group">
                <CardContent className="pt-7 pb-7">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="h-11 w-11 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <Calculator className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Toán AI</h3>
                      <p className="text-xs text-muted-foreground">THPT Quốc Gia ready</p>
                    </div>
                  </div>
                  <ul className="space-y-2.5 text-sm text-muted-foreground">
                    {[
                      'Chụp ảnh → AI giải từng bước với LaTeX',
                      'AI Gia sư phân tích điểm yếu, gợi ý ôn tập',
                      'Ngân hàng 10,000+ câu theo chủ đề & độ khó',
                    ].map((f) => (
                      <li key={f} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-purple-500 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/login">
                    <Button variant="outline" className="mt-6 w-full gap-1 group-hover:border-purple-400 group-hover:text-purple-600 transition-colors">
                      Học Toán miễn phí <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <Card className="h-full border-2 border-teal-100 dark:border-teal-900/40 hover:border-teal-300 dark:hover:border-teal-700 transition-colors group">
                <CardContent className="pt-7 pb-7">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="h-11 w-11 rounded-xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                      <Languages className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Tiếng Anh</h3>
                      <p className="text-xs text-muted-foreground">B1 → C2 · IELTS ready</p>
                    </div>
                  </div>
                  <ul className="space-y-2.5 text-sm text-muted-foreground">
                    {[
                      'Từ vựng B1, B2, C1-C2 theo chủ đề',
                      'Spaced repetition (FSRS) — nhớ lâu hơn',
                      'Ngữ pháp tương tác + Reading comprehension',
                    ].map((f) => (
                      <li key={f} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-teal-500 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/login">
                    <Button variant="outline" className="mt-6 w-full gap-1 group-hover:border-teal-400 group-hover:text-teal-600 transition-colors">
                      Học Tiếng Anh miễn phí <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Feature Deep-dive: Toán ── */}
      <section className="py-20 bg-gradient-to-b from-purple-50/60 to-background dark:from-purple-950/20">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Badge className="mb-4 bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700 hover:bg-purple-100">
                <Calculator className="h-3 w-3 mr-1" /> Học Toán
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Chinh phục Toán THPT cùng AI
              </h2>
              <p className="text-muted-foreground mb-8">
                Không cần gia sư đắt tiền — chụp ảnh bài toán bất kỳ, AI giải ngay với từng bước rõ ràng.
              </p>
              <div className="space-y-5">
                {MATH_FEATURES.map((f) => (
                  <div key={f.title} className="flex gap-4">
                    <div className={`shrink-0 h-10 w-10 rounded-xl flex items-center justify-center ${f.color}`}>
                      <f.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-0.5">{f.title}</h4>
                      <p className="text-sm text-muted-foreground">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/login" className="mt-8 inline-block">
                <Button className="gap-2 bg-purple-600 hover:bg-purple-700 text-white">
                  Thử giải toán miễn phí <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex justify-center lg:justify-end"
            >
              <div className="w-full max-w-sm rounded-2xl border-2 border-purple-100 dark:border-purple-900/40 bg-card shadow-2xl shadow-purple-100/60 dark:shadow-purple-900/20 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-8 w-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Brain className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="font-semibold text-sm">Giải toán AI</span>
                  <Badge className="ml-auto text-[10px] bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
                    ● Trực tuyến
                  </Badge>
                </div>
                <div className="rounded-xl bg-muted/50 p-3 text-center font-mono text-sm mb-4">
                  ∫₀¹ x² dx = ?
                </div>
                <div className="space-y-2 text-xs">
                  {[
                    { step: '1', text: 'Tìm nguyên hàm: F(x) = x³/3' },
                    { step: '2', text: 'F(1) - F(0) = 1/3 - 0 = 1/3' },
                    { step: '3', text: 'Kết quả: 1/3 ≈ 0.333' },
                  ].map((s) => (
                    <div key={s.step} className="flex items-center gap-2 p-2 rounded-lg bg-muted/40">
                      <span className="shrink-0 h-5 w-5 rounded-full bg-purple-500 text-white flex items-center justify-center text-[10px] font-bold">
                        {s.step}
                      </span>
                      <span className="text-muted-foreground">{s.text}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-2.5 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-xs text-green-700 dark:text-green-400 font-medium text-center">
                  ✓ Đáp án: 1/3
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Feature Deep-dive: Tiếng Anh ── */}
      <section className="py-20 bg-gradient-to-b from-teal-50/60 to-background dark:from-teal-950/20">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex justify-center lg:justify-start order-2 lg:order-1"
            >
              <div className="w-full max-w-sm rounded-2xl border-2 border-teal-100 dark:border-teal-900/40 bg-card shadow-2xl shadow-teal-100/60 dark:shadow-teal-900/20 p-6">
                <div className="flex items-center justify-between mb-4">
                  <Badge className="bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-700 hover:bg-teal-100 text-[10px]">
                    C1 · Khoa học
                  </Badge>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className={`h-1.5 w-5 rounded-full ${i <= 3 ? 'bg-teal-500' : 'bg-muted'}`} />
                    ))}
                  </div>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-teal-50 to-blue-50 dark:from-teal-900/20 dark:to-blue-900/20 border border-teal-100 dark:border-teal-800 p-5 text-center mb-4">
                  <p className="text-3xl font-bold text-teal-700 dark:text-teal-300 mb-1">phenomenon</p>
                  <p className="text-xs text-muted-foreground">/fəˈnɒmɪnən/ · noun</p>
                  <p className="text-base font-semibold mt-2">hiện tượng</p>
                </div>
                <p className="text-xs text-muted-foreground italic text-center mb-4">
                  &quot;Climate change is a global <strong className="text-foreground not-italic">phenomenon</strong>.&quot;
                </p>
                <div className="grid grid-cols-4 gap-1.5 text-center text-[10px]">
                  {['Nghe', 'Đọc', 'Viết', 'Nhớ'].map((a) => (
                    <button key={a} className="rounded-lg border py-1.5 hover:bg-muted transition-colors">
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-1 lg:order-2"
            >
              <Badge className="mb-4 bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-700 hover:bg-teal-100">
                <Languages className="h-3 w-3 mr-1" /> Học Tiếng Anh
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Lên trình tiếng Anh từ B1 đến C2
              </h2>
              <p className="text-muted-foreground mb-8">
                Phương pháp học khoa học — từ vựng, ngữ pháp, đọc hiểu đều được tích hợp trong một hành trình liên tục.
              </p>
              <div className="space-y-5">
                {ENGLISH_FEATURES.map((f) => (
                  <div key={f.title} className="flex gap-4">
                    <div className={`shrink-0 h-10 w-10 rounded-xl flex items-center justify-center ${f.color}`}>
                      <f.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-0.5">{f.title}</h4>
                      <p className="text-sm text-muted-foreground">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/login" className="mt-8 inline-block">
                <Button className="gap-2 bg-teal-600 hover:bg-teal-700 text-white">
                  Thử học tiếng Anh miễn phí <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Bắt đầu chỉ trong 3 bước</h2>
            <p className="text-muted-foreground">Đơn giản, nhanh chóng, không rườm rà.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="relative mx-auto mb-5 h-16 w-16">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-200 dark:shadow-purple-900/30">
                    <step.icon className="h-7 w-7 text-white" />
                  </div>
                  <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-background border-2 border-border text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                </div>
                <h3 className="font-bold text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Học sinh nói gì về chúng tôi</h2>
            <div className="flex items-center justify-center gap-1 mt-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              ))}
              <span className="text-sm text-muted-foreground ml-2">4.9/5 từ 200+ đánh giá</span>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full hover:shadow-md transition-shadow">
                  <CardContent className="pt-6 flex flex-col h-full">
                    <div className="flex mb-3">
                      {Array.from({ length: t.stars }).map((_, j) => (
                        <Star key={j} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mb-5 flex-1">&ldquo;{t.text}&rdquo;</p>
                    <div className="flex items-center gap-3 pt-4 border-t border-border">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {t.avatar}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.school}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Bảng giá rõ ràng, không ẩn phí</h2>
            <p className="text-muted-foreground">Bắt đầu miễn phí, nâng cấp khi sẵn sàng.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {PRICING.map((plan, i) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className={`h-full flex flex-col ${plan.highlight ? 'border-2 border-purple-500 dark:border-purple-400 shadow-xl shadow-purple-100/60 dark:shadow-purple-900/20' : ''}`}>
                  <CardContent className="pt-6 flex flex-col h-full">
                    {plan.badge && (
                      <Badge className={`self-start mb-3 text-xs ${plan.highlight ? 'bg-purple-600 text-white border-purple-600' : 'bg-secondary text-secondary-foreground'}`}>
                        {plan.highlight && <Zap className="h-3 w-3 mr-1" />}
                        {plan.badge}
                      </Badge>
                    )}
                    <h3 className="font-bold text-xl mb-1">{plan.name}</h3>
                    <div className="mb-5">
                      <span className="text-3xl font-extrabold">{plan.price}</span>
                      <span className="text-muted-foreground text-sm ml-1">{plan.period}</span>
                    </div>
                    <ul className="space-y-2.5 text-sm text-muted-foreground flex-1 mb-6">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2">
                          <CheckCircle className={`h-4 w-4 shrink-0 mt-0.5 ${plan.highlight ? 'text-purple-500' : 'text-green-500'}`} />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Link href={plan.href}>
                      <Button
                        className={`w-full ${plan.highlight ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white border-0 shadow' : ''}`}
                        variant={plan.highlight ? 'default' : 'outline'}
                      >
                        {plan.cta}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground mt-6">
            Cần gói riêng cho Toán hoặc Tiếng Anh? Xem thêm tại{' '}
            <Link href="/payment" className="underline hover:text-foreground">
              trang bảng giá đầy đủ
            </Link>.
          </p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-20">
        <div className="container max-w-2xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Câu hỏi thường gặp</h2>
            <p className="text-muted-foreground">Chưa tìm được câu trả lời? Nhắn tin cho chúng tôi.</p>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {FAQS.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-left font-medium">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-20 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600">
        <div className="container text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex justify-center mb-5">
              <div className="flex -space-x-2">
                {['MA', 'PQ', 'TH', 'NT', 'LH'].map((a) => (
                  <div
                    key={a}
                    className="h-9 w-9 rounded-full border-2 border-white/50 bg-white/20 backdrop-blur flex items-center justify-center text-xs font-bold"
                  >
                    {a}
                  </div>
                ))}
              </div>
              <span className="ml-3 text-sm text-white/80 self-center">+1,000 học sinh đang học</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
              Sẵn sàng học thông minh hơn chưa?
            </h2>
            <p className="text-white/80 mb-8 max-w-md mx-auto">
              Tham gia miễn phí ngay hôm nay. Không cần thẻ ngân hàng.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/login">
                <Button size="lg" className="gap-2 bg-white text-purple-700 hover:bg-white/90 font-bold shadow-lg px-8">
                  <CheckCircle className="h-4 w-4" /> Học miễn phí ngay
                </Button>
              </Link>
              <Link href="/payment">
                <Button size="lg" variant="outline" className="gap-2 border-white/40 text-white hover:bg-white/10 px-8">
                  <Users className="h-4 w-4" /> Xem bảng giá VIP
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border bg-muted/20 py-12">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-1">
              <Link href="/" className="flex items-center gap-2 font-bold text-lg mb-3">
                <img src="/logo-light.png" className="h-11 w-auto object-contain block dark:hidden" alt="ngocthaigiasu" />
                <img src="/logo-dark.png" className="h-11 w-auto object-contain hidden dark:block" alt="ngocthaigiasu" />
              </Link>
              <p className="text-sm text-muted-foreground">
                Nền tảng học Toán & Tiếng Anh thông minh dành cho học sinh Việt Nam.
              </p>

              {/* Social links */}
              <div className="mt-4 space-y-2">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Cộng đồng học tập</p>
                {SOCIAL_GROUPS.map((group) => (
                  <div key={group.label} className="flex items-center gap-2.5">
                    <span className={`text-[10px] font-bold ${group.color} w-[68px] shrink-0`}>{group.label}</span>
                    <div className="flex gap-1.5">
                      {group.links.map((link) => (
                        <a
                          key={link.platform}
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={`${link.platform} — ${group.label}`}
                          className="w-8 h-8 rounded-full border border-border bg-background flex items-center justify-center transition-all duration-200 hover:scale-110 hover:shadow-md"
                        >
                          {link.platform === 'Facebook' && <FacebookIcon />}
                          {link.platform === 'TikTok'   && <TikTokIcon />}
                          {link.platform === 'Zalo'     && <ZaloIcon />}
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-3">Sản phẩm</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {[
                  { href: '/solve', label: 'Giải Toán AI' },
                  // { href: '/exam', label: 'Thi Thử' }, // tạm ẩn — sẽ phát triển sau
                  { href: '/vocabulary', label: 'Từ Vựng Anh' },
                  { href: '/grammar', label: 'Ngữ Pháp' },
                ].map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="hover:text-foreground transition-colors">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-3">Hỗ trợ</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#faq" className="hover:text-foreground transition-colors">FAQ</a></li>
                <li><Link href="/affiliate" className="hover:text-foreground transition-colors">Hoa hồng</Link></li>
                <li><Link href="/payment" className="hover:text-foreground transition-colors">Bảng giá</Link></li>
                <li><Link href="/login" className="hover:text-foreground transition-colors">Đăng nhập</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-3">Pháp lý</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Điều khoản dịch vụ</li>
                <li>Chính sách bảo mật</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border pt-6 text-center text-xs text-muted-foreground">
            <p>© 2024 ngocthaigiasu.id.vn — Tất cả quyền được bảo lưu.</p>
          </div>
        </div>
      </footer>

    </div>
  )
}
