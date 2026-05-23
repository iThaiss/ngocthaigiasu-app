type QuestionLike = Record<string, unknown>

function hasText(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0
}

function hasNumber(value: unknown) {
  if (typeof value === 'number') return Number.isFinite(value)
  if (typeof value !== 'string' || !value.trim()) return false
  return Number.isFinite(Number(value))
}

export function hasRequiredAnswer(question: QuestionLike | null | undefined) {
  if (!question) return false

  const type = typeof question.question_type === 'string' ? question.question_type : ''
  if (type === 'multiple_choice') return hasText(question.correct_answer)
  if (type === 'short_answer') return hasNumber(question.numeric_answer) || hasText(question.correct_answer)
  if (type === 'true_false') {
    if (hasText(question.correct_answer)) return true

    const directAnswers = [question.answer_a, question.answer_b, question.answer_c, question.answer_d]
    if (directAnswers.some((answer) => typeof answer === 'boolean')) return true

    const statements = Array.isArray(question.statements) ? question.statements : null
    return Boolean(
      statements?.length
      && statements.every((statement) => {
        return Boolean(statement)
          && typeof statement === 'object'
          && typeof (statement as Record<string, unknown>).answer === 'boolean'
      }),
    )
  }

  return hasText(question.correct_answer) || hasNumber(question.numeric_answer)
}

export function hasRequiredVisual(question: QuestionLike | null | undefined) {
  if (!question) return false
  const needsVisual = question.needs_visual === true
  return !needsVisual || hasText(question.visual_image_url) || hasText(question.image_url)
}

export function isQuestionStudentReady(question: QuestionLike | null | undefined) {
  return hasRequiredAnswer(question) && hasRequiredVisual(question)
}
