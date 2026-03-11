'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { propertyAPI } from '@/lib/api'
import { useI18n } from '@/contexts/I18nContext'
import DashboardNav from '@/components/DashboardNav'

export default function DashboardPage() {
  const router = useRouter()
  const { t } = useI18n()
  const [properties, setProperties] = useState<{ id: number; name: string; address: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const res = await propertyAPI.list()
      if (res.success && res.data) {
        setProperties(res.data as any[])
      }
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <DashboardNav />
      <main className="max-w-7xl mx-auto px-4 py-6 pb-24">
        <h1 className="text-3xl font-bold mb-6">{t('dashboardTitle')}</h1>

        {loading ? (
          <div className="text-gray-500">Loading...</div>
        ) : properties.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-6xl mb-4">🏢</div>
            <h2 className="text-2xl font-bold mb-4">{t('noProperties')}</h2>
            <Link
              href="/properties/new"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              {t('createFirstProperty')}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <Link
                key={property.id}
                href={`/properties/${property.id}`}
                className="card bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <h2 className="text-xl font-bold">{property.name}</h2>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Property</span>
                </div>
                <p className="text-gray-600 text-sm mb-4">{property.address || 'No address'}</p>
                <div className="flex gap-2">
                  <Link
                    href={`/properties/${property.id}/rooms`}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium text-center hover:bg-blue-700 transition-colors"
                  >
                    {t('viewRooms')}
                  </Link>
                  <Link
                    href={`/properties/${property.id}/payments`}
                    className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium text-center hover:bg-green-700 transition-colors"
                  >
                    {t('viewPayments')}
                  </Link>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-8 pt-8 border-t border-gray-200">
          <h2 className="text-xl font-bold mb-4">{t('quickActions')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/payments"
              className="card bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="text-3xl mb-2">💰</div>
              <h3 className="font-bold mb-1">{t('addPayment')}</h3>
              <p className="text-sm text-gray-600">{t('addPaymentDesc')}</p>
            </Link>
            <Link
              href="/properties/new"
              className="card bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="text-3xl mb-2">🏢</div>
              <h3 className="font-bold mb-1">{t('addProperty')}</h3>
              <p className="text-sm text-gray-600">{t('addPropertyDesc')}</p>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}