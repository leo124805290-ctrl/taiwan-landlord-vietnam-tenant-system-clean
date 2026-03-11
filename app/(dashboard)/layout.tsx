'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authAPI } from '@/lib/api'
import Header from '@/components/Header'
import DashboardNav from '@/components/DashboardNav'
import { RoleProvider } from '@/contexts/RoleContext'
import { useI18n } from '@/contexts/I18nContext'

type Me = {
  id: number
  username: string
  display_name: string
  role: 'superadmin' | 'staff' | 'readonly'
  language: string
}

function LoadingMessage() {
  const { t } = useI18n()
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-gray-500 text-sm">{t('loading')}</div>
    </div>
  )
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [me, setMe] = useState<Me | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      if (!authAPI.isAuthenticated()) {
        router.replace('/login')
        return
      }
      const result = await authAPI.me()
      if (!result.success || !result.data) {
        authAPI.logout()
        router.replace('/login')
        return
      }
      setMe(result.data as Me)
      setLoading(false)
    }
    init()
  }, [router])

  if (loading) {
    return <LoadingMessage />
  }

  return (
    <RoleProvider role={me!.role}>
      <div className="min-h-screen">
        <Header />
        <DashboardNav />
        <main className="max-w-7xl mx-auto px-4 py-6 pb-24">
          {children}
        </main>
      </div>
    </RoleProvider>
  )
}

