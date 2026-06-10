'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Crown, Check, Loader2, CheckCircle, Copy, Shield, Zap, Star,
  Plus, Gift, BookOpen, Sparkles, RefreshCw, AlertCircle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
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

// Core durations to prevent clutter (dropped 3-day to keep it clean)
const DURATIONS = [
  { id: '1day', label: '1 Ngày', badge: 'Cấp tốc' },
  { id: '1week', label: '1 Tuần', badge: 'Ôn thi' },
  { id: 'monthly', label: '1 Tháng', badge: 'Tự học' },
  { id: '3months', label: '3 Tháng', badge: 'Tiết kiệm nhất', highlight: true },
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

  async function handleCreateTopup() {
    if (parsedAmount < 20000) {
      toast({ title: 'Số tiền tối thiểu 20.000đ', variant: 'destructive' })
      return
    }
    setTopupLoading(true)
    setDialogOpen(true)

    try {
      const res = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parsedAmount }),
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
            setTopupSuccess(true)
            await fetchPoints()
            toast({ title: `Nạp điểm thành công! +${data.pointsToAdd} điểm` })
          }
        } catch {}
      }, 5000)
    } catch (err) {
      toast({ title: 'Không thể tạo giao dịch', description: err instanceof Error ? err.message : 'Thử lại sau.', variant: 'destructive' })
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
            description: `Thiếu ${data.needed - data.current} điểm. Vui lòng nạp thêm.`,
            variant: 'destructive',
          })
        } else {
          throw new Error(data.error ?? 'Giao dịch thất bại')
        }
        return
      }
      await updateSession()
      router.refresh()
      await fetchPoints()
      toast({ title: 'Kích hoạt VIP thành công! 🎉' })
    } catch (err) {
      toast({ title: 'Lỗi', description: err instanceof Error ? err.message : 'Thử lại sau.', variant: 'destructive' })
    } finally {
      setSubscribing(null)
    }
  }

  function copy(text: string, label: string) {
    navigator.clipboard.writeText(text)
    toast({ title: `Đã sao chép ${label}` })
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 px-4 py-4 text-foreground">
      {/* Dynamic Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between p-4 rounded-xl border border-slate-800 bg-slate-950/30 backdrop-blur-md"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20">
            <Crown className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-amber-400">Tài khoản VIP</h1>
            <p className="text-slate-400 text-xs">Nạp điểm để mở khóa toàn bộ tính năng</p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 font-mono font-bold text-amber-400 text-sm">
          <Star className="h-4 w-4 fill-amber-400/20" />
          <span>{points ?? 0}đ (điểm)</span>
          <button onClick={fetchPoints} className="ml-1 hover:text-amber-200 text-amber-500 transition-colors">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </motion.div>

      {/* Main Tabs */}
      <Tabs defaultValue="subscribe" className="w-full">
        <TabsList className="grid w-full grid-cols-2 p-1 bg-slate-950/80 border border-slate-900 rounded-lg h-10">
          <TabsTrigger value="subscribe" className="rounded-md font-semibold text-xs transition-all data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            <Crown className="mr-1.5 h-3.5 w-3.5" /> Đăng ký gói cước
          </TabsTrigger>
          <TabsTrigger value="topup" className="rounded-md font-semibold text-xs transition-all data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Nạp thêm điểm
          </TabsTrigger>
        </TabsList>

        {/* Tab: Đăng ký gói */}
        <TabsContent value="subscribe" className="mt-4 space-y-4">
          
          {/* Claim Free VIP Box */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/30 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                canClaimFree ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-900 text-slate-500'
              }`}>
                <Gift className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-bold text-xs">VIP 1 Ngày Miễn Phí</h4>
                <p className="text-[11px] text-slate-400">Tặng 1 ngày VIP trải nghiệm mỗi tháng (30 ngày/lần).</p>
              </div>
            </div>

            <div>
              {canClaimFree ? (
                <Button
                  onClick={handleClaimFreeVip}
                  disabled={claimingFree}
                  size="sm"
                  className="font-bold bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
                >
                  {claimingFree ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1" />}
                  Nhận ngay
                </Button>
              ) : (
                <span className="text-[11px] text-amber-500 font-medium">Khả dụng sau: {freeVipDaysLeft} ngày</span>
              )}
            </div>
          </div>

          {/* Subject category switcher */}
          <div className="flex items-center justify-center">
            <div className="grid grid-cols-3 p-0.5 bg-slate-950/80 border border-slate-900 rounded-lg max-w-sm w-full">
              {[
                { id: 'combo', label: 'Combo Toán + Anh' },
                { id: 'math', label: 'Môn Toán' },
                { id: 'english', label: 'Môn Anh' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSubjectCategory(cat.id as any)}
                  className={`py-1.5 rounded-md text-[11px] font-semibold transition-all ${
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
          <div className="rounded-xl border border-slate-800 bg-slate-950/10 p-3 flex items-center justify-between gap-3">
            <span className="text-xs font-semibold text-slate-400 shrink-0">Nhập mã giảm giá:</span>
            {couponApplied ? (
              <Badge className="bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-1 text-xs gap-1.5">
                {couponApplied.code} (-{couponApplied.discountPercent}%)
                <button onClick={() => { setCouponApplied(null); setCouponInput('') }} className="hover:text-white font-bold ml-1">×</button>
              </Badge>
            ) : (
              <div className="flex gap-2 w-full max-w-[240px]">
                <Input
                  placeholder="MÃ GIẢM GIÁ"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  className="uppercase h-8 text-xs border-slate-800 bg-slate-950/40 focus-visible:ring-purple-500 text-center"
                />
                <Button
                  variant="outline"
                  onClick={() => applyCoupon(subjectCategory === 'combo' ? 'combo_3months' : `${subjectCategory}_3months`)}
                  disabled={couponLoading || !couponInput.trim()}
                  className="h-8 text-xs font-semibold border-slate-800 text-slate-300 px-3 hover:bg-slate-900"
                >
                  Dùng
                </Button>
              </div>
            )}
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
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

              return (
                <Card
                  key={planId}
                  className={`border transition-all flex flex-col justify-between p-3.5 text-center relative ${
                    isHighlighted
                      ? 'border-amber-500/80 bg-slate-950 shadow-[0_0_10px_rgba(245,158,11,0.05)]'
                      : 'border-slate-800 bg-slate-950/30'
                  }`}
                >
                  {isHighlighted && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-950 text-[9px] font-black uppercase px-2 py-0.5 rounded-b">
                      Ưa chuộng
                    </span>
                  )}
                  <div className="space-y-1.5 mb-3">
                    <p className="text-[11px] font-semibold text-slate-400">{dur.label}</p>
                    <div className="flex justify-center items-baseline gap-1">
                      {couponApplied && effectiveCost !== planConfig.costPoints ? (
                        <>
                          <span className="text-xs line-through text-slate-600 font-mono">{planConfig.costPoints}</span>
                          <span className="text-lg font-black text-amber-400 font-mono">{effectiveCost}</span>
                        </>
                      ) : (
                        <span className="text-lg font-black text-amber-400 font-mono">{planConfig.costPoints}</span>
                      )}
                      <span className="text-[10px] text-slate-500">điểm</span>
                    </div>
                  </div>

                  <Button
                    className={`w-full text-[10px] h-7 font-bold ${
                      isHighlighted
                        ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                        : 'bg-transparent border-slate-800 text-slate-300 hover:bg-slate-900'
                    }`}
                    variant={isHighlighted ? 'default' : 'outline'}
                    onClick={() => handleSubscribe(planId)}
                    disabled={!canAfford || isSubscribing || !!subscribing}
                  >
                    {isSubscribing ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : (
                      <Crown className="h-3 w-3 mr-1" />
                    )}
                    {canAfford ? 'Đăng ký' : `Cần +${effectiveCost - currentPts}đ`}
                  </Button>
                </Card>
              )
            })}
          </div>

        </TabsContent>

        {/* Tab: Nạp điểm */}
        <TabsContent value="topup" className="mt-4 space-y-4">
          <Card className="border border-slate-800 bg-slate-950/30">
            <CardContent className="space-y-4 pt-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Tỷ lệ quy đổi</span>
                <span className="font-semibold text-purple-400">1.000đ = 1 điểm (đ)</span>
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <Input
                    id="amount"
                    placeholder="Số tiền muốn nạp (Tối thiểu 20.000đ)"
                    inputMode="numeric"
                    value={amountInput ? parseInt(amountInput).toLocaleString('vi-VN') : ''}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '')
                      setAmountInput(raw)
                    }}
                    className="h-11 text-base font-bold bg-slate-900/40 border-slate-800 text-purple-400 placeholder:text-slate-600 pl-3 focus-visible:ring-purple-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-slate-500 text-xs">VNĐ</span>
                </div>
                {parsedAmount > 0 && parsedAmount < 20000 && (
                  <p className="text-[11px] text-red-400 font-semibold flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" /> Nạp tối thiểu 20.000đ.
                  </p>
                )}
              </div>

              {/* Preset buttons */}
              <div className="grid grid-cols-3 gap-2">
                {PRESET_AMOUNTS.map((preset) => (
                  <Button
                    key={preset}
                    variant="outline"
                    size="sm"
                    onClick={() => setAmountInput(String(preset))}
                    className={`h-9 border-slate-800 text-xs font-semibold hover:bg-purple-500/5 ${
                      parsedAmount === preset ? 'border-purple-500 bg-purple-500/10 text-purple-400' : 'text-slate-400'
                    }`}
                  >
                    {formatCurrency(preset)}
                  </Button>
                ))}
              </div>

              {/* Points preview panel */}
              {parsedAmount >= 20000 && (
                <div className="flex items-center justify-between rounded-lg bg-amber-500/5 border border-amber-500/10 px-3 py-2 text-xs">
                  <span className="text-slate-400">Nhận được:</span>
                  <div className="flex items-center gap-1 font-bold text-amber-400">
                    <Star className="h-3.5 w-3.5 fill-amber-400/20" />
                    <span>{pointsPreview} điểm VIP</span>
                  </div>
                </div>
              )}

              <Button
                className="w-full h-10 gap-1.5 font-bold text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                onClick={handleCreateTopup}
                disabled={topupLoading || parsedAmount < 20000}
              >
                {topupLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
                Tạo mã QR chuyển khoản
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Trust badges footer */}
      <div className="grid grid-cols-3 gap-2 text-center pt-2">
        {[
          { label: 'Bảo mật 100%' },
          { label: 'Duyệt tự động 24/7' },
          { label: 'Không phát sinh phụ phí' },
        ].map((item) => (
          <div key={item.label} className="rounded-lg bg-slate-950/20 border border-slate-900/50 py-2.5 px-1 text-[10px] text-slate-500">
            {item.label}
          </div>
        ))}
      </div>

      {/* Bank Transfer QR Dialog */}
      <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-xs bg-slate-950 border border-slate-800 text-slate-200">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-center">Chuyển khoản nạp điểm</DialogTitle>
          </DialogHeader>

          {topupSuccess && topupInfo && (
            <div className="space-y-4 py-4 text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-emerald-500" />
              <p className="text-sm font-bold text-white">Nạp điểm thành công!</p>
              <div className="flex items-center justify-center gap-1 text-amber-400 font-bold">
                <Star className="h-4 w-4" />
                <span className="text-lg">+{topupInfo.pointsToAdd} điểm</span>
              </div>
              <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs h-9" onClick={() => setDialogOpen(false)}>
                Xong
              </Button>
            </div>
          )}

          {!topupLoading && topupInfo && !topupSuccess && (
            <div className="space-y-3">
              <div className="flex justify-center p-2 bg-white rounded-xl border border-slate-800 max-w-[180px] mx-auto">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={topupInfo.qrUrl}
                  alt="QR Code"
                  width={160}
                  height={160}
                  className="object-contain"
                />
              </div>
              <div className="space-y-1.5 text-[11px]">
                <InfoRow label="Ngân hàng" value={topupInfo.bankName} />
                <InfoRow label="Số tài khoản" value={topupInfo.bankAccount} mono onCopy={() => copy(topupInfo.bankAccount, 'số tài khoản')} />
                <InfoRow label="Số tiền chuyển" value={formatCurrency(topupInfo.amount)} bold onCopy={() => copy(String(topupInfo.amount), 'số tiền')} />
                <InfoRow label="Nội dung CK bắt buộc" value={topupInfo.referenceCode} mono bold onCopy={() => copy(topupInfo.referenceCode, 'nội dung')} />
              </div>
              <div className="flex items-center gap-1.5 rounded-lg bg-amber-500/5 border border-amber-500/10 px-2.5 py-2 text-[10px] text-amber-400">
                <Loader2 className="h-3 w-3 shrink-0 animate-spin" />
                <span>Hệ thống đang kiểm tra. Điểm cộng ngay sau khi tiền vào tài khoản.</span>
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
    <div className="flex items-center justify-between rounded bg-slate-900 border border-slate-800 px-3 py-1.5">
      <div>
        <p className="text-[9px] text-slate-500 uppercase">{label}</p>
        <p className={`${mono ? 'font-mono' : ''} ${bold ? 'font-bold text-white' : 'font-medium text-slate-300'}`}>{value}</p>
      </div>
      {onCopy && (
        <button onClick={onCopy} className="ml-2 text-slate-500 transition-colors hover:text-slate-300">
          <Copy className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}
