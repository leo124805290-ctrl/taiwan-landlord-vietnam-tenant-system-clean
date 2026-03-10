import { getDb } from '@/src/server/db'

type Cache = {
  columnsByTable: Map<string, Set<string>>
  tables: Set<string> | null
}

declare global {
  // eslint-disable-next-line no-var
  var __schemaCache: Cache | undefined
}

function cache(): Cache {
  if (!globalThis.__schemaCache) {
    globalThis.__schemaCache = {
      columnsByTable: new Map(),
      tables: null,
    }
  }
  return globalThis.__schemaCache
}

export async function tableExists(tableName: string) {
  const c = cache()
  if (c.tables) return c.tables.has(tableName)

  const db = getDb()
  const { rows } = await db.query(
    `SELECT table_name
     FROM information_schema.tables
     WHERE table_schema = 'public'`
  )
  c.tables = new Set(rows.map((r: any) => String(r.table_name)))
  return c.tables.has(tableName)
}

export async function columnExists(tableName: string, columnName: string) {
  const c = cache()
  const key = tableName
  const cached = c.columnsByTable.get(key)
  if (cached) return cached.has(columnName)

  const db = getDb()
  const { rows } = await db.query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1`,
    [tableName]
  )
  const cols: Set<string> = new Set<string>(rows.map((r: any) => String(r.column_name)))
  c.columnsByTable.set(key, cols)
  return cols.has(columnName)
}

