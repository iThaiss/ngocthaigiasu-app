'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Crown, Check, CreditCard, Loader2, CheckCircle, Copy, Shield, Zap, BookOpen } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { formatCurrency } from '@/lib/utils'

interface PaymentInfo {
  txId: string
  referenceCode: string
  amount: number
  qrUrl: string
  bankAccount: string
  accountName: string
  bankName: string
}

const PLANS = [
  {
    id: 'monthly',
    name: 'Gói Tháng',
    price: 99000,
    period: '/ tháng',
    features: ['Không giới hạn giải toán AI', 'Thi thử không giới hạn', 'Xem video hướng dẫn', 'Hỗ trợ 24/7'],
    highlight: false,
  },
  {
    id: 'yearly',
    name: 'Gói Năm',
    price: 799000,
    period: '/ năm',
    badge: 'Tiết kiệm 34%',
    features: ['Tất cả tính năng Gói Tháng', 'Ưu tiên hỗ trợ hàng đầu', 'Đề thi exclusive', 'Báo cáo học tập chi tiết', 'Huy hiệu VIP nổi bật'],
    highlight: true,
  },
]

export default function PaymentPage() {
  const { data: session, update: updateSession } = useSession()
  const { toast } = useToast()

  const [loading, setLoading] = useState(false)
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null)
  const [success, setSuccess] = useState(false)
  const [open, setOpen] = useState(false)
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  const isVip = session?.user?.isVip ?? false

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }

  useEffect(() => {
    return () => stopPolling()
  }, [])

  async function handleSelectPlan(planId: string) {
    setLoading(true)
    setPaymentInfo(null)
    setSuccess(false)
    setOpen(true)

    try {
      const res = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'Request failed')
      }

      const data: PaymentInfo = await res.json()
      setPaymentInfo(data)

      stopPolling()
      pollRef.current = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/payment/status/${data.txId}`)
          const { status } = await statusRes.json()
          if (status === 'completed') {
            stopPolling()
            setSuccess(true)
            await updateSession()
            toast({
              title: 'Thanh toán thành công!',
              description: 'Tài khoản đã được nâng cấp lên VIP.',
            })
          }
        } catch {
          // bỏ qua lỗi mạng tạm thời
        }
      }, 5000)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Vui lòng thử lại.'
      toast({ title: 'Không thể tạo giao dịch', description: message, variant: 'destructive' })
      setOpen(false)
    } finally {
      setLoading(false)
    }
  }

  function handleOpenChange(value: boolean) {
    if (!value) {
      stopPolling()
      setSuccess(false)
      setPaymentInfo(null)
    }
    setOpen(value)
  }

  function copy(text: string, label: string) {
    navigator.clipboard.writeText(text)
    toast({ title: `Đã sao chép ${label}` })
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-500/10">
          <Crown className="h-5 w-5 text-yellow-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Nâng cấp VIP</h1>
          <p className="text-muted-foreground text-sm">Mở khóa toàn bộ tính năng học tập</p>
        </div>
      </div>

      {isVip && (
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <Crown className="h-5 w-5 text-yellow-500" />
            <p className="text-sm font-medium">Bạn đang là thành viên VIP. Cảm ơn bạn đã tin tưởng!</p>
          </CardContent>
        </Card>
      )}

      {/* Plan cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {PLANS.map((plan) => (
          <Card key={plan.id} className={`relative h-full ${plan.highlight ? 'border-primary shadow-lg' : ''}`}>
            {plan.badge && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary">{plan.badge}</Badge>
              </div>
            )}
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">{plan.name}</CardTitle>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold">{formatCurrency(plan.price)}</span>
                <span className="text-muted-foreground text-sm">{plan.period}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                className="w-full"
                variant={plan.highlight ? 'default' : 'outline'}
                onClick={() => handleSelectPlan(plan.id)}
                disabled={loading}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Chọn gói này
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Trust badges */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Shield, label: 'Thanh toán an toàn' },
          { icon: Zap, label: 'Kích hoạt ngay lập tức' },
          { icon: BookOpen, label: 'Hủy bất kỳ lúc nào' },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="flex flex-col items-center gap-1 text-center p-3 rounded-lg bg-muted/50">
            <Icon className="h-5 w-5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Payment modal */}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Thanh toán qua chuyển khoản</DialogTitle>
            <DialogDescription>
              Quét mã QR hoặc chuyển khoản theo thông tin bên dưới
            </DialogDescription>
          </DialogHeader>

          {/* Loading state */}
          {(loading || (!paymentInfo && !success)) && (
            <div className="py-12 flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Đang tạo mã thanh toán...</p>
            </div>
          )}

          {/* Success state */}
          {success && (
            <div className="py-6 text-center space-y-3">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <p className="font-bold text-lg">Thanh toán thành công!</p>
              <p className="text-sm text-muted-foreground">Tài khoản đã được nâng cấp lên VIP</p>
              <Badge className="bg-yellow-500 gap-1">
                <Crown className="h-3 w-3" /> VIP Active
              </Badge>
              <Button className="w-full" onClick={() => setOpen(false)}>Đóng</Button>
            </div>
          )}

          {/* QR + info state */}
          {!loading && paymentInfo && !success && (
            <div className="space-y-3">
              {/* QR code thật từ VietQR */}
              <div className="flex justify-center">
                <img
                  src={paymentInfo.qrUrl}
                  alt="Mã QR thanh toán"
                  width={240}
                  height={240}
                  className="rounded-xl border bg-white"
                />
              </div>

              {/* Thông tin chuyển khoản */}
              <div className="space-y-2 text-sm">
                <InfoRow label="Ngân hàng" value={paymentInfo.bankName} />
                <InfoRow
                  label="Số tài khoản"
                  value={paymentInfo.bankAccount}
                  mono
                  onCopy={() => copy(paymentInfo.bankAccount, 'số tài khoản')}
                />
                <InfoRow label="Chủ tài khoản" value={paymentInfo.accountName} />
                <InfoRow
                  label="Số tiền"
                  value={formatCurrency(paymentInfo.amount)}
                  bold
                  onCopy={() => copy(String(paymentInfo.amount), 'số tiền')}
                />
                <InfoRow
                  label="Nội dung chuyển khoản"
                  value={paymentInfo.referenceCode}
                  mono
                  bold
                  onCopy={() => copy(paymentInfo.referenceCode, 'nội dung chuyển khoản')}
                />
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-blue-500/10 rounded-lg px-3 py-2">
                <Loader2 className="h-3 w-3 animate-spin shrink-0 text-blue-500" />
                Đang chờ xác nhận thanh toán tự động...
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function InfoRow({
  label,
  value,
  mono = false,
  bold = false,
  onCopy,
}: {
  label: string
  value: string
  mono?: boolean
  bold?: boolean
  onCopy?: () => void
}) {
  return (
    <div className="flex items-center justify-between bg-muted rounded-lg px-3 py-2">
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`${mono ? 'font-mono' : ''} ${bold ? 'font-semibold' : 'font-medium'}`}>{value}</p>
      </div>
      {onCopy && (
        <button onClick={onCopy} className="text-muted-foreground hover:text-foreground transition-colors ml-2">
          <Copy className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
