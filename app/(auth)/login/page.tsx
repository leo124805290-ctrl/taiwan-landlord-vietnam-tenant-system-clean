'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authAPI } from '@/lib/api'
import { useI18n } from '@/contexts/I18nContext'

export default function LoginPage() {
  const router = useRouter()
  const { t } = useI18n()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 已登入則直接進儀表板
  useEffect(() => {
    if (authAPI.isAuthenticated()) {
      router.replace('/dashboard')
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    setError(null)
    setLoading(true)

    const result = await authAPI.login({ username, password })

    if (!result.success) {
      setError(result.error || t('loginFailed'))
      setLoading(false)
      return
    }

    router.replace('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* 卡片 */}
        <div className="bg-white/95 backdrop-blur shadow-2xl rounded-2xl px-6 py-7 sm:px-8">
          {/* Logo 與標題 */}
          <div className="flex flex-col items-center mb-6">
            <div className="h-12 w-12 rounded-2xl bg-blue-100 flex items-center justify-center text-2xl">
              🏢
            </div>
            <h1 className="mt-3 text-xl sm:text-2xl font-bold text-slate-900">
              多物業管理系統
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              台灣房東 / 越南房客 管理後台登入
            </p>
          </div>

          {/* 表單 */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-600">
                {t('username') || '帳號'}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                autoComplete="username"
                placeholder="帳號"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-600">
                {t('password') || '密碼'}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                autoComplete="current-password"
                placeholder="密碼"
              />
            </div>

            {/* 錯誤訊息：在卡片內部顯示 */}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs sm:text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`mt-2 w-full inline-flex items-center justify-center rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-medium text-white shadow-md transition ${
                loading
                  ? 'opacity-70 cursor-not-allowed'
                  : 'hover:bg-blue-800 hover:shadow-lg'
              }`}
            >
              {loading ? '處理中...' : t('login') || '登入'}
            </button>
          </form>

          {/* 底部提示 */}
          <p className="mt-4 text-[11px] sm:text-xs text-slate-400 text-center">
            建議使用桌機或平板獲得最佳管理體驗
          </p>
        </div>
      </div>
    </div>
  )
}
