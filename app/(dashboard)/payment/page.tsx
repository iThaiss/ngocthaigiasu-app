'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Crown, Check, Loader2, QrCode, CheckCircle, CreditCard, Zap, Shield, BookOpen } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/components/ui/use-toast'
import { MOCK_TRANSACTIONS } from '@/lib/mock-data'
import { formatCurrency, formatDate } from '@/lib/utils'

const PLANS = [
  {
    id: 'monthly',
    name: 'Gói Tháng',
    price: 99000,
    period: '/ tháng',
    highlight: false,
    features: ['Không giới hạn giải toán AI', 'Thi thử không giới hạn', 'Xem video hướng dẫn VDC', 'Hỗ trợ 24/7'],
  },
  {
    id: 'yearly',
    name: 'Gói Năm',
    price: 799000,
    period: '/ năm',
    highlight: true,
    badge: 'Tiết kiệm 34%',
    features: ['Tất cả tính năng Gói Tháng', 'Ưu tiên hàng đầu khi hỗ trợ', 'Truy cập đề thi exclusive', 'Báo cáo học tập chi tiết', 'Huy hiệu VIP nổi bật'],
  },
]

export default function PaymentPage() {
  const { user, isVip } = useAuth()
  const { toast } = useToast()
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [showQR, setShowQR] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState(false)

  const plan = PLANS.find((p) => p.id === selectedPlan)
  const history = MOCK_TRANSACTIONS.filter((t) => t.userId === user?.id)

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId)
    setShowQR(true)
    setSuccess(false)
  }

  const handleConfirmPayment = async () => {
    setProcessing(true)
    await new Promise((r) => setTimeout(r, 2800))
    setProcessing(false)
    setSuccess(true)
    toast({ title: 'Thanh toán thành công! 🎉', description: 'Tài khoản của bạn đã được nâng cấp lên VIP.', variant: 'success' as never })
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-500/10">
            <Crown className="h-5 w-5 text-yellow-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Nâng cấp VIP</h1>
            <p className="text-muted-foreground text-sm">Mở khóa toàn bộ tính năng học tập</p>
          </div>
        </div>
      </motion.div>

      {isVip && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card className="border-yellow-500/30 bg-yellow-500/5">
            <CardContent className="pt-4 pb-4 flex items-center gap-3">
              <Crown className="h-5 w-5 text-yellow-500" />
              <p className="text-sm font-medium">Bạn đang là thành viên VIP. Cảm ơn bạn đã tin tưởng!</p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Plans */}
      <div className="grid md:grid-cols-2 gap-4">
        {PLANS.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className={`h-full relative ${p.highlight ? 'border-primary shadow-lg' : ''}`}>
              {p.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary">{p.badge}</Badge>
                </div>
              )}
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">{p.name}</CardTitle>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold">{formatCurrency(p.price)}</span>
                  <span className="text-muted-foreground text-sm">{p.period}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={p.highlight ? 'default' : 'outline'}
                  onClick={() => handleSelectPlan(p.id)}
                >
                  <CreditCard className="h-4 w-4 mr-2" /> Chọn gói này
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Trust Badges */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Shield, label: 'Thanh toán an toàn' },
          { icon: Zap, label: 'Kích hoạt ngay lập tức' },
          { icon: BookOpen, label: 'Hủy bất kỳ lúc nào' },
        ].map((item) => (
          <div key={item.label} className="flex flex-col items-center gap-1 text-center p-3 rounded-lg bg-muted/50">
            <item.icon className="h-5 w-5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Transaction history */}
      {history.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Lịch sử giao dịch</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {history.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium">{tx.type === 'VIPPurchase' ? `Mua VIP — Gói ${tx.packageType === 'monthly' ? 'Tháng' : 'Năm'}` : 'Hoa hồng giới thiệu'}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(tx.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(tx.amount)}</p>
                  <Badge variant={tx.status === 'Completed' ? 'success' : tx.status === 'Pending' ? 'warning' : 'destructive'} className="text-xs">
                    {tx.status === 'Completed' ? 'Thành công' : tx.status === 'Pending' ? 'Chờ xử lý' : 'Thất bại'}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* QR Dialog */}
      <Dialog open={showQR} onOpenChange={(o) => { if (!processing) { setShowQR(o); if (!o) setSuccess(false) } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Thanh toán {plan?.name}</DialogTitle>
            <DialogDescription>Quét mã QR để thanh toán {plan && formatCurrency(plan.price)}</DialogDescription>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {success ? (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="py-6 text-center space-y-3">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                <p className="font-bold text-lg">Thanh toán thành công!</p>
                <p className="text-sm text-muted-foreground">Tài khoản của bạn đã được nâng cấp lên VIP</p>
                <Badge variant="warning" className="gap-1 mx-auto">
                  <Crown className="h-3 w-3" /> VIP Active
                </Badge>
                <Button className="w-full" onClick={() => setShowQR(false)}>Đóng</Button>
              </motion.div>
            ) : (
              <motion.div key="qr" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                {/* Fake QR */}
                <div className="mx-auto w-48 h-48 bg-white rounded-xl p-2 flex items-center justify-center">
                  <div className="w-full h-full border-4 border-black rounded grid grid-cols-7 gap-0.5 p-1">
                    {Array.from({ length: 49 }).map((_, i) => (
                      <div key={i} className={`rounded-[1px] ${Math.random() > 0.5 ? 'bg-black' : 'bg-white'}`} />
                    ))}
                  </div>
                </div>
                <div className="text-center space-y-1">
                  <p className="font-bold text-xl">{plan && formatCurrency(plan.price)}</p>
                  <p className="text-xs text-muted-foreground">Chuyển đến: NGUYEN NGOC THAI · MB Bank · 0123456789</p>
                  <p className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">NGOCT-{Date.now().toString().slice(-6)}</p>
                </div>
                <Button
                  className="w-full gap-2"
                  onClick={handleConfirmPayment}
                  disabled={processing}
                >
                  {processing ? <><Loader2 className="h-4 w-4 animate-spin" /> Đang xác nhận...</> : 'Tôi đã thanh toán'}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </div>
  )
}
