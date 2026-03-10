import { getDb } from '@/src/server/db'
import { ok } from '@/src/server/http'

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return ok({ status: 'offline', reason: 'Missing DATABASE_URL' })
  }

  try {
    const db = getDb()
    await db.query('SELECT 1')
    return ok({ status: 'ok' })
  } catch (e) {
    return ok({
      status: 'unhealthy',
      reason: e instanceof Error ? e.message : String(e),
    })
  }
}

