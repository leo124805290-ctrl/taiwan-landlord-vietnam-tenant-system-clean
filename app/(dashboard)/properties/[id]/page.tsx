'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { propertyAPI, roomAPI } from '@/lib/api'
import { CheckinModal } from '@/components/CheckinModal'
import { CheckoutModal } from '@/components/CheckoutModal'

type Room = {
  id: number
  property_id: number
  floor: number | null
  room_number: string
  monthly_rent: number | null
  deposit: number | null
  status: string
  tenant_name: string | null
  check_in_date: string | null
  check_out_date: string | null
  current_meter: number | null
  previous_meter: number | null
}

const STATUS_MAP: Record<string, { label: string; bg: string; text: string }> = {
  vacant: { label: '空房', bg: 'bg-green-100', text: 'text-green-800' },
  occupied: { label: '已出租', bg: 'bg-red-100', text: 'text-red-800' },
  pending: { label: '待入住', bg: 'bg-yellow-100', text: 'text-yellow-800' },
  maintenance: { label: '維修中', bg: 'bg-gray-200', text: 'text-gray-700' },
}

export default function PropertyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = Number(params.id)
  const [property, setProperty] = useState<{ id: number; name: string; address: string | null } | null>(null)
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [checkinRoom, setCheckinRoom] = useState<Room | null>(null)
  const [checkoutRoom, setCheckoutRoom] = useState<Room | null>(null)

  const load = async () => {
    if (!id || Number.isNaN(id)) {
      setError('無效的物業 ID')
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    const [propRes, roomRes] = await Promise.all([
      propertyAPI.list(),
      roomAPI.list({ property_id: id }),
    ])
    if (!propRes.success || !propRes.data) {
      setError(propRes.error || '無法載入物業')
      setLoading(false)
      return
    }
    const found = (propRes.data as any[]).find((p: any) => p.id === id)
    if (!found) {
      setError('找不到此物業')
      setLoading(false)
      return
    }
    setProperty(found)
    if (roomRes.success && roomRes.data) {
      setRooms(roomRes.data as Room[])
    } else {
      setRooms([])
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [id])

  const handleCheckinClose = (refreshed: boolean) => {
    setCheckinRoom(null)
    if (refreshed) load()
  }

  const handleCheckoutClose = (refreshed: boolean) => {
    setCheckoutRoom(null)
    if (refreshed) load()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">載入中...</p>
      </div>
    )
  }

  if (error || !property) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <p className="text-red-600 mb-4">{error || '找不到物業'}</p>
        <Link href="/" className="text-blue-600 hover:underline">← 返回首頁</Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/" className="text-gray-600 hover:text-gray-900">← 返回</Link>
        <h1 className="text-2xl font-bold">{property.name}</h1>
      </div>
      {property.address && (
        <p className="text-gray-600 mb-6">地址：{property.address}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rooms.map((room) => {
          const statusInfo = STATUS_MAP[room.status] || { label: room.status, bg: 'bg-gray-100', text: 'text-gray-800' }
          const isVacant = room.status === 'vacant' || room.status === 'pending'
          const isOccupied = room.status === 'occupied'

          return (
            <div
              key={room.id}
              onClick={() => {
                if (isVacant) setCheckinRoom(room)
                if (isOccupied) setCheckoutRoom(room)
              }}
              className={`
                rounded-xl border p-4 cursor-pointer transition
                ${isVacant || isOccupied ? 'hover:shadow-md hover:border-blue-300' : ''}
                ${!isVacant && !isOccupied ? 'cursor-default opacity-90' : ''}
              `}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-semibold text-lg">#{room.room_number}</span>
                <span className={`px-2 py-0.5 rounded text-sm ${statusInfo.bg} ${statusInfo.text}`}>
                  {statusInfo.label}
                </span>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                {room.floor != null && <p>樓層：{room.floor}</p>}
                <p>月租：{room.monthly_rent != null ? `NT$ ${room.monthly_rent}` : '-'}</p>
                {isOccupied && room.tenant_name && (
                  <>
                    <p>租客：{room.tenant_name}</p>
                    {room.check_in_date && (
                      <p>入住：{new Date(room.check_in_date).toLocaleDateString('zh-TW')}</p>
                    )}
                  </>
                )}
              </div>
              {(isVacant || isOccupied) && (
                <p className="mt-2 text-xs text-blue-600">
                  {isVacant ? '點擊辦理入住' : '點擊辦理退租'}
                </p>
              )}
            </div>
          )
        })}
      </div>

      {checkinRoom && (
        <CheckinModal
          room={checkinRoom}
          onClose={() => handleCheckinClose(false)}
          onSuccess={() => handleCheckinClose(true)}
        />
      )}
      {checkoutRoom && (
        <CheckoutModal
          room={checkoutRoom}
          onClose={() => handleCheckoutClose(false)}
          onSuccess={() => handleCheckoutClose(true)}
        />
      )}
    </div>
  )
}
