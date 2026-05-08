import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { SupabaseAdapter } from '@auth/supabase-adapter'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  }),
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false

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
          await supabaseAdmin.from('profiles').insert({ id: newUser.id })
          await supabaseAdmin.from('wallets').insert({ user_id: newUser.id, balance: 0 })
        }
      } else {
        await supabaseAdmin
          .from('users')
          .update({ name: user.name, avatar_url: user.image })
          .eq('email', user.email)
      }

      return true
    },

    async jwt({ token, user }) {
      if (user?.email) {
        const { data } = await supabaseAdmin
          .from('users')
          .select('id, role, is_vip, vip_expires_at')
          .eq('email', user.email)
          .single()

        if (data) {
          token.userId = data.id
          token.role = data.role
          token.isVip = data.is_vip
          token.vipExpiresAt = data.vip_expires_at
        }
      }
      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string
        session.user.role = token.role as string
        session.user.isVip = token.isVip as boolean
        session.user.vipExpiresAt = token.vipExpiresAt as string | null
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
