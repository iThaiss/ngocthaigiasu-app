'use client'

interface Question {
  question_number: number
  part: string
  question_type: 'multiple_choice' | 'true_false' | 'short_answer'
  max_score: number
}

interface AnswerInputProps {
  question: Question
  value: string | undefined
  onChange: (value: string) => void
  disabled?: boolean
}

function parseTf(value: string | undefined): Record<string, boolean | undefined> {
  if (!value) return {}
  try { return JSON.parse(value) } catch { return {} }
}

export default function AnswerInput({ question, value, onChange, disabled }: AnswerInputProps) {
  if (question.question_type === 'multiple_choice') {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {(['A', 'B', 'C', 'D'] as const).map((label) => {
          const selected = value === label
          return (
            <button
              key={label}
              type="button"
              disabled={disabled}
              onClick={() => onChange(label)}
              className={`h-10 rounded-md border text-sm font-bold transition-colors ${
                selected
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border hover:border-primary/50 hover:bg-accent'
              } ${disabled ? 'cursor-default opacity-70' : ''}`}
            >
              {label}
            </button>
          )
        })}
      </div>
    )
  }

  if (question.question_type === 'true_false') {
    const parsed = parseTf(value)
    const keys = ['a', 'b', 'c', 'd']
    return (
      <div className="space-y-2">
        {keys.map((key, i) => {
          const current = parsed[key]
          return (
            <div key={key} className="flex items-center gap-3 rounded-md border p-3">
              <span className="w-5 text-sm font-bold uppercase text-muted-foreground">{key})</span>
              <div className="flex gap-2 flex-1">
                {[true, false].map((val) => (
                  <button
                    key={String(val)}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      const next = { ...parsed, [key]: val }
                      onChange(JSON.stringify(next))
                    }}
                    className={`flex-1 h-8 rounded border text-xs font-medium transition-colors ${
                      current === val
                        ? val ? 'border-green-500 bg-green-500/15 text-green-700 dark:text-green-300'
                               : 'border-red-500 bg-red-500/15 text-red-700 dark:text-red-300'
                        : 'border-border hover:bg-accent'
                    } ${disabled ? 'cursor-default' : ''}`}
                  >
                    {val ? 'Đúng' : 'Sai'}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  if (question.question_type === 'short_answer') {
    return (
      <input
        type="text"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Nhập đáp số..."
        className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-70"
      />
    )
  }

  return null
}
