'use client'

import { useMemo, useState } from 'react'
import { Check, ChevronRight, Clock3 } from 'lucide-react'

export type BookingForm = {
  name: string
  phone: string
  email: string
  note: string
  branch: string
  service: string
  date: string
  time: string
  specialist: string
  promo: string
}

const businessHours = Array.from({ length: 12 }, (_, index) => `${String(index + 9).padStart(2, '0')}:00`)
const labels = ['Chi nhánh', 'Dịch vụ', 'Ngày & giờ', 'Chuyên viên', 'Xác nhận']

export default function BookingFlow({
  onDone,
  onSubmit,
}: {
  onDone: () => void
  onSubmit?: (form: BookingForm) => Promise<void> | void
}) {
  const [step, setStep] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<BookingForm>({
    name: '',
    phone: '',
    email: '',
    note: '',
    branch: 'Chi Spa 1 · 10–12 đường 30/4',
    service: 'Massage Body Relax · 60 phút',
    date: '',
    time: '09:00',
    specialist: 'Nguyễn Ngọc Linh · 4.9 ★',
    promo: '',
  })
  const update = (key: keyof BookingForm, value: string) => setForm(current => ({ ...current, [key]: value }))
  const minDate = useMemo(() => new Date().toISOString().slice(0, 10), [])

  const next = async () => {
    setError('')
    if (step === 2 && (!form.date || !form.time)) {
      setError('Vui lòng chọn ngày và khung giờ.')
      return
    }
    if (step === 4) {
      if (!form.name.trim() || !form.phone.trim()) {
        setError('Vui lòng nhập họ tên và số điện thoại.')
        return
      }
      try {
        await onSubmit?.(form)
        setSubmitted(true)
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : 'Không thể tạo lịch hẹn lúc này.')
      }
      return
    }
    setStep(current => current + 1)
  }

  if (submitted) {
    return (
      <section className="booking-card">
        <div className="success-state">
          <div className="success-icon"><Check /></div>
          <strong>Đặt lịch thành công!</strong>
          <p>Cảm ơn {form.name} đã tin chọn An Nhiên. Lịch của bạn đang ở trạng thái <b>Chờ xác nhận</b>; chúng tôi sẽ liên hệ qua số <b>{form.phone}</b> sau khi nhân viên xử lý.</p>
          <small>Bạn có thể theo dõi trạng thái mới trong mục “Lịch sử của tôi”.</small>
        </div>
        <button className="outline-btn" onClick={onDone}>Xem lịch sử của tôi</button>
      </section>
    )
  }

  return (
    <section className="booking-card">
      <div className="panel-head">
        <div>
          <span className="eyebrow">ĐẶT LỊCH ONLINE</span>
          <h2>Chọn lịch chăm sóc của bạn</h2>
          <p className="booking-subtitle">Điền thông tin để đội ngũ An Nhiên hỗ trợ bạn chu đáo nhất.</p>
        </div>
        <span className="date-pill">Bước {step + 1}/5</span>
      </div>
      <div className="booking-steps">
        {labels.map((label, index) => (
          <span className={index <= step ? 'active' : ''} key={label}>{index + 1}. {label}</span>
        ))}
      </div>
      {step === 0 && (
        <label>Chọn chi nhánh
          <select value={form.branch} onChange={event => update('branch', event.target.value)}>
            <option>Chi Spa 1 · 10–12 đường 30/4</option>
            <option>Chi Spa 3 · 134/16 đường 30/4</option>
          </select>
        </label>
      )}
      {step === 1 && (
        <label>Chọn dịch vụ
          <select value={form.service} onChange={event => update('service', event.target.value)}>
            <option>Massage Body Relax · 60 phút</option>
            <option>Chăm sóc da mặt · 60 phút</option>
            <option>Gội đầu dưỡng sinh · 45 phút</option>
          </select>
        </label>
      )}
      {step === 2 && (
        <div className="booking-date-time">
          <label>Chọn ngày
            <input type="date" min={minDate} value={form.date} onChange={event => update('date', event.target.value)} required />
          </label>
          <fieldset className="time-picker">
            <legend><Clock3 /> Chọn giờ mở cửa</legend>
            <p>09:00–20:00 · Chọn một khung giờ phù hợp</p>
            <div className="time-grid">
              {businessHours.map(time => (
                <button type="button" key={time} className={form.time === time ? 'selected' : ''} onClick={() => update('time', time)}>{time}</button>
              ))}
            </div>
          </fieldset>
        </div>
      )}
      {step === 3 && (
        <>
          <label>Chọn chuyên viên
            <select value={form.specialist} onChange={event => update('specialist', event.target.value)}>
              <option>Nguyễn Ngọc Linh · 4.9 ★</option>
              <option>Trần Minh Thư · 4.8 ★</option>
              <option>Không yêu cầu chuyên viên</option>
            </select>
          </label>
          <label>Mã khuyến mãi (không bắt buộc)
            <input value={form.promo} onChange={event => update('promo', event.target.value)} placeholder="ANNHIEN10" />
          </label>
        </>
      )}
      {step === 4 && (
        <div className="booking-review">
          <h3>Kiểm tra thông tin</h3>
          <p><b>{form.service}</b><br />{form.date} · {form.time} · {form.branch}<br />{form.specialist}</p>
          <label>Họ và tên<input value={form.name} onChange={event => update('name', event.target.value)} placeholder="Nguyễn Minh Anh" required /></label>
          <label>Số điện thoại<input value={form.phone} onChange={event => update('phone', event.target.value)} inputMode="tel" placeholder="0398 555 678" required /></label>
          <label>Email<input type="email" value={form.email} onChange={event => update('email', event.target.value)} placeholder="ban@example.com" /></label>
          <label>Ghi chú<textarea value={form.note} onChange={event => update('note', event.target.value)} placeholder="Nhu cầu đặc biệt của bạn..." /></label>
        </div>
      )}
      {error && <p className="form-error">{error}</p>}
      <div className="booking-actions">
        {step > 0 && <button className="outline-btn" type="button" onClick={() => setStep(current => current - 1)}>Quay lại</button>}
        <button className="primary-btn" type="button" onClick={next}>{step === 4 ? 'Xác nhận đặt lịch' : 'Tiếp tục'} <ChevronRight /></button>
      </div>
    </section>
  )
}
