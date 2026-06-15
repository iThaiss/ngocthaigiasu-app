'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

// Sakura petal SVG
function SakuraPetal({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <ellipse cx="10" cy="10" rx="4" ry="8" fill="#fda4af" opacity="0.75" transform="rotate(-30 10 10)" />
      <ellipse cx="10" cy="10" rx="4" ry="8" fill="#fb7185" opacity="0.5" transform="rotate(30 10 10)" />
      <circle cx="10" cy="10" r="2" fill="#fecdd3" opacity="0.9" />
    </svg>
  )
}

// Heart SVG
function HeartIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#f472b6" opacity="0.8">
      <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z"/>
    </svg>
  )
}

// Sparkle SVG
function SparkleIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#f9a8d4">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
    </svg>
  )
}

// Pixel cat SVG
function PixelCat() {
  return (
    <svg viewBox="0 0 24 24" width="64" height="64" style={{ imageRendering: 'pixelated' }}>
      {/* ears */}
      <rect x="3" y="1" width="4" height="5" fill="#f9a8d4" />
      <rect x="17" y="1" width="4" height="5" fill="#f9a8d4" />
      {/* inner ear */}
      <rect x="4" y="2" width="2" height="3" fill="#fce7f3" />
      <rect x="18" y="2" width="2" height="3" fill="#fce7f3" />
      {/* head */}
      <rect x="3" y="5" width="18" height="11" rx="2" fill="white" />
      {/* eyes */}
      <rect x="6" y="8" width="3" height="3" rx="1" fill="#1e1b4b" />
      <rect x="15" y="8" width="3" height="3" rx="1" fill="#1e1b4b" />
      {/* eye shine */}
      <rect x="7" y="9" width="1" height="1" fill="white" />
      <rect x="16" y="9" width="1" height="1" fill="white" />
      {/* nose */}
      <rect x="11" y="11" width="2" height="1" rx="0.5" fill="#f9a8d4" />
      {/* whiskers */}
      <rect x="4" y="11" width="5" height="0.5" fill="#d1d5db" />
      <rect x="15" y="11" width="5" height="0.5" fill="#d1d5db" />
      <rect x="4" y="12" width="5" height="0.5" fill="#d1d5db" />
      <rect x="15" y="12" width="5" height="0.5" fill="#d1d5db" />
      {/* mouth */}
      <rect x="10" y="12" width="1" height="1" fill="#f9a8d4" />
      <rect x="13" y="12" width="1" height="1" fill="#f9a8d4" />
      {/* body */}
      <rect x="5" y="15" width="14" height="8" rx="3" fill="white" />
      {/* paws */}
      <rect x="5" y="21" width="4" height="3" rx="2" fill="#fce7f3" />
      <rect x="15" y="21" width="4" height="3" rx="2" fill="#fce7f3" />
      {/* tail */}
      <rect x="19" y="17" width="3" height="7" rx="1.5" fill="#f9a8d4" />
      {/* blush */}
      <rect x="5" y="10" width="3" height="2" rx="1" fill="#fda4af" opacity="0.4" />
      <rect x="16" y="10" width="3" height="2" rx="1" fill="#fda4af" opacity="0.4" />
    </svg>
  )
}

// Flower decoration
function CuteFlower({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      {[0, 60, 120, 180, 240, 300].map((deg) => (
        <ellipse
          key={deg}
          cx="16" cy="8" rx="4" ry="6"
          fill="#fda4af"
          opacity="0.8"
          transform={`rotate(${deg} 16 16)`}
        />
      ))}
      <circle cx="16" cy="16" r="5" fill="#fef08a" />
      <circle cx="16" cy="16" r="2.5" fill="#fbbf24" />
    </svg>
  )
}

const PETALS = Array.from({ length: 14 }, (_, i) => ({
  left: `${(i * 7.1) % 96 + 2}%`,
  delay: `${(i * 1.1) % 12}s`,
  duration: `${7 + (i % 5)}s`,
  size: 14 + (i % 3) * 6,
}))

