import { NextRequest, NextResponse } from 'next/server'
import { clearSessionCookie, getSessionUser } from '@/lib/session'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user) return NextResponse.json({ user: null }, { status: 401 })
  return NextResponse.json({ user })
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  clearSessionCookie(response)
  return response
}