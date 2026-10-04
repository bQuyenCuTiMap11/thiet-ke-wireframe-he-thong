import { jwtVerify, SignJWT } from 'jose'
import type { NextRequest, NextResponse } from 'next/server'

export type UserRole = 'customer' | 'admin' | 'specialist'
export type SessionUser = {
  userId: number
  fullName: string
  email: string
  phone: string
  role: UserRole
}

export const sessionCookieName = 'spa_session'
const sessionDuration = 60 * 60 * 24 * 7

function sessionKey() {
  const secret = process.env.SESSION_SECRET
  if (!secret || secret.length < 32) throw new Error('SESSION_SECRET_NOT_CONFIGURED')
  return new TextEncoder().encode(secret)
}

export async function createSessionToken(user: SessionUser) {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(user.userId))
    .setIssuedAt()
    .setExpirationTime(`${sessionDuration}s`)
    .sign(sessionKey())
}

export async function getSessionUser(request: NextRequest): Promise<SessionUser | null> {
  const token = request.cookies.get(sessionCookieName)?.value
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, sessionKey(), { algorithms: ['HS256'] })
    if (
      typeof payload.userId !== 'number' ||
      typeof payload.fullName !== 'string' ||
      typeof payload.email !== 'string' ||
      typeof payload.phone !== 'string' ||
      !['customer', 'admin', 'specialist'].includes(String(payload.role))
    ) return null

    return {
      userId: payload.userId,
      fullName: payload.fullName,
      email: payload.email,
      phone: payload.phone,
      role: payload.role as UserRole,
    }
  } catch {
    return null
  }
}

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(sessionCookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: sessionDuration,
  })
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(sessionCookieName, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
}