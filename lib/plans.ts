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
export const FREE_MODEL = 'claude-haiku-4-5'
export const FREE_MODEL_LABEL = 'Claude Haiku'

export const VIP_PLANS: Record<PlanId, VipPlanConfig> = {
  monthly: {
    id: 'monthly',
    name: 'Tháng',
    displayName: 'Gói Tháng',
    costPoints: 69,
    durationDays: 30,
    solveLimit: 20,
    model: 'claude-sonnet-4-6',
    modelLabel: 'Claude Sonnet (VIP Tháng)',
  },
  yearly: {
    id: 'yearly',
    name: 'Năm Học',
    displayName: 'Gói Năm Học',
    costPoints: 699,
    durationDays: 365,
    solveLimit: 50,
    model: 'claude-sonnet-4-6',
    modelLabel: 'Claude Sonnet (VIP Năm)',
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
