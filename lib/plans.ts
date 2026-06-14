// ============================================================
// Plans & Subscription Configuration
// ============================================================

export type PlanId =
  | 'monthly' // legacy
  | 'yearly'  // legacy
  | 'math_1day'
  | 'math_3days'
  | 'math_1week'
  | 'math_monthly'
  | 'math_3months'
  | 'math_yearly'
  | 'english_1day'
  | 'english_3days'
  | 'english_1week'
  | 'english_monthly'
  | 'english_3months'
  | 'english_yearly'
  | 'combo_1day'
  | 'combo_3days'
  | 'combo_1week'
  | 'combo_monthly'
  | 'combo_3months'
  | 'combo_yearly'

export interface VipPlanConfig {
  id: PlanId
  name: string
  displayName: string
  costPoints: number
  durationDays: number
  solveLimit: number // -1 = unlimited
  model: string
  modelLabel: string
  subjects: ('math' | 'english')[]
  vipPlanValue: 'math_vip' | 'english_vip' | 'combo_vip'
}

export const FREE_SOLVE_LIMIT = 3
export const FREE_MODEL = 'google/gemini-2.5-flash-lite'
export const FREE_MODEL_LABEL = 'Gemini 2.5 Flash Lite'

export const VIP_PLANS: Record<PlanId, VipPlanConfig> = {
  // Legacy fallback
  monthly: {
    id: 'monthly',
    name: '1 Tháng',
    displayName: 'Toán + Anh — 1 Tháng',
    costPoints: 129,
    durationDays: 30,
    solveLimit: -1,
    model: 'google/gemini-2.5-flash',
    modelLabel: 'Gemini 2.5 Flash',
    subjects: ['math', 'english'],
    vipPlanValue: 'combo_vip',
  },
  yearly: {
    id: 'yearly',
    name: '1 Năm',
    displayName: 'Toán + Anh — 1 Năm',
    costPoints: 699,
    durationDays: 365,
    solveLimit: -1,
    model: 'google/gemini-2.5-flash',
    modelLabel: 'Gemini 2.5 Flash',
    subjects: ['math', 'english'],
    vipPlanValue: 'combo_vip',
  },

  // ---- Toán VIP ----
  math_1day: {
    id: 'math_1day',
    name: '1 Ngày',
    displayName: 'Toán VIP — 1 Ngày',
    costPoints: 9,
    durationDays: 1,
    solveLimit: 20,
    model: 'google/gemini-2.5-flash-lite',
    modelLabel: 'Gemini 2.5 Flash Lite',
    subjects: ['math'],
    vipPlanValue: 'math_vip',
  },
  math_3days: {
    id: 'math_3days',
    name: '3 Ngày',
    displayName: 'Toán VIP — 3 Ngày',
    costPoints: 19,
    durationDays: 3,
    solveLimit: 25,
    model: 'google/gemini-2.5-flash-lite',
    modelLabel: 'Gemini 2.5 Flash Lite',
    subjects: ['math'],
    vipPlanValue: 'math_vip',
  },
  math_1week: {
    id: 'math_1week',
    name: '1 Tuần',
    displayName: 'Toán VIP — 1 Tuần',
    costPoints: 39,
    durationDays: 7,
    solveLimit: 30,
    model: 'google/gemini-2.5-flash-lite',
    modelLabel: 'Gemini 2.5 Flash Lite',
    subjects: ['math'],
    vipPlanValue: 'math_vip',
  },
  math_monthly: {
    id: 'math_monthly',
    name: '1 Tháng',
    displayName: 'Toán VIP — 1 Tháng',
    costPoints: 79,
    durationDays: 30,
    solveLimit: -1,
    model: 'google/gemini-2.5-flash',
    modelLabel: 'Gemini 2.5 Flash',
    subjects: ['math'],
    vipPlanValue: 'math_vip',
  },
  math_3months: {
    id: 'math_3months',
    name: '3 Tháng',
    displayName: 'Toán VIP — 3 Tháng',
    costPoints: 169,
    durationDays: 90,
    solveLimit: -1,
    model: 'google/gemini-2.5-flash',
    modelLabel: 'Gemini 2.5 Flash',
    subjects: ['math'],
    vipPlanValue: 'math_vip',
  },
  math_yearly: {
    id: 'math_yearly',
    name: '1 Năm',
    displayName: 'Toán VIP — 1 Năm',
    costPoints: 399,
    durationDays: 365,
    solveLimit: -1,
    model: 'google/gemini-2.5-flash',
    modelLabel: 'Gemini 2.5 Flash',
    subjects: ['math'],
    vipPlanValue: 'math_vip',
  },

  // ---- Anh VIP ----
  // Anh VIP không mở Giải toán AI: giải toán giữ mức Free (Lite, 3 lượt/ngày).
  english_1day: {
    id: 'english_1day',
    name: '1 Ngày',
    displayName: 'Anh VIP — 1 Ngày',
    costPoints: 9,
    durationDays: 1,
    solveLimit: FREE_SOLVE_LIMIT,
    model: FREE_MODEL,
    modelLabel: FREE_MODEL_LABEL,
    subjects: ['english'],
    vipPlanValue: 'english_vip',
  },
  english_3days: {
    id: 'english_3days',
    name: '3 Ngày',
    displayName: 'Anh VIP — 3 Ngày',
    costPoints: 19,
    durationDays: 3,
    solveLimit: FREE_SOLVE_LIMIT,
    model: FREE_MODEL,
    modelLabel: FREE_MODEL_LABEL,
    subjects: ['english'],
    vipPlanValue: 'english_vip',
  },
  english_1week: {
    id: 'english_1week',
    name: '1 Tuần',
    displayName: 'Anh VIP — 1 Tuần',
    costPoints: 39,
    durationDays: 7,
    solveLimit: FREE_SOLVE_LIMIT,
    model: FREE_MODEL,
    modelLabel: FREE_MODEL_LABEL,
    subjects: ['english'],
    vipPlanValue: 'english_vip',
  },
  english_monthly: {
    id: 'english_monthly',
    name: '1 Tháng',
    displayName: 'Anh VIP — 1 Tháng',
    costPoints: 79,
    durationDays: 30,
    solveLimit: FREE_SOLVE_LIMIT,
    model: FREE_MODEL,
    modelLabel: FREE_MODEL_LABEL,
    subjects: ['english'],
    vipPlanValue: 'english_vip',
  },
  english_3months: {
    id: 'english_3months',
    name: '3 Tháng',
    displayName: 'Anh VIP — 3 Tháng',
    costPoints: 169,
    durationDays: 90,
    solveLimit: FREE_SOLVE_LIMIT,
    model: FREE_MODEL,
    modelLabel: FREE_MODEL_LABEL,
    subjects: ['english'],
    vipPlanValue: 'english_vip',
  },
  english_yearly: {
    id: 'english_yearly',
    name: '1 Năm',
    displayName: 'Anh VIP — 1 Năm',
    costPoints: 399,
    durationDays: 365,
    solveLimit: FREE_SOLVE_LIMIT,
    model: FREE_MODEL,
    modelLabel: FREE_MODEL_LABEL,
    subjects: ['english'],
    vipPlanValue: 'english_vip',
  },

  // ---- Combo Toán + Anh ----
  combo_1day: {
    id: 'combo_1day',
    name: '1 Ngày',
    displayName: 'Combo Toán+Anh — 1 Ngày',
    costPoints: 15,
    durationDays: 1,
    solveLimit: 20,
    model: 'google/gemini-2.5-flash-lite',
    modelLabel: 'Gemini 2.5 Flash Lite',
    subjects: ['math', 'english'],
    vipPlanValue: 'combo_vip',
  },
  combo_3days: {
    id: 'combo_3days',
    name: '3 Ngày',
    displayName: 'Combo Toán+Anh — 3 Ngày',
    costPoints: 29,
    durationDays: 3,
    solveLimit: 25,
    model: 'google/gemini-2.5-flash-lite',
    modelLabel: 'Gemini 2.5 Flash Lite',
    subjects: ['math', 'english'],
    vipPlanValue: 'combo_vip',
  },
  combo_1week: {
    id: 'combo_1week',
    name: '1 Tuần',
    displayName: 'Combo Toán+Anh — 1 Tuần',
    costPoints: 49,
    durationDays: 7,
    solveLimit: 30,
    model: 'google/gemini-2.5-flash-lite',
    modelLabel: 'Gemini 2.5 Flash Lite',
    subjects: ['math', 'english'],
    vipPlanValue: 'combo_vip',
  },
  combo_monthly: {
    id: 'combo_monthly',
    name: '1 Tháng',
    displayName: 'Combo Toán+Anh — 1 Tháng',
    costPoints: 129,
    durationDays: 30,
    solveLimit: -1,
    model: 'google/gemini-2.5-flash',
    modelLabel: 'Gemini 2.5 Flash',
    subjects: ['math', 'english'],
    vipPlanValue: 'combo_vip',
  },
  combo_3months: {
    id: 'combo_3months',
    name: '3 Tháng',
    displayName: 'Combo Toán+Anh — 3 Tháng',
    costPoints: 279,
    durationDays: 90,
    solveLimit: -1,
    model: 'google/gemini-2.5-flash',
    modelLabel: 'Gemini 2.5 Flash',
    subjects: ['math', 'english'],
    vipPlanValue: 'combo_vip',
  },
  combo_yearly: {
    id: 'combo_yearly',
    name: '1 Năm',
    displayName: 'Combo Toán+Anh — 1 Năm',
    costPoints: 699,
    durationDays: 365,
    solveLimit: -1,
    model: 'google/gemini-2.5-flash',
    modelLabel: 'Gemini 2.5 Flash',
    subjects: ['math', 'english'],
    vipPlanValue: 'combo_vip',
  },
}

