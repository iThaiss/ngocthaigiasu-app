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

  // Detect subject from pathname
  const isEnglish = pathname.includes('/dashboard/english') || 
                    pathname.includes('/vocabulary') || 
                    pathname.includes('/grammar') || 
                    pathname.includes('/reading') || 
                    pathname.includes('/english-feedback')

  const isMath = pathname.includes('/dashboard/math') || 
                 pathname.includes('/solve') || 
                 pathname.includes('/practice') || 
                 pathname.includes('/exam') || 
                 pathname.includes('/learning')

  const [subject, setSubject] = useState<'math' | 'english' | null>(null)

  useEffect(() => {
    if (isEnglish) {
      setSubject('english')
    } else if (isMath) {
      setSubject('math')
    } else {
      const saved = localStorage.getItem('ngocthai_subject') as 'math' | 'english' | null
      setSubject(saved)
    }
  }, [pathname, isEnglish, isMath])

  // Show profile completion modal only if user is logged in, profile not completed,
  // and NOT on the subject select / redirect page
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
      {!isSelectOrRedirect && <Sidebar subject={subject} />}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {!isSelectOrRedirect && <Header />}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>

      <ProfileCompletionModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        userName={session?.user?.name ?? ''}
      />

      {/* Global dictionary popup — active on any text selection across the app */}
      <DictionaryPopup />

      {/* Floating help / chat bubble widget */}
      {!isSelectOrRedirect && <SupportBubble />}

      {/* Pink theme cute decorations — only visible when theme=pink */}
      <PinkThemeDecorations />
    </div>
  )
}
