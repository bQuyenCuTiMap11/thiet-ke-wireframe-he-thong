import bcrypt from 'bcryptjs'
import { NextRequest, NextResponse } from 'next/server'
import { getDbPool, isSqlServerConnectionError, sql, sqlServerConnectionMessage } from '@/lib/db'
import { createSessionToken, setSessionCookie, type SessionUser, type UserRole } from '@/lib/session'

export const runtime = 'nodejs'

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d\s]).{8,20}$/

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const login = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body?.password === 'string' ? body.password : ''

  if (!login || !passwordPattern.test(password)) {
    return NextResponse.json({ error: 'Email/tên đăng nhập hoặc mật khẩu không hợp lệ.' }, { status: 400 })
  }

  try {
    const alias = login.includes('@') ? login : `${login}@spa.local`
    const result = await (await getDbPool()).request()
      .input('login', login)
      .input('alias', alias)
      .query(`
        SELECT TOP (1) user_id AS userId, full_name AS fullName, email, phone,
          password_hash AS passwordHash, role, status
        FROM NGUOI_DUNG
        WHERE email = @login OR email = @alias
      `)

    const record = result.recordset[0] as {
      userId: number
      fullName: string
      email: string
      phone: string
      passwordHash: string
      role: string
      status: number | string
    } | undefined
    const validPassword = record ? await bcrypt.compare(password, String(record.passwordHash)) : false
    if (!record || Number(record.status) !== 1 || !validPassword) {
      return NextResponse.json({ error: 'Thông tin đăng nhập chưa chính xác.' }, { status: 401 })
    }

    const user: SessionUser = {
      userId: record.userId,
      fullName: record.fullName,
      email: record.email,
      phone: record.phone,
      role: record.role as UserRole,
    }
    const token = await createSessionToken(user)
    const response = NextResponse.json({ user })
    setSessionCookie(response, token)
    return response
  } catch (error) {
    if (error instanceof Error && error.message === 'SQLSERVER_NOT_CONFIGURED') {
      return NextResponse.json({ error: 'Chưa cấu hình kết nối SQL Server.' }, { status: 503 })
    }
    if (isSqlServerConnectionError(error)) {
      return NextResponse.json({ error: sqlServerConnectionMessage }, { status: 503 })
    }
    console.error('Login failed:', error)
    return NextResponse.json({ error: 'Không thể đăng nhập lúc này.' }, { status: 500 })
  }
}