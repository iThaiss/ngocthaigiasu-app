'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Crown, Check, Loader2, CheckCircle, Copy, Shield, Zap, Star,
  Plus, ArrowRight, Info, Gift, BookOpen, Sparkles, RefreshCw,
  AlertCircle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { formatCurrency } from '@/lib/utils'
import { VIP_PLANS, PlanId, isPlanId } from '@/lib/plans'

interface TopupInfo {
  txId: string
  referenceCode: string
  amount: number
  pointsToAdd: number
  qrUrl: string
  bankAccount: string
  accountName: string
  bankName: string
}

const PRESET_AMOUNTS = [20000, 50000, 100000]

// Define durations for rendering
const DURATIONS = [
  { id: '1day', label: '1 Ngày', badge: 'Cấp tốc' },
  { id: '3days', label: '3 Ngày', badge: 'Ôn tập' },
  { id: '1week', label: '1 Tuần', badge: 'Thi cử' },
  { id: 'monthly', label: '1 Tháng', badge: 'Phổ biến' },
  { id: '3months', label: '3 Tháng', badge: 'Khuyên dùng', highlight: true },
  { id: 'yearly', label: '1 Năm', badge: 'Mỏ neo' },
]

export default function PaymentPage() {
  const { data: session, update: updateSession } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [points, setPoints] = useState<number | null>(null)
  const [lastFreeVipClaimedAt, setLastFreeVipClaimedAt] = useState<string | null>(null)
  const [loadingPoints, setLoadingPoints] = useState(true)
  const [amountInput, setAmountInput] = useState('')
  const [topupLoading, setTopupLoading] = useState(false)
  const [topupInfo, setTopupInfo] = useState<TopupInfo | null>(null)
  const [topupSuccess, setTopupSuccess] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [subscribing, setSubscribing] = useState<string | null>(null)
  const [couponInput, setCouponInput] = useState('')
  const [couponApplied, setCouponApplied] = useState<{ code: string; discountPercent: number; finalPoints: Record<string, number> } | null>(null)
  const [couponLoading, setCouponLoading] = useState(false)
  const [claimingFree, setClaimingFree] = useState(false)

  // Subject filter: combo, math, english
  const [subjectCategory, setSubjectCategory] = useState<'combo' | 'math' | 'english'>('combo')

  const pollRef = useRef<NodeJS.Timeout | null>(null)

  const fetchPoints = useCallback(async () => {
    try {
      const res = await fetch('/api/wallet')
      if (res.ok) {
        const data = await res.json()
        setPoints(data.points ?? 0)
        setLastFreeVipClaimedAt(data.lastFreeVipClaimedAt ?? null)
      }
    } catch (err) {
      console.error('Error fetching points:', err)
    } finally {
      setLoadingPoints(false)
    }
  }, [])

  useEffect(() => {
    fetchPoints()
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [fetchPoints])

  const parsedAmount = parseInt(amountInput.replace(/\D/g, ''), 10) || 0
  const pointsPreview = Math.floor(parsedAmount / 1000)
  const isVip = session?.user?.isVip ?? false

  // Calculate if eligible for free VIP day
  const getFreeVipStatus = () => {
    if (!lastFreeVipClaimedAt) return { eligible: true, daysLeft: 0 }
    const lastClaim = new Date(lastFreeVipClaimedAt)
    const diffTime = Date.now() - lastClaim.getTime()
    const diffDays = diffTime / (1000 * 60 * 60 * 24)
    if (diffDays >= 30) return { eligible: true, daysLeft: 0 }
    return { eligible: false, daysLeft: Math.ceil(30 - diffDays) }
  }

  const { eligible: canClaimFree, daysLeft: freeVipDaysLeft } = getFreeVipStatus()

  async function handleClaimFreeVip() {
    if (!canClaimFree) return
    setClaimingFree(true)
    try {
      const res = await fetch('/api/payment/claim-free-vip', {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error ?? 'Lỗi nhận VIP')
      }
      await updateSession()
      router.refresh()
      await fetchPoints()
      toast({
        title: 'Nhận quà thành công! 🎉',
        description: 'Tài khoản của bạn đã được kích hoạt 1 ngày VIP miễn phí.',
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Vui lòng thử lại sau.'
      toast({ title: 'Không thể nhận VIP miễn phí', description: msg, variant: 'destructive' })
    } finally {
      setClaimingFree(false)
    }
  }

  async function handleCreateTopup() {
    if (parsedAmount < 20000) {
      toast({ title: 'Số tiền tối thiểu 20.000đ', variant: 'destructive' })
      return
    }
    setTopupLoading(true)
    setTopupInfo(null)
    setTopupSuccess(false)
    setDialogOpen(true)

    try {
      const res = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parsedAmount }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'Request failed')
      }
      const data: TopupInfo = await res.json()
      setTopupInfo(data)

      if (pollRef.current) clearInterval(pollRef.current)
      pollRef.current = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/payment/status/${data.txId}`)
          const { status } = await statusRes.json()
          if (status === 'completed') {
            clearInterval(pollRef.current!)
            pollRef.current = null
            setTopupSuccess(true)
            await fetchPoints()
            toast({ title: `Nạp điểm thành công! +${data.pointsToAdd} điểm` })
          }
        } catch {
          // ignore transient network errors
        }
      }, 5000)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Vui lòng thử lại.'
      toast({ title: 'Không thể tạo giao dịch', description: msg, variant: 'destructive' })
      setDialogOpen(false)
    } finally {
      setTopupLoading(false)
    }
  }

  function handleDialogClose(open: boolean) {
    if (!open) {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
      setTopupSuccess(false)
      setTopupInfo(null)
    }
    setDialogOpen(open)
  }

  async function applyCoupon(samplePlanId: string) {
    if (!couponInput.trim()) return
    setCouponLoading(true)
    try {
      const res = await fetch('/api/payment/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponInput.trim(), planId: samplePlanId }),
      })
      const data = await res.json()
      if (!data.valid) {
        toast({ title: 'Mã không hợp lệ', description: data.error, variant: 'destructive' })
        return
      }

      // Pre-calculate final points for all available plans
      const finalPoints: Record<string, number> = {}
      const keys = Object.keys(VIP_PLANS)
      for (const pid of keys) {
        const r = await fetch('/api/payment/validate-coupon', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: couponInput.trim(), planId: pid }),
        })
        const d = await r.json()
        if (d.valid) finalPoints[pid] = d.finalPoints
      }
      setCouponApplied({ code: couponInput.trim().toUpperCase(), discountPercent: data.discountPercent, finalPoints })
      toast({ title: `Áp dụng mã thành công! Giảm ${data.discountPercent}%` })
    } catch {
      toast({ title: 'Lỗi', description: 'Không thể kiểm tra mã', variant: 'destructive' })
    } finally {
      setCouponLoading(false)
    }
  }

  async function handleSubscribe(planId: string) {
    setSubscribing(planId)
    try {
      const res = await fetch('/api/payment/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, ...(couponApplied && { couponCode: couponApplied.code }) }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.needed !== undefined) {
          toast({
            title: 'Không đủ điểm',
            description: `Cần ${data.needed} điểm, bạn đang có ${data.current} điểm (thiếu ${data.needed - data.current} điểm)`,
            variant: 'destructive',
          })
        } else {
          throw new Error(data.error ?? 'Request failed')
        }
        return
      }
      await updateSession()
      router.refresh()
      await fetchPoints()
      toast({
        title: 'Đăng ký VIP thành công! 🎉',
        description: `Tài khoản đã được kích hoạt. Còn lại ${data.pointsRemaining} điểm.`,
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Vui lòng thử lại.'
      toast({ title: 'Lỗi', description: msg, variant: 'destructive' })
    } finally {
      setSubscribing(null)
    }
  }

  function copy(text: string, label: string) {
    navigator.clipboard.writeText(text)
    toast({ title: `Đã sao chép ${label}` })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 px-4 sm:px-0 py-6 text-foreground">
      {/* Header section with Glassmorphism */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-2xl border border-slate-800 bg-slate-950/40 backdrop-blur-md shadow-2xl"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
            <Crown className="h-6 w-6 text-amber-500 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200 bg-clip-text text-transparent">
              Hệ thống điểm VIP
            </h1>
            <p className="text-slate-400 text-sm">Nạp tiền tích điểm — Kích hoạt đặc quyền học tập</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-3 shadow-[0_0_20px_rgba(245,158,11,0.15)] transition-transform hover:scale-105">
          <Star className="h-5 w-5 text-amber-400 fill-amber-400/20" />
          {loadingPoints ? (
            <Loader2 className="h-5 w-5 animate-spin text-amber-400" />
          ) : (
            <span className="text-xl font-black text-amber-400 font-mono">{points ?? 0} điểm</span>
          )}
          <button onClick={fetchPoints} className="ml-1 hover:text-amber-200 text-amber-500 transition-colors" title="Làm mới">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </motion.div>

      {/* VIP Expiry notice */}
      {isVip && session?.user?.vipExpiresAt && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4"
        >
          <Crown className="h-5 w-5 text-amber-400 shrink-0" />
          <p className="text-sm font-medium text-amber-200/90">
            Bạn đang có VIP cước{' '}
            <span className="font-bold text-amber-400">
              {session.user.vipPlan === 'math_vip'
                ? 'Toán VIP'
                : session.user.vipPlan === 'english_vip'
                ? 'Anh VIP'
                : 'Combo Toán + Anh VIP'}
            </span>
            . Hiệu lực đến: {new Date(session.user.vipExpiresAt).toLocaleDateString('vi-VN')} {new Date(session.user.vipExpiresAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}.
          </p>
        </motion.div>
      )}

      {/* Main Tabs */}
      <Tabs defaultValue="topup" className="w-full">
        <TabsList className="grid w-full grid-cols-2 p-1 bg-slate-950/80 border border-slate-900 rounded-xl h-12">
          <TabsTrigger value="topup" className="rounded-lg font-semibold text-sm transition-all data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            <Plus className="mr-2 h-4 w-4" /> Nạp điểm
          </TabsTrigger>
          <TabsTrigger value="subscribe" className="rounded-lg font-semibold text-sm transition-all data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            <Crown className="mr-2 h-4 w-4" /> Đăng ký gói
          </TabsTrigger>
        </TabsList>

        {/* Tab: Nạp điểm */}
        <TabsContent value="topup" className="mt-6 space-y-6">
          <Card className="border border-slate-800 bg-slate-950/40 backdrop-blur-md shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 h-48 w-48 rounded-full bg-purple-600/5 blur-3xl pointer-events-none" />
            <CardHeader className="pb-4 border-b border-slate-900">
              <CardTitle className="text-lg font-bold">Nạp điểm qua chuyển khoản nhanh</CardTitle>
              <CardDescription className="text-slate-400 text-sm">
                Quy đổi: <span className="text-purple-400 font-semibold">1.000đ = 1 điểm</span> · Hạn mức tối thiểu:{' '}
                <span className="text-red-400 font-semibold">20.000đ (20 điểm)</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* Info notice about minimum amount */}
              <div className="flex items-start gap-3 rounded-lg border border-blue-500/20 bg-blue-500/5 p-3.5 text-xs text-blue-400">
                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  Để tối ưu hóa xử lý biến động số dư và cước phí API, chúng tôi áp dụng hạn mức tối thiểu nạp tiền là 20.000đ. Xin cảm ơn quý học sinh.
                </span>
              </div>

              <div className="space-y-2.5">
                <Label htmlFor="amount" className="text-sm font-semibold text-slate-300">
                  Số tiền muốn nạp (VNĐ)
                </Label>
                <div className="relative">
                  <Input
                    id="amount"
                    placeholder="Nhập số tiền (VD: 50,000)"
                    inputMode="numeric"
                    value={amountInput ? parseInt(amountInput).toLocaleString('vi-VN') : ''}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '')
                      setAmountInput(raw)
                    }}
                    className="h-14 text-xl font-bold bg-slate-900/60 border-slate-800 focus-visible:ring-purple-500 text-purple-400 placeholder:text-slate-600 pl-4"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-500 text-sm">VNĐ</span>
                </div>
                {parsedAmount > 0 && parsedAmount < 20000 && (
                  <p className="text-xs text-red-400 font-medium flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" /> Số tiền tối thiểu nạp là 20.000đ.
                  </p>
                )}
              </div>

              {/* Preset buttons */}
              <div className="grid grid-cols-3 gap-3">
                {PRESET_AMOUNTS.map((preset) => (
                  <Button
                    key={preset}
                    variant="outline"
                    onClick={() => setAmountInput(String(preset))}
                    className={`h-12 border-slate-800 text-sm font-semibold transition-all hover:bg-purple-500/5 hover:border-purple-500/50 ${
                      parsedAmount === preset ? 'border-purple-500 bg-purple-500/10 text-purple-400 font-bold shadow-[0_0_15px_rgba(147,51,234,0.1)]' : 'text-slate-400'
                    }`}
                  >
                    {formatCurrency(preset)}
                    <span className="text-[10px] opacity-75 font-normal ml-1">({preset / 1000}đ)</span>
                  </Button>
                ))}
              </div>

              {/* Points preview panel */}
              <AnimatePresence>
                {parsedAmount >= 20000 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center justify-between rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
                      <span className="text-sm text-slate-400">Bạn sẽ nhận được:</span>
                      <div className="flex items-center gap-2 font-black text-amber-400">
                        <Star className="h-5 w-5 fill-amber-400/20" />
                        <span className="text-2xl font-mono">{pointsPreview} điểm VIP</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <Button
                className="w-full h-12 gap-2 font-bold text-sm bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg transition-transform hover:-translate-y-0.5 active:translate-y-0"
                onClick={handleCreateTopup}
                disabled={topupLoading || parsedAmount < 20000}
              >
                {topupLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Zap className="h-4 w-4" /> Tạo QR nạp tiền ngay
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Đăng ký gói */}
        <TabsContent value="subscribe" className="mt-6 space-y-6">
          {/* Claim Free VIP Day Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-5 rounded-2xl border backdrop-blur-md shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 transition-all ${
              canClaimFree
                ? 'border-emerald-500/30 bg-emerald-950/20 shadow-[0_0_20px_rgba(16,185,129,0.05)]'
                : 'border-slate-800 bg-slate-950/20'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${
                canClaimFree ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-slate-900 border border-slate-800 text-slate-500'
              }`}>
                <Gift className={`h-5 w-5 ${canClaimFree ? 'animate-bounce' : ''}`} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm">Học thử: Quà tặng 1 ngày VIP</h4>
                  {canClaimFree && <Badge className="bg-emerald-600 text-white border-0 text-[10px]">Khả dụng</Badge>}
                </div>
                <p className="text-xs text-slate-400">
                  Mỗi học sinh được kích hoạt miễn phí 24 giờ trải nghiệm VIP Combo Toán + Anh, định kỳ 1 lần mỗi tháng (30 ngày).
                </p>
              </div>
            </div>

            <div className="w-full md:w-auto shrink-0">
              {canClaimFree ? (
                <Button
                  onClick={handleClaimFreeVip}
                  disabled={claimingFree}
                  className="w-full md:w-auto font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-2 transition-transform hover:-translate-y-0.5"
                >
                  {claimingFree ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Kích hoạt 1 Ngày VIP
                </Button>
              ) : (
                <div className="text-center md:text-right px-4 py-2 rounded-lg bg-slate-900/60 border border-slate-800/80 text-xs text-slate-400">
                  Đã nhận tháng này. Lượt tiếp theo sau:{' '}
                  <span className="font-bold text-amber-400 font-mono text-sm ml-1">{freeVipDaysLeft} ngày</span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Subject Category Filter (Combo, Math, English) */}
          <div className="flex items-center justify-center">
            <div className="grid grid-cols-3 p-1 bg-slate-950/80 border border-slate-900 rounded-xl max-w-md w-full">
              {[
                { id: 'combo', label: 'Combo Toán+Anh' },
                { id: 'math', label: 'Chỉ học Toán' },
                { id: 'english', label: 'Chỉ học Anh' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSubjectCategory(cat.id as any)}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                    subjectCategory === cat.id
                      ? 'bg-purple-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Coupon Code Section */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/20 px-4 py-3.5 space-y-3">
            <p className="text-xs font-semibold text-slate-400">Áp dụng mã giảm giá ôn thi tốt nghiệp</p>
            {couponApplied ? (
              <div className="flex items-center justify-between">
                <Badge className="bg-green-500/15 text-green-400 border border-green-500/30 px-3 py-1.5 gap-1.5 text-xs">
                  <Check className="h-3.5 w-3.5 text-green-400" />
                  Mã {couponApplied.code} — Giảm {couponApplied.discountPercent}% cho tất cả gói
                </Badge>
                <button
                  onClick={() => { setCouponApplied(null); setCouponInput('') }}
                  className="text-xs text-slate-500 hover:text-slate-300 font-medium underline"
                >
                  Gỡ bỏ
                </button>
              </div>
            ) : (
              <div className="flex gap-2.5">
                <Input
                  placeholder="Nhập mã ưu đãi (Ví dụ: VEDICH30)"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  className="uppercase h-10 border-slate-800 bg-slate-950/40 text-sm focus-visible:ring-purple-500"
                />
                <Button
                  variant="outline"
                  onClick={() => applyCoupon(subjectCategory === 'combo' ? 'combo_3months' : `${subjectCategory}_3months`)}
                  disabled={couponLoading || !couponInput.trim()}
                  className="h-10 text-sm font-semibold border-slate-800 text-slate-300 px-5 hover:bg-slate-900"
                >
                  {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Áp dụng'}
                </Button>
              </div>
            )}
          </div>

          {/* Package display grid */}
          <div className="space-y-8">
            {/* Subsection 1: Gói cày cuốc cấp tốc */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Zap className="h-4 w-4 text-purple-400" />
                <h3 className="font-bold text-sm uppercase tracking-wider text-slate-400">Gói cấp tốc ôn tập ngắn hạn</h3>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                {DURATIONS.slice(0, 3).map((dur) => {
                  const durationKey = dur.id
                  const planId = (subjectCategory === 'combo' ? `combo_${durationKey}` : `${subjectCategory}_${durationKey}`) as PlanId
                  const planConfig = VIP_PLANS[planId]
                  if (!planConfig) return null

                  const currentPts = points ?? 0
                  const effectiveCost = couponApplied?.finalPoints?.[planId] ?? planConfig.costPoints
                  const canAfford = currentPts >= effectiveCost
                  const lacking = effectiveCost - currentPts
                  const isSubscribing = subscribing === planId

                  return (
                    <Card key={planId} className="border border-slate-800 bg-slate-950/40 backdrop-blur-md hover:border-slate-700 transition-all flex flex-col justify-between">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-slate-400">{planConfig.name}</span>
                          <Badge variant="outline" className="text-[10px] text-purple-400 border-purple-500/20 bg-purple-500/5">
                            {dur.badge}
                          </Badge>
                        </div>
                        <CardTitle className="text-base font-bold truncate">{planConfig.displayName}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 pt-0">
                        <div className="flex items-baseline gap-1.5">
                          <Star className="h-4 w-4 text-amber-500 shrink-0 fill-amber-500/15" />
                          {couponApplied && effectiveCost !== planConfig.costPoints ? (
                            <div className="flex items-baseline gap-2">
                              <span className="text-sm line-through text-slate-500 font-mono">{planConfig.costPoints}</span>
                              <span className="text-2xl font-black text-amber-400 font-mono">{effectiveCost}</span>
                            </div>
                          ) : (
                            <span className="text-2xl font-black text-amber-400 font-mono">{planConfig.costPoints}</span>
                          )}
                          <span className="text-xs text-slate-500">điểm / {planConfig.durationDays} ngày</span>
                        </div>
                        <Button
                          className="w-full text-xs font-bold"
                          variant="outline"
                          onClick={() => handleSubscribe(planId)}
                          disabled={!canAfford || isSubscribing || !!subscribing}
                        >
                          {isSubscribing ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                          ) : (
                            <Crown className="h-3.5 w-3.5 mr-1.5 text-amber-500 fill-amber-500/20" />
                          )}
                          {canAfford ? `Mua bằng ${effectiveCost} điểm` : `Thiếu ${lacking} điểm`}
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>

            {/* Subsection 2: Gói tự học tích lũy dài hạn */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="h-4 w-4 text-amber-400" />
                <h3 className="font-bold text-sm uppercase tracking-wider text-slate-400">Gói tích lũy đồng hành</h3>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                {DURATIONS.slice(3, 6).map((dur) => {
                  const durationKey = dur.id
                  const planId = (subjectCategory === 'combo'
                    ? (durationKey === 'yearly' ? 'combo_yearly' : `combo_${durationKey}`)
                    : (durationKey === 'yearly' ? `${subjectCategory}_yearly` : `${subjectCategory}_${durationKey}`)) as PlanId
                  const planConfig = VIP_PLANS[planId]
                  if (!planConfig) return null

                  const currentPts = points ?? 0
                  const effectiveCost = couponApplied?.finalPoints?.[planId] ?? planConfig.costPoints
                  const canAfford = currentPts >= effectiveCost
                  const lacking = effectiveCost - currentPts
                  const isSubscribing = subscribing === planId
                  const isHighlighted = dur.highlight

                  return (
                    <Card
                      key={planId}
                      className={`border backdrop-blur-md hover:border-slate-600 transition-all flex flex-col justify-between relative overflow-hidden ${
                        isHighlighted
                          ? 'border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.1)] bg-slate-950/60 scale-105 z-10'
                          : 'border-slate-800 bg-slate-950/40'
                      }`}
                    >
                      {isHighlighted && (
                        <div className="absolute top-0 right-0">
                          <span className="bg-amber-500 text-slate-950 text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-lg">
                            Đặc Biệt
                          </span>
                        </div>
                      )}
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-slate-400">{planConfig.name}</span>
                          <Badge
                            className={`text-[10px] border-0 ${
                              isHighlighted ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-slate-300'
                            }`}
                          >
                            {dur.badge}
                          </Badge>
                        </div>
                        <CardTitle className="text-base font-bold truncate">{planConfig.displayName}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 pt-0">
                        <div className="flex items-baseline gap-1.5">
                          <Star className="h-4 w-4 text-amber-500 shrink-0 fill-amber-500/15" />
                          {couponApplied && effectiveCost !== planConfig.costPoints ? (
                            <div className="flex items-baseline gap-2">
                              <span className="text-sm line-through text-slate-500 font-mono">{planConfig.costPoints}</span>
                              <span className="text-2xl font-black text-amber-400 font-mono">{effectiveCost}</span>
                            </div>
                          ) : (
                            <span className="text-2xl font-black text-amber-400 font-mono">{planConfig.costPoints}</span>
                          )}
                          <span className="text-xs text-slate-500">điểm / {planConfig.durationDays} ngày</span>
                        </div>

                        {/* Special saving badge */}
                        {planId.includes('3months') && (
                          <p className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                            ✓ Tiết kiệm đến 30% so với mua lẻ tháng
                          </p>
                        )}

                        <Button
                          className={`w-full text-xs font-bold ${
                            isHighlighted
                              ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 shadow-md'
                              : 'bg-transparent border-slate-800 text-slate-300 hover:bg-slate-900'
                          }`}
                          variant={isHighlighted ? 'default' : 'outline'}
                          onClick={() => handleSubscribe(planId)}
                          disabled={!canAfford || isSubscribing || !!subscribing}
                        >
                          {isSubscribing ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                          ) : (
                            <Crown className="h-3.5 w-3.5 mr-1.5" />
                          )}
                          {canAfford ? `Đăng ký bằng ${effectiveCost} điểm` : `Cần thêm ${lacking} điểm`}
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          </div>

          {!loadingPoints && (points ?? 0) < 9 && (
            <div className="flex items-center gap-2 rounded-xl border border-blue-500/10 bg-blue-500/5 p-4 text-sm text-blue-400">
              <Info className="h-4 w-4 shrink-0" />
              Chưa đủ điểm đăng ký VIP cước. Bạn hãy chuyển sang tab <strong className="text-white ml-0.5">Nạp điểm</strong> để nạp thêm (hạn mức tối thiểu nạp chỉ 20.000đ).
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Trust badges footer */}
      <div className="grid grid-cols-3 gap-4 border-t border-slate-900 pt-6">
        {[
          { icon: Shield, label: 'Bảo mật giao dịch', sub: 'Mã hóa 100%' },
          { icon: Zap, label: 'Kích hoạt lập tức', sub: 'Tự động duyệt 24/7' },
          { icon: Star, label: 'Giá trị quy đổi', sub: '1.000đ = 1 điểm' },
        ].map((item) => (
          <div key={item.label} className="flex flex-col items-center gap-1 rounded-xl bg-slate-950/20 border border-slate-900/50 p-4 text-center">
            <item.icon className="h-5 w-5 text-purple-500 mb-1" />
            <p className="text-xs font-bold text-slate-300">{item.label}</p>
            <p className="text-[10px] text-slate-500">{item.sub}</p>
          </div>
        ))}
      </div>

      {/* Bank Transfer QR Dialog */}
      <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-sm bg-slate-950 border border-slate-800 text-slate-200">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-center">Chuyển khoản nạp điểm</DialogTitle>
            <DialogDescription className="text-center text-slate-400 text-xs">
              Quét mã QR bằng ứng dụng ngân hàng của bạn để hoàn tất nhanh chóng.
            </DialogDescription>
          </DialogHeader>

          {(topupLoading || (!topupInfo && !topupSuccess)) && (
            <div className="flex flex-col items-center gap-3 py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
              <p className="text-xs text-slate-400">Đang khởi tạo mã QR chuyển khoản...</p>
            </div>
          )}

          {topupSuccess && topupInfo && (
            <div className="space-y-4 py-6 text-center">
              <CheckCircle className="mx-auto h-16 w-16 text-emerald-500 animate-bounce" />
              <p className="text-lg font-bold text-white">Nạp điểm thành công!</p>
              <div className="flex items-center justify-center gap-2">
                <Star className="h-5 w-5 text-amber-400 fill-amber-400/20" />
                <span className="text-2xl font-black text-amber-400 font-mono">+{topupInfo.pointsToAdd} điểm</span>
              </div>
              <p className="text-xs text-slate-400">Số điểm đã được cộng trực tiếp vào ví VIP của bạn.</p>
              <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold" onClick={() => setDialogOpen(false)}>
                Hoàn tất
              </Button>
            </div>
          )}

          {!topupLoading && topupInfo && !topupSuccess && (
            <div className="space-y-4">
              <div className="flex justify-center p-3 bg-white rounded-2xl border border-slate-800 max-w-[240px] mx-auto">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={topupInfo.qrUrl}
                  alt="Mã QR thanh toán"
                  width={220}
                  height={220}
                  className="rounded-lg object-contain"
                />
              </div>
              <div className="space-y-2.5 text-xs">
                <InfoRow label="Ngân hàng" value={topupInfo.bankName} />
                <InfoRow label="Số tài khoản" value={topupInfo.bankAccount} mono onCopy={() => copy(topupInfo.bankAccount, 'số tài khoản')} />
                <InfoRow label="Chủ tài khoản" value={topupInfo.accountName} />
                <InfoRow label="Số tiền chuyển" value={formatCurrency(topupInfo.amount)} bold onCopy={() => copy(String(topupInfo.amount), 'số tiền')} />
                <InfoRow label="Nội dung CK bắt buộc" value={topupInfo.referenceCode} mono bold onCopy={() => copy(topupInfo.referenceCode, 'nội dung')} />
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 px-3 py-2.5 text-[11px] text-amber-400">
                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
                <span>Hệ thống đang quét giao dịch tự động. Điểm sẽ cộng ngay sau khi tiền vào tài khoản.</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function InfoRow({
  label, value, mono = false, bold = false, onCopy,
}: {
  label: string
  value: string
  mono?: boolean
  bold?: boolean
  onCopy?: () => void
}) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-slate-900 border border-slate-800/80 px-3.5 py-2">
      <div>
        <p className="text-[10px] text-slate-500 font-semibold uppercase">{label}</p>
        <p className={`${mono ? 'font-mono text-sm' : ''} ${bold ? 'font-bold text-white' : 'font-medium text-slate-300'}`}>{value}</p>
      </div>
      {onCopy && (
        <button onClick={onCopy} className="ml-2 text-slate-500 transition-colors hover:text-slate-300">
          <Copy className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
