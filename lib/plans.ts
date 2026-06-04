// ============================================================
// Plans & Subscription Configuration
// ============================================================

// ---- Legacy VIP (Math only) ----
export type PlanId = 'monthly' | 'yearly'

export interface VipPlanConfig {
  id: PlanId
  name: string
  displayName: string
  costPoints: number
  durationDays: number
  solveLimit: number
  model: string
  modelLabel: string
}

export const FREE_SOLVE_LIMIT = 3
export const FREE_MODEL = 'google/gemini-2.0-flash:free'
export const FREE_MODEL_LABEL = 'Gemini Flash'

export const VIP_PLANS: Record<PlanId, VipPlanConfig> = {
  monthly: {
    id: 'monthly',
    name: 'Tháng',
    displayName: 'Gói Tháng',
    costPoints: 69,
    durationDays: 30,
    solveLimit: 20,
    model: 'google/gemini-2.0-flash',
    modelLabel: 'Gemini Flash (VIP Tháng)',
  },
  yearly: {
    id: 'yearly',
    name: 'Năm Học',
    displayName: 'Gói Năm Học',
    costPoints: 699,
    durationDays: 365,
    solveLimit: 50,
    model: 'google/gemini-2.0-flash',
    modelLabel: 'Gemini Flash (VIP Năm)',
  },
}

export const PLAN_IDS = Object.keys(VIP_PLANS) as PlanId[]

export function isPlanId(value: unknown): value is PlanId {
  return value === 'monthly' || value === 'yearly'
}

export function getPlanCost(planId: PlanId): number {
  return VIP_PLANS[planId].costPoints
}

export function getPlanName(planId: PlanId): string {
  return VIP_PLANS[planId].name
}

export function inferVipPlan(vipExpiresAt?: string | null): PlanId {
  const expiresAt = vipExpiresAt ? new Date(vipExpiresAt) : null
  const daysLeft = expiresAt ? (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24) : 0
  return daysLeft > 200 ? 'yearly' : 'monthly'
}

export function getSolveLimit(isVip: boolean, vipExpiresAt?: string | null): number {
  if (!isVip) return FREE_SOLVE_LIMIT
  return VIP_PLANS[inferVipPlan(vipExpiresAt)].solveLimit
}

export function getModelConfig(isVip: boolean, vipExpiresAt?: string | null) {
  if (!isVip) return { model: FREE_MODEL, limit: FREE_SOLVE_LIMIT, label: FREE_MODEL_LABEL }
  const plan = VIP_PLANS[inferVipPlan(vipExpiresAt)]
  return { model: plan.model, limit: plan.solveLimit, label: plan.modelLabel }
}

// ============================================================
// New Subject-based Plans (Toán / Anh / Combo)
// ============================================================

export type SubjectPlanId =
  | 'free'
  | 'math_monthly'
  | 'math_yearly'
  | 'english_monthly'
  | 'english_yearly'
  | 'combo_monthly'
  | 'combo_3months'
  | 'combo_6months'

export interface SubjectPlanConfig {
  id: SubjectPlanId
  displayName: string
  priceVnd: number            // giá niêm yết VND/kỳ
  pricePerMonth: number       // giá quy ra tháng
  durationDays: number
  subjects: ('math' | 'english')[]
  badge?: string              // "Tiết kiệm nhất", "Phổ biến"...
  savingVnd?: number          // tiết kiệm so với mua riêng
  features: string[]
}

export const SUBJECT_PLANS: Record<SubjectPlanId, SubjectPlanConfig> = {
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
  math_monthly: {
    id: 'math_monthly',
    displayName: 'Toán VIP — 1 tháng',
    priceVnd: 79_000,
    pricePerMonth: 79_000,
    durationDays: 30,
    subjects: ['math'],
    features: [
      'Luyện tập Toán không giới hạn',
      'Giải toán AI không giới hạn',
      'Thi thử không giới hạn',
      'Toàn bộ tài liệu Toán',
    ],
  },
  math_yearly: {
    id: 'math_yearly',
    displayName: 'Toán VIP — 1 năm học',
    priceVnd: 699_000,
    pricePerMonth: Math.round(699_000 / 12),
    durationDays: 365,
    subjects: ['math'],
    badge: 'Tiết kiệm',
    savingVnd: 79_000 * 12 - 699_000,
    features: [
      'Tất cả tính năng Toán VIP tháng',
      'Báo cáo học tập chi tiết',
      'Đề thi exclusive',
      'Huy hiệu VIP nổi bật',
    ],
  },
  english_monthly: {
    id: 'english_monthly',
    displayName: 'Anh VIP — 1 tháng',
    priceVnd: 79_000,
    pricePerMonth: 79_000,
    durationDays: 30,
    subjects: ['english'],
    features: [
      'Từ vựng không giới hạn',
      '30 lượt AI tạo từ vựng / tháng',
      'Spaced repetition (FSRS)',
      'Chia sẻ bộ từ cộng đồng',
      'Popup từ điển nâng cao',
    ],
  },
  english_yearly: {
    id: 'english_yearly',
    displayName: 'Anh VIP — 1 năm học',
    priceVnd: 699_000,
    pricePerMonth: Math.round(699_000 / 12),
    durationDays: 365,
    subjects: ['english'],
    badge: 'Tiết kiệm',
    savingVnd: 79_000 * 12 - 699_000,
    features: [
      'Tất cả tính năng Anh VIP tháng',
      'Không giới hạn AI tạo từ vựng',
      'Truy cập sớm tính năng mới',
    ],
  },
  combo_monthly: {
    id: 'combo_monthly',
    displayName: 'Combo Toán + Anh — 1 tháng',
    priceVnd: 129_000,
    pricePerMonth: 129_000,
    durationDays: 30,
    subjects: ['math', 'english'],
    badge: 'Phổ biến',
    savingVnd: 79_000 * 2 - 129_000,
    features: [
      'Toàn bộ tính năng Toán VIP',
      'Toàn bộ tính năng Anh VIP',
      'Tiết kiệm 29,000đ so với mua riêng',
    ],
  },
  combo_3months: {
    id: 'combo_3months',
    displayName: 'Combo Toán + Anh — 3 tháng',
    priceVnd: 329_000,
    pricePerMonth: Math.round(329_000 / 3),
    durationDays: 90,
    subjects: ['math', 'english'],
    savingVnd: 129_000 * 3 - 329_000,
    features: [
      'Toàn bộ tính năng Combo tháng',
      '~109,000đ / tháng',
      'Tiết kiệm 58,000đ so với 3 tháng lẻ',
    ],
  },
  combo_6months: {
    id: 'combo_6months',
    displayName: 'Combo Toán + Anh — 6 tháng',
    priceVnd: 599_000,
    pricePerMonth: Math.round(599_000 / 6),
    durationDays: 180,
    subjects: ['math', 'english'],
    badge: 'Tiết kiệm nhất',
    savingVnd: 129_000 * 6 - 599_000,
    features: [
      'Toàn bộ tính năng Combo tháng',
      '~99,000đ / tháng',
      'Tiết kiệm 175,000đ so với 6 tháng lẻ',
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
    aiVocabPerMonth: 30,
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
  if (isVip) return true // backward compat
  return plan === 'math_vip' || plan === 'combo_vip'
}

export function hasEnglishAccess(plan: string | null | undefined): boolean {
  return plan === 'english_vip' || plan === 'combo_vip'
}
