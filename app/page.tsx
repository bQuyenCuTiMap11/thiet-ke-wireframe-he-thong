'use client'

import { useEffect, useState } from 'react'
import BookingFlow, { type BookingForm } from '@/components/booking-flow'
import {
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Grid2X2,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  Search,
  Settings2,
  Sparkles,
  Star,
  Store,
  Tag,
  Trash2,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react'

type Workspace = 'admin' | 'specialist' | 'customer'
type AuthMode = 'login' | 'register'
type AppointmentStatus = 'Chờ xác nhận' | 'Đã xác nhận' | 'Đã hoàn thành'
type Appointment = {
  id: number
  time: string
  date: string
  customer: string
  phone: string
  service: string
  specialist: string
  branch: string
  status: AppointmentStatus
}
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d\s]).{8,20}$/
const passwordRuleMessage = 'Mật khẩu phải có 8–20 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.'

const services = [
  { name: 'Massage Body Relax', detail: '60 phút · từ 450.000đ', tag: 'Thư giãn toàn thân', imageClass: 'image-0' },
  { name: 'Chăm sóc da mặt', detail: '60 phút · từ 380.000đ', tag: 'Phục hồi & cấp ẩm', imageClass: 'image-1' },
  { name: 'Gội đầu dưỡng sinh', detail: '45 phút · từ 250.000đ', tag: 'Thư giãn da đầu', imageClass: 'image-2' },
]

const adminMenu = [
  { label: 'Tổng quan', icon: LayoutDashboard },
  { label: 'Chi nhánh', icon: Store },
  { label: 'Dịch vụ', icon: Sparkles },
  { label: 'Chuyên viên', icon: UsersRound },
  { label: 'Lịch hẹn', icon: CalendarDays },
  { label: 'Khuyến mãi', icon: Tag },
]

const initialCatalog: Record<string, string[]> = {
  'Chi nhánh': ['Chi Spa 1 · 10–12 đường 30/4', 'Chi Spa 3 · 134/16 đường 30/4'],
  'Dịch vụ': ['Massage Body Relax · 60 phút · 450.000đ', 'Chăm sóc da mặt · 60 phút · 380.000đ', 'Gội đầu dưỡng sinh · 45 phút · 250.000đ'],
  'Chuyên viên': ['Nguyễn Ngọc Linh · Massage · 4.9★', 'Trần Minh Thư · Facial · 4.8★'],
  'Khuyến mãi': ['ANNHIEN10 · giảm 10% buổi đầu', 'COMBO20 · giảm 20% gói thư giãn'],
}

function Status({ children }: { children: string }) {
  const kind = children.includes('Chờ') ? 'pending' : children.includes('hoàn') || children.includes('Hủy') ? 'done' : 'confirmed'
  return (
    <span className={`status ${kind}`}>
      <span className="status-dot" />
      {children}
    </span>
  )
}

