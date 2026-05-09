'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Loader2, User } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'

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

const SCHOOL_SUGGESTIONS = [
  'THPT Lê Hồng Phong', 'THPT Nguyễn Huệ', 'THPT Trần Phú',
  'THPT Nguyễn Trãi', 'THPT Chu Văn An', 'THPT Kim Liên',
  'THPT Gia Định', 'THPT Bùi Thị Xuân', 'THPT Phan Đình Phùng',
  'THPT Lê Quý Đôn', 'THPT Nguyễn Bỉnh Khiêm', 'THPT Trần Đại Nghĩa',
  'THPT Nguyễn Thị Minh Khai', 'THPT Hùng Vương', 'THPT Đinh Tiên Hoàng',
]

interface Props {
  isOpen: boolean
  onClose: () => void
  userName: string
}

export default function ProfileCompletionModal({ isOpen, onClose, userName }: Props) {
  const { update: updateSession } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [form, setForm] = useState({
    name: userName ?? '',
    studentClass: '',
    phone: '',
    province: '',
    school: '',
  })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Tên không được để trống'
    if (form.phone && !/^0\d{9}$/.test(form.phone.replace(/\s/g, '')))
      e.phone = 'Số điện thoại phải 10 số, bắt đầu bằng 0'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSave() {
    if (!validate()) return
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
      toast({ title: 'Cập nhật thành công!' })
      onClose()
    } catch (err) {
      toast({
        title: 'Lỗi',
        description: err instanceof Error ? err.message : 'Vui lòng thử lại.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Hoàn thiện hồ sơ</DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                Thông tin giúp chúng tôi hỗ trợ bạn tốt hơn
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Họ và tên */}
          <div className="space-y-1.5">
            <Label htmlFor="pc-name">
              Họ và tên <span className="text-destructive">*</span>
            </Label>
            <Input
              id="pc-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Nguyễn Văn A"
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          {/* Lớp */}
          <div className="space-y-1.5">
            <Label htmlFor="pc-class">Lớp</Label>
            <Input
              id="pc-class"
              value={form.studentClass}
              onChange={(e) => setForm({ ...form, studentClass: e.target.value })}
              placeholder="12A1"
            />
          </div>

          {/* Số điện thoại */}
          <div className="space-y-1.5">
            <Label htmlFor="pc-phone">Số điện thoại</Label>
            <Input
              id="pc-phone"
              inputMode="numeric"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="0912345678"
              className={errors.phone ? 'border-destructive' : ''}
            />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
          </div>

          {/* Tỉnh/Thành phố */}
          <div className="space-y-1.5">
            <Label htmlFor="pc-province">Tỉnh / Thành phố</Label>
            <select
              id="pc-province"
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

          {/* Trường học */}
          <div className="space-y-1.5">
            <Label htmlFor="pc-school">Trường học</Label>
            <Input
              id="pc-school"
              list="school-list"
              value={form.school}
              onChange={(e) => setForm({ ...form, school: e.target.value })}
              placeholder="THPT Nguyễn Huệ"
              autoComplete="off"
            />
            <datalist id="school-list">
              {SCHOOL_SUGGESTIONS.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="ghost" className="flex-1" onClick={onClose} disabled={saving}>
            Bỏ qua
          </Button>
          <Button className="flex-1" onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Lưu thông tin
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
