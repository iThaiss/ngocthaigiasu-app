import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { createClient } from '@supabase/supabase-js'
import { isVipActive } from '@/lib/vip'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false
      try {
        const { data: existing } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('email', user.email)
          .single()
        if (!existing) {
          const { data: newUser } = await supabaseAdmin
            .from('users')
            .insert({
              email: user.email,
              name: user.name,
              avatar_url: user.image,
              role: 'student',
            })
            .select('id')
            .single()
          if (newUser) {
            const referralCode = 'REF' + newUser.id.replace(/-/g, '').substring(0, 8).toUpperCase()
            await supabaseAdmin.from('users').update({ referral_code: referralCode }).eq('id', newUser.id)
            await supabaseAdmin.from('profiles').insert({ id: newUser.id })
            await supabaseAdmin.from('wallets').insert({ user_id: newUser.id, balance: 0, points: 0 })
          }
        } else {
          await supabaseAdmin
            .from('users')
            .update({ name: user.name, avatar_url: user.image })
            .eq('email', user.email)
        }
        return true
      } catch (error) {
        console.error('SignIn error:', error)
        return false
      }
    },
    async jwt({ token, user, trigger }) {
      // Refresh an expired VIP session even without an explicit session update.
      // This prevents a stale JWT from retaining VIP access after its expiry date.
      const tokenSaysVip = token.isVip as boolean | undefined
      const tokenExpiry = token.vipExpiresAt as string | null | undefined
      const refreshExpiredVip = Boolean(tokenSaysVip) && !isVipActive(tokenSaysVip, tokenExpiry)
      const email = user?.email ?? (
        trigger === 'update' || refreshExpiredVip ? (token.email as string) : null
      )
      if (email) {
        try {
          const { data } = await supabaseAdmin
            .from('users')
            .select('id, role, is_vip, vip_expires_at, plan, vip_plan, profile_completed, avatar_url')
            .eq('email', email)
            .single()
          if (data) {
            token.userId = data.id
            token.role = data.role
            const hasActiveVip = isVipActive(data.is_vip, data.vip_expires_at)
            token.isVip = hasActiveVip
            token.vipExpiresAt = data.vip_expires_at
            token.plan = hasActiveVip ? data.plan ?? null : 'free'
            token.vipPlan = hasActiveVip ? data.vip_plan ?? null : null
            token.profileCompleted = data.profile_completed ?? false
            token.avatarUrl = data.avatar_url ?? (token.picture as string | null) ?? null
          }
        } catch (error) {
          console.error('JWT error:', error)
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string
        session.user.role = token.role as string
        const vipExpiresAt = token.vipExpiresAt as string | null
        const hasActiveVip = isVipActive(token.isVip as boolean, vipExpiresAt)
        session.user.isVip = hasActiveVip
        session.user.vipExpiresAt = vipExpiresAt
        session.user.plan = hasActiveVip ? (token.plan as string | null) ?? null : 'free'
        session.user.vipPlan = hasActiveVip ? (token.vipPlan as string | null) ?? null : null
        session.user.profileCompleted = (token.profileCompleted as boolean) ?? false
        if (token.avatarUrl) session.user.image = token.avatarUrl as string
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) return `${baseUrl}${url}`
      if (url.startsWith(baseUrl)) return url
      return `${baseUrl}/dashboard`
    },
  },
}
