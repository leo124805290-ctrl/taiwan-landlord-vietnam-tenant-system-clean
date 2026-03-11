'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authAPI } from '@/lib/api'
import Header from '@/components/Header'

type Me = {
  id: number
  username: string
  display_name: string
  role: 'superadmin' | 'staff' | 'readonly'
  language: string
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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500 text-sm">載入中...</div>
      </div>
    )
  }

  // readonly 角色：在 Header / 其他元件內可依照 role 隱藏新增/編輯/刪除按鈕
  const isReadonly = me?.role === 'readonly'

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-6 pb-24">
        {/* 這裡可以未來透過 Context 把 me/role 傳給子元件做更細緻控管 */}
        {children}
      </main>
    </div>
  )
}

