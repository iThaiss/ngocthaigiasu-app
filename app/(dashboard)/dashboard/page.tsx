'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DashboardRedirect() {
  const router = useRouter()

  useEffect(() => {
    const subject = localStorage.getItem('ngocthai_subject')
    if (subject === 'english') {
      router.replace('/dashboard/english')
    } else if (subject === 'math') {
      router.replace('/dashboard/math')
    } else {
      router.replace('/select')
    }
  }, [router])

  return (
    <div className="flex h-[50vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  )
}
