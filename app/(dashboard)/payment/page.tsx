'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Crown, Check, Loader2, CheckCircle, Copy, Shield, Zap, Star,
  Plus, Gift, Sparkles, RefreshCw, AlertCircle, HelpCircle,
  CreditCard, Wallet, ArrowRight, BookOpen
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { formatCurrency } from '@/lib/utils'
import { VIP_PLANS, PlanId } from '@/lib/plans'

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

// Define cước durations (5 packages) with styling properties
const DURATIONS = [
  {
    id: '1day',
    label: '1 Ngày',
    badge: 'Cấp tốc',
  },
  {
    id: '1week',
    label: '1 Tuần',
    badge: 'Ôn thi',
  },
  {
    id: 'monthly',
    label: '1 Tháng',
    badge: 'Tự học',
  },
  {
    id: '3months',
    label: '3 Tháng',
    badge: 'Khuyên dùng',
    highlight: true,
  },
  {
    id: 'yearly',
    label: '1 Năm',
    badge: 'Đồng hành',
  },
]

// Unified VIP benefits
const VIP_BENEFITS = [
  {
    icon: Zap,
    title: 'Trợ lý AI Giải Toán',
    description: 'Giải toán không giới hạn (gói Toán/Combo), giải thích chi tiết từng bước. Gói tháng trở lên dùng mô hình Gemini 2.5 Flash cao cấp.',
    color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  },
  {
    icon: Sparkles,
    title: 'Học Anh Văn Thông Minh',
    description: 'Mở khóa phương pháp Lặp lại ngắt quãng (Spaced Repetition) học từ vựng và tra cứu từ điển nâng cao.',
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  },
  {
    icon: BookOpen,
    title: 'Luyện Đề Bứt Phá',
    description: 'Mở khóa toàn bộ kho đề thi tốt nghiệp THPT Quốc gia và đề Đánh giá năng lực có lời giải chi tiết.',
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  },
  {
    icon: Shield,
    title: 'Trải Nghiệm Tập Trung 100%',
    description: 'Không quảng cáo, không bị gián đoạn, bảo mật và đồng bộ tiến độ học tập trên mọi thiết bị.',
    color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  },
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
  const [giftInput, setGiftInput] = useState('')
  const [giftLoading, setGiftLoading] = useState(false)
  const [giftRedeemed, setGiftRedeemed] = useState<{ label: string } | null>(null)

  // Confirm states
  const [confirmSubscribePlan, setConfirmSubscribePlan] = useState<PlanId | null>(null)
  const [shortPointsPlan, setShortPointsPlan] = useState<PlanId | null>(null)
  const [confirmTopupAmount, setConfirmTopupAmount] = useState<number | null>(null)
  const [pendingSubscribePlanId, setPendingSubscribePlanId] = useState<PlanId | null>(null)
  const [successMessage, setSuccessMessage] = useState<{ title: string; subtitle: string; highlight: string } | null>(null)

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
      const res = await fetch('/api/payment/claim-free-vip', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Lỗi nhận VIP')
      await updateSession()
      router.refresh()
      await fetchPoints()
      toast({ title: 'Nhận quà thành công! 🎉', description: 'Đã kích hoạt 1 ngày VIP miễn phí.' })
    } catch (err) {
      toast({ title: 'Không thể nhận VIP miễn phí', description: err instanceof Error ? err.message : 'Vui lòng thử lại.', variant: 'destructive' })
    } finally {
      setClaimingFree(false)
    }
  }

  async function redeemGiftCode() {
    if (!giftInput.trim()) return
    setGiftLoading(true)
    try {
      const res = await fetch('/api/payment/redeem-gift-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: giftInput.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Lỗi đổi mã quà tặng')
      setGiftRedeemed({ label: data.planLabel })
      await updateSession()
      router.refresh()
      await fetchPoints()
      toast({ title: 'Đổi quà thành công! 🎁', description: `Đã kích hoạt ${data.planLabel}.` })
    } catch (err) {
      toast({ title: 'Không thể đổi mã quà tặng', description: err instanceof Error ? err.message : 'Vui lòng thử lại.', variant: 'destructive' })
    } finally {
      setGiftLoading(false)
    }
  }

  // Common purchase API call
  async function executeSubscribe(planId: PlanId): Promise<boolean> {
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
            description: `Thiếu ${data.needed - data.current} điểm. Vui lòng nạp thêm.`,
            variant: 'destructive',
          })
        } else {
          throw new Error(data.error ?? 'Giao dịch thất bại')
        }
        return false
      }
      await updateSession()
      router.refresh()
      await fetchPoints()
      return true
    } catch (err) {
      toast({ title: 'Lỗi', description: err instanceof Error ? err.message : 'Thử lại sau.', variant: 'destructive' })
      return false
    } finally {
      setSubscribing(null)
    }
  }

  // Handler for direct confirm purchase dialog
  async function handleConfirmSubscribe() {
    if (!confirmSubscribePlan) return
    const planId = confirmSubscribePlan
    setConfirmSubscribePlan(null)
    const success = await executeSubscribe(planId)
    if (success) {
      toast({ title: 'Kích hoạt VIP thành công! 🎉' })
    }
  }

  // Handler for auto-subscription triggered by client polling
  async function handleAutoSubscribe(planId: PlanId) {
    try {
      const res = await fetch('/api/payment/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, ...(couponApplied && { couponCode: couponApplied.code }) }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error ?? 'Đăng ký gói tự động thất bại')
      }
      await updateSession()
      router.refresh()
      await fetchPoints()
      
      setSuccessMessage({
        title: 'Kích hoạt VIP thành công! 👑',
        subtitle: `Hệ thống đã tự động nâng cấp thành công gói ${VIP_PLANS[planId]?.displayName}.`,
        highlight: `${VIP_PLANS[planId]?.name} VIP`
      })
      setTopupSuccess(true)
      setPendingSubscribePlanId(null)
      toast({ title: 'Kích hoạt VIP thành công! 🎉' })
    } catch (err) {
      console.error('Auto activation error:', err)
      toast({
        title: 'Lỗi kích hoạt tự động',
        description: err instanceof Error ? err.message : 'Vui lòng kích hoạt thủ công.',
        variant: 'destructive'
      })
      // Fallback to basic top-up success, user gets points at least
      setSuccessMessage({
        title: 'Nạp điểm thành công! 🎉',
        subtitle: 'Điểm cước đã được cộng. Vui lòng bấm kích hoạt thủ công.',
        highlight: `Điểm cước đã sẵn sàng`
      })
      setTopupSuccess(true)
      setPendingSubscribePlanId(null)
      await fetchPoints()
    }
  }

  // Unified top-up creator
  async function createTopup(amount: number, autoSubscribePlanId?: PlanId | null) {
    if (amount < 20000) return
    
    // Clear confirmation modals
    setConfirmTopupAmount(null)
    setShortPointsPlan(null)
    
    setTopupLoading(true)
    setDialogOpen(true)
    
    if (autoSubscribePlanId) {
      setPendingSubscribePlanId(autoSubscribePlanId)
    } else {
      setPendingSubscribePlanId(null)
    }

    try {
      const res = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'Lỗi tạo giao dịch')
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
            
            if (autoSubscribePlanId) {
              await handleAutoSubscribe(autoSubscribePlanId)
            } else {
              setSuccessMessage({
                title: 'Nạp điểm thành công! 🎉',
                subtitle: 'Điểm cước đã được cộng vào tài khoản của bạn.',
                highlight: `+${data.pointsToAdd} điểm cước`
              })
              setTopupSuccess(true)
              await fetchPoints()
              toast({ title: `Nạp điểm thành công! +${data.pointsToAdd} điểm` })
            }
          }
        } catch {}
      }, 5500)
    } catch (err) {
      toast({ title: 'Không thể tạo giao dịch', description: err instanceof Error ? err.message : 'Thử lại sau.', variant: 'destructive' })
      setDialogOpen(false)
      setPendingSubscribePlanId(null)
    } finally {
      setTopupLoading(false)
    }
  }

  function handleCreateTopupRequest() {
    if (parsedAmount < 20000) {
      toast({ title: 'Số tiền tối thiểu 20.000đ', variant: 'destructive' })
      return
    }
    setConfirmTopupAmount(parsedAmount)
  }

  function handleSubscribeRequest(planId: string) {
    const planConfig = VIP_PLANS[planId as PlanId]
    if (!planConfig) return
    const currentPts = points ?? 0
    const effectiveCost = couponApplied?.finalPoints?.[planId as PlanId] ?? planConfig.costPoints

    if (currentPts >= effectiveCost) {
      setConfirmSubscribePlan(planId as PlanId)
    } else {
      setShortPointsPlan(planId as PlanId)
    }
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

      const finalPoints: Record<string, number> = {}
      for (const dur of DURATIONS) {
        const key = dur.id
        const pid = (subjectCategory === 'combo'
          ? (key === 'yearly' ? 'combo_yearly' : `combo_${key}`)
          : (key === 'yearly' ? `${subjectCategory}_yearly` : `${subjectCategory}_${key}`)) as PlanId
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

  function handleDialogClose(open: boolean) {
    if (!open) {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
      setTopupSuccess(false)
      setTopupInfo(null)
      setPendingSubscribePlanId(null)
      setSuccessMessage(null)
    }
    setDialogOpen(open)
  }

  function copy(text: string, label: string) {
    navigator.clipboard.writeText(text)
    toast({ title: `Đã sao chép ${label}` })
  }

  // Pre-calculate shortPointsPlan variables safely
  const shortPointsPlanConfig = shortPointsPlan ? VIP_PLANS[shortPointsPlan] : null
  const shortPointsPlanCost = shortPointsPlan && shortPointsPlanConfig
    ? (couponApplied?.finalPoints?.[shortPointsPlan] ?? shortPointsPlanConfig.costPoints)
    : 0
  const shortPointsCurrent = points ?? 0
  const shortPointsNeeded = Math.max(0, shortPointsPlanCost - shortPointsCurrent)
  const shortPointsCashNeeded = shortPointsNeeded * 1000
  const finalTopupAmount = shortPointsCashNeeded < 20000 ? 20000 : shortPointsCashNeeded
  const pointsToAddFromTopup = finalTopupAmount / 1000
  const expectedWalletAfterTopup = shortPointsCurrent + pointsToAddFromTopup
  const expectedWalletAfterPurchase = expectedWalletAfterTopup - shortPointsPlanCost

  return (
    <div className="max-w-6xl mx-auto space-y-8 px-4 py-8 text-foreground relative min-h-screen">
      {/* Background glowing decorations */}
      <div className="absolute top-10 left-1/4 w-96 h-96 rounded-full bg-purple-650/10 blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-20 right-1/4 w-96 h-96 rounded-full bg-amber-500/5 blur-3xl pointer-events-none -z-10" />

      {/* Header section with Premium Glassmorphism */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-6 p-6 rounded-3xl border border-slate-800 bg-slate-900/40 backdrop-blur-xl shadow-2xl relative overflow-hidden"
      >
        <div className="absolute -top-16 -left-16 h-32 w-32 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />
        <div className="flex items-center gap-5 z-10">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-500/10 border border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.15)] shrink-0">
            <Crown className="h-7 w-7 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-violet-300 via-amber-200 to-yellow-300 bg-clip-text text-transparent">
              Đặc Quyền Hội Viên VIP
            </h1>
            <p className="text-slate-400 text-xs mt-1">Sử dụng điểm cước tự động để kích hoạt các đặc quyền học tập không giới hạn</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-3 shadow-[0_0_25px_rgba(245,158,11,0.12)]">
          <Star className="h-5 w-5 text-amber-400 fill-amber-400/20 shrink-0" />
          {loadingPoints ? (
            <Loader2 className="h-5 w-5 animate-spin text-amber-400" />
          ) : (
            <span className="text-xl font-extrabold text-amber-400 font-mono tracking-wide">{points ?? 0}đ</span>
          )}
          <button onClick={fetchPoints} className="ml-2 hover:text-amber-200 text-amber-500 transition-colors p-1" title="Làm mới">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </motion.div>

      {/* VIP Expiry status indicator */}
      {isVip && session?.user?.vipExpiresAt && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 shadow-[0_0_15px_rgba(245,158,11,0.05)]"
        >
          <div className="h-8 w-8 rounded-full bg-amber-500/15 flex items-center justify-center shrink-0">
            <Crown className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-sm font-medium text-amber-300 leading-relaxed">
            Hội viên VIP hiện tại:{' '}
            <span className="text-white font-bold">
              {session.user.plan === 'math_vip'
                ? 'Toán VIP'
                : session.user.plan === 'english_vip'
                ? 'Anh VIP'
                : 'Combo Toán + Anh VIP'}
            </span>
            . Thời hạn kết thúc:{' '}
            <span className="text-white font-semibold">
              {new Date(session.user.vipExpiresAt).toLocaleDateString('vi-VN')} {new Date(session.user.vipExpiresAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </p>
        </motion.div>
      )}

      {/* Main Tabs */}
      <Tabs defaultValue="subscribe" className="w-full">
        <TabsList className="grid w-full grid-cols-2 p-1.5 bg-slate-900/60 border border-slate-800 rounded-2xl h-14 max-w-xl mx-auto shadow-lg">
          <TabsTrigger value="subscribe" className="rounded-xl font-bold text-xs sm:text-sm transition-all data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            <Crown className="mr-2 h-4 w-4" /> Đăng ký gói cước
          </TabsTrigger>
          <TabsTrigger value="topup" className="rounded-xl font-bold text-xs sm:text-sm transition-all data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            <Plus className="mr-2 h-4 w-4" /> Nạp thêm điểm
          </TabsTrigger>
        </TabsList>

        {/* Tab: Đăng ký gói */}
        <TabsContent value="subscribe" className="mt-8 space-y-8">
          
          {/* Holographic free claim VIP voucher */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-2xl border border-emerald-500/25 bg-gradient-to-r from-emerald-550/10 via-teal-950/5 to-emerald-550/10 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_0_20px_rgba(16,185,129,0.04)] relative overflow-hidden"
          >
            <div className="absolute right-0 bottom-0 top-0 w-32 bg-emerald-550/5 blur-3xl pointer-events-none" />
            <div className="flex items-center gap-4">
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${
                canClaimFree
                  ? 'bg-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)] animate-pulse'
                  : 'bg-slate-900 text-slate-500 border border-slate-800'
              }`}>
                <Gift className="h-6 w-6" />
              </div>
              <div className="space-y-1 text-center sm:text-left">
                <h4 className="font-extrabold text-sm text-emerald-400 flex items-center gap-1.5 justify-center sm:justify-start">
                  Tặng 1 Ngày Trải Nghiệm VIP
                  {canClaimFree && <Badge className="bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-500 text-[9px] h-4">Mở sẵn</Badge>}
                </h4>
                <p className="text-xs text-slate-400">Trải nghiệm full tính năng VIP hoàn toàn miễn phí. Hồi lại sau mỗi 30 ngày.</p>
              </div>
            </div>

            <div className="shrink-0">
              {canClaimFree ? (
                <Button
                  onClick={handleClaimFreeVip}
                  disabled={claimingFree}
                  size="sm"
                  className="font-bold bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-5 h-9 rounded-xl shadow-[0_4px_12px_rgba(16,185,129,0.3)] transition-all hover:scale-102"
                >
                  {claimingFree ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <Sparkles className="h-4.5 w-4.5 mr-1.5" />}
                  Nhận ngay 1 ngày
                </Button>
              ) : (
                <span className="text-xs text-amber-500 font-bold bg-amber-500/10 px-4 py-2 rounded-xl border border-amber-500/20 shadow-inner">
                  Lượt tiếp theo: {freeVipDaysLeft} ngày
                </span>
              )}
            </div>
          </motion.div>

          {/* Category control panel */}
          <div className="flex flex-col gap-4 items-center justify-center">
            <div className="grid grid-cols-3 p-1 bg-slate-900/80 border border-slate-800/80 rounded-2xl max-w-md w-full shadow-lg">
              {[
                { id: 'combo', label: 'Combo Toán + Anh' },
                { id: 'math', label: 'Môn Toán' },
                { id: 'english', label: 'Môn Anh' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSubjectCategory(cat.id as any)}
                  className={`py-2 rounded-xl text-xs sm:text-xs font-extrabold transition-all duration-300 ${
                    subjectCategory === cat.id
                      ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.4)]'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Coupon Code Panel */}
            <div className="rounded-2xl border border-slate-850 bg-slate-900/20 p-4 flex flex-wrap items-center justify-between gap-4 w-full max-w-lg shadow-inner">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-400" />
                <span className="text-xs font-bold text-slate-300">Mã giảm giá ôn thi học kỳ/THPT:</span>
              </div>
              {couponApplied ? (
                <Badge className="bg-green-500/15 text-green-400 border border-green-500/30 px-3 py-1.5 text-xs gap-2 font-mono rounded-lg">
                  {couponApplied.code} (-{couponApplied.discountPercent}%)
                  <button onClick={() => { setCouponApplied(null); setCouponInput('') }} className="hover:text-white font-bold ml-1 text-sm">×</button>
                </Badge>
              ) : (
                <div className="flex gap-2 w-full sm:w-auto">
                  <Input
                    placeholder="MÃ GIẢM GIÁ (VD: VEDICH30)"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    className="uppercase h-9 text-xs border-slate-800 bg-slate-950/40 focus-visible:ring-purple-500 text-center font-bold tracking-wider rounded-lg max-w-[170px]"
                  />
                  <Button
                    variant="outline"
                    onClick={() => applyCoupon(subjectCategory === 'combo' ? 'combo_3months' : `${subjectCategory}_3months`)}
                    disabled={couponLoading || !couponInput.trim()}
                    className="h-9 text-xs font-bold border-slate-800 text-slate-300 px-4 hover:bg-slate-900 rounded-lg"
                  >
                    Áp dụng
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Gift Code Panel */}
          <div className="rounded-2xl border border-slate-850 bg-slate-900/20 p-4 flex flex-wrap items-center justify-between gap-4 w-full max-w-lg shadow-inner">
            <div className="flex items-center gap-2">
              <Gift className="h-4 w-4 text-rose-400" />
              <span className="text-xs font-bold text-slate-300">Mã quà tặng VIP miễn phí:</span>
            </div>
            {giftRedeemed ? (
              <Badge className="bg-rose-500/15 text-rose-400 border border-rose-500/30 px-3 py-1.5 text-xs gap-2 font-mono rounded-lg">
                ✓ {giftRedeemed.label} đã được kích hoạt!
              </Badge>
            ) : (
              <div className="flex gap-2 w-full sm:w-auto">
                <Input
                  placeholder="MÃ QUÀ TẶNG"
                  value={giftInput}
                  onChange={(e) => setGiftInput(e.target.value.toUpperCase())}
                  className="uppercase h-9 text-xs border-slate-800 bg-slate-950/40 focus-visible:ring-rose-500 text-center font-bold tracking-wider rounded-lg max-w-[170px]"
                />
                <Button
                  variant="outline"
                  onClick={redeemGiftCode}
                  disabled={giftLoading || !giftInput.trim()}
                  className="h-9 text-xs font-bold border-slate-800 text-slate-300 px-4 hover:bg-slate-900 rounded-lg"
                >
                  {giftLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Đổi quà'}
                </Button>
              </div>
            )}
          </div>

          {/* Pricing Grid - Highly Minimalistic Redesign */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
            {DURATIONS.map((dur) => {
              const durationKey = dur.id
              const planId = (subjectCategory === 'combo'
                ? (durationKey === 'yearly' ? 'combo_yearly' : `combo_${durationKey}`)
                : (durationKey === 'yearly' ? `${subjectCategory}_yearly` : `${subjectCategory}_${durationKey}`)) as PlanId
              const planConfig = VIP_PLANS[planId]
              if (!planConfig) return null

              const currentPts = points ?? 0
              const effectiveCost = couponApplied?.finalPoints?.[planId] ?? planConfig.costPoints
              const canAfford = currentPts >= effectiveCost
              const isSubscribing = subscribing === planId
              const isHighlighted = dur.highlight
              const isYearly = durationKey === 'yearly'

              // Calculate daily cost dynamically for student preview
              const dailyCostVnd = Math.round((effectiveCost * 1000) / planConfig.durationDays)
              const dailyCostFormatted = dailyCostVnd >= 1000 ? (dailyCostVnd / 1000).toFixed(1).replace('.0', '') + 'k' : dailyCostVnd + 'đ'

              return (
                <motion.div
                  key={planId}
                  whileHover={{ y: -4 }}
                  className={`rounded-2xl border backdrop-blur-md transition-all flex flex-col justify-between p-5 relative ${
                    isYearly
                      ? 'border-amber-500 bg-slate-900/70 shadow-[0_0_25px_rgba(245,158,11,0.12)]'
                      : isHighlighted
                      ? 'border-purple-500 bg-slate-900/60 shadow-[0_0_20px_rgba(147,51,234,0.08)]'
                      : 'border-slate-850 bg-slate-900/20'
                  }`}
                >
                  {/* Badge Label */}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 shrink-0">
                    <span className={`text-[9px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md ${
                      isYearly
                        ? 'bg-amber-500 text-slate-950'
                        : isHighlighted
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}>
                      {dur.badge}
                    </span>
                  </div>

                  <div className="space-y-4 mt-2 text-center">
                    <div>
                      <span className="text-base font-extrabold text-slate-200">{dur.label}</span>
                    </div>

                    <div className="flex flex-col items-center justify-center py-2.5 border-y border-slate-900/80 gap-1">
                      {couponApplied && effectiveCost !== planConfig.costPoints ? (
                        <div className="flex flex-col items-center">
                          <span className="text-xs line-through text-slate-600 font-mono">{planConfig.costPoints}đ</span>
                          <span className="text-3xl font-black text-amber-400 font-mono tracking-tight">{effectiveCost}</span>
                        </div>
                      ) : (
                        <span className="text-3xl font-black text-amber-400 font-mono tracking-tight">{planConfig.costPoints}</span>
                      )}
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">điểm cước</span>
                    </div>

                    {/* Cost per day helper - very clear value proposition */}
                    <div className="text-[11px] text-slate-400 font-medium">
                      Tương đương <span className="font-extrabold text-slate-300">{dailyCostFormatted}</span> / ngày
                    </div>
                  </div>

                  <div className="pt-5">
                    <Button
                      className={`w-full text-xs font-extrabold h-10 transition-all rounded-xl ${
                        isYearly
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 shadow-[0_4px_12px_rgba(245,158,11,0.3)]'
                          : isHighlighted
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-[0_4px_12px_rgba(147,51,234,0.25)]'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`}
                      variant={isHighlighted || isYearly ? 'default' : 'outline'}
                      onClick={() => handleSubscribeRequest(planId)}
                      disabled={isSubscribing || !!subscribing}
                    >
                      {isSubscribing ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                      ) : (
                        <Crown className="h-4 w-4 mr-1.5" />
                      )}
                      {canAfford ? 'Kích hoạt' : `Nạp +${effectiveCost - currentPts}đ`}
                    </Button>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Unified VIP Benefits Showcase */}
          <div className="space-y-4 pt-8 border-t border-slate-900/60">
            <div className="text-center space-y-1">
              <h2 className="text-lg font-black tracking-tight text-white flex items-center justify-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-400" /> Đặc Quyền Khi Kích Hoạt VIP
              </h2>
              <p className="text-xs text-slate-400">Tất cả các gói cước trên đều kích hoạt trọn vẹn quyền lợi VIP dưới đây</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              {VIP_BENEFITS.map((benefit, idx) => (
                <div key={idx} className="rounded-2xl border border-slate-900 bg-slate-900/10 p-4.5 space-y-3 backdrop-blur-md hover:border-slate-800/60 hover:bg-slate-900/20 transition-all duration-300">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border ${benefit.color}`}>
                    <benefit.icon className="h-5.5 w-5.5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xs font-extrabold text-slate-200">{benefit.title}</h3>
                    <p className="text-[10px] text-slate-400 leading-relaxed">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </TabsContent>

        {/* Tab: Nạp điểm */}
        <TabsContent value="topup" className="mt-8 space-y-6 max-w-xl mx-auto">
          <Card className="border border-slate-800 bg-slate-900/20 backdrop-blur-xl rounded-3xl relative overflow-hidden">
            <CardContent className="space-y-6 pt-6">
              <div className="flex justify-between items-center text-xs border-b border-slate-900 pb-4">
                <span className="text-slate-400">Tỷ lệ quy đổi điểm</span>
                <span className="font-extrabold text-purple-400">1.000đ = 1 điểm cước</span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount" className="text-xs font-bold text-slate-300">Nhập số tiền muốn nạp</Label>
                <div className="relative">
                  <Input
                    id="amount"
                    placeholder="Tối thiểu 20.000đ"
                    inputMode="numeric"
                    value={amountInput ? parseInt(amountInput).toLocaleString('vi-VN') : ''}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '')
                      setAmountInput(raw)
                    }}
                    className="h-14 text-lg font-extrabold bg-slate-950/45 border-slate-800 text-purple-400 placeholder:text-slate-700 pl-4 pr-12 focus-visible:ring-purple-500 rounded-xl"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-extrabold text-slate-650 text-xs">VNĐ</span>
                </div>
                {parsedAmount > 0 && parsedAmount < 20000 && (
                  <p className="text-[11px] text-red-400 font-semibold flex items-center gap-1.5 pt-0.5">
                    <AlertCircle className="h-4 w-4 shrink-0" /> Hạn mức nạp tối thiểu là 20.000đ
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
                    className={`h-12 border-slate-800 text-xs font-bold hover:bg-purple-500/5 transition-all rounded-xl ${
                      parsedAmount === preset ? 'border-purple-500 bg-purple-500/10 text-purple-400 shadow-[0_0_12px_rgba(147,51,234,0.15)]' : 'text-slate-400'
                    }`}
                  >
                    {formatCurrency(preset)}
                  </Button>
                ))}
              </div>

              {/* Points preview panel */}
              {parsedAmount >= 20000 && (
                <div className="flex items-center justify-between rounded-xl bg-amber-500/5 border border-amber-500/10 px-4 py-3 text-xs">
                  <span className="text-slate-400">Bạn sẽ nhận được:</span>
                  <div className="flex items-center gap-1.5 font-black text-amber-400">
                    <Star className="h-4.5 w-4.5 fill-amber-400/25" />
                    <span>{pointsPreview} điểm cước</span>
                  </div>
                </div>
              )}

              <Button
                className="w-full h-12 gap-2 font-bold text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-[0_4px_15px_rgba(147,51,234,0.3)] rounded-xl"
                onClick={handleCreateTopupRequest}
                disabled={topupLoading || parsedAmount < 20000}
              >
                {topupLoading ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <Zap className="h-4.5 w-4.5" />}
                Tạo mã QR chuyển khoản ngân hàng
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Trust Badges Footer */}
      <div className="grid grid-cols-3 gap-3 text-center max-w-2xl mx-auto pt-6 border-t border-slate-900/60">
        {[
          { label: 'Bảo mật giao dịch 100%', icon: Shield },
          { icon: Zap, label: 'Duyệt tự động 24/7' },
          { icon: Star, label: 'Đổi điểm học tập tức thì' },
        ].map((item, idx) => (
          <div key={idx} className="flex flex-col sm:flex-row items-center justify-center gap-2 rounded-2xl bg-slate-900/20 border border-slate-900/60 py-3 px-4 text-[10px] text-slate-500 shadow-inner">
            <item.icon className="h-4.5 w-4.5 text-slate-655 shrink-0" />
            <span className="font-semibold text-slate-400">{item.label}</span>
          </div>
        ))}
      </div>

      {/* --- MODAL A: CONFIRM SUBSCRIBE (ENOUGH POINTS) --- */}
      <Dialog open={confirmSubscribePlan !== null} onOpenChange={(open) => !open && setConfirmSubscribePlan(null)}>
        <DialogContent className="max-w-sm bg-slate-950 border border-slate-800 text-slate-200 rounded-3xl p-5 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-center flex items-center justify-center gap-2 text-white">
              <Crown className="h-6 w-6 text-amber-400 fill-amber-400/10" /> Xác nhận đăng ký VIP
            </DialogTitle>
            <DialogDescription className="text-center text-slate-400 text-xs mt-1 leading-relaxed">
              Bạn đang thực hiện đăng ký gói VIP bằng số điểm cước học tập của mình.
            </DialogDescription>
          </DialogHeader>

          {confirmSubscribePlan && (
            <div className="space-y-4 py-3 text-xs">
              <div className="rounded-2xl bg-slate-900/70 border border-slate-800/80 p-4 space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Gói đăng ký:</span>
                  <span className="font-bold text-white text-right">{VIP_PLANS[confirmSubscribePlan]?.displayName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Thời hạn sử dụng:</span>
                  <span className="font-extrabold text-white">{VIP_PLANS[confirmSubscribePlan]?.durationDays} Ngày</span>
                </div>
                <div className="flex justify-between items-center border-t border-slate-800/60 pt-2.5">
                  <span className="text-slate-400 font-medium">Chi phí trừ ví:</span>
                  <span className="font-black text-amber-400 font-mono text-sm">
                    -{couponApplied?.finalPoints?.[confirmSubscribePlan] ?? VIP_PLANS[confirmSubscribePlan]?.costPoints} điểm
                  </span>
                </div>
              </div>

              {/* Points transition layout */}
              <div className="flex items-center justify-around bg-slate-900/30 border border-slate-850 rounded-2xl p-4 shadow-inner">
                <div className="text-center">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Số dư cũ</p>
                  <p className="text-sm font-bold text-slate-300 mt-1">{points} điểm</p>
                </div>
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-purple-500/10 text-purple-400 shadow-sm border border-purple-500/15">
                  <ArrowRight className="h-4 w-4" />
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Số dư mới</p>
                  <p className="text-sm font-black text-emerald-400 mt-1">
                    {(points ?? 0) - (couponApplied?.finalPoints?.[confirmSubscribePlan] ?? VIP_PLANS[confirmSubscribePlan]?.costPoints)} điểm
                  </p>
                </div>
              </div>

              <p className="text-[10.5px] text-slate-500 text-center leading-relaxed italic">
                * Kích hoạt tức thì, không hỗ trợ đổi trả hoặc hoàn lại điểm sau khi đã kích hoạt gói VIP thành công.
              </p>
            </div>
          )}

          <DialogFooter className="flex flex-row gap-3 mt-2">
            <Button
              variant="outline"
              onClick={() => setConfirmSubscribePlan(null)}
              className="flex-1 h-10 text-xs font-bold border-slate-800 bg-transparent hover:bg-slate-900 text-slate-400 rounded-xl"
            >
              Hủy bỏ
            </Button>
            <Button
              onClick={handleConfirmSubscribe}
              className="flex-1 h-10 text-xs font-black bg-purple-655 hover:bg-purple-700 text-white rounded-xl shadow-[0_4px_12px_rgba(147,51,234,0.25)]"
            >
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- MODAL B: CONFIRM SUBSCRIBE WITH TOP-UP (SHORTAGE POINTS) --- */}
      <Dialog open={shortPointsPlan !== null} onOpenChange={(open) => !open && setShortPointsPlan(null)}>
        <DialogContent className="max-w-sm bg-slate-950 border border-slate-800 text-slate-200 rounded-3xl p-5 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-center flex items-center justify-center gap-2 text-white">
              <Wallet className="h-5.5 w-5.5 text-purple-400" /> Nạp điểm để mua gói cước
            </DialogTitle>
            <DialogDescription className="text-center text-slate-400 text-xs mt-1 leading-relaxed">
              Bạn không đủ điểm cước trong ví. Hãy tạo nhanh một giao dịch QR thanh toán để bù đắp số điểm thiếu.
            </DialogDescription>
          </DialogHeader>

          {shortPointsPlan && shortPointsPlanConfig && (
            <div className="space-y-4 py-2 text-xs">
              <div className="rounded-2xl bg-slate-900/70 border border-slate-800/80 p-4 space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Gói muốn đăng ký:</span>
                  <span className="font-bold text-white text-right">{shortPointsPlanConfig.displayName}</span>
                </div>
                <div className="flex justify-between items-center border-t border-slate-800/60 pt-2.5">
                  <span className="text-slate-400 font-medium">Chi phí gói:</span>
                  <span className="font-bold text-slate-200">{shortPointsPlanCost} điểm</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Số dư ví hiện tại:</span>
                  <span className="font-bold text-slate-400">{shortPointsCurrent} điểm</span>
                </div>
                <div className="flex justify-between items-center text-red-400 font-medium">
                  <span>Còn thiếu:</span>
                  <span className="font-extrabold font-mono">-{shortPointsNeeded} điểm</span>
                </div>
              </div>

              {/* Dynamic topup analysis card */}
              <div className="bg-slate-900/30 border border-slate-850 rounded-2xl p-4 space-y-2.5 shadow-inner">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Hạn mức nạp tối thiểu:</span>
                  <span className="font-bold text-white">20.000đ (20 điểm)</span>
                </div>

                {shortPointsCashNeeded < 20000 ? (
                  <div className="space-y-2.5 pt-1.5 border-t border-slate-800/50">
                    <p className="text-[10px] text-amber-400 leading-relaxed font-medium flex items-start gap-1">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      Do số điểm thiếu quy đổi ({formatCurrency(shortPointsCashNeeded)}) nhỏ hơn mức nạp tối thiểu, hệ thống sẽ đề xuất QR trị giá 20.000đ (+20 điểm cước).
                    </p>
                    <div className="flex justify-between items-center text-xs pt-1">
                      <span className="text-slate-400 font-bold">Số tiền nạp:</span>
                      <span className="font-black text-purple-400 text-sm">{formatCurrency(finalTopupAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-400">
                      <span>Ví sau khi mua gói:</span>
                      <span className="font-extrabold text-emerald-400">Còn dư {expectedWalletAfterPurchase} điểm cước</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5 pt-1.5 border-t border-slate-800/50">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-medium">Số tiền nạp đề xuất:</span>
                      <span className="font-black text-purple-400 text-sm">{formatCurrency(finalTopupAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-450">
                      <span>Điểm cước cộng thêm:</span>
                      <span className="font-bold text-amber-400">+{pointsToAddFromTopup} điểm</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-400">
                      <span>Ví sau khi mua gói:</span>
                      <span className="font-extrabold text-emerald-400">Còn dư {expectedWalletAfterPurchase} điểm cước</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 rounded-xl bg-purple-550/5 border border-purple-500/10 p-3 text-[10px] text-purple-300">
                <Zap className="h-4 w-4 shrink-0 text-purple-400 animate-pulse" />
                <p className="leading-relaxed">
                  <strong>Tự động kích hoạt:</strong> Sau khi hoàn thành chuyển khoản, hệ thống sẽ tự động kích hoạt gói VIP ngay lập tức mà bạn không cần ấn lại.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-row gap-3 mt-2">
            <Button
              variant="outline"
              onClick={() => setShortPointsPlan(null)}
              className="flex-1 h-10 text-xs font-bold border-slate-800 bg-transparent hover:bg-slate-900 text-slate-400 rounded-xl"
            >
              Hủy bỏ
            </Button>
            <Button
              onClick={() => createTopup(finalTopupAmount, shortPointsPlan)}
              className="flex-1 h-10 text-xs font-black bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl shadow-[0_4px_12px_rgba(147,51,234,0.3)]"
            >
              Tạo mã QR & Mua
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- MODAL C: CONFIRM FREE TOP-UP (MANUAL TAB TOPUP) --- */}
      <Dialog open={confirmTopupAmount !== null} onOpenChange={(open) => !open && setConfirmTopupAmount(null)}>
        <DialogContent className="max-w-sm bg-slate-950 border border-slate-800 text-slate-200 rounded-3xl p-5 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-center flex items-center justify-center gap-2 text-white">
              <Zap className="h-5.5 w-5.5 text-purple-400" /> Xác nhận tạo mã QR nạp tiền
            </DialogTitle>
            <DialogDescription className="text-center text-slate-400 text-xs mt-1 leading-relaxed">
              Bạn đang chuẩn bị tạo mã QR thanh toán ngân hàng trực tuyến.
            </DialogDescription>
          </DialogHeader>

          {confirmTopupAmount && (
            <div className="space-y-4 py-3 text-xs">
              <div className="rounded-2xl bg-slate-900/70 border border-slate-800/80 p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Số tiền nạp:</span>
                  <span className="font-black text-white text-base">{formatCurrency(confirmTopupAmount)}</span>
                </div>
                <div className="flex justify-between items-center border-t border-slate-800/60 pt-2.5">
                  <span className="text-slate-400 font-medium">Điểm VIP nhận được:</span>
                  <span className="font-black text-amber-400 font-mono text-sm">+{confirmTopupAmount / 1000} điểm cước</span>
                </div>
              </div>
              <p className="text-[10.5px] text-slate-500 text-center leading-relaxed">
                Vui lòng chuyển tiền đúng nội dung được thiết lập trong mã QR để hệ thống tự động cộng điểm sau 1-3 phút.
              </p>
            </div>
          )}

          <DialogFooter className="flex flex-row gap-3 mt-2">
            <Button
              variant="outline"
              onClick={() => setConfirmTopupAmount(null)}
              className="flex-1 h-10 text-xs font-bold border-slate-800 bg-transparent hover:bg-slate-900 text-slate-400 rounded-xl"
            >
              Quay lại
            </Button>
            <Button
              onClick={() => createTopup(confirmTopupAmount!, null)}
              className="flex-1 h-10 text-xs font-black bg-purple-655 hover:bg-purple-700 text-white rounded-xl shadow-[0_4px_12px_rgba(147,51,234,0.25)]"
            >
              Khởi tạo QR
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- DISPLAY BANK TRANSFER QR & SUCCESS MODAL --- */}
      <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-xs bg-slate-950 border border-slate-800 text-slate-200 rounded-3xl p-5 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-center text-white">
              {topupSuccess ? 'Giao dịch hoàn tất' : 'Thanh toán nạp điểm'}
            </DialogTitle>
          </DialogHeader>

          {/* Success screen */}
          {topupSuccess && successMessage && (
            <div className="space-y-5 py-4 text-center">
              <div className="h-16 w-16 bg-emerald-500/15 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(16,185,129,0.25)] animate-bounce">
                <CheckCircle className="h-9 w-9 text-emerald-500" />
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-black text-white">{successMessage.title}</p>
                <p className="text-xs text-slate-400 leading-relaxed px-2">{successMessage.subtitle}</p>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 px-4 py-1.5 text-xs font-black text-amber-400">
                <Star className="h-4 w-4 fill-amber-400/20" />
                <span>{successMessage.highlight}</span>
              </div>
              <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs h-10 rounded-xl mt-2" onClick={() => handleDialogClose(false)}>
                Hoàn tất
              </Button>
            </div>
          )}

          {/* Transfer QR screen */}
          {!topupLoading && topupInfo && !topupSuccess && (
            <div className="space-y-4">
              <div className="flex justify-center p-2.5 bg-white rounded-2xl border border-slate-800 max-w-[185px] mx-auto animate-fade-in shadow-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={topupInfo.qrUrl}
                  alt="QR Code"
                  width={165}
                  height={165}
                  className="object-contain"
                />
              </div>

              <div className="space-y-2 text-[11px]">
                <InfoRow label="Ngân hàng" value={topupInfo.bankName} />
                <InfoRow label="Số tài khoản" value={topupInfo.bankAccount} mono onCopy={() => copy(topupInfo.bankAccount, 'số tài khoản')} />
                <InfoRow label="Số tiền chuyển" value={formatCurrency(topupInfo.amount)} bold onCopy={() => copy(String(topupInfo.amount), 'số tiền')} />
                <InfoRow label="Nội dung bắt buộc" value={topupInfo.referenceCode} mono bold onCopy={() => copy(topupInfo.referenceCode, 'nội dung')} />
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center gap-2 rounded-xl bg-amber-500/5 border border-amber-500/10 px-3 py-2 text-[10px] text-amber-450 leading-relaxed">
                  <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-amber-500" />
                  <span>Hệ thống đang quét chuyển khoản tự động (1-3 phút).</span>
                </div>
                {pendingSubscribePlanId && (
                  <p className="text-[10px] text-purple-400 text-center leading-relaxed font-semibold italic">
                    * Vui lòng giữ tab này mở để hệ thống tự động kích hoạt gói VIP sau khi thanh toán thành công.
                  </p>
                )}
              </div>
            </div>
          )}

          {topupLoading && (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
              <p className="text-xs text-slate-400">Đang khởi tạo giao dịch...</p>
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
    <div className="flex items-center justify-between rounded-xl bg-slate-900 border border-slate-800/80 px-3 py-2">
      <div>
        <p className="text-[9px] text-slate-500 uppercase font-semibold">{label}</p>
        <p className={`${mono ? 'font-mono text-xs' : 'text-xs'} ${bold ? 'font-bold text-white' : 'font-medium text-slate-300'} mt-0.5`}>{value}</p>
      </div>
      {onCopy && (
        <button onClick={onCopy} className="ml-2 text-slate-500 transition-colors hover:text-slate-350 p-1" title="Sao chép">
          <Copy className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}
