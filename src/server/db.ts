import { Pool } from 'pg'

declare global {
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined
}

function createPool() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('Missing DATABASE_URL')
  }

  // Zeabur Postgres 通常可直連；若你後續改成需要 SSL，可用 PGSSLMODE=require + 自行調整
  const ssl =
    process.env.PGSSLMODE === 'require' || connectionString.includes('sslmode=require')
      ? { rejectUnauthorized: false }
      : undefined

  return new Pool({
    connectionString,
    ssl,
    max: 5,
  })
}

export function getDb() {
  if (process.env.NODE_ENV === 'production') {
    // serverless 環境避免重複建立過多連線
    if (!globalThis.__pgPool) globalThis.__pgPool = createPool()
    return globalThis.__pgPool
  }
  // dev / local
  if (!globalThis.__pgPool) globalThis.__pgPool = createPool()
  return globalThis.__pgPool
}