export const PLAN_IDS = Object.keys(VIP_PLANS) as PlanId[]

export function isPlanId(value: unknown): value is PlanId {
  return typeof value === 'string' && value in VIP_PLANS
}

export function getPlanCost(planId: PlanId): number {
  return VIP_PLANS[planId]?.costPoints ?? 0
}

export function getPlanName(planId: PlanId): string {
  return VIP_PLANS[planId]?.name ?? ''
}

const FLASH_MODEL = 'google/gemini-2.5-flash'
const FLASH_MODEL_LABEL = 'Gemini 2.5 Flash'

const FREE_SOLVE_CONFIG = { model: FREE_MODEL, limit: FREE_SOLVE_LIMIT, label: FREE_MODEL_LABEL }

/**
 * Suy ra môn (subject) từ một planId granular ('math_monthly' -> 'math_vip') hoặc
 * từ chính giá trị subject/legacy đã lưu trong DB.
 */
export function subjectFromPlanId(
  planId?: string | null
): 'math_vip' | 'english_vip' | 'combo_vip' | null {
  if (!planId) return null
  if (planId === 'math_vip' || planId === 'english_vip' || planId === 'combo_vip') return planId
  const config = VIP_PLANS[planId as PlanId]
  return config?.vipPlanValue ?? null
}

