'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import SupportBubble from '@/components/layout/SupportBubble'
import ProfileCompletionModal from '@/components/ProfileCompletionModal'
import DictionaryPopup from '@/components/vocabulary/DictionaryPopup'
import PinkThemeDecorations from '@/components/PinkThemeDecorations'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAuth()
  const { data: session } = useSession()
  const pathname = usePathname()
  const [showProfileModal, setShowProfileModal] = useState(false)
  const profileCompleted = session?.user?.profileCompleted

  const isSelectOrRedirect = pathname === '/select' || pathname === '/dashboard'

  useEffect(() => {
    if (profileCompleted === false && !isSelectOrRedirect) {
      setShowProfileModal(true)
    }
  }, [profileCompleted, isSelectOrRedirect])

  // Process pending affiliate ref cookie after sign-in
  useEffect(() => {
    if (!session?.user?.id) return
    const match = document.cookie.match(/(?:^|;\s*)pending_ref=([^;]+)/)
    if (!match) return
    const refCode = decodeURIComponent(match[1])
    fetch('/api/affiliate/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refCode }),
    }).finally(() => {
      document.cookie = 'pending_ref=; path=/; max-age=0'
    })
  }, [session?.user?.id])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {!isSelectOrRedirect && <Sidebar />}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {!isSelectOrRedirect && <Header />}
        {/* pb-14 trên mobile để tránh bị bottom tab bar che khuất */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
          {children}
        </main>
      </div>

      <ProfileCompletionModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        userName={session?.user?.name ?? ''}
      />

      <DictionaryPopup />

      {!isSelectOrRedirect && <SupportBubble />}

      <PinkThemeDecorations />
    </div>
  )
}
