import { ok } from '@/src/server/http'

export async function GET() {
  return ok({ status: 'ok' })
}

