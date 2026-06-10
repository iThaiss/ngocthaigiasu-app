import http from 'http'
import { URL } from 'url'
import readline from 'readline'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

const question = (query) => new Promise((resolve) => rl.question(query, resolve))

async function run() {
  console.log('=== Google OAuth 2.0 Refresh Token Generator ===')

  let clientId = process.argv[2] || process.env.GOOGLE_CLIENT_ID
  let clientSecret = process.argv[3] || process.env.GOOGLE_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    console.log('Để tạo Refresh Token, bạn cần chuẩn bị Client ID và Client Secret từ Google Cloud Console.')
    console.log('Cách tạo:\n1. Truy cập https://console.cloud.google.com/\n2. Chọn Credentials -> Create Credentials -> OAuth client ID\n3. Chọn Application type: Web application (Ứng dụng Web)\n4. Thêm Authorized Redirect URI: http://localhost:8080\n5. Lưu lại Client ID và Client Secret.\n')

    clientId = (await question('Nhập Client ID của bạn: ')).trim()
    clientSecret = (await question('Nhập Client Secret của bạn: ')).trim()
  } else {
    console.log('Sử dụng Client ID và Client Secret được truyền từ tham số dòng lệnh.')
  }

  if (!clientId || !clientSecret) {
    console.error('Lỗi: Cần cung cấp đầy đủ Client ID và Client Secret.')
    rl.close()
    process.exit(1)
  }

  const redirectUri = 'http://localhost:8080'
  const scope = 'https://www.googleapis.com/auth/calendar'
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scope,
    access_type: 'offline',
    prompt: 'consent'
  }).toString()

  console.log('\n----------------------------------------')
  console.log('Vui lòng click vào liên kết dưới đây để đăng nhập và cấp quyền cho ứng dụng:')
  console.log('\x1b[36m%s\x1b[0m', authUrl)
  console.log('----------------------------------------\n')
  console.log('Đang chờ trình duyệt chuyển hướng về http://localhost:8080 ...')

  const server = http.createServer(async (req, res) => {
    try {
      const reqUrl = new URL(req.url, `http://${req.headers.host}`)
      const code = reqUrl.searchParams.get('code')

      if (code) {
        // Send a success HTML response to browser
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        res.end(`
          <html>
            <body style="font-family: sans-serif; text-align: center; padding: 50px; background: #f4f7f6;">
              <h2 style="color: #2ecc71;">✓ Ủy quyền thành công!</h2>
              <p>Bạn có thể đóng tab này và quay lại cửa sổ chat với AI để lấy Refresh Token.</p>
            </body>
          </html>
        `)

        // Stop server immediately
        server.close()

        console.log('\nĐã nhận Authorization Code. Đang lấy Refresh Token từ Google...')

        // Trade code for token
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            code: code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code',
          }).toString()
        })

        if (!tokenRes.ok) {
          const errText = await tokenRes.text()
          console.error('\nLỗi khi lấy token từ Google:', errText)
          rl.close()
          process.exit(1)
        }

        const data = await tokenRes.json()
        
        console.log('\n======================================================================')
        console.log('★ LẤY REFRESH TOKEN THÀNH CÔNG ★')
        console.log('Hãy copy các biến môi trường sau để dán lên Vercel Environment Variables:')
        console.log('----------------------------------------------------------------------')
        console.log(`GOOGLE_CLIENT_ID="${clientId}"`)
        console.log(`GOOGLE_CLIENT_SECRET="${clientSecret}"`)
        console.log(`GOOGLE_REFRESH_TOKEN="${data.refresh_token}"`)
        console.log('======================================================================\n')
        
        console.log('Lưu ý: Sau khi thêm các biến này vào Vercel, hãy REDEPLOY lại dự án để thay đổi có hiệu lực.')
        rl.close()
        process.exit(0)
      } else {
        res.writeHead(400, { 'Content-Type': 'text/plain' })
        res.end('No code parameter found in the redirect URL.')
      }
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' })
      res.end('Internal Server Error: ' + err.message)
      console.error(err)
      server.close()
      rl.close()
      process.exit(1)
    }
  })

  server.listen(8080, () => {
    // Server is listening
  })
}

run()
