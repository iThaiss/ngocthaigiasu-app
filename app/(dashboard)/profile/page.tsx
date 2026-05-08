'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Save, Camera, Crown } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/components/ui/use-toast'
import { supabase } from '@/lib/supabase'

interface ProfileData {
  name: string
  school: string
  class: string
  email: string
}

interface FormErrors {
  name?: string
}

export default function ProfilePage() {
  const { user, isVip, role } = useAuth()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<ProfileData>({
    name: user?.name ?? '',
    school: '',
    class: '',
    email: user?.email ?? '',
  })
  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    if (!user?.id) return
    supabase
      .from('profiles')
      .select('school, class')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setForm((prev) => ({
            ...prev,
            school: data.school ?? '',
            class: data.class ?? '',
          }))
        }
      })
  }, [user?.id])

  const validate = (): boolean => {
    const newErrors: FormErrors = {}
    if (!form.name.trim()) newErrors.name = 'Tên không được để trống'
    if (form.name.trim().length < 2) newErrors.name = 'Tên phải có ít nhất 2 ký tự'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validate() || !user?.id) return
    setSaving(true)
    try {
      const [userResult, profileResult] = await Promise.all([
        supabase.from('users').update({ name: form.name }).eq('id', user.id),
        supabase.from('profiles').upsert({
          id: user.id,
          school: form.school || null,
          class: form.class || null,
          updated_at: new Date().toISOString(),
        }),
      ])

      if (userResult.error) throw userResult.error
      if (profileResult.error) throw profileResult.error

      toast({ title: 'Cập nhật thành công!', description: 'Thông tin cá nhân đã được lưu.' })
    } catch {
      toast({ title: 'Lỗi', description: 'Không thể lưu thông tin. Vui lòng thử lại.', variant: 'destructive' })
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
                  <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? ''} />
                  <AvatarFallback className="text-2xl">{user?.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <button className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                  <Camera className="h-3.5 w-3.5" />
                </button>
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
            <CardDescription>Cập nhật tên, trường và lớp học của bạn</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Họ và tên <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => {
                  setForm({ ...form, name: e.target.value })
                  if (errors.name) setErrors({ ...errors, name: undefined })
                }}
                placeholder="Nhập họ và tên"
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email (từ Google)</Label>
              <Input id="email" value={form.email} disabled className="opacity-60 cursor-not-allowed" />
              <p className="text-xs text-muted-foreground">Email được lấy từ tài khoản Google và không thể thay đổi.</p>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="school">Trường học</Label>
              <Input
                id="school"
                value={form.school}
                onChange={(e) => setForm({ ...form, school: e.target.value })}
                placeholder="VD: THPT Nguyễn Huệ"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="class">Lớp</Label>
              <Input
                id="class"
                value={form.class}
                onChange={(e) => setForm({ ...form, class: e.target.value })}
                placeholder="VD: 12A1"
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                {saving ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Account Info */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card>
          <CardHeader>
            <CardTitle>Thông tin tài khoản</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Vai trò</span>
              <Badge variant="outline" className="capitalize">{role}</Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Trạng thái VIP</span>
              {isVip ? <Badge variant="success">Đang hoạt động</Badge> : <Badge variant="secondary">Chưa đăng ký</Badge>}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
