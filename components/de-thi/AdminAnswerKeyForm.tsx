'use client'

import { useState } from 'react'
import { Save, Loader2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'

interface ExamQuestion {
  question_number: number
  part: 'part_1' | 'part_2' | 'part_3'
  question_type: 'multiple_choice' | 'true_false' | 'short_answer'
  correct_answer: string | null
  max_score: number
  scoring_rule: Record<string, unknown> | null
}

interface AdminAnswerKeyFormProps {
  examId: string
  questions: ExamQuestion[]
  solutionUrl?: string | null
  handwrittenUrl?: string | null
  onSaved?: () => void
}

const PART_LABELS: Record<string, string> = {
  part_1: 'Phần I — Trắc nghiệm (A/B/C/D)',
  part_2: 'Phần II — Đúng/Sai',
  part_3: 'Phần III — Điền số',
}

function getPartDisplayNum(questions: ExamQuestion[], questionNum: number): number {
  const q = questions.find((x) => x.question_number === questionNum)
  if (!q) return questionNum
  const partQs = questions.filter((x) => x.part === q.part)
  return partQs.findIndex((x) => x.question_number === questionNum) + 1
}

function parseTf(v: string | null): Record<string, boolean | null> {
  if (!v) return { a: null, b: null, c: null, d: null }
  try { return { ...{ a: null, b: null, c: null, d: null }, ...JSON.parse(v) } }
  catch { return { a: null, b: null, c: null, d: null } }
}

export default function AdminAnswerKeyForm({
  examId, questions, solutionUrl: initSolutionUrl, handwrittenUrl: initHandwrittenUrl, onSaved,
}: AdminAnswerKeyFormProps) {
  const [answers, setAnswers] = useState<Record<number, string | null>>(
    Object.fromEntries(questions.map((q) => [q.question_number, q.correct_answer]))
  )
  const [solutionUrl, setSolutionUrl] = useState(initSolutionUrl ?? '')
  const [handwrittenUrl, setHandwrittenUrl] = useState(initHandwrittenUrl ?? '')
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const parts = ['part_1', 'part_2', 'part_3'] as const

  const setMc = (num: number, val: string) => setAnswers((prev) => ({ ...prev, [num]: val }))
  const setSa = (num: number, val: string) => setAnswers((prev) => ({ ...prev, [num]: val || null }))
  const setTfKey = (num: number, key: string, val: boolean) => {
    setAnswers((prev) => {
      const cur = parseTf(prev[num] ?? null)
      const next = { ...cur, [key]: val }
      return { ...prev, [num]: JSON.stringify(next) }
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const rows = questions.map((q) => ({
        ...q,
        correct_answer: answers[q.question_number] ?? null,
      }))

      const [qRes, examRes] = await Promise.all([
        fetch(`/api/admin/de-thi/${examId}/questions`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questions: rows }),
        }),
        fetch(`/api/admin/de-thi/${examId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            solution_url: solutionUrl.trim() || null,
            handwritten_url: handwrittenUrl.trim() || null,
          }),
        }),
      ])

      if (!qRes.ok) throw new Error((await qRes.json()).error)
      if (!examRes.ok) throw new Error((await examRes.json()).error)

      toast({ title: 'Đã lưu đáp án và liên kết', variant: 'success' as never })
      onSaved?.()
    } catch (e) {
      toast({ title: 'Lỗi lưu', description: String(e), variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Link xem giải */}
      <div className="rounded-md border bg-muted/30 p-4 space-y-3">
        <p className="text-sm font-semibold flex items-center gap-2">
          <ExternalLink className="h-4 w-4" /> Liên kết tài liệu
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Link xem giải chi tiết</label>
            <input
              type="url"
              value={solutionUrl}
              onChange={(e) => setSolutionUrl(e.target.value)}
              placeholder="https://drive.google.com/..."
              className="h-9 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Link bản giải viết tay</label>
            <input
              type="url"
              value={handwrittenUrl}
              onChange={(e) => setHandwrittenUrl(e.target.value)}
              placeholder="https://drive.google.com/..."
              className="h-9 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      </div>

      {/* Đáp án từng phần */}
      {parts.map((part) => {
        const qs = questions.filter((q) => q.part === part)
        if (!qs.length) return null
        return (
          <div key={part} className="space-y-3">
            <p className="text-sm font-semibold">{PART_LABELS[part]}</p>
            <div className="space-y-2">
              {qs.map((q) => {
                const dispNum = getPartDisplayNum(questions, q.question_number)
                return (
                  <div key={q.question_number} className="flex items-start gap-3 rounded-md border p-3">
                    <span className="text-sm font-medium text-muted-foreground w-14 shrink-0 pt-1">
                      Câu {dispNum}
                    </span>

                    {q.question_type === 'multiple_choice' && (
                      <div className="flex gap-2 flex-wrap">
                        {['A', 'B', 'C', 'D'].map((label) => {
                          const selected = answers[q.question_number] === label
                          return (
                            <button
                              key={label}
                              type="button"
                              onClick={() => setMc(q.question_number, label)}
                              className={`h-8 w-9 rounded border text-sm font-bold transition-colors ${
                                selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/50'
                              }`}
                            >
                              {label}
                            </button>
                          )
                        })}
                        {answers[q.question_number] && (
                          <button
                            type="button"
                            onClick={() => setAnswers((prev) => ({ ...prev, [q.question_number]: null }))}
                            className="h-8 px-2 rounded border border-dashed text-xs text-muted-foreground hover:text-destructive"
                          >
                            Xóa
                          </button>
                        )}
                      </div>
                    )}

                    {q.question_type === 'true_false' && (
                      <div className="grid grid-cols-2 gap-2 flex-1">
                        {['a', 'b', 'c', 'd'].map((key) => {
                          const cur = parseTf(answers[q.question_number] ?? null)[key]
                          return (
                            <div key={key} className="flex items-center gap-2">
                              <span className="text-xs font-medium uppercase w-3">{key}</span>
                              <div className="flex gap-1">
                                {[true, false].map((val) => (
                                  <button
                                    key={String(val)}
                                    type="button"
                                    onClick={() => setTfKey(q.question_number, key, val)}
                                    className={`h-7 px-2 rounded border text-xs transition-colors ${
                                      cur === val
                                        ? val ? 'border-green-500 bg-green-500/15 text-green-700 dark:text-green-300'
                                               : 'border-red-500 bg-red-500/15 text-red-700 dark:text-red-300'
                                        : 'border-border hover:bg-accent'
                                    }`}
                                  >
                                    {val ? 'Đ' : 'S'}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {q.question_type === 'short_answer' && (
                      <input
                        type="text"
                        value={answers[q.question_number] ?? ''}
                        onChange={(e) => setSa(q.question_number, e.target.value)}
                        placeholder="Đáp số..."
                        className="h-8 w-32 rounded-md border bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                      />
                    )}

                    <Badge variant="outline" className="ml-auto text-xs shrink-0">
                      {q.max_score}đ
                    </Badge>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      <div className="flex justify-end pt-2">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Lưu đáp án
        </Button>
      </div>
    </div>
  )
}
