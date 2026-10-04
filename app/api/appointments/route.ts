import { NextRequest, NextResponse } from 'next/server'
import { getDbPool, sql } from '@/lib/db'
import { getSessionUser } from '@/lib/session'

export const runtime = 'nodejs'

const displayStatus: Record<string, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  completed: 'Đã hoàn thành',
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function optionName(value: string) {
  return value.split(' · ')[0].trim()
}

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user) return NextResponse.json({ error: 'Vui lòng đăng nhập.' }, { status: 401 })

  try {
    const result = await (await getDbPool()).request()
      .input('userId', sql.Int, user.userId)
      .input('role', sql.VarChar(20), user.role)
      .query(`
        SELECT a.appointment_id AS id,
          CONVERT(char(10), a.appointment_date, 23) AS date,
          CONVERT(char(5), a.start_time, 108) AS time,
          customer.full_name AS customer, customer.phone AS phone,
          service.name AS service, specialistUser.full_name AS specialist,
          CONCAT(branch.name, N' · ', branch.address) AS branch,
          a.notes AS note,
          CASE a.status
            WHEN 'pending' THEN N'Chờ xác nhận'
            WHEN 'confirmed' THEN N'Đã xác nhận'
            WHEN 'completed' THEN N'Đã hoàn thành'
          END AS status
        FROM LICH_HEN AS a
        INNER JOIN NGUOI_DUNG AS customer ON customer.user_id = a.customer_id
        INNER JOIN CHI_NHANH AS branch ON branch.branch_id = a.branch_id
        INNER JOIN DICH_VU AS service ON service.service_id = a.service_id
        INNER JOIN CHUYEN_VIEN AS specialist ON specialist.specialist_id = a.specialist_id
        INNER JOIN NGUOI_DUNG AS specialistUser ON specialistUser.user_id = specialist.user_id
        WHERE (@role <> 'customer' OR a.customer_id = @userId)
          AND (@role <> 'specialist' OR specialist.user_id = @userId)
        ORDER BY a.appointment_date DESC, a.start_time DESC
      `)

    return NextResponse.json(result.recordset.map(item => ({
      ...item,
      status: displayStatus[String(item.status)] ?? 'Chờ xác nhận',
    })))
  } catch (error) {
    if (error instanceof Error && error.message === 'SQLSERVER_NOT_CONFIGURED') {
      return NextResponse.json({ error: 'Chưa cấu hình kết nối SQL Server.' }, { status: 503 })
    }
    console.error('Appointment query failed:', error)
    return NextResponse.json({ error: 'Không thể tải lịch hẹn.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user) return NextResponse.json({ error: 'Vui lòng đăng nhập.' }, { status: 401 })
  if (user.role !== 'customer' && user.role !== 'admin') {
    return NextResponse.json({ error: 'Bạn không có quyền tạo lịch hẹn.' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const date = text(body?.date)
  const time = text(body?.time)
  const branchName = optionName(text(body?.branch))
  const serviceName = optionName(text(body?.service))
  const specialistName = optionName(text(body?.specialist))
  const note = text(body?.note).slice(0, 500)
  const customerEmail = text(body?.customerEmail).toLowerCase()

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time) || !branchName || !serviceName || !specialistName) {
    return NextResponse.json({ error: 'Thông tin lịch hẹn không hợp lệ.' }, { status: 400 })
  }

  try {
    const pool = await getDbPool()
    let customerId = user.userId
    let customerName = user.fullName
    let customerPhone = user.phone

    if (user.role === 'admin') {
      if (!customerEmail) return NextResponse.json({ error: 'Nhập email của khách hàng đã có tài khoản.' }, { status: 400 })
      const customerResult = await pool.request()
        .input('email', sql.VarChar(100), customerEmail)
        .query(`SELECT TOP (1) user_id AS id, full_name AS name, phone FROM NGUOI_DUNG WHERE email = @email AND role = 'customer' AND status = 1`)
      const customer = customerResult.recordset[0]
      if (!customer) return NextResponse.json({ error: 'Không tìm thấy khách hàng đang hoạt động với email này.' }, { status: 404 })
      customerId = customer.id
      customerName = customer.name
      customerPhone = customer.phone
    } else if (user.role !== 'customer') {
      return NextResponse.json({ error: 'Chỉ khách hàng mới được đặt lịch.' }, { status: 403 })
    }

    const transaction = new sql.Transaction(pool)
    await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE)

    try {
      const branchResult = await transaction.request()
        .input('name', sql.NVarChar(150), branchName)
        .query('SELECT TOP (1) branch_id AS id, name, address FROM CHI_NHANH WHERE name = @name AND status = 1')
      const serviceResult = await transaction.request()
        .input('name', sql.NVarChar(150), serviceName)
        .query('SELECT TOP (1) service_id AS id, name, duration_min AS duration, price FROM DICH_VU WHERE name = @name AND status = 1')

      const branch = branchResult.recordset[0]
      const service = serviceResult.recordset[0]
      if (!branch || !service) {
        await transaction.rollback()
        return NextResponse.json({ error: 'Chi nhánh hoặc dịch vụ không còn hoạt động.' }, { status: 400 })
      }

      const specialistResult = await transaction.request()
        .input('branchId', sql.Int, branch.id)
        .input('name', sql.NVarChar(100), specialistName)
        .query(`
          SELECT TOP (1) specialist.specialist_id AS id, person.full_name AS name
          FROM CHUYEN_VIEN AS specialist
          INNER JOIN NGUOI_DUNG AS person ON person.user_id = specialist.user_id
          WHERE specialist.branch_id = @branchId AND specialist.status = 1 AND person.status = 1
            AND (@name = N'Không yêu cầu chuyên viên' OR person.full_name = @name)
          ORDER BY specialist.specialist_id
        `)
      const specialist = specialistResult.recordset[0]
      if (!specialist) {
        await transaction.rollback()
        return NextResponse.json({ error: 'Chuyên viên đã chọn không thuộc chi nhánh này.' }, { status: 400 })
      }

      const conflict = await transaction.request()
        .input('specialistId', sql.Int, specialist.id)
        .input('date', sql.Date, date)
        .input('time', sql.VarChar(5), time)
        .input('duration', sql.Int, service.duration)
        .query(`
          SELECT TOP (1) appointment_id
          FROM LICH_HEN WITH (UPDLOCK, HOLDLOCK)
          WHERE specialist_id = @specialistId AND appointment_date = @date
            AND status IN ('pending', 'confirmed')
            AND start_time < CONVERT(time(0), DATEADD(minute, @duration, CONVERT(datetime, @time)))
            AND end_time > CONVERT(time(0), CONVERT(datetime, @time))
        `)
      if (conflict.recordset.length) {
        await transaction.rollback()
        return NextResponse.json({ error: 'Khung giờ này vừa được đặt. Vui lòng chọn giờ khác.' }, { status: 409 })
      }

      const inserted = await transaction.request()
        .input('customerId', sql.Int, customerId)
        .input('branchId', sql.Int, branch.id)
        .input('serviceId', sql.Int, service.id)
        .input('specialistId', sql.Int, specialist.id)
        .input('date', sql.Date, date)
        .input('time', sql.VarChar(5), time)
        .input('duration', sql.Int, service.duration)
        .input('amount', sql.Decimal(12, 2), service.price)
        .input('notes', sql.NVarChar(500), note || null)
        .query(`
          INSERT INTO LICH_HEN
            (customer_id, branch_id, service_id, specialist_id, appointment_date,
             start_time, end_time, status, total_amount, notes)
          OUTPUT INSERTED.appointment_id AS id
          VALUES (@customerId, @branchId, @serviceId, @specialistId, @date,
            CONVERT(time(0), CONVERT(datetime, @time)),
            CONVERT(time(0), DATEADD(minute, @duration, CONVERT(datetime, @time))),
            'pending', @amount, @notes)
        `)

      await transaction.commit()
      return NextResponse.json({
        id: inserted.recordset[0].id,
        date,
        time,
        customer: customerName,
        phone: customerPhone,
        service: service.name,
        specialist: specialist.name,
        branch: `${branch.name} · ${branch.address}`,
        status: 'Chờ xác nhận',
      }, { status: 201 })
    } catch (error) {
      await transaction.rollback().catch(() => undefined)
      throw error
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'SQLSERVER_NOT_CONFIGURED') {
      return NextResponse.json({ error: 'Chưa cấu hình kết nối SQL Server.' }, { status: 503 })
    }
    console.error('Appointment creation failed:', error)
    return NextResponse.json({ error: 'Không thể tạo lịch hẹn.' }, { status: 500 })
  }
}