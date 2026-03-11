'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { propertyAPI, roomAPI, paymentAPI } from '@/lib/api'
import { useI18n } from '@/contexts/I18nContext'

export default function RoomDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { t } = useI18n()
  const [property, setProperty] = useState<any>(null)
  const [room, setRoom] = useState<any>(null)
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [properties, setProperties] = useState<any[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const [propRes, roomRes, payRes, listRes] = await Promise.all([
          propertyAPI.get(params.propertyId as string),
          roomAPI.get(Number(params.roomId)),
          paymentAPI.list({ room_id: Number(params.roomId) }),
          propertyAPI.list()
        ])

        if (propRes.success && propRes.data) {
          setProperty(propRes.data)
          setProperties(listRes.data)
        }
        if (roomRes.success && roomRes.data) {
          setRoom(roomRes.data)
        }
        if (payRes.success && payRes.data) {
          setPayments(payRes.data)
        }
      } catch (err) {
        console.error('Failed to load room:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params.propertyId, params.roomId])

  const handleBack = () => {
    router.replace(`/properties/${property?.id}`)
  }

  const switchProperty = (e: React.ChangeEvent<HTMLSelectElement>) => {
    router.replace(`/properties/${e.target.value}/rooms/${room?.id}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <main className="max-w-7xl mx-auto px-4 py-6 pb-24">
          <div className="text-gray-500">Loading...</div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <main className="max-w-7xl mx-auto px-4 py-6 pb-24">
        <div className="flex items-center justify-between mb-6">
          <a href="/dashboard" className="text-blue-600 hover:text-blue-700 font-medium">
            ← {t('back')}
          </a>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Back to property:</span>
            <select
              value={property?.id || ''}
              onChange={switchProperty}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              {properties.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="card bg-white p-6 rounded-xl shadow-md mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">#{room?.room_number}</h1>
              <p className="text-gray-600">{property?.address || 'No address'}</p>
            </div>
            {room?.status && (
              <span
                className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${
                  room.status === 'occupied'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {t(room.status)}
              </span>
            )}
          </div>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            {room?.floor && (
              <div>
                <p className="text-sm text-gray-500">{t('floor')}</p>
                <p className="font-bold">{room.floor}</p>
              </div>
            )}
            {room?.monthly_rent && (
              <div>
                <p className="text-sm text-gray-500">Monthly Rent</p>
                <p className="font-bold">NT$ {room.monthly_rent}</p>
              </div>
            )}
            {room?.deposit && (
              <div>
                <p className="text-sm text-gray-500">{t('deposit')}</p>
                <p className="font-bold">NT$ {room.deposit}</p>
              </div>
            )}
            {room?.tenant_name && (
              <div>
                <p className="text-sm text-gray-500">{t('tenant')}</p>
                <p className="font-bold">{room.tenant_name}</p>
              </div>
            )}
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-4">Payments ({payments.length})</h2>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 px-3 py-2 text-left text-sm">{t('date')}</th>
                <th className="border border-gray-200 px-3 py-2 text-left text-sm">{t('type')}</th>
                <th className="border border-gray-200 px-3 py-2 text-right text-sm">{t('amount')}</th>
                <th className="border border-gray-200 px-3 py-2 text-left text-sm">{t('note')}</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="border border-gray-200 px-3 py-2 text-sm">
                    {payment.paid_date ? new Date(payment.paid_date).toLocaleDateString('zh-TW') : '-'}
                  </td>
                  <td className="border border-gray-200 px-3 py-2 text-sm">
                    {payment.type || '-'}
                  </td>
                  <td className="border border-gray-200 px-3 py-2 text-sm text-right">
                    NT$ {payment.amount}
                  </td>
                  <td className="border border-gray-200 px-3 py-2 text-sm text-gray-600">
                    {payment.note ?? '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {payments.length === 0 && (
            <div className="card bg-white p-6 rounded-xl text-center text-gray-500">
              No payments found
            </div>
          )}
        </div>
      </main>
    </div>
  )
}