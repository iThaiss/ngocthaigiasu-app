'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Save, Camera, Crown, ArrowRight, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/lib/auth-context'
import { useSession } from 'next-auth/react'
import { useToast } from '@/components/ui/use-toast'
import { VIP_PLANS } from '@/lib/plans'

const PROVINCES = [
  'An Giang', 'Bạc Liêu', 'Bắc Ninh', 'Cà Mau',
  'Cao Bằng', 'Cần Thơ', 'Đà Nẵng', 'Đắk Lắk',
  'Điện Biên', 'Đồng Nai', 'Gia Lai', 'Hà Nội',
  'Hà Tĩnh', 'Hải Phòng', 'Huế', 'Hưng Yên',
  'Khánh Hòa', 'Lai Châu', 'Lâm Đồng', 'Lạng Sơn',
  'Nghệ An', 'Ninh Bình', 'Phú Thọ', 'Quảng Ngãi',
  'Quảng Ninh', 'Quảng Trị', 'Sơn La', 'Thái Nguyên',
  'Thanh Hóa', 'Tiền Giang', 'TP. Hồ Chí Minh',
  'Tuyên Quang', 'Tây Ninh', 'Vĩnh Long',
]

interface UserProfile {
  name: string
  email: string
  phone: string
  school: string
  province: string
  studentClass: string
  isVip: boolean
  vipExpiresAt: string | null
}

