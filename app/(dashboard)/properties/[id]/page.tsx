'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { propertyAPI, roomAPI } from '@/lib/api'
import { useI18n } from '@/contexts/I18nContext'
import Link from 'next/link'

export default function PropertyDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { t } = useI18n()
  const [property, setProperty] = useState<any>(null)
  const [rooms, setRooms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [properties, setProperties] = useState<any[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const [propRes, roomsRes, listRes] = await Promise.all([
          propertyAPI.get(params.id as string),
          roomAPI.list({ property_id: Number(params.id) }),
          propertyAPI.list()
        ])

        if (propRes.success && propRes.data) {
          setProperty(propRes.data)
        }
        if (roomsRes.success && roomsRes.data) {
          setRooms(roomsRes.data)
        }
        if (listRes.success && listRes.data) {
          setProperties(listRes.data)
        }
      } catch (err) {
        console.error('Failed to load property:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params.id])

  const handleBack = () => {
    router.replace('/dashboard')
  }

  const switchProperty = (e: React.ChangeEvent<HTMLSelectElement>) => {
    router.replace(`/properties/${e.target.value}`)
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
          <select
            value={params.id as string}
            onChange={switchProperty}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            {properties.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="card bg-white p-6 rounded-xl shadow-md mb-6">
          <h1 className="text-3xl font-bold mb-4">{property?.name}</h1>
          <p className="text-gray-600">{property?.address || 'No address'}</p>
        </div>

        <h2 className="text-2xl font-bold mb-4">
          {t('rooms')} ({rooms.length})
        </h2>

        <div className="grid gap-4">
          {rooms.length === 0 ? (
            <div className="card bg-white p-6 rounded-xl text-center text-gray-500">
              {t('noRooms')}
            </div>
          ) : (
            rooms.map((room) => (
              <Link
                key={room.id}
                href={`/properties/${property.id}/rooms/${room.id}`}
                className="card bg-white p-4 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg">#{room.room_number}</h3>
                    <p className="text-sm text-gray-600">
                      {room.floor ? `Floor ${room.floor} • ` : ''}
                      ${room.monthly_rent ? `Rent: NT$${room.monthly_rent}` : ''}
                    </p>
                    {room.status && (
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
                </div>
              </Link>
            ))
          )}
        </div>
      </main>
    </div>
  )
}