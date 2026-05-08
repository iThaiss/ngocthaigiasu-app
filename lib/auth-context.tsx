'use client'

import { useSession, signOut } from 'next-auth/react'

export function useAuth() {
  const { data: session, status } = useSession()

  const isLoading = status === 'loading'
  const user = session?.user ?? null
  const role = user?.role ?? 'student'
  const isVip = user?.isVip ?? false

  const logout = () => signOut({ callbackUrl: '/login' })

  return { user, session, isLoading, isVip, role, logout }
}
