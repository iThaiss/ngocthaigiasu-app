'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

function SakuraPetal({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <ellipse cx="10" cy="10" rx="4" ry="8" fill="#fda4af" opacity="0.5" transform="rotate(-30 10 10)" />
      <ellipse cx="10" cy="10" rx="4" ry="8" fill="#fb7185" opacity="0.35" transform="rotate(30 10 10)" />
      <circle cx="10" cy="10" r="2" fill="#fecdd3" opacity="0.7" />
    </svg>
  )
}

function SparkleIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#f9a8d4" opacity="0.6">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
    </svg>
  )
}

function PixelCat() {
  return (
    <svg viewBox="0 0 24 24" width="56" height="56" style={{ imageRendering: 'pixelated' }}>
      <rect x="3" y="1" width="4" height="5" fill="#f9a8d4" />
      <rect x="17" y="1" width="4" height="5" fill="#f9a8d4" />
      <rect x="4" y="2" width="2" height="3" fill="#fce7f3" />
      <rect x="18" y="2" width="2" height="3" fill="#fce7f3" />
      <rect x="3" y="5" width="18" height="11" rx="2" fill="white" />
      <rect x="6" y="8" width="3" height="3" rx="1" fill="#1e1b4b" />
      <rect x="15" y="8" width="3" height="3" rx="1" fill="#1e1b4b" />
      <rect x="7" y="9" width="1" height="1" fill="white" />
      <rect x="16" y="9" width="1" height="1" fill="white" />
      <rect x="11" y="11" width="2" height="1" rx="0.5" fill="#f9a8d4" />
      <rect x="4" y="11" width="5" height="0.5" fill="#d1d5db" />
      <rect x="15" y="11" width="5" height="0.5" fill="#d1d5db" />
      <rect x="4" y="12" width="5" height="0.5" fill="#d1d5db" />
      <rect x="15" y="12" width="5" height="0.5" fill="#d1d5db" />
      <rect x="10" y="12" width="1" height="1" fill="#f9a8d4" />
      <rect x="13" y="12" width="1" height="1" fill="#f9a8d4" />
      <rect x="5" y="15" width="14" height="8" rx="3" fill="white" />
      <rect x="5" y="21" width="4" height="3" rx="2" fill="#fce7f3" />
      <rect x="15" y="21" width="4" height="3" rx="2" fill="#fce7f3" />
      <rect x="19" y="17" width="3" height="7" rx="1.5" fill="#f9a8d4" />
      <rect x="5" y="10" width="3" height="2" rx="1" fill="#fda4af" opacity="0.4" />
      <rect x="16" y="10" width="3" height="2" rx="1" fill="#fda4af" opacity="0.4" />
    </svg>
  )
}

// 6 petals, spread across screen, slow & subtle
const PETALS = [
  { left: '8%',  delay: '0s',   duration: '14s', size: 16 },
  { left: '22%', delay: '4s',   duration: '18s', size: 12 },
  { left: '40%', delay: '8s',   duration: '16s', size: 14 },
  { left: '58%', delay: '2s',   duration: '20s', size: 10 },
  { left: '75%', delay: '11s',  duration: '15s', size: 16 },
  { left: '90%', delay: '6s',   duration: '17s', size: 12 },
]

// 2 sparkles — only at top corners, very subtle
const SPARKLES = [
  { top: '6%',  left: '2%',   size: 14, delay: '0s',   duration: '4s' },
  { top: '10%', right: '3%',  size: 12, delay: '2s',   duration: '5s' },
]

export default function PinkThemeDecorations() {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  if (!mounted || theme !== 'pink') return null

  return (
    <>
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-40" aria-hidden="true">
        {PETALS.map((p, i) => (
          <div
            key={`petal-${i}`}
            className="absolute top-0"
            style={{ left: p.left, animation: `float-down ${p.duration} ${p.delay} infinite linear` }}
          >
            <SakuraPetal size={p.size} />
          </div>
        ))}

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
      </div>

      {/* Pixel cat — fixed bottom-right */}
      <div
        className="fixed bottom-20 right-4 z-50 pointer-events-none select-none"
        style={{ animation: 'cat-idle 4s ease-in-out infinite' }}
        aria-hidden="true"
      >
        <div className="relative">
          <div className="absolute -top-8 -left-16 bg-white/90 border border-pink-200 rounded-xl px-2 py-1 text-[10px] font-bold text-pink-500 whitespace-nowrap shadow-sm">
ʕ•ᴥ•ʔ Cố lên!
          </div>
          <PixelCat />
        </div>
      </div>
    </>
  )
}