/**
 * Nguồn sự thật duy nhất cho cấu hình Giải toán AI (model + hạn mức/ngày).
 * - Không VIP → Free (Lite, 3).
 * - Anh VIP → giải toán giữ mức Free (Lite, 3).
 * - Toán/Combo → tra granular plan để lấy đúng tier (Lite + 20/25/30 cho gói ngắn,
 *   Flash + unlimited cho tháng trở lên). Fallback: dữ liệu cũ chỉ lưu subject/legacy
 *   → math/combo dùng Flash unlimited.
 */
export function getSolveConfig(opts: {
  plan?: string | null // subject (users.plan)
  vipPlanId?: string | null // granular (users.vip_plan)
  isVip: boolean
  vipExpiresAt?: string | null
}): { model: string; limit: number; label: string } {
  if (!opts.isVip) return { ...FREE_SOLVE_CONFIG }

  const subject = subjectFromPlanId(opts.plan) ?? subjectFromPlanId(opts.vipPlanId)
  if (subject === 'english_vip') return { ...FREE_SOLVE_CONFIG }

  // Granular plan → đúng model + limit theo thời hạn đã mua.
  const granular = opts.vipPlanId ? VIP_PLANS[opts.vipPlanId as PlanId] : undefined
  if (granular) {
    return { model: granular.model, limit: granular.solveLimit, label: granular.modelLabel }
  }

  // Fallback legacy (chỉ lưu subject 'math_vip'/'combo_vip' hoặc null): Flash unlimited.
  return { model: FLASH_MODEL, limit: -1, label: FLASH_MODEL_LABEL }
}

