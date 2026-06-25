/**
 * Script lấy Google OAuth refresh token mới — phiên bản copy-paste (không cần local server).
 * Chạy: node scripts/get-google-refresh-token.mjs
 */

import readline from 'readline'
import { exec } from 'child_process'

const CLIENT_ID = ''  // Điền khi cần dùng lại
const CLIENT_SECRET = ''  // Điền khi cần dùng lại
const REDIRECT_URI = 'http://localhost:8080'
const SCOPE = 'https://www.googleapis.com/auth/calendar'

const authUrl =
  `https://accounts.google.com/o/oauth2/v2/auth` +
  `?client_id=${encodeURIComponent(CLIENT_ID)}` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
  `&response_type=code` +
  `&scope=${encodeURIComponent(SCOPE)}` +
  `&access_type=offline` +
  `&prompt=consent`

console.log('\n📋 BƯỚC 1: Mở URL này trong trình duyệt:')
console.log('─────────────────────────────────────────')
console.log(authUrl)
console.log('─────────────────────────────────────────')
console.log('\n(Đang tự mở trình duyệt...)\n')
exec(`start "" "${authUrl}"`)

console.log('📋 BƯỚC 2: Đăng nhập Google → Continue → Continue')
console.log('   Sau đó trình duyệt sẽ báo lỗi "localhost refused to connect" — BÌNH THƯỜNG.')
console.log('   Copy TOÀN BỘ URL trong thanh địa chỉ (bắt đầu bằng http://localhost:8080/?...)\n')

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
rl.question('📋 BƯỚC 3: Dán URL vừa copy vào đây rồi Enter:\n> ', async (input) => {
  rl.close()
  try {
    const url = new URL(input.trim())
    const code = url.searchParams.get('code')
    if (!code) {
      console.error('❌ Không tìm thấy "code" trong URL. Thử lại từ đầu.')
      process.exit(1)
    }

    console.log('\n⏳ Đang lấy refresh token...')
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    })

    const tokens = await tokenRes.json()
    if (tokens.error) {
      console.error('❌ Lỗi:', tokens.error, '-', tokens.error_description)
      process.exit(1)
    }

    console.log('\n✅ REFRESH TOKEN MỚI:')
    console.log('════════════════════════════════════════')
    console.log(tokens.refresh_token)
    console.log('════════════════════════════════════════')
    console.log('\n→ Copy token trên')
    console.log('→ Báo lại cho Claude để update Vercel và deploy\n')
  } catch (err) {
    console.error('❌ URL không hợp lệ:', err.message)
  }
})
