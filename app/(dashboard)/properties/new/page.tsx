'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { propertyAPI } from '@/lib/api'
import { useI18n } from '@/contexts/I18nContext'

export default function NewPropertyPage() {
  const router = useRouter()
  const { t } = useI18n()
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    if (!name.trim()) {
      setError('Property name is required')
      return
    }
    setError(null)
    setLoading(true)

    const result = await propertyAPI.create({ name, address })
    setLoading(false)

    if (!result.success) {
      setError(result.error || 'Failed to create property')
      return
    }

    router.replace(`/properties/${result.data.id}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <main className="max-w-2xl mx-auto px-4 py-6 pb-24">
        <a href="/dashboard" className="text-blue-600 hover:text-blue-700 font-medium mb-4 inline-block">
          ← {t('back')}
        </a>
        <div className="card bg-white p-6 rounded-xl shadow-md">
          <h1 className="text-2xl font-bold mb-6">{t('addProperty')}</h1>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-800 rounded-lg px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                {t('property')} {t('name')} *
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                {t('address')}
              </label>
              <textarea
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('submitting') : t('add')}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}