import { NextResponse } from 'next/server'

export type ApiOk<T> = { success: true; data: T; timestamp: string }
export type ApiFail = {
  success: false
  error: { code: string; message: string; details?: unknown }
  timestamp: string
}

export function ok<T>(data: T, init?: ResponseInit) {
  const body: ApiOk<T> = { success: true, data, timestamp: new Date().toISOString() }
  return NextResponse.json(body, init)
}

export function fail(message: string, code = 'UNKNOWN_ERROR', init?: ResponseInit, details?: unknown) {
  const body: ApiFail = {
    success: false,
    error: { code, message, details },
    timestamp: new Date().toISOString(),
  }
  return NextResponse.json(body, init ?? { status: 500 })
}

