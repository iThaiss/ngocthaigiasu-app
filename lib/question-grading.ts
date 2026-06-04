export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer'

export interface QuestionLike {
  id?: unknown
  question_type?: unknown
  correct_answer?: unknown
  numeric_answer?: unknown
  statements?: unknown
  explanation?: unknown
}

export interface GradeResult {
  correct: boolean
  score: number
  maxScore: number
  correctCount?: number
  totalStatements?: number
}

export interface PublicStatement {
  label: string
  text: string
  answer?: boolean
  explanation?: string
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function cleanString(value: unknown) {
  return typeof value === 'string' ? value : value == null ? '' : String(value)
}

function parseNumber(value: unknown) {
  if (typeof value === 'number') return value
  if (typeof value !== 'string') return Number.NaN
  return Number(value.replace(',', '.').trim())
}

function normalizeChoice(value: unknown) {
  return cleanString(value).trim().toUpperCase()
}

function normalizeText(value: unknown) {
  return cleanString(value).trim().replace(/\s+/g, ' ').toLowerCase()
}

export function parseStatements(raw: unknown): PublicStatement[] {
  let value = raw
  if (typeof raw === 'string') {
    try {
      value = JSON.parse(raw)
    } catch {
      return []
    }
  }

  if (!Array.isArray(value)) return []
  return value.map((item) => {
    const statement = asRecord(item)
    return {
      label: cleanString(statement.label).trim(),
      text: cleanString(statement.text),
      answer: typeof statement.answer === 'boolean' ? statement.answer : undefined,
      explanation: typeof statement.explanation === 'string' ? statement.explanation : undefined,
    }
  }).filter((statement) => statement.label && statement.text)
}

export function stripStatementAnswers(raw: unknown, reveal = false): PublicStatement[] | null {
  const statements = parseStatements(raw)
  if (!statements.length) return null

  return statements.map((statement) => ({
    label: statement.label,
    text: statement.text,
    ...(reveal && statement.answer !== undefined ? { answer: statement.answer } : {}),
    ...(reveal && statement.explanation ? { explanation: statement.explanation } : {}),
  }))
}

export function toStudentQuestion<T extends Record<string, unknown>>(question: T, reveal = false) {
  return {
    ...question,
    correct_answer: reveal ? question.correct_answer ?? null : null,
    numeric_answer: reveal ? question.numeric_answer ?? null : null,
    explanation: reveal ? question.explanation ?? null : null,
    statements: stripStatementAnswers(question.statements, reveal),
  }
}

export function gradeQuestion(
  question: QuestionLike,
  answer: unknown,
  maxScore = 1,
  scoringRule?: Record<string, unknown> | null,
): GradeResult {
  const questionType = cleanString(question.question_type) as QuestionType
  const submittedAnswer = cleanString(answer).trim()
  if (!submittedAnswer) return { correct: false, score: 0, maxScore }

  if (questionType === 'multiple_choice') {
    const correct = normalizeChoice(submittedAnswer) === normalizeChoice(question.correct_answer)
    return { correct, score: correct ? maxScore : 0, maxScore }
  }

  if (questionType === 'short_answer') {
    const userValue = parseNumber(submittedAnswer)
    const target = parseNumber(question.numeric_answer)
    const correct = Number.isFinite(userValue) && Number.isFinite(target)
      ? Math.abs(userValue - target) <= 0.01
      : normalizeText(submittedAnswer) === normalizeText(question.correct_answer)
    return { correct, score: correct ? maxScore : 0, maxScore }
  }

  if (questionType === 'true_false') {
    let parsedAnswer: Record<string, unknown> = {}
    try {
      parsedAnswer = JSON.parse(submittedAnswer)
    } catch {
      parsedAnswer = {}
    }

    const statements = parseStatements(question.statements)
    const correctCount = statements.filter((statement) => parsedAnswer[statement.label] === statement.answer).length
    const scoreByCorrect = asRecord(scoringRule?.score_by_correct_statements)
    const score = scoreByCorrect[String(correctCount)] !== undefined
      ? Number(scoreByCorrect[String(correctCount)] ?? 0)
      : correctCount === statements.length ? maxScore : 0

    return {
      correct: statements.length > 0 && correctCount === statements.length,
      score: Number.isFinite(score) ? score : 0,
      maxScore,
      correctCount,
      totalStatements: statements.length,
    }
  }

  return { correct: false, score: 0, maxScore }
}
