export interface ExamQuestion {
  question_number: number
  part: 'part_1' | 'part_2' | 'part_3'
  question_type: 'multiple_choice' | 'true_false' | 'short_answer'
  correct_answer: string | null
  max_score: number
  scoring_rule: Record<string, unknown> | null
}

// TF answer stored as JSON string: '{"a":true,"b":false,"c":true,"d":false}'
function parseTfAnswer(value: string | undefined): Record<string, boolean> {
  if (!value) return {}
  try { return JSON.parse(value) as Record<string, boolean> } catch { return {} }
}

function parseNumber(value: string | null | undefined): number {
  if (!value) return NaN
  return parseFloat(value.replace(',', '.').trim())
}

export function scoreQuestion(question: ExamQuestion, answer: string | undefined): number {
  if (answer === undefined || answer === '' || question.correct_answer === null) return 0

  if (question.question_type === 'multiple_choice') {
    return answer.toUpperCase() === question.correct_answer.toUpperCase() ? question.max_score : 0
  }

  if (question.question_type === 'short_answer') {
    const user = parseNumber(answer)
    const correct = parseNumber(question.correct_answer)
    if (isNaN(user) || isNaN(correct)) return 0
    return Math.abs(user - correct) <= 0.01 ? question.max_score : 0
  }

  // true_false: count how many sub-answers match
  if (question.question_type === 'true_false') {
    const userAnswers = parseTfAnswer(answer)
    const correctAnswers = parseTfAnswer(question.correct_answer)
    const keys = Object.keys(correctAnswers) // ['a','b','c','d']
    const correctCount = keys.filter((k) => userAnswers[k] === correctAnswers[k]).length

    const rule = question.scoring_rule as { score_by_correct_count?: Record<string, number> } | null
    const table = rule?.score_by_correct_count
    if (table) {
      return Number(table[String(correctCount)] ?? 0)
    }
    // fallback: full marks only if all correct
    return correctCount === keys.length ? question.max_score : 0
  }

  return 0
}

export function scoreExam(questions: ExamQuestion[], answers: Record<number, string>): number {
  return questions.reduce((total, q) => total + scoreQuestion(q, answers[q.question_number]), 0)
}

// Default THPT 2025 structure preset
export const THPT_2025_MATH_PRESET = {
  time_limit_minutes: 90,
  question_count: 22,
  max_score: 10,
  parts: [
    {
      part: 'part_1' as const,
      label: 'Phần I — Trắc nghiệm nhiều lựa chọn',
      question_type: 'multiple_choice' as const,
      count: 12,
      max_score_per_question: 0.25,
      scoring_rule: null,
    },
    {
      part: 'part_2' as const,
      label: 'Phần II — Trắc nghiệm đúng/sai',
      question_type: 'true_false' as const,
      count: 4,
      max_score_per_question: 1,
      scoring_rule: { score_by_correct_count: { '1': 0.1, '2': 0.25, '3': 0.5, '4': 1.0 } },
    },
    {
      part: 'part_3' as const,
      label: 'Phần III — Trả lời ngắn',
      question_type: 'short_answer' as const,
      count: 6,
      max_score_per_question: 0.5,
      scoring_rule: null,
    },
  ],
}

export function generateQuestionsFromPreset(preset: typeof THPT_2025_MATH_PRESET) {
  const questions: Omit<ExamQuestion, 'correct_answer'>[] = []
  let num = 1
  for (const part of preset.parts) {
    for (let i = 0; i < part.count; i++) {
      questions.push({
        question_number: num++,
        part: part.part,
        question_type: part.question_type,
        max_score: part.max_score_per_question,
        scoring_rule: part.scoring_rule,
      })
    }
  }
  return questions
}
