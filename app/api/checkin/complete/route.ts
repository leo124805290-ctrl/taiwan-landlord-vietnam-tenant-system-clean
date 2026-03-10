import { getDb } from '@/src/server/db'
import { fail, ok } from '@/src/server/http'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const room_id = Number(body.room_id)
    const tenant = body.tenant || {}
    const tenant_name = typeof tenant.tenant_name === 'string' ? tenant.tenant_name.trim() : ''
    const tenant_phone = typeof tenant.tenant_phone === 'string' ? tenant.tenant_phone.trim() : ''
    const check_in_date = typeof tenant.check_in_date === 'string' ? tenant.check_in_date : null
    const check_out_date = typeof tenant.check_out_date === 'string' ? tenant.check_out_date : null
    const payment_option =
      body.payment_option === 'full' || body.payment_option === 'deposit_only' || body.payment_option === 'reservation_only'
        ? body.payment_option
        : null

    if (!room_id || !tenant_name || !check_in_date || !payment_option) {
      return fail('缺少必填欄位', 'VALIDATION_ERROR', { status: 400 })
    }

    const db = getDb()
    const roomRes = await db.query('SELECT id, property_id, monthly_rent, deposit FROM rooms WHERE id = $1', [room_id])
    if (roomRes.rows.length === 0) return fail('房間不存在', 'NOT_FOUND', { status: 404 })

    const room = roomRes.rows[0]

    // 狀態對齊前端：全額→occupied；只押金/只預訂→reserved 或 pending_payment
    const newStatus = payment_option === 'full' ? 'occupied' : payment_option === 'deposit_only' ? 'pending_payment' : 'reserved'

    await db.query(
      `UPDATE rooms
       SET status = $1,
           tenant_name = $2,
           tenant_phone = $3,
           check_in_date = $4,
           check_out_date = $5
       WHERE id = $6`,
      [newStatus, tenant_name, tenant_phone || null, check_in_date, check_out_date, room_id]
    )

    // tenants 表：若存在就更新，否則新增（避免重複）
    await db.query(
      `INSERT INTO tenants (room_id, name, phone, contract_start, contract_end, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (room_id) DO UPDATE
       SET name = EXCLUDED.name,
           phone = EXCLUDED.phone,
           contract_start = EXCLUDED.contract_start,
           contract_end = EXCLUDED.contract_end`,
      [room_id, tenant_name, tenant_phone || '', check_in_date, check_out_date]
    )

    // 全額付款時，補上一筆 payments + history，避免「全額付款沒有 payment history」
    if (payment_option === 'full') {
      const amount = Number(room.monthly_rent || 0) + Number(room.deposit || 0)
      const paid_date = check_in_date
      const note = `入住全額（租金+押金）`

      await db.query(
        `INSERT INTO payments (room_id, property_id, type, amount, paid_date, note, created_at)
         VALUES ($1, $2, 'checkin_full', $3, $4, $5, NOW())`,
        [room_id, room.property_id, amount, paid_date, note]
      )

      await db.query(
        `INSERT INTO history (room_id, property_id, action, description, amount, created_at)
         VALUES ($1, $2, '入住', $3, $4, NOW())`,
        [room_id, room.property_id, `租客 ${tenant_name} 入住（全額付款）`, amount]
      )
    }

    return ok({ message: '入住成功' })
  } catch (e) {
    return fail('入住失敗', 'DB_ERROR', { status: 500 }, e instanceof Error ? e.message : e)
  }
}

