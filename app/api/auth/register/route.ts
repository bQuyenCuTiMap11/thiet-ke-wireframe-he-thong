import bcrypt from 'bcryptjs'
import { NextRequest, NextResponse } from 'next/server'
import { getDbPool, isSqlServerConnectionError, sql, sqlServerConnectionMessage } from '@/lib/db'
import { createSessionToken, setSessionCookie, type SessionUser } from '@/lib/session'

export const runtime = 'nodejs'

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d\s]).{8,20}$/
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const fullName = typeof body?.fullName === 'string' ? body.fullName.trim() : ''
  const phone = typeof body?.phone === 'string' ? body.phone.trim() : ''
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body?.password === 'string' ? body.password : ''

  if (!fullName || !phone || !email || !password) {
    return NextResponse.json({ error: 'Vui lòng nhập đủ họ tên, số điện thoại, email và mật khẩu.' }, { status: 400 })
  }
  if (!emailPattern.test(email)) {
    return NextResponse.json({ error: 'Email không hợp lệ.' }, { status: 400 })
  }
  if (phone.length > 20) {
    return NextResponse.json({ error: 'Số điện thoại không hợp lệ.' }, { status: 400 })
  }
  if (!passwordPattern.test(password)) {
    return NextResponse.json({ error: 'Mật khẩu phải có 8–20 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.' }, { status: 400 })
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12)
    const result = await (await getDbPool()).request()
      .input('fullName', fullName)
      .input('phone', phone)
      .input('email', email)
      .input('passwordHash', passwordHash)
      .query(`
        INSERT INTO NGUOI_DUNG (full_name, phone, email, password_hash, role, status)
        OUTPUT INSERTED.user_id AS userId, INSERTED.full_name AS fullName,
          INSERTED.email AS email, INSERTED.phone AS phone, INSERTED.role AS role
        VALUES (@fullName, @phone, @email, @passwordHash, 'customer', 1)
      `)

    const user = result.recordset[0] as SessionUser
    const token = await createSessionToken(user)
    const response = NextResponse.json({ user }, { status: 201 })
    setSessionCookie(response, token)
    return response
  } catch (error) {
    const errorNumber = typeof error === 'object' && error !== null && 'number' in error ? Number(error.number) : 0
    if (errorNumber === 2601 || errorNumber === 2627) {
      return NextResponse.json({ error: 'Email hoặc số điện thoại đã được đăng ký.' }, { status: 409 })
    }
    if (error instanceof Error && error.message === 'SQLSERVER_NOT_CONFIGURED') {
      return NextResponse.json({ error: 'Chưa cấu hình kết nối SQL Server.' }, { status: 503 })
    }
    if (isSqlServerConnectionError(error)) {
      return NextResponse.json({ error: sqlServerConnectionMessage }, { status: 503 })
    }
    console.error('Registration failed:', error)
    return NextResponse.json({ error: 'Không thể tạo tài khoản lúc này.' }, { status: 500 })
  }
}