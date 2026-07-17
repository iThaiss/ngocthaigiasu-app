'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Crown, Loader2, CheckCircle, Copy, Shield, Zap, Star,
  Plus, Gift, Sparkles, RefreshCw, AlertCircle,
  Wallet, ArrowRight, BookOpen, Target,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { formatCurrency } from '@/lib/utils'
import { VIP_PLANS, PlanId } from '@/lib/plans'
import { isVipActive } from '@/lib/vip'

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

type CouponResult = { type: 'coupon'; code: string; discountPercent: number; finalPoints: Record<string, number> }
type GiftResult = { type: 'gift'; label: string }
type PromoResult = CouponResult | GiftResult | null

const PRESET_AMOUNTS = [20000, 50000, 100000]

// Math-only plans, 5 durations
const MATH_PLANS: PlanId[] = [
  'math_1day',
  'math_1week',
  'math_monthly',
  'math_3months',
  'math_yearly',
]

const PLAN_HIGHLIGHT: Record<string, boolean> = {
  math_3months: true,
}

const VIP_BENEFITS = [
  { icon: Zap,      title: 'AI Giải Toán không giới hạn',    desc: 'Gói tháng trở lên dùng Gemini 2.5 Flash, giải thích từng bước.' },
  { icon: Target,   title: 'Luyện tập không giới hạn',        desc: 'Mở khóa toàn bộ ngân hàng câu hỏi, không bị giới hạn lượt.' },
  { icon: BookOpen, title: 'Thi thử THPT Quốc gia',           desc: 'Toàn bộ đề thi và đề đánh giá năng lực có lời giải chi tiết.' },
  { icon: Shield,   title: 'Tập trung 100% — không quảng cáo', desc: 'Không gián đoạn, đồng bộ tiến độ trên mọi thiết bị.' },
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

  // Unified promo
  const [promoInput, setPromoInput] = useState('')
  const [promoLoading, setPromoLoading] = useState(false)
  const [promoResult, setPromoResult] = useState<PromoResult>(null)

  const [claimingFree, setClaimingFree] = useState(false)

  const [confirmSubscribePlan, setConfirmSubscribePlan] = useState<PlanId | null>(null)
  const [shortPointsPlan, setShortPointsPlan] = useState<PlanId | null>(null)
  const [confirmTopupAmount, setConfirmTopupAmount] = useState<number | null>(null)
  const [pendingSubscribePlanId, setPendingSubscribePlanId] = useState<PlanId | null>(null)
  const [successMessage, setSuccessMessage] = useState<{ title: string; subtitle: string; highlight: string } | null>(null)

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
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [fetchPoints])

  const parsedAmount = parseInt(amountInput.replace(/\D/g, ''), 10) || 0
  const pointsPreview = Math.floor(parsedAmount / 1000)
  const isVip = isVipActive(session?.user?.isVip, session?.user?.vipExpiresAt)

  const getFreeVipStatus = () => {
    if (!lastFreeVipClaimedAt) return { eligible: true, daysLeft: 0 }
    const diffDays = (Date.now() - new Date(lastFreeVipClaimedAt).getTime()) / (1000 * 60 * 60 * 24)
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
      await updateSession(); router.refresh(); await fetchPoints()
      toast({ title: 'Nhận quà thành công! 🎉', description: 'Đã kích hoạt 1 ngày VIP miễn phí.' })
    } catch (err) {
      toast({ title: 'Không thể nhận VIP miễn phí', description: err instanceof Error ? err.message : 'Vui lòng thử lại.', variant: 'destructive' })
    } finally {
      setClaimingFree(false)
    }
  }

  async function handleApplyPromo() {
    const code = promoInput.trim().toUpperCase()
    if (!code) return
    setPromoLoading(true)
    try {
      // 1. Try coupon (non-destructive)
      const couponRes = await fetch('/api/payment/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, planId: 'math_3months' }),
      })
      const couponData = await couponRes.json()

      if (couponData.valid) {
        // Pre-fetch discounts for all math plans
        const finalPoints: Record<string, number> = {}
        await Promise.all(MATH_PLANS.map(async (pid) => {
          const r = await fetch('/api/payment/validate-coupon', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, planId: pid }),
          })
          const d = await r.json()
          if (d.valid) finalPoints[pid] = d.finalPoints
        }))
        setPromoResult({ type: 'coupon', code, discountPercent: couponData.discountPercent, finalPoints })
        toast({ title: `Áp dụng thành công! Giảm ${couponData.discountPercent}%` })
        return
      }

      // 2. Try gift code (destructive — redeems immediately)
      const giftRes = await fetch('/api/payment/redeem-gift-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const giftData = await giftRes.json()

      if (giftRes.ok) {
        setPromoResult({ type: 'gift', label: giftData.planLabel })
        await updateSession(); router.refresh(); await fetchPoints()
        toast({ title: 'Đổi quà thành công! 🎁', description: `Đã kích hoạt ${giftData.planLabel}.` })
        return
      }

      // 3. Both failed
      toast({ title: 'Mã không hợp lệ', description: couponData.error || giftData.error || 'Vui lòng kiểm tra lại mã.', variant: 'destructive' })
    } catch {
      toast({ title: 'Lỗi', description: 'Không thể kiểm tra mã', variant: 'destructive' })
    } finally {
      setPromoLoading(false)
    }
  }

  const getCouponResult = (): CouponResult | null =>
    promoResult?.type === 'coupon' ? promoResult : null

  function getEffectiveCost(planId: PlanId): number {
    const coupon = getCouponResult()
    return coupon?.finalPoints?.[planId] ?? VIP_PLANS[planId].costPoints
  }

  async function executeSubscribe(planId: PlanId): Promise<boolean> {
    setSubscribing(planId)
    const coupon = getCouponResult()
    try {
      const res = await fetch('/api/payment/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, ...(coupon && { couponCode: coupon.code }) }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.needed !== undefined) {
          toast({ title: 'Không đủ điểm', description: `Thiếu ${data.needed - data.current} điểm.`, variant: 'destructive' })
        } else {
          throw new Error(data.error ?? 'Giao dịch thất bại')
        }
        return false
      }
      await updateSession(); router.refresh(); await fetchPoints()
      return true
    } catch (err) {
      toast({ title: 'Lỗi', description: err instanceof Error ? err.message : 'Thử lại sau.', variant: 'destructive' })
      return false
    } finally {
      setSubscribing(null)
    }
  }

  async function handleConfirmSubscribe() {
    if (!confirmSubscribePlan) return
    const planId = confirmSubscribePlan
    setConfirmSubscribePlan(null)
    const success = await executeSubscribe(planId)
    if (success) toast({ title: 'Kích hoạt VIP thành công! 🎉' })
  }

  async function handleAutoSubscribe(planId: PlanId) {
    const coupon = getCouponResult()
    try {
      const res = await fetch('/api/payment/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, ...(coupon && { couponCode: coupon.code }) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Đăng ký gói tự động thất bại')
      await updateSession(); router.refresh(); await fetchPoints()
      setSuccessMessage({ title: 'Kích hoạt VIP thành công! 👑', subtitle: `Đã tự động nâng cấp gói ${VIP_PLANS[planId]?.displayName}.`, highlight: `${VIP_PLANS[planId]?.name} VIP` })
      setTopupSuccess(true)
      setPendingSubscribePlanId(null)
      toast({ title: 'Kích hoạt VIP thành công! 🎉' })
    } catch (err) {
      console.error('Auto activation error:', err)
      toast({ title: 'Lỗi kích hoạt tự động', description: err instanceof Error ? err.message : 'Vui lòng kích hoạt thủ công.', variant: 'destructive' })
      setSuccessMessage({ title: 'Nạp điểm thành công! 🎉', subtitle: 'Điểm đã được cộng. Vui lòng kích hoạt thủ công.', highlight: 'Điểm cước đã sẵn sàng' })
      setTopupSuccess(true)
      setPendingSubscribePlanId(null)
      await fetchPoints()
    }
  }

  async function createTopup(amount: number, autoSubscribePlanId?: PlanId | null) {
    if (amount < 20000) return
    setConfirmTopupAmount(null)
    setShortPointsPlan(null)
    setTopupLoading(true)
    setDialogOpen(true)
    setPendingSubscribePlanId(autoSubscribePlanId ?? null)
    try {
      const res = await fetch('/api/payment/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount }) })
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error ?? 'Lỗi tạo giao dịch') }
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
              setSuccessMessage({ title: 'Nạp điểm thành công! 🎉', subtitle: 'Điểm đã được cộng vào tài khoản.', highlight: `+${data.pointsToAdd} điểm cước` })
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
    if (parsedAmount < 20000) { toast({ title: 'Số tiền tối thiểu 20.000đ', variant: 'destructive' }); return }
    setConfirmTopupAmount(parsedAmount)
  }

  function handleSubscribeRequest(planId: PlanId) {
    const planConfig = VIP_PLANS[planId]
    if (!planConfig) return
    const effectiveCost = getEffectiveCost(planId)
    if ((points ?? 0) >= effectiveCost) {
      setConfirmSubscribePlan(planId)
    } else {
      setShortPointsPlan(planId)
    }
  }

  function handleDialogClose(open: boolean) {
    if (!open) {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
      setTopupSuccess(false); setTopupInfo(null); setPendingSubscribePlanId(null); setSuccessMessage(null)
    }
    setDialogOpen(open)
  }

  function copy(text: string, label: string) {
    navigator.clipboard.writeText(text)
    toast({ title: `Đã sao chép ${label}` })
  }

  const shortPointsPlanConfig = shortPointsPlan ? VIP_PLANS[shortPointsPlan] : null
  const shortPointsPlanCost = shortPointsPlan && shortPointsPlanConfig ? getEffectiveCost(shortPointsPlan) : 0
  const shortPointsCurrent = points ?? 0
  const shortPointsNeeded = Math.max(0, shortPointsPlanCost - shortPointsCurrent)
  const shortPointsCashNeeded = shortPointsNeeded * 1000
  const finalTopupAmount = shortPointsCashNeeded < 20000 ? 20000 : shortPointsCashNeeded
  const pointsToAddFromTopup = finalTopupAmount / 1000
  const expectedWalletAfterTopup = shortPointsCurrent + pointsToAddFromTopup
  const expectedWalletAfterPurchase = expectedWalletAfterTopup - shortPointsPlanCost

  return (
    <div className="max-w-3xl mx-auto space-y-6 px-2 py-6 text-foreground">

      {/* Header — điểm ví */}
      <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card">
        <div className="flex items-center gap-3">
          <Crown className="h-5 w-5 text-yellow-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground">Đặc quyền VIP Toán</p>
            <p className="text-xs text-muted-foreground">Dùng điểm cước để kích hoạt</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {loadingPoints ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <span className="text-lg font-bold text-foreground font-mono">{points ?? 0} điểm</span>
          )}
          <button onClick={fetchPoints} className="text-muted-foreground hover:text-foreground transition-colors p-1">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* VIP status hiện tại */}
      {isVip && session?.user?.vipExpiresAt && (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-3 text-sm">
          <Crown className="h-4 w-4 text-yellow-500 shrink-0" />
          <span className="text-foreground font-medium">
            {session.user.plan === 'math_vip' ? 'Toán VIP' : session.user.plan === 'english_vip' ? 'Anh VIP' : 'Combo VIP'}
            {' · '}hết hạn{' '}
            <span className="font-semibold">
              {new Date(session.user.vipExpiresAt).toLocaleDateString('vi-VN')}
            </span>
          </span>
        </div>
      )}

      {/* Free VIP 1 ngày */}
      {canClaimFree ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4">
          <div className="flex items-center gap-3">
            <Gift className="h-4 w-4 text-primary shrink-0" />
            <div>
              <p className="text-sm font-semibold text-foreground">Miễn phí 1 ngày VIP</p>
              <p className="text-xs text-muted-foreground">Hồi lại mỗi 30 ngày</p>
            </div>
          </div>
          <Button size="sm" onClick={handleClaimFreeVip} disabled={claimingFree} className="shrink-0">
            {claimingFree ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Nhận ngay'}
          </Button>
        </div>
      ) : freeVipDaysLeft > 0 ? (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 p-3 text-xs text-muted-foreground">
          <Gift className="h-4 w-4 shrink-0" />
          <span>Lượt VIP miễn phí tiếp theo: còn {freeVipDaysLeft} ngày</span>
        </div>
      ) : null}

      {/* Tabs */}
      <Tabs defaultValue="subscribe" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-10">
          <TabsTrigger value="subscribe" className="text-sm">
            <Crown className="mr-1.5 h-3.5 w-3.5" /> Đăng ký gói
          </TabsTrigger>
          <TabsTrigger value="topup" className="text-sm">
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Nạp điểm
          </TabsTrigger>
        </TabsList>

        {/* Tab Đăng ký */}
        <TabsContent value="subscribe" className="mt-6 space-y-6">

          {/* Mã ưu đãi */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground">Mã ưu đãi (giảm giá hoặc quà tặng VIP)</p>
            {promoResult ? (
              <div className="flex items-center justify-between">
                {promoResult.type === 'coupon' ? (
                  <Badge className="bg-green-500/10 text-green-500 border border-green-500/20 px-3 py-1 text-xs font-mono">
                    {promoResult.code} (-{promoResult.discountPercent}%)
                  </Badge>
                ) : (
                  <Badge className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 text-xs">
                    ✓ {promoResult.label} đã kích hoạt
                  </Badge>
                )}
                {promoResult.type === 'coupon' && (
                  <button onClick={() => { setPromoResult(null); setPromoInput('') }} className="text-xs text-muted-foreground hover:text-foreground">
                    Xóa
                  </button>
                )}
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="Nhập mã (VD: VEDICH30 hoặc GIFT1234)"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                  className="uppercase text-xs font-mono tracking-wider h-9"
                />
                <Button variant="outline" onClick={handleApplyPromo} disabled={promoLoading || !promoInput.trim()} className="h-9 text-xs shrink-0">
                  {promoLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Áp dụng'}
                </Button>
              </div>
            )}
          </div>

          {/* Pricing cards — 5 gói toán */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {MATH_PLANS.map((planId) => {
              const planConfig = VIP_PLANS[planId]
              if (!planConfig) return null
              const effectiveCost = getEffectiveCost(planId)
              const canAfford = (points ?? 0) >= effectiveCost
              const isSubscribing = subscribing === planId
              const isHighlighted = PLAN_HIGHLIGHT[planId]
              const coupon = getCouponResult()
              const dailyCostVnd = Math.round((effectiveCost * 1000) / planConfig.durationDays)
              const dailyCostFormatted = dailyCostVnd >= 1000
                ? (dailyCostVnd / 1000).toFixed(1).replace('.0', '') + 'k'
                : dailyCostVnd + 'đ'

              return (
                <div
                  key={planId}
                  className={`rounded-xl border p-4 flex flex-col justify-between transition-colors ${
                    isHighlighted
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-card hover:border-border/80 hover:bg-muted/30'
                  }`}
                >
                  <div className="space-y-3 text-center">
                    <p className="text-sm font-bold text-foreground">{planConfig.name}</p>
                    <div className="py-2 border-y border-border/60">
                      {coupon && effectiveCost !== planConfig.costPoints ? (
                        <div className="flex flex-col items-center">
                          <span className="text-xs line-through text-muted-foreground/60 font-mono">{planConfig.costPoints}</span>
                          <span className="text-2xl font-black text-foreground font-mono">{effectiveCost}</span>
                        </div>
                      ) : (
                        <span className="text-2xl font-black text-foreground font-mono">{planConfig.costPoints}</span>
                      )}
                      <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mt-0.5">điểm</p>
                    </div>
                    <p className="text-[11px] text-muted-foreground">≈ {dailyCostFormatted}/ngày</p>
                  </div>
                  <Button
                    size="sm"
                    variant={isHighlighted ? 'default' : 'outline'}
                    className="w-full mt-4 text-xs font-semibold"
                    onClick={() => handleSubscribeRequest(planId)}
                    disabled={isSubscribing || !!subscribing}
                  >
                    {isSubscribing
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : canAfford ? 'Kích hoạt' : `Nạp +${effectiveCost - (points ?? 0)}đ`}
                  </Button>
                </div>
              )
            })}
          </div>

          {/* VIP Benefits — compact */}
          <div className="border-t border-border/60 pt-6">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quyền lợi VIP Toán</p>
            <div className="grid grid-cols-2 gap-3">
              {VIP_BENEFITS.map((b, i) => (
                <div key={i} className="flex items-start gap-2.5 rounded-lg border border-border bg-muted/20 p-3">
                  <b.icon className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-foreground leading-snug">{b.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Tab Nạp điểm */}
        <TabsContent value="topup" className="mt-6 space-y-4 max-w-sm mx-auto">
          <div className="rounded-xl border border-border bg-card p-4 space-y-4">
            <div className="flex justify-between items-center text-xs border-b border-border pb-3">
              <span className="text-muted-foreground">Tỷ lệ quy đổi</span>
              <span className="font-bold text-foreground">1.000đ = 1 điểm</span>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="amount" className="text-xs font-medium text-muted-foreground">Số tiền muốn nạp</Label>
              <div className="relative">
                <Input
                  id="amount"
                  placeholder="Tối thiểu 20.000đ"
                  inputMode="numeric"
                  value={amountInput ? parseInt(amountInput).toLocaleString('vi-VN') : ''}
                  onChange={(e) => setAmountInput(e.target.value.replace(/\D/g, ''))}
                  className="h-12 text-base font-bold pr-12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">VNĐ</span>
              </div>
              {parsedAmount > 0 && parsedAmount < 20000 && (
                <p className="text-[11px] text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" /> Tối thiểu 20.000đ
                </p>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_AMOUNTS.map((preset) => (
                <Button key={preset} variant="outline" onClick={() => setAmountInput(String(preset))}
                  className={`h-10 text-xs font-semibold ${parsedAmount === preset ? 'border-primary bg-primary/5 text-primary' : 'text-muted-foreground'}`}>
                  {formatCurrency(preset)}
                </Button>
              ))}
            </div>
            {parsedAmount >= 20000 && (
              <div className="flex justify-between items-center rounded-lg bg-muted/40 border border-border px-3 py-2 text-xs">
                <span className="text-muted-foreground">Bạn nhận được:</span>
                <span className="font-bold text-foreground">{pointsPreview} điểm</span>
              </div>
            )}
            <Button className="w-full h-10 text-xs font-semibold" onClick={handleCreateTopupRequest} disabled={topupLoading || parsedAmount < 20000}>
              {topupLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4 mr-1.5" />}
              Tạo mã QR chuyển khoản
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            {[{ icon: Shield, label: 'Bảo mật 100%' }, { icon: Zap, label: 'Duyệt tự động' }, { icon: Star, label: 'Cộng điểm tức thì' }].map((item, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1 rounded-lg border border-border/60 bg-muted/20 py-2 px-1">
                <item.icon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* MODAL A: CONFIRM SUBSCRIBE */}
      <Dialog open={confirmSubscribePlan !== null} onOpenChange={(open) => !open && setConfirmSubscribePlan(null)}>
        <DialogContent className="max-w-sm rounded-2xl p-5">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" /> Xác nhận đăng ký VIP
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">Điểm sẽ được trừ ngay lập tức, không hoàn lại.</DialogDescription>
          </DialogHeader>
          {confirmSubscribePlan && (
            <div className="space-y-3 py-2 text-xs">
              <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gói:</span>
                  <span className="font-semibold">{VIP_PLANS[confirmSubscribePlan]?.displayName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Thời hạn:</span>
                  <span className="font-semibold">{VIP_PLANS[confirmSubscribePlan]?.durationDays} ngày</span>
                </div>
                <div className="flex justify-between border-t border-border/60 pt-2">
                  <span className="text-muted-foreground">Chi phí:</span>
                  <span className="font-bold text-foreground">-{getEffectiveCost(confirmSubscribePlan)} điểm</span>
                </div>
              </div>
              <div className="flex items-center justify-around rounded-xl border border-border bg-muted/20 p-3">
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground">Số dư hiện tại</p>
                  <p className="font-bold text-muted-foreground">{points} điểm</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground">Sau khi trừ</p>
                  <p className="font-bold text-foreground">{(points ?? 0) - getEffectiveCost(confirmSubscribePlan)} điểm</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex flex-row gap-2 mt-1">
            <Button variant="outline" onClick={() => setConfirmSubscribePlan(null)} className="flex-1 h-9 text-xs">Hủy</Button>
            <Button onClick={handleConfirmSubscribe} className="flex-1 h-9 text-xs font-semibold">Kích hoạt</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL B: SHORTAGE POINTS */}
      <Dialog open={shortPointsPlan !== null} onOpenChange={(open) => !open && setShortPointsPlan(null)}>
        <DialogContent className="max-w-sm rounded-2xl p-5">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" /> Nạp điểm để mua gói
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">Không đủ điểm. Nạp thêm để hoàn tất đăng ký.</DialogDescription>
          </DialogHeader>
          {shortPointsPlan && shortPointsPlanConfig && (
            <div className="space-y-3 py-2 text-xs">
              <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gói:</span>
                  <span className="font-semibold">{shortPointsPlanConfig.displayName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Chi phí:</span>
                  <span className="font-semibold">{shortPointsPlanCost} điểm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Số dư hiện tại:</span>
                  <span>{shortPointsCurrent} điểm</span>
                </div>
                <div className="flex justify-between text-destructive border-t border-border/60 pt-2">
                  <span>Còn thiếu:</span>
                  <span className="font-bold">-{shortPointsNeeded} điểm</span>
                </div>
              </div>
              <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Số tiền nạp:</span>
                  <span className="font-bold text-foreground">{formatCurrency(finalTopupAmount)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground/70">
                  <span>Ví sau khi mua:</span>
                  <span className="font-semibold text-foreground">còn {expectedWalletAfterPurchase} điểm</span>
                </div>
              </div>
              <div className="flex items-start gap-2 rounded-lg bg-muted/30 border border-border/60 p-2.5 text-[10px] text-muted-foreground">
                <Zap className="h-3.5 w-3.5 shrink-0 text-primary mt-0.5" />
                <span>Sau khi chuyển khoản, hệ thống tự động kích hoạt gói VIP — không cần ấn lại.</span>
              </div>
            </div>
          )}
          <DialogFooter className="flex flex-row gap-2 mt-1">
            <Button variant="outline" onClick={() => setShortPointsPlan(null)} className="flex-1 h-9 text-xs">Hủy</Button>
            <Button onClick={() => createTopup(finalTopupAmount, shortPointsPlan)} className="flex-1 h-9 text-xs font-semibold">Tạo QR & Mua</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL C: CONFIRM TOPUP */}
      <Dialog open={confirmTopupAmount !== null} onOpenChange={(open) => !open && setConfirmTopupAmount(null)}>
        <DialogContent className="max-w-sm rounded-2xl p-5">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" /> Tạo mã QR nạp tiền
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">Chuyển khoản đúng nội dung để hệ thống tự động cộng điểm.</DialogDescription>
          </DialogHeader>
          {confirmTopupAmount && (
            <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-2 text-xs my-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Số tiền nạp:</span>
                <span className="font-bold text-foreground">{formatCurrency(confirmTopupAmount)}</span>
              </div>
              <div className="flex justify-between border-t border-border/60 pt-2">
                <span className="text-muted-foreground">Điểm nhận được:</span>
                <span className="font-bold text-foreground">+{confirmTopupAmount / 1000} điểm</span>
              </div>
            </div>
          )}
          <DialogFooter className="flex flex-row gap-2 mt-1">
            <Button variant="outline" onClick={() => setConfirmTopupAmount(null)} className="flex-1 h-9 text-xs">Quay lại</Button>
            <Button onClick={() => createTopup(confirmTopupAmount!, null)} className="flex-1 h-9 text-xs font-semibold">Tạo QR</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL D: QR & SUCCESS */}
      <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-xs rounded-2xl p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-center">
              {topupSuccess ? 'Giao dịch hoàn tất' : 'Thanh toán QR'}
            </DialogTitle>
          </DialogHeader>

          {topupSuccess && successMessage && (
            <div className="space-y-4 py-2 text-center">
              <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="h-14 w-14 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-emerald-500" />
              </motion.div>
              <div>
                <p className="text-sm font-bold">{successMessage.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{successMessage.subtitle}</p>
              </div>
              <Badge className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 text-xs">{successMessage.highlight}</Badge>
              <Button className="w-full h-9 text-xs font-semibold mt-1" onClick={() => handleDialogClose(false)}>Hoàn tất</Button>
            </div>
          )}

          {!topupLoading && topupInfo && !topupSuccess && (
            <div className="space-y-4">
              <div className="flex justify-center p-2 bg-white rounded-xl border border-border max-w-[160px] mx-auto">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={topupInfo.qrUrl} alt="QR Code" width={140} height={140} className="object-contain" />
              </div>
              <div className="space-y-1.5 text-[11px]">
                <InfoRow label="Ngân hàng" value={topupInfo.bankName} />
                <InfoRow label="Số tài khoản" value={topupInfo.bankAccount} mono onCopy={() => copy(topupInfo.bankAccount, 'số TK')} />
                <InfoRow label="Số tiền" value={formatCurrency(topupInfo.amount)} bold onCopy={() => copy(String(topupInfo.amount), 'số tiền')} />
                <InfoRow label="Nội dung bắt buộc" value={topupInfo.referenceCode} mono bold onCopy={() => copy(topupInfo.referenceCode, 'nội dung')} />
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-muted/30 border border-border/60 px-3 py-2 text-[10px] text-muted-foreground">
                <Loader2 className="h-3 w-3 shrink-0 animate-spin" />
                <span>Đang quét chuyển khoản tự động (1-3 phút)</span>
              </div>
              {pendingSubscribePlanId && (
                <p className="text-[10px] text-primary text-center">Giữ tab này mở để hệ thống tự kích hoạt VIP sau khi thanh toán.</p>
              )}
            </div>
          )}

          {topupLoading && (
            <div className="py-10 flex flex-col items-center gap-2">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Đang khởi tạo giao dịch...</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function InfoRow({ label, value, mono = false, bold = false, onCopy }: {
  label: string; value: string; mono?: boolean; bold?: boolean; onCopy?: () => void
}) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-muted/30 border border-border/60 px-3 py-2">
      <div>
        <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className={`${mono ? 'font-mono' : ''} ${bold ? 'font-bold text-foreground' : 'text-muted-foreground'} text-xs mt-0.5`}>{value}</p>
      </div>
      {onCopy && (
        <button onClick={onCopy} className="ml-2 text-muted-foreground hover:text-foreground p-1">
          <Copy className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}
