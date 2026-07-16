import type { Metadata } from 'next'
import { LandingLinks } from './landing-links'

export const metadata: Metadata = {
  title: 'Học Toán 12 cùng anh Thái',
  description:
    'Nhóm học Toán 12 dành cho các bạn đang yếu hoặc mất gốc. Học phí chỉ 6.000đ mỗi buổi.',
  alternates: {
    canonical: 'https://ngocthaigiasu.id.vn/ngocthaigiasu',
  },
  openGraph: {
    title: 'Học Toán 12 cùng anh Thái',
    description: 'Học lại Toán 12 từ gốc, cùng nhóm Zalo 350+ thành viên. Chỉ 6.000đ mỗi buổi.',
    url: 'https://ngocthaigiasu.id.vn/ngocthaigiasu',
    siteName: 'Ngọc Thái Gia Sư',
    locale: 'vi_VN',
    type: 'website',
  },
}

export default function NgocThaiGiaSuLandingPage() {
  return <LandingLinks />
}
