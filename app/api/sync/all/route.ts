import { getDb } from '@/src/server/db'
import { fail, ok } from '@/src/server/http'
import { columnExists, tableExists } from '@/src/server/schema'

export async function GET() {
  try {
    // 沒有 DATABASE_URL 時不要讓整站卡死：回傳空資料讓前端可離線使用（localStorage）
    if (!process.env.DATABASE_URL) {
      return ok({
        properties: [],
        rooms: [],
        payments: [],
        tenants: [],
        history: [],
        maintenance: [],
        mode: 'offline',
      })
    }

    const db = getDb()
    const hasProperties = await tableExists('properties')
    if (!hasProperties) {
      return ok({
        properties: [],
        rooms: [],
        payments: [],
        tenants: [],
        history: [],
        maintenance: [],
      })
    }

    const propsRes = await db.query('SELECT id, name, address FROM properties ORDER BY name')

    const properties = await Promise.all(
      propsRes.rows.map(async (p: any) => {
        // rooms：做 schema 容錯，避免欄位不存在造成整包同步失敗
        const rooms: any[] = []
        if (await tableExists('rooms')) {
          const cols = {
            floor: (await columnExists('rooms', 'floor')) ? 'floor' : null,
            room_number: (await columnExists('rooms', 'room_number')) ? 'room_number' : null,
            monthly_rent: (await columnExists('rooms', 'monthly_rent')) ? 'monthly_rent' : null,
            deposit: (await columnExists('rooms', 'deposit')) ? 'deposit' : null,
            status: (await columnExists('rooms', 'status')) ? 'status' : null,
            tenant_name: (await columnExists('rooms', 'tenant_name')) ? 'tenant_name' : null,
            tenant_phone: (await columnExists('rooms', 'tenant_phone')) ? 'tenant_phone' : null,
            check_in_date: (await columnExists('rooms', 'check_in_date')) ? 'check_in_date' : null,
            check_out_date: (await columnExists('rooms', 'check_out_date')) ? 'check_out_date' : null,
            current_meter: (await columnExists('rooms', 'current_meter')) ? 'current_meter' : null,
            previous_meter: (await columnExists('rooms', 'previous_meter')) ? 'previous_meter' : null,
          }

          const select = [
            'id',
            'property_id',
            cols.floor ? `${cols.floor} as floor` : 'NULL::int as floor',
            cols.room_number ? `${cols.room_number} as room_number` : `id::text as room_number`,
            cols.monthly_rent ? `${cols.monthly_rent} as monthly_rent` : '0::int as monthly_rent',
            cols.deposit ? `${cols.deposit} as deposit` : '0::int as deposit',
            cols.status ? `${cols.status} as status` : `'vacant'::text as status`,
            cols.tenant_name ? `${cols.tenant_name} as tenant_name` : `''::text as tenant_name`,
            cols.tenant_phone ? `${cols.tenant_phone} as tenant_phone` : `''::text as tenant_phone`,
            cols.check_in_date ? `${cols.check_in_date} as check_in_date` : `NULL::date as check_in_date`,
            cols.check_out_date ? `${cols.check_out_date} as check_out_date` : `NULL::date as check_out_date`,
            cols.current_meter ? `${cols.current_meter} as current_meter` : `0::int as current_meter`,
            cols.previous_meter ? `${cols.previous_meter} as previous_meter` : `0::int as previous_meter`,
          ].join(', ')

          const roomsRes = await db.query(
            `SELECT ${select}
             FROM rooms
             WHERE property_id = $1
             ORDER BY floor NULLS LAST, room_number`,
            [p.id]
          )

          rooms.push(
            ...roomsRes.rows.map((r: any) => ({
              id: r.id,
              f: Number(r.floor ?? 0),
              n: String(r.room_number ?? ''),
              r: Number(r.monthly_rent ?? 0),
              d: Number(r.deposit ?? 0),
              s: r.status === 'vacant' ? 'available' : r.status,
              t: r.tenant_name ?? '',
              p: r.tenant_phone ?? '',
              in: r.check_in_date ? String(r.check_in_date).slice(0, 10) : '',
              out: r.check_out_date ? String(r.check_out_date).slice(0, 10) : '',
              cm: Number(r.current_meter ?? 0),
              pm: Number(r.previous_meter ?? 0),
            }))
          )
        }

        // 其他表：不存在就回空陣列，避免 getAllData 整包炸掉
        const paymentsRes = (await tableExists('payments'))
          ? await db.query('SELECT * FROM payments WHERE property_id = $1 ORDER BY created_at DESC', [p.id])
          : { rows: [] as any[] }
        const historyRes = (await tableExists('history'))
          ? await db.query('SELECT * FROM history WHERE property_id = $1 ORDER BY created_at DESC LIMIT 200', [p.id])
          : { rows: [] as any[] }
        const maintenanceRes = (await tableExists('maintenance'))
          ? await db.query('SELECT * FROM maintenance WHERE property_id = $1 ORDER BY created_at DESC', [p.id])
          : { rows: [] as any[] }

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
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.includes('Missing DATABASE_URL')) {
      return ok({
        properties: [],
        rooms: [],
        payments: [],
        tenants: [],
        history: [],
        maintenance: [],
        mode: 'offline',
      })
    }
    return fail('同步資料失敗', 'DB_ERROR', { status: 500 }, msg)
  }
}

