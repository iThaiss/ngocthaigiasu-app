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
  english_1day: {
    id: 'english_1day',
    name: '1 Ngày',
    displayName: 'Anh VIP — 1 Ngày',
    costPoints: 9,
    durationDays: 1,
    solveLimit: 0,
    model: 'google/gemini-2.5-flash-lite',
    modelLabel: 'Gemini 2.5 Flash Lite',
    subjects: ['english'],
    vipPlanValue: 'english_vip',
  },
  english_3days: {
    id: 'english_3days',
    name: '3 Ngày',
    displayName: 'Anh VIP — 3 Ngày',
    costPoints: 19,
    durationDays: 3,
    solveLimit: 0,
    model: 'google/gemini-2.5-flash-lite',
    modelLabel: 'Gemini 2.5 Flash Lite',
    subjects: ['english'],
    vipPlanValue: 'english_vip',
  },
  english_1week: {
    id: 'english_1week',
    name: '1 Tuần',
    displayName: 'Anh VIP — 1 Tuần',
    costPoints: 39,
    durationDays: 7,
    solveLimit: 0,
    model: 'google/gemini-2.5-flash-lite',
    modelLabel: 'Gemini 2.5 Flash Lite',
    subjects: ['english'],
    vipPlanValue: 'english_vip',
  },
  english_monthly: {
    id: 'english_monthly',
    name: '1 Tháng',
    displayName: 'Anh VIP — 1 Tháng',
    costPoints: 79,
    durationDays: 30,
    solveLimit: 0,
    model: 'google/gemini-2.5-flash',
    modelLabel: 'Gemini 2.5 Flash',
    subjects: ['english'],
    vipPlanValue: 'english_vip',
  },
  english_3months: {
    id: 'english_3months',
    name: '3 Tháng',
    displayName: 'Anh VIP — 3 Tháng',
    costPoints: 169,
    durationDays: 90,
    solveLimit: 0,
    model: 'google/gemini-2.5-flash',
    modelLabel: 'Gemini 2.5 Flash',
    subjects: ['english'],
    vipPlanValue: 'english_vip',
  },
  english_yearly: {
    id: 'english_yearly',
    name: '1 Năm',
    displayName: 'Anh VIP — 1 Năm',
    costPoints: 399,
    durationDays: 365,
    solveLimit: 0,
    model: 'google/gemini-2.5-flash',
    modelLabel: 'Gemini 2.5 Flash',
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

export function inferVipPlan(vipExpiresAt?: string | null): PlanId {
  const expiresAt = vipExpiresAt ? new Date(vipExpiresAt) : null
  const daysLeft = expiresAt ? (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24) : 0
  if (daysLeft > 200) return 'combo_yearly'
  if (daysLeft > 60) return 'combo_3months'
  return 'combo_monthly'
}

export function getSolveLimit(isVip: boolean, vipExpiresAt?: string | null): number {
  if (!isVip) return FREE_SOLVE_LIMIT
  return VIP_PLANS[inferVipPlan(vipExpiresAt)]?.solveLimit ?? -1
}

export function getModelConfig(isVip: boolean, vipExpiresAt?: string | null) {
  if (!isVip) return { model: FREE_MODEL, limit: FREE_SOLVE_LIMIT, label: FREE_MODEL_LABEL }
  const plan = VIP_PLANS[inferVipPlan(vipExpiresAt)]
  return { model: plan?.model ?? 'google/gemini-2.5-flash', limit: plan?.solveLimit ?? -1, label: plan?.modelLabel ?? 'Gemini 2.5 Flash' }
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
  solvePerDay: number           // -1 = unlimited
  spacedRepetition: boolean
  communityPublish: boolean
  examUnlimited: boolean
  vocabSetsMax: number          // -1 = unlimited
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  free: {
    mathPracticeUnlimited: false,
    englishVocabUnlimited: false,
    aiVocabPerMonth: 5,
    solvePerDay: FREE_SOLVE_LIMIT,
    spacedRepetition: false,
    communityPublish: false,
    examUnlimited: false,
    vocabSetsMax: 3,
  },
  math_vip: {
    mathPracticeUnlimited: true,
    englishVocabUnlimited: false,
    aiVocabPerMonth: 5,
    solvePerDay: -1,
    spacedRepetition: false,
    communityPublish: false,
    examUnlimited: true,
    vocabSetsMax: 3,
  },
  english_vip: {
    mathPracticeUnlimited: false,
    englishVocabUnlimited: true,
    aiVocabPerMonth: -1, // English VIP has unlimited AI vocab
    solvePerDay: FREE_SOLVE_LIMIT,
    spacedRepetition: true,
    communityPublish: true,
    examUnlimited: false,
    vocabSetsMax: -1,
  },
  combo_vip: {
    mathPracticeUnlimited: true,
    englishVocabUnlimited: true,
    aiVocabPerMonth: -1,
    solvePerDay: -1,
    spacedRepetition: true,
    communityPublish: true,
    examUnlimited: true,
    vocabSetsMax: -1,
  },
}

export function getPlanLimits(plan: string | null | undefined): PlanLimits {
  return PLAN_LIMITS[plan ?? 'free'] ?? PLAN_LIMITS['free']
}

export function hasMathAccess(plan: string | null | undefined, isVip: boolean): boolean {
  if (isVip && (!plan || plan === 'monthly' || plan === 'yearly')) return true // backward compat
  return plan === 'math_vip' || plan === 'combo_vip'
}

export function hasEnglishAccess(plan: string | null | undefined): boolean {
  if (!plan) return false
  return plan === 'english_vip' || plan === 'combo_vip'
}
