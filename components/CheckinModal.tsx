'use client'

import { useState } from 'react'
import { roomAPI, checkinAPI } from '@/lib/api'
import { useI18n } from '@/contexts/I18nContext'

type Room = {
  id: number
  property_id: number
  room_number: string
  monthly_rent: number | null
  status: string
  previous_meter?: number | null
  current_meter?: number | null
}

type Props = {
  room: Room
  onClose: () => void
  onSuccess: () => void
}

export function CheckinModal({ room, onClose, onSuccess }: Props) {
  const { t } = useI18n()
  const [tenant_name, setTenantName] = useState('')
  const [phone, setPhone] = useState('')
  const [nationality, setNationality] = useState('')
  const [contract_start, setContractStart] = useState(
    new Date().toISOString().slice(0, 10),
  )
  const [contract_end, setContractEnd] = useState('')
  const [payment_type, setPaymentType] = useState<'full' | 'deposit_only' | 'booking_only'>('full')
  const [initial_meter, setInitialMeter] = useState<string>(
    String(room.previous_meter ?? room.current_meter ?? 0),
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenant_name.trim() || !contract_start) {
      setError(t('validationError'))
      return
    }
    setSubmitting(true)
    setError(null)

    const idempotencyKey = `checkin-${room.id}-${Date.now()}`

    try {
      const lockRes = await roomAPI.lock(room.id)
      if (!lockRes.success) {
        setError(lockRes.error || t('lockFailed'))
        setSubmitting(false)
        return
      }

      const res = await checkinAPI.complete(
        {
          room_id: room.id,
          tenant_name: tenant_name.trim(),
          phone: phone.trim() || undefined,
          nationality: nationality.trim() || undefined,
          contract_start,
          contract_end: contract_end || undefined,
          payment_type,
          initial_meter: Number(initial_meter) || 0,
        },
        idempotencyKey,
      )

      if (res.success) {
        onSuccess()
        onClose()
        return
      }
      setError(res.error || t('checkinFailed'))
    } catch (err: any) {
      setError(err?.message || '網路錯誤')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">{t('checkinTitle')} · #{room.room_number}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('tenantNameRequired')}</label>
              <input
                type="text"
                value={tenant_name}
                onChange={(e) => setTenantName(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
                required
                disabled={submitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('phone')}</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
                disabled={submitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('nationality')}</label>
              <input
                type="text"
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
                disabled={submitting}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('contractStart')}</label>
                <input
                  type="date"
                  value={contract_start}
                  onChange={(e) => setContractStart(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('contractEnd')}</label>
                <input
                  type="date"
                  value={contract_end}
                  onChange={(e) => setContractEnd(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  disabled={submitting}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('paymentType')}</label>
              <select
                value={payment_type}
                onChange={(e) => setPaymentType(e.target.value as any)}
                className="w-full border rounded-lg px-3 py-2"
                disabled={submitting}
              >
                <option value="full">{t('paymentFull')}</option>
                <option value="deposit_only">{t('paymentDepositOnly')}</option>
                <option value="booking_only">{t('paymentBookingOnly')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('initialMeter')}</label>
              <input
                type="number"
                min={0}
                value={initial_meter}
                onChange={(e) => setInitialMeter(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
                disabled={submitting}
              />
            </div>
            {error && (
              <p className="text-red-600 text-sm">{error}</p>
            )}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 border rounded-lg text-gray-700"
                disabled={submitting}
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
              >
                {submitting ? t('submitting') : t('confirmCheckin')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