const HEARTS = Array.from({ length: 8 }, (_, i) => ({
  left: `${10 + i * 11}%`,
  bottom: `${5 + (i % 3) * 8}%`,
  delay: `${i * 2.2}s`,
  duration: `${5 + (i % 3) * 2}s`,
  size: 12 + (i % 3) * 6,
}))

const SPARKLES = [
  { top: '8%', left: '3%', size: 18, delay: '0s', duration: '2.5s' },
  { top: '15%', right: '4%', size: 14, delay: '0.8s', duration: '3s' },
  { top: '50%', left: '1%', size: 20, delay: '1.5s', duration: '2s' },
  { top: '70%', right: '2%', size: 16, delay: '0.3s', duration: '3.5s' },
  { top: '35%', right: '6%', size: 12, delay: '2s', duration: '2.8s' },
  { top: '85%', left: '5%', size: 18, delay: '1s', duration: '2.2s' },
]

const FLOWERS = Array.from({ length: 5 }, (_, i) => ({
  top: `${15 + i * 18}%`,
  left: i % 2 === 0 ? '0%' : undefined,
  right: i % 2 === 1 ? '0%' : undefined,
  size: 20 + (i % 2) * 10,
  delay: `${i * 1.7}s`,
  duration: `${3 + i}s`,
}))

export default function PinkThemeDecorations() {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  if (!mounted || theme !== 'pink') return null

  return (
    <>
      {/* Floating elements overlay */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-40" aria-hidden="true">
        {/* Sakura petals falling */}
        {PETALS.map((p, i) => (
          <div
            key={`petal-${i}`}
            className="absolute top-0"
            style={{
              left: p.left,
              animation: `float-down ${p.duration} ${p.delay} infinite linear`,
            }}
          >
            <SakuraPetal size={p.size} />
          </div>
        ))}

        {/* Hearts floating up */}
        {HEARTS.map((h, i) => (
          <div
            key={`heart-${i}`}
            className="absolute"
            style={{
              left: h.left,
              bottom: h.bottom,
              animation: `float-up ${h.duration} ${h.delay} infinite ease-in-out`,
            }}
          >
            <HeartIcon size={h.size} />
          </div>
        ))}

        {/* Sparkles twinkling */}
        {SPARKLES.map((s, i) => (
          <div
            key={`sparkle-${i}`}
            className="absolute"
            style={{
              top: s.top,
              left: (s as { left?: string }).left,
              right: (s as { right?: string }).right,
              animation: `twinkle ${s.duration} ${s.delay} infinite ease-in-out`,
            }}
          >
            <SparkleIcon size={s.size} />
          </div>
        ))}

        {/* Side flowers */}
        {FLOWERS.map((f, i) => (
          <div
            key={`flower-${i}`}
            className="absolute opacity-60"
            style={{
              top: f.top,
              left: f.left,
              right: f.right,
              animation: `twinkle ${f.duration} ${f.delay} infinite ease-in-out`,
            }}
          >
            <CuteFlower size={f.size} />
          </div>
        ))}
      </div>

      {/* Pixel cat — fixed bottom-right, slightly interactive feel */}
      <div
        className="fixed bottom-20 right-4 z-50 pointer-events-none select-none"
        style={{ animation: 'cat-idle 3s ease-in-out infinite' }}
        aria-hidden="true"
      >
        <div className="relative">
          {/* Speech bubble */}
          <div className="absolute -top-10 -left-14 bg-white/90 border border-pink-200 rounded-xl px-2 py-1 text-[10px] font-bold text-pink-500 whitespace-nowrap shadow-sm"
            style={{ animation: 'heart-beat 2s ease-in-out infinite' }}
          >
            ʕ•ᴥ•ʔ 頑張れ！
          </div>
          <PixelCat />
        </div>
      </div>
    </>
  )
}
