'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Brain, Trophy, BookOpen, ArrowRight, Star, Zap, Shield,
  CheckCircle, Flame, Target, Languages, Sparkles, ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { VIP_PLANS } from '@/lib/plans'

/* ─── Data ─────────────────────────────────────────────────────── */

const FEATURES = [
  {
    icon: Brain,
    title: 'AI Giải Toán',
    desc: 'Upload ảnh bài toán — AI phân tích và trình bày từng bước chi tiết bằng LaTeX chuẩn.',
    color: 'text-[var(--color-math)]',
    bg: 'bg-red-500/10',
  },
  {
    icon: Trophy,
    title: 'Thi Thử Thực Chiến',
    desc: '50 câu, 90 phút, bảng xếp hạng real-time. Áp lực y hệt thi THPT Quốc Gia thật.',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
  },
  {
    icon: BookOpen,
    title: 'Ngân Hàng Câu Hỏi',
    desc: 'Hàng nghìn câu chất lượng cao, phân loại theo độ khó và chủ đề bài thi.',
    color: 'text-[var(--color-english)]',
    bg: 'bg-rose-500/10',
  },
  {
    icon: Languages,
    title: 'Từ Vựng Tiếng Anh',
    desc: 'AI tạo bộ từ vựng cá nhân hóa. Spaced repetition giúp nhớ lâu hơn, nhanh hơn.',
    color: 'text-pink-400',
    bg: 'bg-pink-500/10',
  },
  {
    icon: Zap,
    title: 'Học Mọi Lúc',
    desc: 'Responsive hoàn toàn — học trên điện thoại, máy tính bảng hay laptop đều mượt.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
  },
  {
    icon: Shield,
    title: 'Bảo Mật Tuyệt Đối',
    desc: 'Google OAuth, dữ liệu mã hóa. Không lưu mật khẩu, không bao giờ spam.',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
  },
]

const STATS = [
  { value: 'AI', label: 'Giải từng bước' },
  { value: '50', label: 'Câu / đề thi' },
  { value: '90', label: 'Phút luyện đề' },
  { value: '24/7', label: 'Luôn sẵn sàng' },
]

const STEPS = [
  { n: '01', icon: Brain, title: 'Chụp & Upload', desc: 'Chụp ảnh bài toán hoặc nhập đề bài. AI đọc hiểu ngay tức thì.' },
  { n: '02', icon: Sparkles, title: 'AI Phân Tích', desc: 'Giải từng bước rõ ràng bằng LaTeX, giải thích tại sao — không chỉ đưa đáp án.' },
  { n: '03', icon: Target, title: 'Luyện & Tiến Bộ', desc: 'Lưu câu cần ôn, thi thử, theo dõi tiến độ. Điểm số tăng thật sự.' },
]

const TESTIMONIALS = [
  {
    name: 'Nguyễn Minh Anh',
    school: 'THPT Chu Văn An',
    text: 'Điểm Toán tôi từ 6 lên 9 chỉ sau 2 tháng. AI giải bài rất dễ hiểu, không phải học vẹt.',
    stars: 5,
    streak: 47,
  },
  {
    name: 'Trần Phú Quý',
    school: 'THPT Lê Quý Đôn',
    text: 'Thi thử với áp lực thời gian thật giúp tôi không còn run khi vào phòng thi nữa.',
    stars: 5,
    streak: 32,
  },
  {
    name: 'Lê Thu Hương',
    school: 'THPT Nguyễn Thị Minh Khai',
    text: 'Từ vựng tiếng Anh AI tạo đúng trình độ của mình. Học 10 phút mỗi ngày mà nhớ hơn cả tháng trước.',
    stars: 5,
    streak: 61,
  },
]

