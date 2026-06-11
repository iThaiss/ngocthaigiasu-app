'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { GitBranch, Copy, Share2, Star, TrendingUp, CheckCircle, ImageIcon, Loader2, Trophy, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/components/ui/use-toast'
import { formatDateShort } from '@/lib/utils'
import { VIP_PLANS } from '@/lib/plans'

const MILESTONES = [
  { count: 5, label: '30 ngày VIP miễn phí', icon: '🎁' },
  { count: 12, label: '90 ngày VIP miễn phí', icon: '🎉' },
  { count: 20, label: 'VIP vĩnh viễn', icon: '👑' },
]


interface ReferralRow {
  id: string
  status: string
  commissionPoints: number
  createdAt: string
  refereeEmail: string
}

interface AffiliateData {
  referralCode: string | null
  points: number
  totalCommissionPoints: number
  commissionedCount: number
  referrals: ReferralRow[]
}

export default function AffiliatePage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [data, setData] = useState<AffiliateData>({
    referralCode: null,
    points: 0,
    totalCommissionPoints: 0,
    commissionedCount: 0,
    referrals: [],
  })
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/affiliate/data')
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user?.id) fetchData()
  }, [user?.id, fetchData])

  const referralCode = data.referralCode ?? ''
  const referralLink = referralCode
    ? `https://www.ngocthaigiasu.id.vn/login?ref=${referralCode}`
    : ''

  const copyToClipboard = (text: string, key: string) => {
    if (!text) return
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key)
      setTimeout(() => setCopied(null), 2000)
      toast({ title: 'Đã sao chép!', variant: 'success' as never })
    })
  }

  // Next milestone
  const nextMilestone = MILESTONES.find(m => data.commissionedCount < m.count)
  const prevMilestoneCount = nextMilestone
    ? (MILESTONES[MILESTONES.indexOf(nextMilestone) - 1]?.count ?? 0)
    : MILESTONES[MILESTONES.length - 1].count
  const milestoneProgress = nextMilestone
    ? ((data.commissionedCount - prevMilestoneCount) / (nextMilestone.count - prevMilestoneCount)) * 100
    : 100

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10">
            <GitBranch className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Chương trình hoa hồng</h1>
            <p className="text-muted-foreground text-sm">Mời bạn bè mua VIP, nhận 15% hoa hồng</p>
          </div>
        </div>
      </motion.div>

      {/* Banner placeholder */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <div className="relative w-full overflow-hidden rounded-xl border border-green-500/20 bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-blue-500/10" style={{ aspectRatio: '16/5' }}>
          <div className="flex h-full flex-col justify-center px-6">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <ImageIcon className="h-5 w-5" />
              <span className="text-sm font-medium">Chia sẻ ngocthaigiasu</span>
            </div>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">Mời bạn bè học thử, theo dõi lượt giới thiệu và nhận điểm hoa hồng khi họ nâng cấp VIP.</p>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}><CardContent className="pt-4 pb-4 flex items-center justify-center h-20"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></CardContent></Card>
          ))
        ) : (
          [
            { label: 'Điểm hiện có', value: `${data.points} điểm`, icon: Star, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
            { label: 'Tổng hoa hồng tích lũy', value: `${data.totalCommissionPoints} điểm`, icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-500/10' },
            { label: 'Đã giới thiệu thành công', value: `${data.commissionedCount} người`, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                      <p className={`font-bold mt-1 text-sm ${s.color}`}>{s.value}</p>
                    </div>
                    <div className={`h-8 w-8 flex items-center justify-center rounded-lg ${s.bg}`}>
                      <s.icon className={`h-4 w-4 ${s.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Referral Code */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Mã giới thiệu của bạn</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <Input
                    value={referralCode || 'Đang tải...'}
                    readOnly
                    className="font-mono font-bold text-primary text-base text-center tracking-widest"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    onClick={() => copyToClipboard(referralCode, 'code')}
                    disabled={!referralCode}
                  >
                    {copied === 'code' ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">Link giới thiệu</p>
                  <div className="flex gap-2">
                    <Input value={referralLink || 'Đang tải...'} readOnly className="text-xs text-muted-foreground" />
                    <Button
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      onClick={() => copyToClipboard(referralLink, 'link')}
                      disabled={!referralLink}
                    >
                      {copied === 'link' ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Share2 className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
                  <p className="font-medium">Cách hoạt động:</p>
                  <p className="text-muted-foreground">1. Chia sẻ mã/link giới thiệu của bạn</p>
                  <p className="text-muted-foreground">2. Bạn bè đăng ký tài khoản qua link của bạn</p>
                  <p className="text-muted-foreground">3. Bạn bè mua gói VIP → Bạn nhận ngay <strong>15% hoa hồng</strong></p>
                  <p className="text-[11px] text-green-600 dark:text-green-400 font-medium">* Hoa hồng được cộng thẳng vào Điểm hiện có để bạn tự đăng ký VIP.</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Milestone Progress */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" /> Thành tích & phần thưởng
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {MILESTONES.map((m) => {
              const achieved = data.commissionedCount >= m.count
              return (
                <div key={m.count} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5">
                      <span>{m.icon}</span>
                      <span className={achieved ? 'font-medium' : 'text-muted-foreground'}>
                        {m.count} người → {m.label}
                      </span>
                    </span>
                    {achieved
                      ? <Badge variant="success" className="text-xs">Đạt được</Badge>
                      : <span className="text-xs text-muted-foreground">{data.commissionedCount}/{m.count}</span>
                    }
                  </div>
                  <Progress
                    value={achieved ? 100 : Math.min(100, (data.commissionedCount / m.count) * 100)}
                    className="h-1.5"
                  />
                </div>
              )
            })}
            {nextMilestone && (
              <p className="text-xs text-muted-foreground pt-1">
                Còn <strong>{nextMilestone.count - data.commissionedCount} người</strong> nữa để nhận {nextMilestone.label}
              </p>
            )}
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
                  <TableHead>Email người được mời</TableHead>
                  <TableHead className="hidden sm:table-cell">Ngày</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Hoa hồng</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : data.referrals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Chưa có lượt giới thiệu nào
                    </TableCell>
                  </TableRow>
                ) : (
                  data.referrals.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <p className="font-mono text-sm">{r.refereeEmail}</p>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {formatDateShort(r.createdAt)}
                      </TableCell>
                      <TableCell>
                        {r.status === 'commissioned'
                          ? <Badge variant="success" className="text-xs">Đã nhận hoa hồng</Badge>
                          : <Badge variant="warning" className="text-xs">Đang chờ</Badge>
                        }
                      </TableCell>
                      <TableCell className="text-right font-semibold text-sm">
                        {r.commissionPoints > 0
                          ? <span className="text-green-500">+{r.commissionPoints} điểm</span>
                          : <span className="text-muted-foreground">—</span>
                        }
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
