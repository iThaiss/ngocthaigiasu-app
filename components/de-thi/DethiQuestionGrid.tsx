'use client'

import { cn } from '@/lib/utils'

interface Question {
  question_number: number
  part: 'part_1' | 'part_2' | 'part_3'
}

interface DethiQuestionGridProps {
  questions: Question[]
  current: number
  answered: Set<number>
  onSelect: (index: number) => void
}

const PARTS = ['part_1', 'part_2', 'part_3'] as const
const PART_LABELS: Record<string, string> = {
  part_1: 'Phần I',
  part_2: 'Phần II',
  part_3: 'Phần III',
}

export default function DethiQuestionGrid({ questions, current, answered, onSelect }: DethiQuestionGridProps) {
  const indexed = questions.map((q, i) => ({ ...q, index: i }))

  return (
    <div className="space-y-3">
      {PARTS.map((part) => {
        const partQs = indexed.filter((q) => q.part === part)
        if (!partQs.length) return null
        return (
          <div key={part}>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
              {PART_LABELS[part]}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {partQs.map((q, localIdx) => {
                const isActive = q.index === current
                const isAnswered = answered.has(q.index)
                return (
                  <button
                    key={q.question_number}
                    onClick={() => onSelect(q.index)}
                    className={cn(
                      'h-8 w-8 rounded text-xs font-medium transition-all hover:scale-105',
                      isActive && 'ring-2 ring-primary ring-offset-1',
                      isAnswered && !isActive && 'bg-primary text-primary-foreground',
                      !isAnswered && !isActive && 'bg-muted text-muted-foreground hover:bg-accent',
                      isActive && 'bg-primary/80 text-primary-foreground'
                    )}
                  >
                    {localIdx + 1}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
