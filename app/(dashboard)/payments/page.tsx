'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { paymentAPI, propertyAPI, roomAPI } from '@/lib/api'
import { useI18n } from '@/contexts/I18nContext'
import { useRole } from '@/contexts/RoleContext'

const PAYMENT_TYPE_KEYS: Record<string, string> = {
  rent: 'typeRent',
  deposit: 'typeDeposit',
  electric: 'typeElectric',
  water: 'typeWater',
  laundry: 'typeLaundry',
  booking: 'typeBooking',
  deposit_return: 'typeDepositReturn',
  other: 'typeOther',
}

type Payment = {
  id: number
  room_id: number | null
  property_id: number
  type: string
  amount: number
  paid_date: string
  note: string | null
  created_by: string | null
  created_at: string
}

export default function PaymentsPage() {
  const { t } = useI18n()
  const { isReadonly } = useRole()
  const [list, setList] = useState<Payment[]>([])
  const [properties, setProperties] = useState<{ id: number; name: string }[]>([])
  const [rooms, setRooms] = useState<{ id: number; room_number: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [filterProperty, setFilterProperty] = useState<string>('')
  const [filterRoom, setFilterRoom] = useState<string>('')
  const [filterType, setFilterType] = useState<string>('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [addForm, setAddForm] = useState({
    property_id: 0,
    room_id: '',
    type: 'rent',
    amount: '',
    paid_date: new Date().toISOString().slice(0, 10),
    note: '',
  })

  const load = async () => {
    setLoading(true)
    const [propRes, payRes] = await Promise.all([
      propertyAPI.list(),
      paymentAPI.list({
        property_id: filterProperty ? Number(filterProperty) : undefined,
        room_id: filterRoom ? Number(filterRoom) : undefined,
        type: filterType || undefined,
        date_from: filterDateFrom || undefined,
        date_to: filterDateTo || undefined,
      }),
    ])
    if (propRes.success && propRes.data) {
      setProperties(propRes.data as any[])
    }
    if (payRes.success && payRes.data) {
      setList(payRes.data as Payment[])
    } else {
      setList([])
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [filterProperty, filterRoom, filterType, filterDateFrom, filterDateTo])

  useEffect(() => {
    if (!filterProperty) {
      setRooms([])
      setFilterRoom('')
      return
    }
    roomAPI.list({ property_id: Number(filterProperty) }).then((res) => {
      if (res.success && res.data) setRooms(res.data as any[])
      else setRooms([])
    })
  }, [filterProperty])

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amount = Number(addForm.amount)
    if (!addForm.property_id || !addForm.type || !Number.isFinite(amount) || amount <= 0) {
      setError(t('validationError'))
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await paymentAPI.create({
        property_id: addForm.property_id,
        room_id: addForm.room_id ? Number(addForm.room_id) : undefined,
        type: addForm.type,
        amount,
        paid_date: addForm.paid_date || undefined,
        note: addForm.note || undefined,
      })
      if (res.success) {
        setShowAdd(false)
        setAddForm({
          property_id: properties[0]?.id ?? 0,
          room_id: '',
          type: 'rent',
          amount: '',
          paid_date: new Date().toISOString().slice(0, 10),
          note: '',
        })
        load()
      } else {
        setError(res.error || '新增失敗')
      }
    } catch (err: any) {
      setError(err?.message || '網路錯誤')
    } finally {
      setSubmitting(false)
    }
  }

  const typeLabel = (type: string) => t(PAYMENT_TYPE_KEYS[type] || 'typeOther')

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="text-gray-600 hover:text-gray-900">← {t('back')}</Link>
        <h1 className="text-2xl font-bold">{t('paymentsTitle')}</h1>
      </div>

      <div className="mb-4 flex flex-wrap gap-2 items-center">
        <select
          value={filterProperty}
          onChange={(e) => setFilterProperty(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">{t('allProperties')}</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <select
          value={filterRoom}
          onChange={(e) => setFilterRoom(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">{t('allRooms')}</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>#{r.room_number}</option>
          ))}
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">{t('allTypes')}</option>
          {Object.entries(PAYMENT_TYPE_KEYS).map(([value, key]) => (
            <option key={value} value={value}>{t(key)}</option>
          ))}
        </select>
        <input
          type="date"
          value={filterDateFrom}
          onChange={(e) => setFilterDateFrom(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
          placeholder="起日"
        />
        <input
          type="date"
          value={filterDateTo}
          onChange={(e) => setFilterDateTo(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
          placeholder="訖日"
        />
        {!isReadonly && (
        <button
          type="button"
          onClick={() => {
            setAddForm((f) => ({ ...f, property_id: properties[0]?.id ?? 0 }))
            setShowAdd(true)
          }}
          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium"
        >
          {t('addPayment')}
        </button>
        )}
      </div>

      {loading ? (
        <p className="text-gray-500 py-8">{t('loading')}</p>
      ) : (
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
              {list.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="border border-gray-200 px-3 py-2 text-sm">
                    {row.paid_date ? new Date(row.paid_date).toLocaleDateString('zh-TW') : '-'}
                  </td>
                  <td className="border border-gray-200 px-3 py-2 text-sm">{typeLabel(row.type)}</td>
                  <td className="border border-gray-200 px-3 py-2 text-sm text-right">NT$ {row.amount}</td>
                  <td className="border border-gray-200 px-3 py-2 text-sm text-gray-600">{row.note ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {list.length === 0 && (
            <p className="text-gray-500 py-6 text-center">{t('noPayments')}</p>
          )}
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">{t('addPayment')}</h2>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('propertyRequired')}</label>
                <select
                  value={addForm.property_id}
                  onChange={(e) => setAddForm((f) => ({ ...f, property_id: Number(e.target.value) }))}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                  disabled={submitting}
                >
                  <option value={0}>{t('selectProperty')}</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('typeRequired')}</label>
                <select
                  value={addForm.type}
                  onChange={(e) => setAddForm((f) => ({ ...f, type: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2"
                  disabled={submitting}
                >
                  {Object.entries(PAYMENT_TYPE_KEYS).map(([value, key]) => (
                    <option key={value} value={value}>{t(key)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('amount')} *</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={addForm.amount}
                  onChange={(e) => setAddForm((f) => ({ ...f, amount: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('paymentDate')}</label>
                <input
                  type="date"
                  value={addForm.paid_date}
                  onChange={(e) => setAddForm((f) => ({ ...f, paid_date: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2"
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('note')}</label>
                <input
                  type="text"
                  value={addForm.note}
                  onChange={(e) => setAddForm((f) => ({ ...f, note: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2"
                  disabled={submitting}
                />
              </div>
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="flex-1 py-2 border rounded-lg"
                  disabled={submitting}
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50"
                >
                  {submitting ? t('submitting') : t('add')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
