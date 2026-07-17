'use client'

import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { isVipActive } from '@/lib/vip'

export function useAuth() {
  const { data: session, status } = useSession()

  const isLoading = status === 'loading'
  const user = session?.user ?? null
  const role = user?.role ?? 'student'
  const [now, setNow] = useState(() => Date.now())
  const isVip = isVipActive(user?.isVip, user?.vipExpiresAt, now)

  useEffect(() => {
    const expiresAt = user?.vipExpiresAt
    if (!user?.isVip || !expiresAt) return

    const expiryTime = new Date(expiresAt).getTime()
    if (!Number.isFinite(expiryTime)) {
      setNow(Date.now())
      return
    }

    const remainingMs = expiryTime - Date.now()
    if (remainingMs <= 0) {
      setNow(Date.now())
      return
    }

    const timer = window.setTimeout(
      () => setNow(Date.now()),
      Math.min(remainingMs + 50, 2_147_483_647),
    )
    return () => window.clearTimeout(timer)
  }, [user?.isVip, user?.vipExpiresAt])

  const logout = () => signOut({ callbackUrl: '/login' })

  return { user, session, isLoading, isVip, role, logout }
}
