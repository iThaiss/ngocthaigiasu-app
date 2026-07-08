import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from '@/components/providers'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'
import 'katex/dist/katex.min.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Ngọc Thái Gia Sư - Ôn Toán thi Đại học giá Tiểu học',
  description: 'Nền tảng gia sư Toán thông minh với AI, luyện tập theo chủ đề và cộng đồng học tập.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