function LoginScreen({ onLogin }: { onLogin: (workspace: Workspace) => void }) {
  const [mode, setMode] = useState<AuthMode>('login')
  const [account, setAccount] = useState<Workspace>('customer')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (mode === 'register') {
      if (!name.trim() || !phone.trim() || !email.trim()) return setError('Vui lòng điền họ tên, số điện thoại và email.')
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError('Vui lòng nhập email hợp lệ.')
      if (!passwordPattern.test(password)) return setError(passwordRuleMessage)
    }
    if (!email.trim() || !password) return setError('Vui lòng nhập email/tên đăng nhập và mật khẩu.')
    if (!passwordPattern.test(password)) return setError(passwordRuleMessage)

    setBusy(true)
    try {
      const response = await fetch(mode === 'register' ? '/api/auth/register' : '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mode === 'register'
          ? { fullName: name.trim(), phone: phone.trim(), email: email.trim(), password }
          : { email: email.trim(), password }),
      })
      const result = await response.json()
      if (!response.ok) {
        setError(result.error || 'Không thể xác thực tài khoản.')
        return
      }
      if (['customer', 'admin', 'specialist'].includes(result.user?.role)) {
        onLogin(result.user.role as Workspace)
      } else {
        setError('Thông tin vai trò tài khoản không hợp lệ.')
      }
    } catch {
      setError('Không thể kết nối máy chủ. Kiểm tra cấu hình database rồi thử lại.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-visual">
        <div className="login-brand">
          <div className="brand-mark"><Sparkles /></div>
          <strong>AN NHIÊN</strong>
          <small>SPA BOOKING</small>
        </div>
        <div>
          <span className="eyebrow">NƠI BẠN TÌM LẠI SỰ CÂN BẰNG</span>
          <h1>Chăm sóc bản thân,<br /><em>theo cách nhẹ nhàng nhất.</em></h1>
        </div>
      </section>
      <section className="login-card">
        <div className="login-heading">
          <span className="eyebrow">CHÀO MỪNG ĐẾN AN NHIÊN</span>
          <h2>{mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản mới'}</h2>
          <p>{mode === 'login' ? 'Chọn không gian làm việc để tiếp tục.' : 'Đăng ký miễn phí để bắt đầu đặt lịch.'}</p>
        </div>
        {mode === 'login' && (
          <div className="account-tabs">
            {([['customer', 'Khách hàng'], ['admin', 'Quản trị viên'], ['specialist', 'Chuyên viên']] as const).map(([v, l]) => (
              <button key={v} className={account === v ? 'active' : ''} onClick={() => { setAccount(v); setError('') }}>{l}</button>
            ))}
          </div>
        )}
        <form onSubmit={submit} noValidate>
          {mode === 'register' && <>
            <label>Họ và tên<input value={name} onChange={e => setName(e.target.value)} placeholder="Nguyễn Minh Anh" autoComplete="name" /></label>
            <label>Số điện thoại<input value={phone} onChange={e => setPhone(e.target.value)} placeholder="0901 234 567" autoComplete="tel" inputMode="tel" /></label>
          </>}
          <label>Email hoặc tên đăng nhập<input value={email} onChange={e => setEmail(e.target.value)} placeholder={account === 'admin' ? 'adminannhien@gmail.com' : account === 'specialist' ? 'chuyenvienannhien' : 'ban@example.com'} /></label>
          <label>Mật khẩu<input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" minLength={8} maxLength={20} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} /><small className="password-help">8–20 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.</small></label>
          {error && <p className="form-error">{error}</p>}
          <button className="primary-btn full" type="submit" disabled={busy}>{busy ? 'Đang xử lý...' : mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản & vào trang chủ'} <ChevronRight /></button>
        </form>
        <button className="link-btn" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}>
          {mode === 'login' ? 'Chưa có tài khoản? Tạo tài khoản mới' : 'Đã có tài khoản? Đăng nhập'}
        </button>
        {mode === 'login' && (
          <small className="login-hint">
            Admin: adminannhien@gmail.com / Admin@2026 · Chuyên viên: chuyenvienannhien / Chuyenvien@2026
          </small>
        )}
      </section>
    </main>
  )
}

function Sidebar({
  workspace,
  active,
  setActive,
  open,
  setOpen,
  onSettings,
}: {
  workspace: Workspace
  active: string
  setActive: (label: string) => void
  open: boolean
  setOpen: (open: boolean) => void
  onSettings: () => void
}) {
  const items =
    workspace === 'customer'
      ? [['Khám phá dịch vụ', Grid2X2], ['Đặt lịch', CalendarDays], ['Lịch sử của tôi', Clock3], ['Đánh giá', Star]] as const
      : workspace === 'specialist'
        ? [['Lịch hôm nay', CalendarDays], ['Lịch sử phục vụ', Clock3], ['Đánh giá', Star]] as const
        : adminMenu.map(x => [x.label, x.icon] as const)

  return (
    <>
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand">
          <div className="brand-mark"><Sparkles /></div>
          <div>
            <strong>AN NHIÊN</strong>
            <small>SPA BOOKING</small>
          </div>
                <button className="mobile-close" aria-label="Đóng menu" onClick={() => setOpen(false)}><X /></button>
        </div>
        <div className="workspace-switcher">
          <span className="eyebrow">KHÔNG GIAN</span>
          <p className="workspace-label">{workspace === 'admin' ? 'Quản trị viên' : workspace === 'specialist' ? 'Chuyên viên' : 'Khách hàng'}</p>
        </div>
        <nav className="nav-list">
          {items.map(([label, Icon]) => (
            <button key={label} className={active === label ? 'active' : ''} onClick={() => { setActive(label); setOpen(false) }}>
              <Icon />{label}<ChevronRight className="nav-chevron" />
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button onClick={onSettings}><Settings2 /> Cài đặt</button>
          <div className="user-mini">
            <div className="avatar">AN</div>
            <div>
              <strong>{workspace === 'admin' ? 'Admin An Nhiên' : workspace === 'specialist' ? 'Chuyên viên Linh' : 'Khách hàng'}</strong>
              <small>{workspace}</small>
            </div>
          </div>
        </div>
      </aside>
      {open && <button className="scrim" aria-label="Đóng menu" onClick={() => setOpen(false)} />}
    </>
  )
}

function AdminView({
  active,
  appointments,
  setAppointments,
}: {
  active: string
  appointments: Appointment[]
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>
}) {
  const [catalog, setCatalog] = useState(initialCatalog)
  const [notice, setNotice] = useState('')
  const [query, setQuery] = useState('')

  const catalogKey = active in catalog ? active : ''
  const rows = catalogKey ? catalog[catalogKey].filter(item => item.toLowerCase().includes(query.toLowerCase())) : []
  const filteredAppointments = appointments.filter(item =>
    `${item.customer} ${item.service} ${item.time}`.toLowerCase().includes(query.toLowerCase()),
  )

  const add = async () => {
    if (active === 'Tổng quan' || active === 'Lịch hẹn') {
      const customerEmail = window.prompt('Email khách hàng đã đăng ký')
      if (!customerEmail) return
      const service = window.prompt('Dịch vụ', 'Massage Body Relax · 60 phút · 450.000đ') || 'Massage Body Relax · 60 phút · 450.000đ'
      const time = window.prompt('Giờ hẹn (HH:MM)', '15:00') || '15:00'
      const date = window.prompt('Ngày hẹn (YYYY-MM-DD)', new Date().toISOString().slice(0, 10)) || ''
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerEmail,
          service,
          time,
          date,
          branch: initialCatalog['Chi nhánh'][0],
          specialist: 'Không yêu cầu chuyên viên',
        }),
      })
      const result = await response.json()
      if (!response.ok) {
        setNotice(result.error || 'Không thể tạo lịch hẹn.')
        return
      }
      setAppointments(current => [result, ...current])
      setNotice(`Đã tạo lịch hẹn cho ${result.customer}`)
      return
    }
    if (!catalogKey) return
    const value = window.prompt(`Tên ${active.toLowerCase()}`)
    if (!value) return
    setCatalog(current => ({ ...current, [catalogKey]: [...current[catalogKey], value] }))
    setNotice(`Đã thêm ${value}`)
  }

  const removeAppointment = async (id: number) => {
    const response = await fetch(`/api/appointments/${id}`, { method: 'DELETE' })
    const result = await response.json()
    if (!response.ok) {
      setNotice(result.error || 'Không thể xóa lịch hẹn.')
      return
    }
    setAppointments(current => current.filter(item => item.id !== id))
    setNotice('Đã xóa lịch hẹn')
  }

  const confirmAppointment = async (item: Appointment) => {
    const response = await fetch(`/api/appointments/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Đã xác nhận' }),
    })
    const result = await response.json()
    if (!response.ok) {
      setNotice(result.error || 'Không thể cập nhật lịch.')
      return
    }
    setAppointments(current => current.map(row => row.id === item.id ? { ...row, status: 'Đã xác nhận' } : row))
    setNotice(`Đã xác nhận lịch của ${item.customer}. Trạng thái đã cập nhật trong lịch sử khách hàng.`)
  }

  return (
    <div className="view-content admin-view">
      <div className="page-heading">
        <div>
          <span className="eyebrow">QUẢN TRỊ · AN NHIÊN SPA</span>
          <h1>{active === 'Tổng quan' ? 'Chào buổi sáng, Admin' : active}</h1>
          <p>Quản lý chi nhánh, dịch vụ, chuyên viên và lịch hẹn trên cùng một không gian.</p>
        </div>
        <button className="primary-btn" onClick={add}>
          <Plus /> {active === 'Tổng quan' || active === 'Lịch hẹn' ? 'Tạo lịch hẹn' : `Thêm ${active.toLowerCase()}`}
        </button>
      </div>
      {notice && <div className="success-note" role="status">{notice}</div>}
      {active === 'Tổng quan' ? (
        <>
          <div className="stats-grid">
            <div className="stat-card"><span>Lịch hẹn</span><strong>{appointments.length}</strong><small>Đang có trên hệ thống</small></div>
            <div className="stat-card"><span>Chờ xác nhận</span><strong>{appointments.filter(a => a.status.includes('Chờ')).length}</strong><small>Cần xử lý sớm</small></div>
            <div className="stat-card"><span>Đã xác nhận</span><strong>{appointments.filter(a => a.status.includes('xác nhận') && !a.status.includes('Chờ')).length}</strong><small>Sẵn sàng phục vụ</small></div>
            <div className="stat-card"><span>Chi nhánh</span><strong>{catalog['Chi nhánh'].length}</strong><small>Đang hoạt động</small></div>
          </div>
          <section className="panel table-panel">
            <div className="panel-head">
              <div>
                <h2>Lịch hẹn sắp tới</h2>
                <p>Xác nhận lịch để cập nhật ngay trạng thái trong lịch sử khách hàng.</p>
              </div>
            </div>
            <div className="appointment-list">
              {appointments.map(item => (
                <div className="appointment" key={item.id}>
                  <div className="appointment-main">
                    <strong>{item.time} · {item.customer}</strong>
                    <span>{item.service} · {item.date} · {item.branch}</span>
                  </div>
                  <Status>{item.status}</Status>
                  {item.status.includes('Chờ') && <button className="confirm-btn" onClick={() => confirmAppointment(item)}><Check /> Xác nhận</button>}
                  <button className="icon-btn" aria-label={`Xóa lịch của ${item.customer}`} onClick={() => removeAppointment(item.id)}><Trash2 /></button>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : active === 'Lịch hẹn' ? (
        <section className="panel table-panel">
          <div className="table-toolbar">
            <div className="search"><Search /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Tìm khách, dịch vụ, giờ..." /></div>
          </div>
          {filteredAppointments.map(item => (
            <div className="crud-row" key={item.id}>
              <span>{item.date} · {item.time} · {item.customer} · {item.service} · {item.branch}</span>
              <Status>{item.status}</Status>
              {item.status.includes('Chờ') && <button className="confirm-btn" onClick={() => confirmAppointment(item)}><Check /> Xác nhận</button>}
              <button className="icon-btn" aria-label={`Xóa lịch của ${item.customer}`} onClick={() => removeAppointment(item.id)}><Trash2 /></button>
            </div>
          ))}
        </section>
      ) : (
        <section className="panel table-panel">
          <div className="table-toolbar">
            <div className="search"><Search /><input value={query} onChange={e => setQuery(e.target.value)} placeholder={`Tìm ${active.toLowerCase()}...`} /></div>
          </div>
          {rows.map((item, i) => (
            <div className="crud-row" key={`${item}-${i}`}>
              <span>{item}</span>
              <Status>Đang hoạt động</Status>
              <button className="icon-btn" onClick={() => {
                const next = window.prompt('Chỉnh sửa', item)
                if (!next) return
                setCatalog(current => ({
                  ...current,
                  [catalogKey]: current[catalogKey].map((row, index) => index === current[catalogKey].indexOf(item) ? next : row),
                }))
                setNotice('Đã cập nhật')
              }}>✎</button>
              <button className="icon-btn" onClick={() => {
                setCatalog(current => ({ ...current, [catalogKey]: current[catalogKey].filter(row => row !== item) }))
                setNotice('Đã xóa')
              }}>×</button>
            </div>
          ))}
        </section>
      )}
    </div>
  )
}

function CustomerView({
  active,
  setActive,
  appointments,
  onBooked,
}: {
  active: string
  setActive: (label: string) => void
  appointments: Appointment[]
  onBooked: (form: BookingForm) => Promise<void>
}) {
  const [booking, setBooking] = useState(false)
  const reviews = [
    { name: 'Ngọc Mai', text: 'Không gian rất nhẹ nhàng, bạn Linh tư vấn tận tâm. Tôi sẽ quay lại vào tháng sau.', service: 'Massage Body Relax' },
    { name: 'Hoàng Yến', text: 'Đặt lịch nhanh, được gọi xác nhận rất chuyên nghiệp. Da mặt sau buổi chăm sóc căng mịn hơn hẳn.', service: 'Chăm sóc da mặt' },
    { name: 'Thu Hà', text: 'Gội đầu dưỡng sinh thư giãn tuyệt vời, nhân viên dễ thương và chu đáo.', service: 'Gội đầu dưỡng sinh' },
  ]
  const showBooking = booking || active === 'Đặt lịch'
  const myBookings = appointments

  return (
    <div className="customer-view">
      <div className="customer-top customer-hero">
        <div className="customer-hero-copy">
          <span className="eyebrow">AN NHIÊN SPA</span>
          <h1>Nuôi dưỡng sự an yên<br /><em>trong bạn.</em></h1>
          <p>Một khoảng lặng dịu dàng giữa nhịp sống bận rộn. Chọn liệu trình phù hợp, đặt lịch trong vài phút.</p>
          <div className="customer-hero-actions">
            <button className="primary-btn" onClick={() => { setBooking(true); setActive('Đặt lịch') }}>Đặt lịch ngay <ChevronRight /></button>
            <span><Star /> Được yêu thích bởi hơn 2.000 khách hàng</span>
          </div>
        </div>
        <div className="customer-hero-photo">
          <img src="/images/spa-interior.png" alt="Không gian thư giãn tại An Nhiên Spa" />
          <div className="photo-caption"><Sparkles /><span><strong>Chạm vào bình yên</strong><small>Không gian chăm sóc riêng tư</small></span></div>
        </div>
      </div>
      <div className="customer-trust-strip">
        <div><Star /><span><strong>4.9/5</strong><small>Đánh giá từ khách hàng</small></span></div>
        <div><Sparkles /><span><strong>12+ liệu trình</strong><small>Chăm sóc từ đầu đến chân</small></span></div>
        <div><Clock3 /><span><strong>09:00 – 20:00</strong><small>Mở cửa mỗi ngày</small></span></div>
      </div>
      <div className="customer-nav">
        <div className="customer-search"><Search /><input placeholder="Bạn muốn trải nghiệm gì hôm nay?" /></div>
        <button className="heart-btn"><Heart /></button>
        <div className="avatar">AN</div>
      </div>
      {showBooking ? (
        <BookingFlow
          onDone={() => { setBooking(false); setActive('Lịch sử của tôi') }}
          onSubmit={onBooked}
        />
      ) : (
        <>
          <div className="section-title">
            <div>
              <span className="eyebrow">GỢI Ý CHO BẠN</span>
              <h2>{active === 'Lịch sử của tôi' ? 'Lịch hẹn của tôi' : active === 'Đánh giá' ? 'Khách hàng nói gì?' : 'Dịch vụ nổi bật'}</h2>
            </div>
          </div>
          {active === 'Lịch sử của tôi' ? (
            <div className="history-list">
              {myBookings.length ? myBookings.map(item => (
                <div className="history-card" key={item.id}>
                  <strong>{item.date.slice(8)}<br /><small>THÁNG {item.date.slice(5, 7)}</small></strong>
                  <div>
                    <b>{item.service}</b>
                    <span>{item.time} · {item.branch} · {item.specialist}</span>
                    {item.status === 'Đã xác nhận' && <small className="history-notice">An Nhiên đã xác nhận lịch hẹn của bạn.</small>}
                  </div>
                  <Status>{item.status}</Status>
                </div>
              )) : (
                <div className="history-empty">
                  <Clock3 />
                  <div><strong>Bạn chưa có lịch hẹn nào</strong><p>Lịch đặt tại An Nhiên sẽ được lưu ở đây để bạn tiện theo dõi.</p></div>
                  <button className="primary-btn" onClick={() => { setBooking(true); setActive('Đặt lịch') }}>Đặt lịch đầu tiên <ChevronRight /></button>
                </div>
              )}
            </div>
          ) : active === 'Đánh giá' ? (
            <div className="reviews-grid">
              {reviews.map(review => (
                <article className="review-card" key={review.name}>
                  <div className="review-head">
                    <div className="avatar">{review.name.slice(0, 2).toUpperCase()}</div>
                    <div><strong>{review.name}</strong><small>{review.service}</small></div>
                    <span className="stars">★★★★★</span>
                  </div>
                  <p>“{review.text}”</p>
                </article>
              ))}
            </div>
          ) : (
            <div className="service-grid">
              {services.map(s => (
                <button className="service-card" key={s.name} onClick={() => { setBooking(true); setActive('Đặt lịch') }}>
                  <div className={`service-image ${s.imageClass}`} />
                  <div className="service-copy">
                    <span>{s.tag}</span>
                    <strong>{s.name}</strong>
                    <small>{s.detail}</small>
                    <b>Đặt lịch <ChevronRight /></b>
                  </div>
                </button>
              ))}
            </div>
          )}
          <div className="promo-banner">
            <img className="promo-visual" src="/images/promo-spa.png" alt="Liệu trình thư giãn tại An Nhiên Spa" />
            <div>
              <span className="eyebrow">ƯU ĐÃI THÁNG NÀY</span>
              <h3>Thư giãn trọn gói, ưu đãi đến 20%</h3>
            </div>
          </div>
          <section className="spa-story">
            <div className="spa-story-photo"><img src="/images/spa-treatment.png" alt="Chuyên viên chăm sóc khách hàng bằng liệu trình nhẹ nhàng" /></div>
            <div className="spa-story-copy">
              <span className="eyebrow">CHĂM SÓC BẰNG SỰ THẤU HIỂU</span>
              <h2>Dành cho bạn một khoảng thở thật sâu.</h2>
              <p>Từ hương thơm dịu nhẹ đến từng thao tác chăm sóc, mỗi trải nghiệm tại An Nhiên đều được thiết kế để bạn chậm lại và lắng nghe cơ thể mình.</p>
              <div className="story-points"><span><Check /> Sản phẩm dịu nhẹ</span><span><Check /> Chuyên viên tận tâm</span><span><Check /> Không gian riêng tư</span></div>
              <button className="outline-btn" onClick={() => { setBooking(true); setActive('Đặt lịch') }}>Chọn liệu trình <ChevronRight /></button>
            </div>
          </section>
          <section className="visit-info">
            <div><MapPin /><span><strong>Ghé thăm An Nhiên</strong><small>Chi Spa 1 · 10–12 đường 30/4</small><small>Chi Spa 3 · 134/16 đường 30/4</small></span></div>
            <div><Clock3 /><span><strong>Thời gian phục vụ</strong><small>Mỗi ngày · 09:00 – 20:00</small><small>Vui lòng đặt lịch trước để được phục vụ tốt nhất</small></span></div>
            <div><Phone /><span><strong>Đặt lịch & tư vấn</strong><small>0398 556 089</small><small>Hỗ trợ nhanh qua điện thoại hoặc Zalo</small></span></div>
          </section>
        </>
      )}
    </div>
  )
}

function FloatingContact() {
  return (
    <div className="floating-contact">
      <a className="call-btn" href="tel:0398556089" aria-label="Gọi 0398556089"><Phone /></a>
      <a className="zalo-btn" href="https://zalo.me/0398556089" target="_blank" rel="noreferrer" aria-label="Mở Zalo 0398556089"><MessageCircle /></a>
    </div>
  )
}

function SpecialistView({
  active,
  appointments,
  setAppointments,
}: {
  active: string
  appointments: Appointment[]
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>
}) {
  const [notice, setNotice] = useState('')
  const updateStatus = async (id: number, status: AppointmentStatus) => {
    const response = await fetch(`/api/appointments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    const result = await response.json()
    if (!response.ok) {
      setNotice(result.error || 'Không thể cập nhật lịch.')
      return
    }
    setAppointments(current => current.map(item => item.id === id ? { ...item, status } : item))
    setNotice(`Đã cập nhật lịch của ${appointments.find(item => item.id === id)?.customer || 'khách hàng'}.`)
  }

  return (
    <div className="view-content">
      <div className="page-heading">
        <div>
          <span className="eyebrow">KHÔNG GIAN CHUYÊN VIÊN</span>
          <h1>{active === 'Đánh giá' ? 'Đánh giá gần đây' : active === 'Lịch sử phục vụ' ? 'Lịch sử phục vụ' : 'Lịch làm việc hôm nay'}</h1>
          <p>Xin chào Linh, cập nhật trạng thái phục vụ theo thời gian thực.</p>
        </div>
        <span className="date-pill">Hôm nay</span>
      </div>
      <div className="stats-grid">
        <div className="stat-card"><span>Lịch hôm nay</span><strong>{appointments.length}</strong><small>Được gán cho chuyên viên</small></div>
        <div className="stat-card"><span>Đã hoàn thành</span><strong>{appointments.filter(item => item.status === 'Đã hoàn thành').length}</strong><small>Cập nhật sau mỗi dịch vụ</small></div>
        <div className="stat-card"><span>Đánh giá trung bình</span><strong>4.9</strong><small>★★★★★ từ khách hàng</small></div>
      </div>
      {notice && <div className="success-note" role="status">{notice}</div>}
      {active !== 'Đánh giá' && (
        <section className="panel table-panel">
          <div className="panel-head">
            <div>
              <h2>{active === 'Lịch sử phục vụ' ? 'Các lịch đã xử lý' : 'Lịch phục vụ'}</h2>
              <p>Chọn trạng thái để thông báo cho lễ tân và khách hàng.</p>
            </div>
          </div>
          <div className="appointment-list">
            {appointments.map(item => (
              <div className="appointment specialist-appointment" key={item.id}>
                <div className="appointment-main">
                  <strong>{item.time} · {item.customer}</strong>
                  <span>{item.service} · {item.branch}</span>
                </div>
                <Status>{item.status}</Status>
                <select aria-label={`Trạng thái ${item.customer}`} value={item.status} onChange={event => updateStatus(item.id, event.target.value as AppointmentStatus)}>
                  <option>Chờ xác nhận</option>
                  <option>Đã xác nhận</option>
                  <option>Đã hoàn thành</option>
                </select>
              </div>
            ))}
          </div>
        </section>
      )}
      {active === 'Đánh giá' && (
        <section className="panel reviews-panel">
          <div className="review-quote">
            <span className="stars">★★★★★</span>
            <p>“Bạn Linh tư vấn rất tận tâm, thao tác nhẹ nhàng và chuyên nghiệp.”</p>
            <strong>— Ngọc Mai · Massage Body Relax</strong>
          </div>
        </section>
      )}
    </div>
  )
}

function SettingsPanel({ workspace, onClose, onLogout }: { workspace: Workspace; onClose: () => void; onLogout: () => void }) {
  const [name, setName] = useState(workspace === 'admin' ? 'Admin An Nhiên' : workspace === 'specialist' ? 'Linh Nguyễn' : 'Khách hàng')
  const [phone, setPhone] = useState('0398556089')
  const [saved, setSaved] = useState(false)
  return (
    <div className="settings-overlay" role="dialog" aria-modal="true" aria-labelledby="settings-title">
      <button className="settings-backdrop" aria-label="Đóng cài đặt" onClick={onClose} />
      <section className="settings-pop">
        <div className="settings-head">
          <div>
            <span className="eyebrow">TÀI KHOẢN CỦA BẠN</span>
            <h3 id="settings-title">Cài đặt</h3>
          </div>
          <button className="icon-btn" aria-label="Đóng" onClick={onClose}><X /></button>
        </div>
        <p className="settings-intro">Cập nhật thông tin liên hệ và tuỳ chỉnh tài khoản An Nhiên.</p>
        <div className="settings-form">
          <label><span><UserRound /> Họ và tên</span><input value={name} onChange={e => setName(e.target.value)} /></label>
          <label><span><Phone /> Số điện thoại</span><input value={phone} onChange={e => setPhone(e.target.value)} inputMode="tel" /></label>
        </div>
        {saved && <p className="success-note">Đã lưu thông tin tài khoản.</p>}
        <div className="settings-actions">
          <button className="primary-btn" onClick={() => setSaved(true)}><Settings2 /> Lưu thay đổi</button>
          <button className="logout-btn" onClick={onLogout}><LogOut /> Đăng xuất</button>
        </div>
      </section>
    </div>
  )
}

export default function Page() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [workspace, setWorkspace] = useState<Workspace>('customer')
  const [active, setActive] = useState('Khám phá dịch vụ')
  const [open, setOpen] = useState(false)
  const [settings, setSettings] = useState(false)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [sessionReady, setSessionReady] = useState(false)

  useEffect(() => {
    let mounted = true
    const restoreSession = async () => {
      try {
        const response = await fetch('/api/auth/session')
        if (response.ok) {
          const { user } = await response.json()
          if (['customer', 'admin', 'specialist'].includes(user?.role)) {
            if (!mounted) return
            setWorkspace(user.role)
            setActive(user.role === 'admin' ? 'Tổng quan' : user.role === 'specialist' ? 'Lịch hôm nay' : 'Khám phá dịch vụ')
            setLoggedIn(true)
            const appointmentsResponse = await fetch('/api/appointments')
            if (appointmentsResponse.ok && mounted) setAppointments(await appointmentsResponse.json())
          }
        }
      } catch {
        if (mounted) setAppointments([])
      } finally {
        if (mounted) setSessionReady(true)
      }
    }

    restoreSession()
    return () => { mounted = false }
  }, [])

  const onBooked = async (form: BookingForm) => {
    const response = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const result = await response.json()
    if (!response.ok) throw new Error(result.error || 'Không thể đặt lịch.')
    setAppointments(current => [result, ...current])
  }

  const startWorkspace = async (w: Workspace) => {
    setWorkspace(w)
    setOpen(false)
    setActive(w === 'admin' ? 'Tổng quan' : w === 'specialist' ? 'Lịch hôm nay' : 'Khám phá dịch vụ')
    setLoggedIn(true)
    try {
      const response = await fetch('/api/appointments')
      if (response.ok) setAppointments(await response.json())
    } catch {
      setAppointments([])
    }
  }

  if (!sessionReady) return <main className="session-loading" aria-label="Đang khôi phục phiên đăng nhập" />
  if (!loggedIn) return <LoginScreen onLogin={startWorkspace} />

  return (
    <main className={`app-shell ${workspace === 'customer' ? 'customer-shell' : ''}`}>
      <Sidebar workspace={workspace} active={active} setActive={setActive} open={open} setOpen={setOpen} onSettings={() => setSettings(true)} />
      <div className="main">
        <header className="mobile-header">
          <button aria-label="Mở menu" onClick={() => setOpen(true)}><Menu /></button>
          <strong>AN NHIÊN</strong>
          <div className="avatar">AN</div>
        </header>
        {settings && (
          <SettingsPanel
            workspace={workspace}
            onClose={() => setSettings(false)}
            onLogout={async () => {
              await fetch('/api/auth/session', { method: 'DELETE' }).catch(() => undefined)
              setSettings(false)
              setOpen(false)
              setLoggedIn(false)
            }}
          />
        )}
        {workspace === 'admin' ? (
          <AdminView active={active} appointments={appointments} setAppointments={setAppointments} />
        ) : workspace === 'specialist' ? (
          <SpecialistView active={active} appointments={appointments} setAppointments={setAppointments} />
        ) : (
          <CustomerView active={active} setActive={setActive} appointments={appointments} onBooked={onBooked} />
        )}
        <FloatingContact />
      </div>
    </main>
  )
}
