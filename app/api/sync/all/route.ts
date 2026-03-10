import { getDb } from '@/src/server/db'
import { fail, ok } from '@/src/server/http'

export async function GET() {
  try {
    const db = getDb()
    const propsRes = await db.query('SELECT id, name, address FROM properties ORDER BY name')

    const properties = await Promise.all(
      propsRes.rows.map(async (p: any) => {
        const roomsRes = await db.query(
          `SELECT id, floor, room_number, monthly_rent, deposit, status,
                  tenant_name, tenant_phone, check_in_date, check_out_date,
                  current_meter, previous_meter
           FROM rooms
           WHERE property_id = $1
           ORDER BY floor, room_number`,
          [p.id]
        )
        const paymentsRes = await db.query('SELECT * FROM payments WHERE property_id = $1 ORDER BY created_at DESC', [p.id])
        const historyRes = await db.query('SELECT * FROM history WHERE property_id = $1 ORDER BY created_at DESC LIMIT 200', [p.id])
        const maintenanceRes = await db.query('SELECT * FROM maintenance WHERE property_id = $1 ORDER BY created_at DESC', [p.id])

        // 盡量輸出成前端需要的簡化結構（不硬依賴完整後端）
        const rooms = roomsRes.rows.map((r: any) => ({
          id: r.id,
          f: Number(r.floor ?? 0),
          n: String(r.room_number ?? ''),
          r: Number(r.monthly_rent ?? 0),
          d: Number(r.deposit ?? 0),
          s: r.status === 'vacant' ? 'available' : r.status,
          t: r.tenant_name ?? '',
          p: r.tenant_phone ?? '',
          in: r.check_in_date ?? '',
          out: r.check_out_date ?? '',
          cm: r.current_meter ?? 0,
          pm: r.previous_meter ?? 0,
        }))

        return {
          id: p.id,
          name: p.name,
          address: p.address ?? '',
          floors: Math.max(...rooms.map((r: any) => r.f), 1),
          rooms,
          // 這兩個目前仍以 DB 原始結構返回；前端 normalize 會允許陣列
          payments: paymentsRes.rows,
          history: historyRes.rows,
          maintenance: maintenanceRes.rows,
        }
      })
    )

    return ok({
      properties,
      rooms: [],
      payments: [],
      tenants: [],
      history: [],
      maintenance: [],
    })
  } catch (e) {
    return fail('同步資料失敗', 'DB_ERROR', { status: 500 }, e instanceof Error ? e.message : e)
  }
}