/* ─── Animation variants ───────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
}

/* ─── Page ──────────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

      {/* ── Navbar ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-rose text-white text-xs font-bold shadow-glow-sm group-hover:shadow-glow transition-shadow duration-300">
              NT
            </div>
            <span className="hidden sm:block font-bold text-base tracking-tight">
              ngocthaigiasu<span className="text-muted-foreground font-normal">.id.vn</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="#features" className="hover:text-foreground transition-colors">Tính năng</Link>
            <Link href="#how" className="hover:text-foreground transition-colors">Cách hoạt động</Link>
            <Link href="/payment" className="hover:text-foreground transition-colors">VIP</Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                Đăng nhập
              </Button>
            </Link>
            <Link href="/login">
              <Button size="sm" className="bg-gradient-rose border-0 text-white shadow-glow-sm hover:shadow-glow transition-shadow">
                Bắt đầu miễn phí <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-24 md:py-40 hero-mesh">
        {/* Decorative orbs */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute top-1/3 left-1/4 h-80 w-80 rounded-full bg-rose-500/10 blur-[90px]" />
          <div className="absolute bottom-1/4 right-1/3 h-96 w-96 rounded-full bg-red-600/8 blur-[110px]" />
          <div className="absolute -top-20 right-0 h-72 w-72 rounded-full bg-pink-500/6 blur-[80px]" />
        </div>

        <div className="container">
          <motion.div
            className="flex flex-col items-center text-center max-w-4xl mx-auto"
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.1 } } }}
          >
            <motion.div variants={fadeUp}>
              <Badge className="mb-6 gap-1.5 px-3 py-1 text-xs bg-rose-500/10 border border-rose-500/25 text-rose-400 rounded-full">
                <Zap className="h-3 w-3" /> Powered by Claude AI
              </Badge>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.06] mb-6"
            >
              Gia sư Toán{' '}
              <span className="bg-gradient-to-r from-rose-400 via-rose-500 to-red-500 bg-clip-text text-transparent">
                thông minh
              </span>
              <br className="hidden md:block" />
              {' '}cho học sinh Việt Nam
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed mb-10"
            >
              Chụp ảnh bài toán — AI giải ngay từng bước. Thi thử bảng xếp hạng.
              Luyện từ vựng tiếng Anh AI. Tất cả trong một nền tảng.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center gap-3">
              <Link href="/login">
                <Button
                  size="lg"
                  className="bg-gradient-rose border-0 text-white shadow-glow hover:shadow-glow transition-all hover:-translate-y-0.5 px-8 text-base h-12"
                >
                  Học miễn phí ngay <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
              <Link href="/solve">
                <Button
                  variant="outline"
                  size="lg"
                  className="px-8 text-base h-12 border-border/60 hover:border-primary/40 hover:bg-accent/50"
                >
                  Thử giải bài ngay
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Hero mock card */}
          <motion.div
            initial={{ opacity: 0, y: 36, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mt-20 mx-auto max-w-2xl"
          >
            <div
              className="rounded-2xl p-5 border"
              style={{
                background: 'var(--glass-bg)',
                borderColor: 'var(--border-subtle)',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
              }}
            >
              {/* Topbar */}
              <div className="flex items-center gap-2 mb-4 pb-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-rose text-white text-[10px] font-bold">NT</div>
                <span className="text-sm font-medium">AI Giải Toán</span>
                <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400">● Live</span>
              </div>
              {/* Question */}
              <div
                className="mb-4 rounded-xl p-4 text-sm leading-relaxed"
                style={{ background: 'hsl(var(--surface-1))', border: '1px solid var(--border-subtle)' }}
              >
                <p className="text-xs text-muted-foreground/60 mb-2 font-mono">Câu hỏi</p>
                <span className="text-muted-foreground">Giải phương trình: </span>
                <span className="font-mono text-foreground">x² - 5x + 6 = 0</span>
              </div>
              {/* Answer */}
              <div className="rounded-xl p-4 text-sm space-y-2 bg-rose-500/5" style={{ border: '1px solid var(--accent-soft)' }}>
                <p className="text-xs text-rose-400 font-medium mb-3">✦ Lời giải AI</p>
                <p className="text-muted-foreground">
                  Với <span className="text-foreground font-mono">a=1, b=-5, c=6</span>
                </p>
                <p className="text-muted-foreground">
                  Delta: <span className="text-foreground font-mono">Δ = 25 - 24 = 1 &gt; 0</span>
                </p>
                <p className="text-muted-foreground">
                  Nghiệm: <span className="text-foreground font-mono text-rose-400">x₁ = 3, x₂ = 2</span>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────────────── */}
      <section style={{ borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)', background: 'hsl(var(--surface-1) / 0.4)' }}>
        <div className="container py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.4 }}
                className="text-center"
              >
                <p className="text-3xl md:text-4xl font-extrabold bg-gradient-to-br from-rose-400 to-red-500 bg-clip-text text-transparent">
                  {s.value}
                </p>
                <p className="text-xs text-muted-foreground mt-1.5">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────── */}
      <section id="features" className="py-24 md:py-32">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-rose-500/10 border border-rose-500/25 text-rose-400 rounded-full px-3 py-0.5">
              Tính năng
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              Tất cả những gì cần
              <br className="hidden md:block" />
              <span className="text-muted-foreground font-normal"> để chinh phục kỳ thi</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-lg mx-auto">
              Từ giải bài AI đến luyện từ vựng tiếng Anh — đủ công cụ, một nơi duy nhất.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                custom={i}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={fadeUp}
              >
                <div
                  className="rounded-2xl p-6 h-full transition-all duration-200 hover:-translate-y-0.5 cursor-default"
                  style={{
                    background: 'var(--glass-bg)',
                    border: '1px solid var(--glass-border)',
                    backdropFilter: 'blur(12px)',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(244,63,94,0.18)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--glass-border)')}
                >
                  <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${f.bg} ${f.color}`}>
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-base mb-2">{f.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────── */}
      <section id="how" className="py-24 md:py-32" style={{ background: 'hsl(var(--surface-1) / 0.35)' }}>
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-rose-500/10 border border-rose-500/25 text-rose-400 rounded-full px-3 py-0.5">
              3 bước đơn giản
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
              Bắt đầu học trong{' '}
              <span className="bg-gradient-to-r from-rose-400 to-red-500 bg-clip-text text-transparent">
                60 giây
              </span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 relative">
            <div
              className="hidden md:block absolute top-[3.25rem] left-[38%] right-[38%] h-px"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(244,63,94,0.3), transparent)' }}
            />

            {STEPS.map((s, i) => (
              <motion.div
                key={s.n}
                custom={i}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={fadeUp}
              >
                <div
                  className="rounded-2xl p-7 text-center h-full transition-colors"
                  style={{
                    background: 'var(--glass-bg)',
                    border: '1px solid var(--border-subtle)',
                    backdropFilter: 'blur(12px)',
                  }}
                >
                  <div className="mb-5 inline-flex flex-col items-center gap-2">
                    <span className="text-[10px] font-mono text-rose-400/50 tracking-[0.2em]">{s.n}</span>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20">
                      <s.icon className="h-5 w-5 text-rose-400" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-base mb-2">{s.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────── */}
      <section className="py-24 md:py-32">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-rose-500/10 border border-rose-500/25 text-rose-400 rounded-full px-3 py-0.5">
              Học sinh nói gì
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
              Kết quả thật,{' '}
              <span className="text-muted-foreground font-normal">từ học sinh thật</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                custom={i}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={fadeUp}
              >
                <div
                  className="rounded-2xl p-6 flex flex-col gap-4 h-full transition-colors"
                  style={{
                    background: 'var(--glass-bg)',
                    border: '1px solid var(--border-subtle)',
                    backdropFilter: 'blur(12px)',
                  }}
                >
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: t.stars }).map((_, j) => (
                      <Star key={j} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                    &ldquo;{t.text}&rdquo;
                  </p>
                  <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    <div>
                      <p className="font-medium text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{t.school}</p>
                    </div>
                    <div className="streak-chip flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium">
                      <Flame className="h-3 w-3" /> {t.streak} ngày
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="py-24 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500/8 via-transparent to-red-600/5" />
          <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(244,63,94,0.4), transparent)' }} />
          <div className="absolute inset-x-0 bottom-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(244,63,94,0.2), transparent)' }} />
        </div>
        <div className="container relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto"
          >
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              Sẵn sàng chinh phục{' '}
              <span className="bg-gradient-to-r from-rose-400 to-red-500 bg-clip-text text-transparent">
                kỳ thi?
              </span>
            </h2>
            <p className="text-muted-foreground text-lg mb-10 leading-relaxed">
              Đăng ký miễn phí ngay hôm nay. Không cần thẻ tín dụng.
              Nâng cấp VIP khi cần nhiều hơn.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/login">
                <Button
                  size="lg"
                  className="bg-gradient-rose border-0 text-white shadow-glow hover:shadow-glow transition-all hover:-translate-y-0.5 px-8 text-base h-12"
                >
                  <CheckCircle className="h-4 w-4 mr-2" /> Đăng ký miễn phí
                </Button>
              </Link>
              <Link href="/payment">
                <Button
                  variant="outline"
                  size="lg"
                  className="px-8 text-base h-12 border-border/60 hover:border-primary/40 gap-2"
                >
                  <Trophy className="h-4 w-4" />
                  VIP — {VIP_PLANS.monthly.costPoints} điểm/tháng
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid var(--border-subtle)', background: 'hsl(var(--surface-1) / 0.3)' }}>
        <div className="container py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-rose text-white text-[10px] font-bold">
              NT
            </div>
            <span className="text-sm text-muted-foreground">
              © 2025{' '}
              <span className="text-foreground font-medium">ngocthaigiasu.id.vn</span>
              {' '}— Tất cả quyền bảo lưu.
            </span>
          </div>
          <div className="flex items-center gap-5 text-sm text-muted-foreground">
            <Link href="/login" className="hover:text-foreground transition-colors">Đăng nhập</Link>
            <Link href="/payment" className="hover:text-foreground transition-colors">VIP</Link>
            <Link href="/affiliate" className="hover:text-foreground transition-colors">Hoa hồng</Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">Liên hệ</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