export default function ProfilePage() {
  const { user, isVip, role } = useAuth()
  const { update: updateSession, data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarSrc, setAvatarSrc] = useState<string | undefined>(undefined)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState<UserProfile>({
    name: '',
    email: '',
    phone: '',
    school: '',
    province: '',
    studentClass: '',
    isVip: false,
    vipExpiresAt: null,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (user?.image) setAvatarSrc(user.image)
  }, [user?.image])

  const fetchProfile = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const res = await fetch('/api/profile/me')
      if (res.ok) {
        const data = await res.json()
        setForm({
          name: data.name ?? user?.name ?? '',
          email: data.email ?? user?.email ?? '',
          phone: data.phone ?? '',
          school: data.school ?? '',
          province: data.province ?? '',
          studentClass: data.studentClass ?? '',
          isVip: data.isVip ?? false,
          vipExpiresAt: data.vipExpiresAt ?? null,
        })
      }
    } finally {
      setLoading(false)
    }
  }, [user?.id, user?.name, user?.email])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAvatar(true)
    try {
      const fd = new FormData()
      fd.append('avatar', file)
      const res = await fetch('/api/profile/avatar', { method: 'POST', body: fd })
      const data = await res.json()
      if (res.ok) {
        setAvatarSrc(data.url)
        await updateSession()
        toast({ title: 'Cập nhật ảnh đại diện thành công!' })
      } else {
        toast({ title: 'Lỗi', description: data.error ?? 'Không thể cập nhật ảnh.', variant: 'destructive' })
      }
    } finally {
      setUploadingAvatar(false)
      e.target.value = ''
    }
  }

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Tên không được để trống'
    if (form.name.trim().length < 2) e.name = 'Tên phải có ít nhất 2 ký tự'
    if (form.phone && !/^0\d{9}$/.test(form.phone.replace(/\s/g, '')))
      e.phone = 'Số điện thoại phải 10 số, bắt đầu bằng 0'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSave() {
    if (!validate() || !user?.id) return
    setSaving(true)
    try {
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone || null,
          school: form.school || null,
          province: form.province || null,
          studentClass: form.studentClass || null,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Lỗi cập nhật')
      }
      await updateSession()
      router.refresh()
      toast({ title: 'Cập nhật thành công!', description: 'Thông tin cá nhân đã được lưu.' })
    } catch (err) {
      toast({
        title: 'Lỗi',
        description: err instanceof Error ? err.message : 'Không thể lưu thông tin.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">Hồ sơ cá nhân</h1>
        <p className="text-muted-foreground mt-1">Cập nhật thông tin tài khoản của bạn</p>
      </motion.div>

      {/* Avatar Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={avatarSrc ?? user?.image ?? undefined} alt={user?.name ?? ''} />
                  <AvatarFallback className="text-2xl">{user?.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  disabled={uploadingAvatar}
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {uploadingAvatar ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold">{user?.name}</h2>
                  {isVip && <Badge variant="warning" className="gap-1"><Crown className="h-3 w-3" />VIP</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <Badge variant="secondary" className="mt-1 capitalize">{role}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Form */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card>
          <CardHeader>
            <CardTitle>Thông tin cá nhân</CardTitle>
            <CardDescription>Cập nhật tên, trường học và địa chỉ của bạn</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Họ và tên <span className="text-destructive">*</span></Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => { setForm({ ...form, name: e.target.value }); setErrors({ ...errors, name: '' }) }}
                    placeholder="Nguyễn Văn A"
                    className={errors.name ? 'border-destructive' : ''}
                  />
                  {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email (từ Google)</Label>
                  <Input id="email" value={form.email} disabled className="opacity-60 cursor-not-allowed" />
                  <p className="text-xs text-muted-foreground">Email lấy từ Google, không thể thay đổi.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <Input
                    id="phone"
                    inputMode="numeric"
                    value={form.phone}
                    onChange={(e) => { setForm({ ...form, phone: e.target.value }); setErrors({ ...errors, phone: '' }) }}
                    placeholder="0912345678"
                    className={errors.phone ? 'border-destructive' : ''}
                  />
                  {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="studentClass">Lớp</Label>
                  <Input
                    id="studentClass"
                    value={form.studentClass}
                    onChange={(e) => setForm({ ...form, studentClass: e.target.value })}
                    placeholder="12A1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="school">Trường học</Label>
                  <Input
                    id="school"
                    value={form.school}
                    onChange={(e) => setForm({ ...form, school: e.target.value })}
                    placeholder="THPT Nguyễn Huệ"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="province">Tỉnh / Thành phố</Label>
                  <select
                    id="province"
                    value={form.province}
                    onChange={(e) => setForm({ ...form, province: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">-- Chọn tỉnh/thành --</option>
                    {PROVINCES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end pt-2">
                  <Button onClick={handleSave} disabled={saving} className="gap-2">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* VIP Status Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <VipStatusCard
        isVip={form.isVip || isVip}
        vipExpiresAt={form.vipExpiresAt ?? user?.vipExpiresAt ?? null}
        vipPlan={session?.user?.vipPlan ?? null}
      />
      </motion.div>
    </div>
  )
}

function VipStatusCard({ isVip, vipExpiresAt, vipPlan }: {
  isVip: boolean
  vipExpiresAt: string | null
  vipPlan: string | null
}) {
  const fmt = (d: Date) =>
    d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })

  let daysRemaining = 0
  let progressPercent = 0

  if (isVip && vipExpiresAt) {
    const expires = new Date(vipExpiresAt)
    const today = new Date()
    daysRemaining = Math.max(0, Math.ceil((expires.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))
    
    let totalDays = 30
    if (vipPlan) {
      if (vipPlan.includes('yearly') || vipPlan === 'yearly') totalDays = 365
      else if (vipPlan.includes('3months')) totalDays = 90
      else if (vipPlan.includes('monthly') || vipPlan === 'monthly') totalDays = 30
      else if (vipPlan.includes('1week')) totalDays = 7
      else if (vipPlan.includes('3days')) totalDays = 3
      else if (vipPlan.includes('1day')) totalDays = 1
    }
    
    const daysUsed = totalDays - daysRemaining
    progressPercent = Math.max(0, Math.min(100, (daysUsed / totalDays) * 100))
  }

  return (
    <Card className={isVip ? 'border-yellow-500/40 bg-yellow-500/5' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Crown className={`h-5 w-5 ${isVip ? 'text-yellow-500' : 'text-muted-foreground'}`} />
          <CardTitle className="text-base">Trạng thái VIP</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isVip && vipExpiresAt ? (
          <>
            <div className="flex items-center justify-between">
              <Badge className="bg-yellow-500 text-white gap-1">
                <Crown className="h-3 w-3" /> VIP Active
              </Badge>
              <span className="text-sm text-muted-foreground">Còn {daysRemaining} ngày</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Hiệu lực: {fmt(new Date())} → {fmt(new Date(vipExpiresAt))}
            </p>
            <div className="space-y-1.5">
              <Progress value={progressPercent} className="h-2" />
            </div>
            <Button variant="outline" size="sm" className="w-full gap-2" asChild>
              <Link href="/payment">
                <Crown className="h-3.5 w-3.5" /> Gia hạn VIP <ArrowRight className="h-3.5 w-3.5 ml-auto" />
              </Link>
            </Button>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <Badge variant="secondary">Chưa kích hoạt</Badge>
              <span className="text-xs text-muted-foreground">Từ {VIP_PLANS.monthly.costPoints} điểm / tháng</span>
            </div>
            <p className="text-sm text-muted-foreground">Nâng cấp VIP để mở khóa toàn bộ tính năng học tập.</p>
            <Button size="sm" className="w-full gap-2" asChild>
              <Link href="/payment">
                <Crown className="h-3.5 w-3.5" /> Nâng cấp VIP ngay <ArrowRight className="h-3.5 w-3.5 ml-auto" />
              </Link>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
