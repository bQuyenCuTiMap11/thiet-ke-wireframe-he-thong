import { NextRequest, NextResponse } from 'next/server'
import { getDbPool, sql } from '@/lib/db'
import { getSessionUser } from '@/lib/session'

export const runtime = 'nodejs'

const statusValues: Record<string, string> = {
  'Chờ xác nhận': 'pending',
  'Đã xác nhận': 'confirmed',
  'Đã hoàn thành': 'completed',
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser(request)
  if (!user) return NextResponse.json({ error: 'Vui lòng đăng nhập.' }, { status: 401 })
  if (user.role !== 'admin' && user.role !== 'specialist') {
    return NextResponse.json({ error: 'Bạn không có quyền cập nhật lịch.' }, { status: 403 })
  }

  const { id: rawId } = await context.params
  const id = Number(rawId)
  const body = await request.json().catch(() => null)
  const databaseStatus = typeof body?.status === 'string' ? statusValues[body.status] : undefined
  if (!Number.isInteger(id) || id < 1 || !databaseStatus) {
    return NextResponse.json({ error: 'Mã lịch hoặc trạng thái không hợp lệ.' }, { status: 400 })
  }

  try {
    const result = await (await getDbPool()).request()
      .input('id', sql.Int, id)
      .input('status', sql.VarChar(20), databaseStatus)
      .input('userId', sql.Int, user.userId)
      .input('role', sql.VarChar(20), user.role)
      .query(`
        UPDATE appointmentRow
        SET status = @status, updated_at = GETDATE()
        FROM LICH_HEN AS appointmentRow
        WHERE appointmentRow.appointment_id = @id
          AND (@role = 'admin' OR EXISTS (
            SELECT 1 FROM CHUYEN_VIEN AS specialist
            WHERE specialist.user_id = @userId
              AND specialist.specialist_id = appointmentRow.specialist_id
          ));
        SELECT @@ROWCOUNT AS affected;
      `)

    if (result.recordset[0]?.affected !== 1) {
      return NextResponse.json({ error: 'Không tìm thấy lịch hoặc bạn không có quyền cập nhật.' }, { status: 404 })
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'SQLSERVER_NOT_CONFIGURED') {
      return NextResponse.json({ error: 'Chưa cấu hình kết nối SQL Server.' }, { status: 503 })
    }
    console.error('Appointment update failed:', error)
    return NextResponse.json({ error: 'Không thể cập nhật lịch hẹn.' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser(request)
  if (!user) return NextResponse.json({ error: 'Vui lòng đăng nhập.' }, { status: 401 })
  if (user.role !== 'admin') return NextResponse.json({ error: 'Chỉ quản trị viên mới được xóa lịch.' }, { status: 403 })

  const { id: rawId } = await context.params
  const id = Number(rawId)
  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ error: 'Mã lịch không hợp lệ.' }, { status: 400 })
  }

  try {
    const result = await (await getDbPool()).request()
      .input('id', sql.Int, id)
      .query(`
        DELETE FROM LICH_HEN
        WHERE appointment_id = @id AND status = 'pending'
          AND NOT EXISTS (SELECT 1 FROM DANH_GIA WHERE DANH_GIA.appointment_id = LICH_HEN.appointment_id)
          AND NOT EXISTS (SELECT 1 FROM AP_DUNG_KM WHERE AP_DUNG_KM.appointment_id = LICH_HEN.appointment_id);
        SELECT @@ROWCOUNT AS affected;
      `)

    if (result.recordset[0]?.affected !== 1) {
      return NextResponse.json({ error: 'Chỉ xóa được lịch đang chờ xác nhận và chưa phát sinh dữ liệu liên quan.' }, { status: 409 })
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'SQLSERVER_NOT_CONFIGURED') {
      return NextResponse.json({ error: 'Chưa cấu hình kết nối SQL Server.' }, { status: 503 })
    }
    console.error('Appointment deletion failed:', error)
    return NextResponse.json({ error: 'Không thể xóa lịch hẹn.' }, { status: 500 })
  }
}