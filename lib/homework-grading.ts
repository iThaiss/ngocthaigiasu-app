// Chấm điểm BTVN (Live). Đề nằm trong file PDF/Drive; ở đây chỉ chấm bảng đáp án.
// 3 loại: multiple_choice (A/B/C/D), true_false (mảng boolean theo ý a–d), short_answer (số).

export type HomeworkSlotType = 'multiple_choice' | 'true_false' | 'short_answer'

export interface HomeworkSlot {
  stt: number
  type: HomeworkSlotType
  correct: string | boolean[] | null // MCQ: 'A'..; TF: [true,false,..]; SA: '3.14'
}

// Slot gửi cho học sinh — đã bỏ đáp án đúng
export interface PublicHomeworkSlot {
  stt: number
  type: HomeworkSlotType
  statementCount?: number // chỉ với true_false
}

export interface GradedAnswer {
  stt: number
  type: HomeworkSlotType
  answer: string | boolean[] | null
  correct: boolean
  correctAnswer: string | boolean[] | null
  points: number
  maxPoints: number
}

export interface HomeworkGradeResult {
  results: GradedAnswer[]
  score: number
  maxScore: number
  correctCount: number
  totalCount: number
}

// Điểm thành phần đúng/sai kiểu THPT: 1 ý đúng=0.1, 2=0.25, 3=0.5, 4=1.0
const TF_SCORE: Record<number, number> = { 0: 0, 1: 0.1, 2: 0.25, 3: 0.5, 4: 1.0 }

function parseNum(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value !== 'string') return Number.NaN
  return Number(value.replace(',', '.').trim())
}

export function publicSlots(answerKey: HomeworkSlot[]): PublicHomeworkSlot[] {
  return (answerKey ?? []).map((slot) => ({
    stt: slot.stt,
    type: slot.type,
    ...(slot.type === 'true_false'
      ? { statementCount: Array.isArray(slot.correct) ? slot.correct.length : 4 }
      : {}),
  }))
}

export function gradeHomework(
  answerKey: HomeworkSlot[],
  studentAnswers: Record<string, unknown>, // map theo stt -> answer
): HomeworkGradeResult {
  const results: GradedAnswer[] = []
  let score = 0
  let maxScore = 0
  let correctCount = 0

  for (const slot of answerKey ?? []) {
    const raw = studentAnswers?.[String(slot.stt)]
    let correct = false
    let points = 0
    const maxPoints = 1

    if (slot.type === 'multiple_choice') {
      const a = typeof raw === 'string' ? raw.trim().toUpperCase() : ''
      const c = typeof slot.correct === 'string' ? slot.correct.trim().toUpperCase() : ''
      correct = !!a && a === c
      points = correct ? maxPoints : 0
    } else if (slot.type === 'short_answer') {
      const a = parseNum(raw)
      const c = parseNum(slot.correct)
      correct = Number.isFinite(a) && Number.isFinite(c) && Math.abs(a - c) <= 0.01
      points = correct ? maxPoints : 0
    } else if (slot.type === 'true_false') {
      const key = Array.isArray(slot.correct) ? slot.correct : []
      const ans = Array.isArray(raw) ? raw : []
      const nCorrect = key.reduce((acc, v, i) => acc + (ans[i] === v ? 1 : 0), 0)
      correct = key.length > 0 && nCorrect === key.length
      points = TF_SCORE[nCorrect] ?? (correct ? 1 : 0)
    }

    if (correct) correctCount += 1
    score += points
    maxScore += maxPoints
    results.push({
      stt: slot.stt,
      type: slot.type,
      answer: (raw ?? null) as string | boolean[] | null,
      correct,
      correctAnswer: slot.correct,
      points,
      maxPoints,
    })
  }

  return {
    results,
    score: Math.round(score * 100) / 100,
    maxScore,
    correctCount,
    totalCount: (answerKey ?? []).length,
  }
}
