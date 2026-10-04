import { NextResponse } from 'next/server'
import { getDbPool } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET() {
  try {
    await (await getDbPool()).request().query('SELECT 1 AS connected')
    return NextResponse.json({ database: 'connected' })
  } catch (error) {
    if (error instanceof Error && error.message === 'SQLSERVER_NOT_CONFIGURED') {
      return NextResponse.json({ database: 'not-configured' }, { status: 503 })
    }
    console.error('Database health check failed:', error)
    return NextResponse.json({ database: 'unavailable' }, { status: 503 })
  }
}