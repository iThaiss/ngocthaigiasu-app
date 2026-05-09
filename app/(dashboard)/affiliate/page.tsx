'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { GitBranch, Copy, Share2, Wallet, TrendingUp, CheckCircle, ImageIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAuth } from '@/lib/auth-context'
import { MOCK_AFFILIATE_REFERRALS, MOCK_WALLETS, ReferralStatus } from '@/lib/mock-data'
import { formatCurrency, formatDateShort, generateReferralCode } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'

const STATUS_CONFIG: Record<ReferralStatus, { label: string; variant: string }> = {
  Pending: { label: 'Chờ thanh toán', variant: 'warning' },
  Commissioned: { label: 'Đã nhận hoa hồng', variant: 'success' },
  Invalid: { label: 'Không hợp lệ', variant: 'destructive' },
}

export default function AffiliatePage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)

  const referralCode = generateReferralCode(user?.id ?? 'u1')
  const referralLink = `https://ngocthaigiasu.id.vn/login?ref=${referralCode}`

  const referrals = MOCK_AFFILIATE_REFERRALS.filter((r) => r.referrerId === user?.id)
  const wallet = MOCK_WALLETS.find((w) => w.userId === user?.id)
  const totalEarned = referrals.filter((r) => r.status === 'Commissioned').reduce((sum, r) => sum + r.commission, 0)
  const pendingCount = referrals.filter((r) => r.status === 'Pending').length

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast({ title: 'Đã sao chép!', variant: 'success' as never })
    })
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10">
            <GitBranch className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Chương trình hoa hồng</h1>
            <p className="text-muted-foreground text-sm">Mời bạn bè, nhận 10 điểm hoa hồng mỗi lượt</p>
          </div>
        </div>
      </motion.div>

      {/* Banner placeholder */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <div className="relative w-full overflow-hidden rounded-xl bg-muted" style={{ aspectRatio: '16/5' }}>
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <ImageIcon className="mr-2 h-8 w-8" />
            <span>Banner quảng cáo</span>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: 'Số dư ví', value: formatCurrency(wallet?.balance ?? 0), icon: Wallet, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Tổng hoa hồng', value: formatCurrency(totalEarned), icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-500/10' },
          { label: 'Chờ thanh toán', value: `${pendingCount} lượt`, icon: GitBranch, color: 'text-orange-500', bg: 'bg-orange-500/10' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className={`font-bold mt-1 ${s.color}`}>{s.value}</p>
                  </div>
                  <div className={`h-8 w-8 flex items-center justify-center rounded-lg ${s.bg}`}>
                    <s.icon className={`h-4 w-4 ${s.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Referral Code */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Mã giới thiệu của bạn</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input value={referralCode} readOnly className="font-mono font-bold text-primary text-lg text-center tracking-widest" />
              <Button
                variant="outline"
                size="icon"
                className="shrink-0"
                onClick={() => copyToClipboard(referralCode)}
              >
                {copied ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium">Link giới thiệu</p>
              <div className="flex gap-2">
                <Input value={referralLink} readOnly className="text-xs text-muted-foreground" />
                <Button variant="outline" size="icon" className="shrink-0" onClick={() => copyToClipboard(referralLink)}>
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
              <p className="font-medium">Cách hoạt động:</p>
              <p className="text-muted-foreground">1. Chia sẻ mã/link giới thiệu của bạn</p>
              <p className="text-muted-foreground">2. Bạn bè đăng ký và mua VIP bằng mã của bạn</p>
              <p className="text-muted-foreground">3. Bạn nhận ngay <strong>10.000đ</strong> vào ví</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* History */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Lịch sử giới thiệu</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Người được mời</TableHead>
                  <TableHead className="hidden sm:table-cell">Ngày</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Hoa hồng</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {referrals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Chưa có lượt giới thiệu nào
                    </TableCell>
                  </TableRow>
                ) : (
                  referrals.map((r) => {
                    const cfg = STATUS_CONFIG[r.status]
                    return (
                      <TableRow key={r.id}>
                        <TableCell>
                          <p className="font-medium text-sm">{r.refereeName}</p>
                          <p className="text-xs text-muted-foreground">{r.refereeEmail}</p>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                          {formatDateShort(r.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={cfg.variant as never} className="text-xs">{cfg.label}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-sm">
                          {r.commission > 0 ? (
                            <span className="text-green-500">+{formatCurrency(r.commission)}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
