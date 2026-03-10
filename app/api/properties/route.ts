import { getDb } from '@/src/server/db'
import { fail, ok } from '@/src/server/http'

export async function GET() {
  try {
    const db = getDb()
    const { rows } = await db.query(
      `SELECT id, name, address, owner_name, owner_phone, created_at
       FROM properties
       ORDER BY name`
    )
    return ok(rows)
  } catch (e) {
    return fail('獲取物業失敗', 'DB_ERROR', { status: 500 }, e instanceof Error ? e.message : e)
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const address = typeof body.address === 'string' ? body.address.trim() : ''
    const owner_name = typeof body.owner_name === 'string' ? body.owner_name.trim() : ''
    const owner_phone = typeof body.owner_phone === 'string' ? body.owner_phone.trim() : ''

    if (!name) return fail('物業名稱為必填', 'VALIDATION_ERROR', { status: 400 })

    const db = getDb()
    const { rows } = await db.query(
      `INSERT INTO properties (name, address, owner_name, owner_phone)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, address, owner_name, owner_phone, created_at`,
      [name, address, owner_name, owner_phone]
    )

    // 與前端 `Modal.tsx` 的期待一致：propData.data.id
    return ok({ id: rows[0].id })
  } catch (e) {
    return fail('新增物業失敗', 'DB_ERROR', { status: 500 }, e instanceof Error ? e.message : e)
  }
}

