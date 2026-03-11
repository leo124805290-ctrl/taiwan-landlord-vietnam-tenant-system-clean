'use client'

import { useState, useEffect } from 'react'
import { checkoutAPI, settingsAPI } from '@/lib/api'
import { useI18n } from '@/contexts/I18nContext'

type Room = {
  id: number
  property_id: number
  room_number: string
  tenant_name: string | null
  previous_meter: number | null
  current_meter?: number | null
}

type Props = {
  room: Room
  onClose: () => void
  onSuccess: () => void
}

const ELECTRIC_RATE_DEFAULT = 6

export function CheckoutModal({ room, onClose, onSuccess }: Props) {
  const { t } = useI18n()
  const [checkout_date, setCheckoutDate] = useState(
    new Date().toISOString().slice(0, 10),
  )
  const [final_meter, setFinalMeter] = useState<string>(
    String(room.current_meter ?? room.previous_meter ?? 0),
  )
  const [deposit_action, setDepositAction] = useState<'return' | 'deduct' | 'partial'>('return')
  const [deposit_amount, setDepositAmount] = useState('')
  const [note, setNote] = useState('')
  const [electricRate, setElectricRate] = useState(ELECTRIC_RATE_DEFAULT)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    settingsAPI.list().then((res) => {
      if (res.success && res.data) {
        const row = (res.data as any[]).find((r: any) => r.key === 'electric_rate')
        if (row?.value) setElectricRate(Number(row.value) || ELECTRIC_RATE_DEFAULT)
      }
    })
  }, [])

  const prevMeter = Number(room.previous_meter ?? 0)
  const finalMeterNum = Number(final_meter) || 0
  const usage = Math.max(0, finalMeterNum - prevMeter)
  const calculatedElectric = usage * electricRate

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (finalMeterNum < prevMeter) {
      setError(t('finalMeterInvalid'))
      return
    }
    setSubmitting(true)
    setError(null)

    const idempotencyKey = `checkout-${room.id}-${Date.now()}`

    try {
      const res = await checkoutAPI.complete(
        {
          room_id: room.id,
          checkout_date,
          final_meter: finalMeterNum,
          deposit_action,
          deposit_amount:
            deposit_action === 'return' || deposit_action === 'partial'
              ? Number(deposit_amount) || 0
              : undefined,
          note: note.trim() || undefined,
        },
        idempotencyKey,
      )

      if (res.success) {
        onSuccess()
        onClose()
        return
      }
      setError(res.error || t('checkoutFailed'))
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
          <h2 className="text-xl font-bold mb-4">{t('checkoutTitle')} · #{room.room_number}</h2>
          {room.tenant_name && (
            <p className="text-gray-600 mb-4">{t('tenant')}：{room.tenant_name}</p>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('checkoutDate')}</label>
              <input
                type="date"
                value={checkout_date}
                onChange={(e) => setCheckoutDate(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
                required
                disabled={submitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('finalMeter')}</label>
              <input
                type="number"
                min={prevMeter}
                value={final_meter}
                onChange={(e) => setFinalMeter(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
                required
                disabled={submitting}
              />
              <p className="text-xs text-gray-500 mt-1">{t('lastMeter')}：{prevMeter}</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700">{t('calculatedElectric')}</p>
              <p className="text-lg font-semibold">
                {usage} {t('degree')} × {electricRate} = NT$ {calculatedElectric}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('depositAction')}</label>
              <select
                value={deposit_action}
                onChange={(e) => setDepositAction(e.target.value as any)}
                className="w-full border rounded-lg px-3 py-2"
                disabled={submitting}
              >
                <option value="return">{t('depositReturn')}</option>
                <option value="deduct">{t('depositDeduct')}</option>
                <option value="partial">{t('depositPartial')}</option>
              </select>
            </div>
            {(deposit_action === 'return' || deposit_action === 'partial') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('refundAmount')}
                </label>
                <input
                  type="number"
                  min={0}
                  value={deposit_amount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  disabled={submitting}
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('note')}</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
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
                {submitting ? t('submitting') : t('confirmCheckout')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
