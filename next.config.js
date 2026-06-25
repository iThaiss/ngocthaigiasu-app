/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@livekit/components-react', '@livekit/components-core'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'img.vietqr.io' },
      { protocol: 'https', hostname: '*.supabase.co' }
    ]
  }
}

module.exports = nextConfig
