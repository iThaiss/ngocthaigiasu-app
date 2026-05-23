'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Crown, Check, Loader2, CheckCircle, Copy, Shield, Zap, Star,
  Plus, ArrowRight, Info,
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
import { VIP_PLANS } from '@/lib/plans'

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

const PLANS = [
  {
    id: 'monthly',
    name: VIP_PLANS.monthly.displayName,
    points: VIP_PLANS.monthly.costPoints,
    period: '/ 30 ngày',
    features: [
      'Không giới hạn giải toán AI',
      'Thi thử không giới hạn',
      'Xem video hướng dẫn',
      'Hỗ trợ ưu tiên',
    ],
    highlight: false,
  },
  {
    id: 'yearly',
    name: VIP_PLANS.yearly.displayName,
    points: VIP_PLANS.yearly.costPoints,
    period: '/ 365 ngày',
    badge: 'Tiết kiệm nhất',
    features: [
      'Tất cả tính năng Gói Tháng',
      'Toàn bộ tài liệu học tập',
      'Đề thi exclusive',
      'Báo cáo học tập chi tiết',
      'Huy hiệu VIP nổi bật',
    ],
    highlight: true,
  },
]

const PRESET_AMOUNTS = [50000, 100000, 200000]

export default function PaymentPage() {
  const { data: session, update: updateSession } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [points, setPoints] = useState<number | null>(null)
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

  const pollRef = useRef<NodeJS.Timeout | null>(null)

  const fetchPoints = useCallback(async () => {
    try {
      const res = await fetch('/api/wallet')
      if (res.ok) {
        const data = await res.json()
        setPoints(data.points ?? 0)
      }
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

  async function handleCreateTopup() {
    if (parsedAmount < 10000) {
      toast({ title: 'Số tiền tối thiểu 10.000đ', variant: 'destructive' })
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

  async function applyCoupon(planId: string) {
    if (!couponInput.trim()) return
    setCouponLoading(true)
    try {
      const res = await fetch('/api/payment/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponInput.trim(), planId }),
      })
      const data = await res.json()
      if (!data.valid) {
        toast({ title: 'Mã không hợp lệ', description: data.error, variant: 'destructive' })
        return
      }
      // Store per-plan final points
      const allPlans = ['monthly', 'yearly']
      const finalPoints: Record<string, number> = {}
      for (const pid of allPlans) {
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
        title: 'Đăng ký VIP thành công!',
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
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header + Points display */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-500/10">
            <Crown className="h-5 w-5 text-yellow-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Hệ thống điểm VIP</h1>
            <p className="text-muted-foreground text-sm">Nạp tiền → tích điểm → đăng ký gói</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-2">
          <Star className="h-4 w-4 text-yellow-500" />
          {loadingPoints
            ? <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />
            : <span className="text-lg font-bold text-yellow-600 dark:text-yellow-400">{points ?? 0} điểm</span>
          }
        </div>
      </motion.div>

      {isVip && (
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="flex items-center gap-3 pt-4 pb-4">
            <Crown className="h-5 w-5 text-yellow-500" />
            <p className="text-sm font-medium">Bạn đang là thành viên VIP. Cảm ơn bạn đã tin tưởng!</p>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs defaultValue="topup">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="topup">
            <Plus className="mr-1.5 h-4 w-4" /> Nạp điểm
          </TabsTrigger>
          <TabsTrigger value="subscribe">
            <Crown className="mr-1.5 h-4 w-4" /> Đăng ký gói
          </TabsTrigger>
        </TabsList>

        {/* Tab: Nạp điểm */}
        <TabsContent value="topup" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Nạp điểm qua chuyển khoản</CardTitle>
              <p className="text-sm text-muted-foreground">Quy đổi: 1.000đ = 1 điểm · Tối thiểu 10.000đ (10 điểm)</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="amount">Số tiền muốn nạp (VND)</Label>
                <Input
                  id="amount"
                  placeholder="Nhập số tiền, VD: 100000"
                  inputMode="numeric"
                  value={amountInput ? parseInt(amountInput).toLocaleString('vi-VN') : ''}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '')
                    setAmountInput(raw)
                  }}
                />
                {parsedAmount > 0 && parsedAmount < 10000 && (
                  <p className="text-xs text-destructive">Số tiền tối thiểu 10.000đ</p>
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
                    className={parsedAmount === preset ? 'border-primary bg-primary/5' : ''}
                  >
                    {formatCurrency(preset)}
                  </Button>
                ))}
              </div>

              {/* Points preview */}
              {parsedAmount >= 10000 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center justify-between rounded-lg border border-yellow-500/20 bg-yellow-500/10 px-4 py-3"
                >
                  <span className="text-sm text-muted-foreground">Bạn sẽ nhận được</span>
                  <div className="flex items-center gap-1.5 font-bold text-yellow-600 dark:text-yellow-400">
                    <Star className="h-4 w-4" />
                    <span className="text-xl">{pointsPreview} điểm</span>
                  </div>
                </motion.div>
              )}

              <Button
                className="w-full gap-2"
                onClick={handleCreateTopup}
                disabled={topupLoading || parsedAmount < 10000}
              >
                {topupLoading
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <ArrowRight className="h-4 w-4" />
                }
                Tạo QR nạp tiền
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Đăng ký gói */}
        <TabsContent value="subscribe" className="mt-4 space-y-4">
          {/* Coupon input */}
          <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Mã giảm giá</p>
            {couponApplied ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30">
                    {couponApplied.code} — Giảm {couponApplied.discountPercent}%
                  </Badge>
                </div>
                <button
                  onClick={() => { setCouponApplied(null); setCouponInput('') }}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Xóa
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="Nhập mã (VD: THPTQG2027)"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  className="uppercase"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applyCoupon('monthly')}
                  disabled={couponLoading || !couponInput.trim()}
                >
                  {couponLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Áp dụng'}
                </Button>
              </div>
            )}
          </div>

          {/* Current points */}
          <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
            <span className="text-sm text-muted-foreground">Điểm hiện tại của bạn</span>
            <div className="flex items-center gap-1.5 font-bold">
              <Star className="h-4 w-4 text-yellow-500" />
              {loadingPoints
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <span>{points ?? 0} điểm</span>
              }
            </div>
          </div>

          {/* Plan cards */}
          <div className="grid md:grid-cols-2 gap-4">
            {PLANS.map((plan) => {
              const currentPts = points ?? 0
              const effectiveCost = couponApplied?.finalPoints?.[plan.id] ?? plan.points
              const canAfford = currentPts >= effectiveCost
              const isSubscribing = subscribing === plan.id
              const lacking = effectiveCost - currentPts

              return (
                <Card key={plan.id} className={`relative h-full ${plan.highlight ? 'border-primary shadow-lg' : ''}`}>
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary">{plan.badge}</Badge>
                    </div>
                  )}
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Star className="h-5 w-5 text-yellow-500" />
                      {couponApplied && effectiveCost !== plan.points ? (
                        <>
                          <span className="text-xl line-through text-muted-foreground">{plan.points}</span>
                          <span className="text-3xl font-extrabold text-yellow-500">{effectiveCost}</span>
                        </>
                      ) : (
                        <span className="text-3xl font-extrabold text-yellow-500">{plan.points}</span>
                      )}
                      <span className="text-sm text-muted-foreground">điểm {plan.period}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-2">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 shrink-0 text-green-500" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="w-full"
                      variant={plan.highlight ? 'default' : 'outline'}
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={!canAfford || isSubscribing || !!subscribing}
                    >
                      {isSubscribing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {canAfford
                        ? `Dùng ${effectiveCost} điểm đăng ký`
                        : `Cần thêm ${lacking} điểm`
                      }
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {!loadingPoints && (points ?? 0) < VIP_PLANS.monthly.costPoints && (
            <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-300">
              <Info className="h-4 w-4 shrink-0" />
              Chưa đủ điểm. Chuyển sang tab <strong className="mx-1">Nạp điểm</strong> để nạp thêm (1.000đ = 1 điểm).
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Trust badges */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Shield, label: 'Thanh toán an toàn' },
          { icon: Zap, label: 'Kích hoạt ngay lập tức' },
          { icon: Star, label: '1.000đ = 1 điểm' },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="flex flex-col items-center gap-1 rounded-lg bg-muted/50 p-3 text-center">
            <Icon className="h-5 w-5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* QR Dialog */}
      <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Nạp điểm qua chuyển khoản</DialogTitle>
            <DialogDescription>
              Quét mã QR hoặc chuyển khoản theo thông tin bên dưới
            </DialogDescription>
          </DialogHeader>

          {(topupLoading || (!topupInfo && !topupSuccess)) && (
            <div className="flex flex-col items-center gap-3 py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Đang tạo mã thanh toán...</p>
            </div>
          )}

          {topupSuccess && topupInfo && (
            <div className="space-y-3 py-6 text-center">
              <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
              <p className="text-lg font-bold">Nạp điểm thành công!</p>
              <div className="flex items-center justify-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                <span className="text-xl font-bold text-yellow-500">+{topupInfo.pointsToAdd} điểm</span>
              </div>
              <p className="text-sm text-muted-foreground">Điểm đã được cộng vào tài khoản</p>
              <Button className="w-full" onClick={() => setDialogOpen(false)}>Đóng</Button>
            </div>
          )}

          {!topupLoading && topupInfo && !topupSuccess && (
            <div className="space-y-3">
              <div className="flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={topupInfo.qrUrl}
                  alt="Mã QR thanh toán"
                  width={240}
                  height={240}
                  className="rounded-xl border bg-white"
                />
              </div>
              <div className="space-y-2 text-sm">
                <InfoRow label="Ngân hàng" value={topupInfo.bankName} />
                <InfoRow label="Số tài khoản" value={topupInfo.bankAccount} mono onCopy={() => copy(topupInfo.bankAccount, 'số tài khoản')} />
                <InfoRow label="Chủ tài khoản" value={topupInfo.accountName} />
                <InfoRow label="Số tiền" value={formatCurrency(topupInfo.amount)} bold onCopy={() => copy(String(topupInfo.amount), 'số tiền')} />
                <InfoRow label="Nội dung CK" value={topupInfo.referenceCode} mono bold onCopy={() => copy(topupInfo.referenceCode, 'nội dung')} />
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-yellow-500/10 px-3 py-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 shrink-0 animate-spin text-yellow-500" />
                <span>Đang chờ xác nhận. Bạn sẽ nhận <strong>{topupInfo.pointsToAdd} điểm</strong> sau khi chuyển khoản.</span>
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
    <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2">
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`${mono ? 'font-mono' : ''} ${bold ? 'font-semibold' : 'font-medium'}`}>{value}</p>
      </div>
      {onCopy && (
        <button onClick={onCopy} className="ml-2 text-muted-foreground transition-colors hover:text-foreground">
          <Copy className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
