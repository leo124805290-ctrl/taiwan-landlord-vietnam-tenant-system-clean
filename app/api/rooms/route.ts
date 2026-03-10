import { getDb } from '@/src/server/db'
import { fail, ok } from '@/src/server/http'

function normalizeRoomStatus(input: unknown) {
  // DB 端常見：vacant/occupied/maintenance；前端常見：available/occupied/maintenance
  if (input === 'available') return 'vacant'
  if (input === 'vacant') return 'vacant'
  if (input === 'occupied') return 'occupied'
  if (input === 'maintenance') return 'maintenance'
  if (input === 'reserved') return 'reserved'
  if (input === 'pending_payment') return 'pending_payment'
  return 'vacant'
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const property_id = Number(body.property_id)
    const floor = body.floor ?? null
    const room_number = typeof body.room_number === 'string' ? body.room_number.trim() : ''
    const monthly_rent = Number(body.monthly_rent ?? 0)
    const deposit = Number(body.deposit ?? 0)
    const status = normalizeRoomStatus(body.status)

    if (!property_id || !room_number) {
      return fail('缺少必填欄位: property_id, room_number', 'VALIDATION_ERROR', { status: 400 })
    }

    const db = getDb()
    const { rows } = await db.query(
      `INSERT INTO rooms (property_id, floor, room_number, monthly_rent, deposit, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [property_id, floor, room_number, monthly_rent, deposit, status]
    )

    // 與前端 `Modal.tsx` 的期待一致：roomData.data.id
    return ok({ id: rows[0].id })
  } catch (e) {
    return fail('新增房間失敗', 'DB_ERROR', { status: 500 }, e instanceof Error ? e.message : e)
  }
}

