'use client'

import { cn } from '@/lib/utils'

interface QuestionGridProps {
  total: number
  current: number
  answered: Set<number>
  onSelect: (index: number) => void
}

export default function QuestionGrid({ total, current, answered, onSelect }: QuestionGridProps) {
  return (
    <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
      {Array.from({ length: total }, (_, i) => {
        const isActive = i === current
        const isAnswered = answered.has(i)
        return (
          <button
            key={i}
            onClick={() => onSelect(i)}
            className={cn(
              'h-8 w-full rounded text-xs font-medium transition-all hover:scale-105',
              isActive && 'ring-2 ring-primary ring-offset-1',
              isAnswered && !isActive ? 'bg-primary text-primary-foreground' : '',
              !isAnswered && !isActive ? 'bg-muted text-muted-foreground hover:bg-accent' : '',
              isActive ? 'bg-primary/80 text-primary-foreground' : ''
            )}
          >
            {i + 1}
          </button>
        )
      })}
    </div>
  )
}
