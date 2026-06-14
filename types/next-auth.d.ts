import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role: string
      isVip: boolean
      vipExpiresAt: string | null
      plan: string | null      // subject: free | math_vip | english_vip | combo_vip
      vipPlan: string | null   // granular planId: math_monthly | combo_1week | ...
      profileCompleted: boolean
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId?: string
    role?: string
    isVip?: boolean
    vipExpiresAt?: string | null
    plan?: string | null
    vipPlan?: string | null
    profileCompleted?: boolean
    avatarUrl?: string | null
  }
}
