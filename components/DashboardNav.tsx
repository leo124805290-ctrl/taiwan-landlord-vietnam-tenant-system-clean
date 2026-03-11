'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useI18n } from '@/contexts/I18nContext'
import { useRole } from '@/contexts/RoleContext'

export default function DashboardNav() {
  const pathname = usePathname()
  const { t, lang, setLang } = useI18n()
  const { isSuperadmin } = useRole()

  return (
    <nav className="flex flex-wrap items-center justify-between gap-2 py-2 px-4 bg-white/80 border-b">
      <div className="flex gap-2">
        <Link
          href="/dashboard"
          className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
            pathname === '/dashboard' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          {t('navDashboard')}
        </Link>
        <Link
          href="/payments"
          className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
            pathname === '/payments' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          {t('navPayments')}
        </Link>
        <Link
          href="/payments"
          className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
            pathname === '/payments' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          {t('navPayments')}
        </Link>
        <Link
          href="/costs"
          className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
            pathname === '/costs' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          {t('navCosts')}
        </Link>
        {isSuperadmin && (
          <Link
            href="/admin"
            className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            {t('navAdmin')}
          </Link>
        )}
      </div>
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => setLang('zh-TW')}
          className={`px-2 py-1.5 rounded text-sm font-medium ${
            lang === 'zh-TW' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          {t('langZh')}
        </button>
        <button
          type="button"
          onClick={() => setLang('vi')}
          className={`px-2 py-1.5 rounded text-sm font-medium ${
            lang === 'vi' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          {t('langVi')}
        </button>
      </div>
    </nav>
  )
}
