'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { paymentAPI, propertyAPI, roomAPI } from '@/lib/api'

const PAYMENT_TYPES = [
  { value: 'rent', label: '租金' },
  { value: 'deposit', label: '押金' },
  { value: 'electric', label: '電費' },
  { value: 'water', label: '水費' },
  { value: 'laundry', label: '洗衣機收入' },
  { value: 'booking', label: '訂金' },
  { value: 'deposit_return', label: '退押金' },
  { value: 'other', label: '其他' },
]

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
      setError('請選擇物業、類型並填寫有效金額')
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

  const typeLabel = (type: string) => PAYMENT_TYPES.find((t) => t.value === type)?.label ?? type

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="text-gray-600 hover:text-gray-900">← 返回</Link>
        <h1 className="text-2xl font-bold">收款管理</h1>
      </div>

      <div className="mb-4 flex flex-wrap gap-2 items-center">
        <select
          value={filterProperty}
          onChange={(e) => setFilterProperty(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">全部物業</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <select
          value={filterRoom}
          onChange={(e) => setFilterRoom(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">全部房間</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>#{r.room_number}</option>
          ))}
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">全部類型</option>
          {PAYMENT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
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
        <button
          type="button"
          onClick={() => {
            setAddForm((f) => ({ ...f, property_id: properties[0]?.id ?? 0 }))
            setShowAdd(true)
          }}
          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium"
        >
          新增收款
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500 py-8">載入中...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 px-3 py-2 text-left text-sm">日期</th>
                <th className="border border-gray-200 px-3 py-2 text-left text-sm">類型</th>
                <th className="border border-gray-200 px-3 py-2 text-right text-sm">金額</th>
                <th className="border border-gray-200 px-3 py-2 text-left text-sm">備註</th>
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
            <p className="text-gray-500 py-6 text-center">尚無收款記錄</p>
          )}
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">新增收款</h2>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">物業 *</label>
                <select
                  value={addForm.property_id}
                  onChange={(e) => setAddForm((f) => ({ ...f, property_id: Number(e.target.value) }))}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                  disabled={submitting}
                >
                  <option value={0}>請選擇</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">類型 *</label>
                <select
                  value={addForm.type}
                  onChange={(e) => setAddForm((f) => ({ ...f, type: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2"
                  disabled={submitting}
                >
                  {PAYMENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">金額 *</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">收款日期</label>
                <input
                  type="date"
                  value={addForm.paid_date}
                  onChange={(e) => setAddForm((f) => ({ ...f, paid_date: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2"
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">備註</label>
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
                  取消
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50"
                >
                  {submitting ? '處理中...' : '新增'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
