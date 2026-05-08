'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TimerProps {
  totalSeconds: number
  onExpire: () => void
  isPaused?: boolean
}

export default function Timer({ totalSeconds, onExpire, isPaused = false }: TimerProps) {
  const [remaining, setRemaining] = useState(totalSeconds)

  useEffect(() => {
    if (isPaused || remaining <= 0) return
    const id = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(id)
          onExpire()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [isPaused, remaining, onExpire])

  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60
  const isUrgent = remaining < 600
  const progress = (remaining / totalSeconds) * 100

  return (
    <motion.div
      animate={isUrgent ? { scale: [1, 1.02, 1] } : {}}
      transition={{ repeat: Infinity, duration: 1.5 }}
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono font-bold text-sm border',
        isUrgent
          ? 'bg-red-500/10 text-red-500 border-red-500/30'
          : 'bg-muted text-foreground border-border'
      )}
    >
      <Clock className={cn('h-4 w-4', isUrgent && 'animate-pulse')} />
      <span>
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
    </motion.div>
  )
}
