'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { costAPI, propertyAPI } from '@/lib/api'
import { useI18n } from '@/contexts/I18nContext'
import { useRole } from '@/contexts/RoleContext'

const COST_CATEGORY_KEYS: Record<string, string> = {
  partition: 'categoryPartition',
  ac: 'categoryAC',
  utility_install: 'categoryUtilityInstall',
  furniture: 'categoryFurniture',
  maintenance: 'categoryMaintenance',
  other: 'categoryOther',
}

type Cost = {
  id: number
  property_id: number
  room_id: number | null
  category: string
  is_initial: boolean
  amount: number
  cost_date: string
  note: string | null
  created_by: string | null
  created_at: string
}

export default function CostsPage() {
  const { t } = useI18n()
  const { isReadonly } = useRole()
  const [list, setList] = useState<Cost[]>([])
  const [properties, setProperties] = useState<{ id: number; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [filterProperty, setFilterProperty] = useState<string>('')
  const [filterCategory, setFilterCategory] = useState<string>('')
  const [filterInitial, setFilterInitial] = useState<string>('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [addForm, setAddForm] = useState({
    property_id: 0,
    room_id: '',
    category: 'partition',
    is_initial: false,
    amount: '',
    cost_date: new Date().toISOString().slice(0, 10),
    note: '',
  })

  const load = async () => {
    setLoading(true)
    const [propRes, costRes] = await Promise.all([
      propertyAPI.list(),
      costAPI.list({
        property_id: filterProperty ? Number(filterProperty) : undefined,
        category: filterCategory || undefined,
        is_initial: filterInitial === 'true' ? true : filterInitial === 'false' ? false : undefined,
        date_from: filterDateFrom || undefined,
        date_to: filterDateTo || undefined,
      }),
    ])
    if (propRes.success && propRes.data) {
      setProperties(propRes.data as any[])
    }
    if (costRes.success && costRes.data) {
      setList(costRes.data as Cost[])
    } else {
      setList([])
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [filterProperty, filterCategory, filterInitial, filterDateFrom, filterDateTo])

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amount = Number(addForm.amount)
    if (!addForm.property_id || !addForm.category || !Number.isFinite(amount) || amount <= 0) {
      setError(t('validationError'))
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await costAPI.create({
        property_id: addForm.property_id,
        room_id: addForm.room_id ? Number(addForm.room_id) : undefined,
        category: addForm.category,
        is_initial: addForm.is_initial,
        amount,
        cost_date: addForm.cost_date || undefined,
        note: addForm.note || undefined,
      })
      if (res.success) {
        setShowAdd(false)
        setAddForm({
          property_id: properties[0]?.id ?? 0,
          room_id: '',
          category: 'partition',
          is_initial: false,
          amount: '',
          cost_date: new Date().toISOString().slice(0, 10),
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

  const categoryLabel = (cat: string) => t(COST_CATEGORY_KEYS[cat] || 'categoryOther')

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="text-gray-600 hover:text-gray-900">← {t('back')}</Link>
        <h1 className="text-2xl font-bold">{t('costsTitle')}</h1>
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
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">{t('allTypes')}</option>
          {Object.entries(COST_CATEGORY_KEYS).map(([value, key]) => (
            <option key={value} value={value}>{t(key)}</option>
          ))}
        </select>
        <select
          value={filterInitial}
          onChange={(e) => setFilterInitial(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">{t('all')}</option>
          <option value="true">{t('initialCost')}</option>
          <option value="false">{t('dailyExpense')}</option>
        </select>
        <input
          type="date"
          value={filterDateFrom}
          onChange={(e) => setFilterDateFrom(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        />
        <input
          type="date"
          value={filterDateTo}
          onChange={(e) => setFilterDateTo(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
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
          {t('addCost')}
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
                <th className="border border-gray-200 px-3 py-2 text-left text-sm">{t('costKind')}</th>
                <th className="border border-gray-200 px-3 py-2 text-right text-sm">{t('amount')}</th>
                <th className="border border-gray-200 px-3 py-2 text-left text-sm">{t('note')}</th>
              </tr>
            </thead>
            <tbody>
              {list.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="border border-gray-200 px-3 py-2 text-sm">
                    {row.cost_date ? new Date(row.cost_date).toLocaleDateString('zh-TW') : '-'}
                  </td>
                  <td className="border border-gray-200 px-3 py-2 text-sm">{categoryLabel(row.category)}</td>
                  <td className="border border-gray-200 px-3 py-2 text-sm">
                    {row.is_initial ? t('initialCost') : t('dailyExpense')}
                  </td>
                  <td className="border border-gray-200 px-3 py-2 text-sm text-right">NT$ {row.amount}</td>
                  <td className="border border-gray-200 px-3 py-2 text-sm text-gray-600">{row.note ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {list.length === 0 && (
            <p className="text-gray-500 py-6 text-center">{t('noCosts')}</p>
          )}
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">{t('addCost')}</h2>
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
                  value={addForm.category}
                  onChange={(e) => setAddForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2"
                  disabled={submitting}
                >
                  {Object.entries(COST_CATEGORY_KEYS).map(([value, key]) => (
                    <option key={value} value={value}>{t(key)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={addForm.is_initial}
                    onChange={(e) => setAddForm((f) => ({ ...f, is_initial: e.target.checked }))}
                    disabled={submitting}
                  />
                  <span className="text-sm font-medium text-gray-700">{t('initialCost')}</span>
                </label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('costDate')}</label>
                <input
                  type="date"
                  value={addForm.cost_date}
                  onChange={(e) => setAddForm((f) => ({ ...f, cost_date: e.target.value }))}
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
