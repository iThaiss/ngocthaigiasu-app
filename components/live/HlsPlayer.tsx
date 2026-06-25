'use client'

import { useEffect, useRef, useState } from 'react'
import Hls from 'hls.js'
import { Loader2, WifiOff } from 'lucide-react'

interface HlsPlayerProps {
  src: string
  className?: string
}

export default function HlsPlayer({ src, className = '' }: HlsPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const [status, setStatus] = useState<'loading' | 'playing' | 'error'>('loading')

  useEffect(() => {
    const video = videoRef.current
    if (!video || !src) return

    setStatus('loading')

    if (Hls.isSupported()) {
      hlsRef.current?.destroy()

      const hls = new Hls({
        backBufferLength: 30,
        // MediaMTX HLS dùng cookie session (Secure, SameSite=None) — phải gửi
        // credentials cho request cross-origin, nếu không sub-playlist bị "authentication error"
        xhrSetup: (xhr) => {
          xhr.withCredentials = true
        },
        fetchSetup: (context, initParams) => {
          initParams.credentials = 'include'
          return new Request(context.url, initParams)
        },
      })
      hlsRef.current = hls

      hls.loadSource(src)
      hls.attachMedia(video)

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setStatus('playing')
        video.play().catch(() => {})
      })

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          setStatus('error')
          setTimeout(() => {
            hls.loadSource(src)
            hls.startLoad()
            setStatus('loading')
          }, 5000)
        }
      })

      return () => {
        hls.destroy()
        hlsRef.current = null
      }
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src
      video.play().catch(() => {})
      setStatus('playing')
    }
  }, [src])

  return (
    <div className={`relative bg-black ${className}`}>
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        controls
        playsInline
        autoPlay
        muted
      />
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 pointer-events-none">
          <div className="text-center text-white space-y-2">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p className="text-sm font-medium">Đang kết nối stream...</p>
            <p className="text-xs text-white/60">Giáo viên cần bắt đầu stream từ Meld Studio</p>
          </div>
        </div>
      )}
      {status === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 pointer-events-none">
          <div className="text-center text-white space-y-2">
            <WifiOff className="h-8 w-8 mx-auto text-rose-400" />
            <p className="text-sm font-medium">Mất kết nối stream</p>
            <p className="text-xs text-white/60">Đang tự động thử lại...</p>
          </div>
        </div>
      )}
    </div>
  )
}