// ============================================================
// New Subject-based Plans (Toán / Anh / Combo) - For landing page mock
// ============================================================

export interface SubjectPlanConfig {
  id: string
  displayName: string
  priceVnd: number
  pricePerMonth: number
  durationDays: number
  subjects: ('math' | 'english')[]
  badge?: string
  savingVnd?: number
  features: string[]
}

export const SUBJECT_PLANS: Record<string, SubjectPlanConfig> = {
  free: {
    id: 'free',
    displayName: 'Miễn phí',
    priceVnd: 0,
    pricePerMonth: 0,
    durationDays: 0,
    subjects: [],
    features: [
      '30 câu luyện tập / ngày',
      'Flashcard cơ bản',
      'Popup từ điển',
      '5 lượt AI tạo từ vựng / tháng',
      '3 lượt Giải toán AI / ngày',
    ],
  },
  combo_monthly: {
    id: 'combo_monthly',
    displayName: 'Combo Toán + Anh — 1 Tháng',
    priceVnd: 129000,
    pricePerMonth: 129000,
    durationDays: 30,
    subjects: ['math', 'english'],
    badge: 'Phổ biến',
    features: [
      'Toàn bộ tính năng Toán VIP',
      'Toàn bộ tính năng Anh VIP',
      'Tiết kiệm 29.000đ so với mua riêng',
    ],
  },
  combo_6months: {
    id: 'combo_6months',
    displayName: 'Combo Toán + Anh — 3 Tháng',
    priceVnd: 279000,
    pricePerMonth: Math.round(279000 / 3),
    durationDays: 90,
    subjects: ['math', 'english'],
    badge: 'Khuyên dùng',
    features: [
      'Toàn bộ tính năng Combo tháng',
      '~93,000đ / tháng',
      'Tiết kiệm 108,000đ so với mua lẻ từng tháng',
    ],
  },
}

// --- Feature gate helpers ---

export interface PlanLimits {
  mathPracticeUnlimited: boolean
  englishVocabUnlimited: boolean
  aiVocabPerMonth: number       // -1 = unlimited
  spacedRepetition: boolean
  communityPublish: boolean
  examUnlimited: boolean
  vocabSetsMax: number          // -1 = unlimited
}

// Lưu ý: hạn mức Giải toán AI KHÔNG nằm ở đây — dùng getSolveConfig() (theo granular plan).
export const PLAN_LIMITS: Record<string, PlanLimits> = {
  free: {
    mathPracticeUnlimited: false,
    englishVocabUnlimited: false,
    aiVocabPerMonth: 5,
    spacedRepetition: false,
    communityPublish: false,
    examUnlimited: false,
    vocabSetsMax: 3,
  },
  math_vip: {
    mathPracticeUnlimited: true,
    englishVocabUnlimited: false,
    aiVocabPerMonth: 5,
    spacedRepetition: false,
    communityPublish: false,
    examUnlimited: true,
    vocabSetsMax: 3,
  },
  english_vip: {
    mathPracticeUnlimited: false,
    englishVocabUnlimited: true,
    aiVocabPerMonth: -1, // English VIP has unlimited AI vocab
    spacedRepetition: true,
    communityPublish: true,
    examUnlimited: false,
    vocabSetsMax: -1,
  },
  combo_vip: {
    mathPracticeUnlimited: true,
    englishVocabUnlimited: true,
    aiVocabPerMonth: -1,
    spacedRepetition: true,
    communityPublish: true,
    examUnlimited: true,
    vocabSetsMax: -1,
  },
}

export function getPlanLimits(plan: string | null | undefined): PlanLimits {
  // Chuẩn hoá giá trị legacy (gói cũ 'monthly'/'yearly' = Combo) về subject tương ứng.
  const key = plan === 'monthly' || plan === 'yearly' ? 'combo_vip' : plan
  return PLAN_LIMITS[key ?? 'free'] ?? PLAN_LIMITS['free']
}

export function hasMathAccess(plan: string | null | undefined, isVip: boolean): boolean {
  if (isVip && (!plan || plan === 'monthly' || plan === 'yearly')) return true // backward compat
  return plan === 'math_vip' || plan === 'combo_vip'
}

export function hasEnglishAccess(plan: string | null | undefined): boolean {
  if (!plan) return false
  return plan === 'english_vip' || plan === 'combo_vip'
}
