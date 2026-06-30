'use client'

import { useEffect, useRef, useState } from 'react'
import Hls from 'hls.js'
import { Loader2, WifiOff, Volume2 } from 'lucide-react'

interface HlsPlayerProps {
  src: string
  className?: string
  /** Giữ tắt tiếng (vd: admin xem stream của chính mình, hoặc HS đang bật mic) */
  startMuted?: boolean
  /** Ép tắt tiếng bất kể người dùng đã bật (vd: HS đang nói qua LiveKit → tránh vọng) */
  forceMuted?: boolean
}

export default function HlsPlayer({ src, className = '', startMuted = false, forceMuted = false }: HlsPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const [status, setStatus] = useState<'loading' | 'playing' | 'error'>('loading')
  // Hiện overlay "Bấm để nghe" khi trình duyệt chặn autoplay có tiếng
  const [needsUnmute, setNeedsUnmute] = useState(false)

  // Thử phát: ưu tiên có tiếng; nếu trình duyệt chặn → phát muted + hiện nút bật tiếng
  const tryPlay = (video: HTMLVideoElement) => {
    if (startMuted) {
      video.muted = true
      video.play().catch(() => {})
      return
    }
    video.muted = false
    video.play().then(() => {
      setNeedsUnmute(false)
    }).catch(() => {
      // Autoplay có tiếng bị chặn → phát im lặng, nhắc người dùng bấm
      video.muted = true
      video.play().catch(() => {})
      setNeedsUnmute(true)
    })
  }

  useEffect(() => {
    const video = videoRef.current
    if (!video || !src) return

    setStatus('loading')

    if (Hls.isSupported()) {
      hlsRef.current?.destroy()

      const hls = new Hls({
        // Buffer rộng để chịu mạng/thiết bị yếu (chống "mất kết nối" do segment hết hạn)
        backBufferLength: 30,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        liveSyncDurationCount: 4,
        liveMaxLatencyDurationCount: 12,
        // Thử lại nhiều lần trước khi báo lỗi
        manifestLoadingMaxRetry: 8,
        manifestLoadingRetryDelay: 1000,
        levelLoadingMaxRetry: 8,
        levelLoadingRetryDelay: 1000,
        fragLoadingMaxRetry: 10,
        fragLoadingRetryDelay: 1000,
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
        tryPlay(video)
      })

      // Tự phục hồi: lỗi mạng → tải lại; lỗi giải mã → recover; chỉ báo "mất kết nối"
      // khi không thể cứu (rồi khởi tạo lại sau vài giây)
      let recovering = false
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (!data.fatal) return
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          setStatus('loading')
          hls.startLoad()
        } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          setStatus('loading')
          hls.recoverMediaError()
        } else if (!recovering) {
          recovering = true
          setStatus('error')
          setTimeout(() => {
            try {
              hls.destroy()
            } catch {}
            const fresh = new Hls(hls.config)
            hlsRef.current = fresh
            fresh.loadSource(src)
            fresh.attachMedia(video)
            fresh.on(Hls.Events.MANIFEST_PARSED, () => { setStatus('playing'); tryPlay(video) })
            setStatus('loading')
          }, 4000)
        }
      })

      return () => {
        hls.destroy()
        hlsRef.current = null
      }
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src
      tryPlay(video)
      setStatus('playing')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src])

  // Ép tắt/khôi phục tiếng theo forceMuted (HS đang nói)
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (forceMuted) {
      video.muted = true
    } else if (!startMuted && !needsUnmute) {
      video.muted = false
    }
  }, [forceMuted, startMuted, needsUnmute])

  const handleUnmute = () => {
    const video = videoRef.current
    if (!video) return
    video.muted = false
    video.play().catch(() => {})
    setNeedsUnmute(false)
  }

  return (
    <div className={`relative bg-black ${className}`}>
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        controls
        playsInline
        autoPlay
      />
      {needsUnmute && status === 'playing' && !forceMuted && (
        <button
          onClick={handleUnmute}
          className="absolute inset-0 flex items-center justify-center bg-black/40 z-10"
        >
          <span className="flex items-center gap-2 rounded-full bg-rose-500 px-5 py-2.5 text-white font-semibold text-sm shadow-lg animate-pulse">
            <Volume2 className="h-4 w-4" /> Bấm để nghe tiếng thầy
          </span>
        </button>
      )}
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
