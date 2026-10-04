USE master;
GO

-- Tạo database
IF DB_ID(N'SpaBookingDB') IS NULL
BEGIN
    CREATE DATABASE SpaBookingDB;
END
GO

USE SpaBookingDB;
GO
-- 1. BẢNG NGUOI_DUNG (Users / Khách hàng / Admin)
CREATE TABLE NGUOI_DUNG (
    user_id         INT             IDENTITY(1,1) PRIMARY KEY,
    full_name       NVARCHAR(100)   NOT NULL,
    phone           VARCHAR(20)     NOT NULL,
    email           VARCHAR(100)    NOT NULL,
    password_hash   VARCHAR(255)    NOT NULL,
    role            VARCHAR(20)     NOT NULL DEFAULT 'customer',  -- customer | admin | specialist
    status          TINYINT         NOT NULL DEFAULT 1,           -- 1: active, 0: inactive
    created_at      DATETIME2       NOT NULL DEFAULT GETDATE(),
    updated_at      DATETIME2       NULL,

    CONSTRAINT UQ_NGUOI_DUNG_email UNIQUE (email),
    CONSTRAINT UQ_NGUOI_DUNG_phone UNIQUE (phone),
    CONSTRAINT CK_NGUOI_DUNG_role CHECK (role IN ('customer', 'admin', 'specialist')),
    CONSTRAINT CK_NGUOI_DUNG_status CHECK (status IN (0, 1))
);
GO
-- 2. BẢNG CHI_NHANH (Branches)
CREATE TABLE CHI_NHANH (
    branch_id       INT             IDENTITY(1,1) PRIMARY KEY,
    name            NVARCHAR(150)   NOT NULL,
    address         NVARCHAR(255)   NOT NULL,
    phone           VARCHAR(20)     NOT NULL,
    open_time       TIME            NOT NULL,
    close_time      TIME            NOT NULL,
    status          TINYINT         NOT NULL DEFAULT 1,           -- 1: active, 0: inactive
    created_at      DATETIME2       NOT NULL DEFAULT GETDATE(),
    updated_at      DATETIME2       NULL,

    CONSTRAINT CK_CHI_NHANH_status CHECK (status IN (0, 1)),
    CONSTRAINT CK_CHI_NHANH_time CHECK (open_time < close_time)
);
GO
-- 3. BẢNG DICH_VU (Services)
CREATE TABLE DICH_VU (
    service_id      INT             IDENTITY(1,1) PRIMARY KEY,
    name            NVARCHAR(150)   NOT NULL,
    category        NVARCHAR(50)    NOT NULL,                     -- massage, facial, body, ...
    description     NVARCHAR(MAX)   NULL,
    duration_min    INT             NOT NULL,                     -- thời lượng (phút)
    price           DECIMAL(12,2)   NOT NULL,
    status          TINYINT         NOT NULL DEFAULT 1,           -- 1: active, 0: inactive
    created_at      DATETIME2       NOT NULL DEFAULT GETDATE(),
    updated_at      DATETIME2       NULL,

    CONSTRAINT CK_DICH_VU_duration CHECK (duration_min > 0),
    CONSTRAINT CK_DICH_VU_price CHECK (price >= 0),
    CONSTRAINT CK_DICH_VU_status CHECK (status IN (0, 1))
);
GO
-- 4. BẢNG CHUYEN_VIEN (Specialists)
-- Quan hệ 1:0..1 với NGUOI_DUNG
CREATE TABLE CHUYEN_VIEN (
    specialist_id   INT             IDENTITY(1,1) PRIMARY KEY,
    user_id         INT             NOT NULL,
    branch_id       INT             NOT NULL,
    specialty       NVARCHAR(100)   NOT NULL,                     -- chuyên môn
    image           NVARCHAR(255)   NULL,                         -- đường dẫn ảnh
    status          TINYINT         NOT NULL DEFAULT 1,           -- 1: active, 0: inactive
    created_at      DATETIME2       NOT NULL DEFAULT GETDATE(),
    updated_at      DATETIME2       NULL,

    CONSTRAINT FK_CHUYEN_VIEN_user 
        FOREIGN KEY (user_id) REFERENCES NGUOI_DUNG(user_id),
    CONSTRAINT FK_CHUYEN_VIEN_branch 
        FOREIGN KEY (branch_id) REFERENCES CHI_NHANH(branch_id),
    CONSTRAINT UQ_CHUYEN_VIEN_user UNIQUE (user_id),              -- 1 user chỉ là 1 chuyên viên
    CONSTRAINT CK_CHUYEN_VIEN_status CHECK (status IN (0, 1))
);
GO
-- 5. BẢNG CA_LAM_VIEC (Work Shifts)
CREATE TABLE CA_LAM_VIEC (
    shift_id        INT             IDENTITY(1,1) PRIMARY KEY,
    specialist_id   INT             NOT NULL,
    work_date       DATE            NOT NULL,
    start_time      TIME            NOT NULL,
    end_time        TIME            NOT NULL,
    created_at      DATETIME2       NOT NULL DEFAULT GETDATE(),

    CONSTRAINT FK_CA_LAM_VIEC_specialist 
        FOREIGN KEY (specialist_id) REFERENCES CHUYEN_VIEN(specialist_id),
    CONSTRAINT CK_CA_LAM_VIEC_time CHECK (start_time < end_time)
);
GO
-- 6. BẢNG KHUYEN_MAI (Promotions)
CREATE TABLE KHUYEN_MAI (
    promo_id        INT             IDENTITY(1,1) PRIMARY KEY,
    code            VARCHAR(50)     NOT NULL,
    type            VARCHAR(20)     NOT NULL,                     -- percent | fixed
    value           DECIMAL(12,2)   NOT NULL,                     -- % hoặc số tiền
    min_order       DECIMAL(12,2)   NOT NULL DEFAULT 0,           -- đơn tối thiểu
    quantity        INT             NULL,                         -- số lượng còn lại (NULL = không giới hạn)
    start_date      DATE            NOT NULL,
    end_date        DATE            NOT NULL,
    status          TINYINT         NOT NULL DEFAULT 1,           -- 1: active, 0: inactive
    created_at      DATETIME2       NOT NULL DEFAULT GETDATE(),
    updated_at      DATETIME2       NULL,

    CONSTRAINT UQ_KHUYEN_MAI_code UNIQUE (code),
    CONSTRAINT CK_KHUYEN_MAI_type CHECK (type IN ('percent', 'fixed')),
    CONSTRAINT CK_KHUYEN_MAI_value CHECK (value > 0),
    CONSTRAINT CK_KHUYEN_MAI_date CHECK (start_date <= end_date),
    CONSTRAINT CK_KHUYEN_MAI_status CHECK (status IN (0, 1))
);
GO
-- 7. BẢNG LICH_HEN (Appointments) - Thực thể trung tâm
CREATE TABLE LICH_HEN (
    appointment_id  INT             IDENTITY(1,1) PRIMARY KEY,
    customer_id     INT             NOT NULL,                     -- FK → NGUOI_DUNG
    branch_id       INT             NOT NULL,
    service_id      INT             NOT NULL,
    specialist_id   INT             NOT NULL,
    appointment_date DATE           NOT NULL,
    start_time      TIME            NOT NULL,
    end_time        TIME            NOT NULL,
    status          VARCHAR(20)     NOT NULL DEFAULT 'pending',   -- pending | confirmed | completed
    total_amount    DECIMAL(12,2)   NOT NULL DEFAULT 0,
    notes           NVARCHAR(500)   NULL,
    created_at      DATETIME2       NOT NULL DEFAULT GETDATE(),
    updated_at      DATETIME2       NULL,

    CONSTRAINT FK_LICH_HEN_customer 
        FOREIGN KEY (customer_id) REFERENCES NGUOI_DUNG(user_id),
    CONSTRAINT FK_LICH_HEN_branch 
        FOREIGN KEY (branch_id) REFERENCES CHI_NHANH(branch_id),
    CONSTRAINT FK_LICH_HEN_service 
        FOREIGN KEY (service_id) REFERENCES DICH_VU(service_id),
    CONSTRAINT FK_LICH_HEN_specialist 
        FOREIGN KEY (specialist_id) REFERENCES CHUYEN_VIEN(specialist_id),
    CONSTRAINT CK_LICH_HEN_time CHECK (start_time < end_time),
    CONSTRAINT CK_LICH_HEN_status CHECK (status IN ('pending', 'confirmed', 'completed')),
    CONSTRAINT CK_LICH_HEN_amount CHECK (total_amount >= 0)
);
GO
-- 8. BẢNG DANH_GIA (Reviews)
CREATE TABLE DANH_GIA (
    review_id       INT             IDENTITY(1,1) PRIMARY KEY,
    appointment_id  INT             NOT NULL,
    customer_id     INT             NOT NULL,
    rating          TINYINT         NOT NULL,                     -- 1-5
    comment         NVARCHAR(1000)  NULL,
    status          TINYINT         NOT NULL DEFAULT 1,           -- 1: hiển thị, 0: ẩn
    created_at      DATETIME2       NOT NULL DEFAULT GETDATE(),

    CONSTRAINT FK_DANH_GIA_appointment 
        FOREIGN KEY (appointment_id) REFERENCES LICH_HEN(appointment_id),
    CONSTRAINT FK_DANH_GIA_customer 
        FOREIGN KEY (customer_id) REFERENCES NGUOI_DUNG(user_id),
    CONSTRAINT UQ_DANH_GIA_appointment UNIQUE (appointment_id),   -- 1 lịch hẹn chỉ 1 đánh giá
    CONSTRAINT CK_DANH_GIA_rating CHECK (rating BETWEEN 1 AND 5),
    CONSTRAINT CK_DANH_GIA_status CHECK (status IN (0, 1))
);
GO
-- 9. BẢNG AP_DUNG_KM (Áp dụng khuyến mãi)
CREATE TABLE AP_DUNG_KM (
    apply_id        INT             IDENTITY(1,1) PRIMARY KEY,
    appointment_id  INT             NOT NULL,
    promo_id        INT             NOT NULL,
    discount_amount DECIMAL(12,2)   NOT NULL DEFAULT 0,
    created_at      DATETIME2       NOT NULL DEFAULT GETDATE(),

    CONSTRAINT FK_AP_DUNG_KM_appointment 
        FOREIGN KEY (appointment_id) REFERENCES LICH_HEN(appointment_id),
    CONSTRAINT FK_AP_DUNG_KM_promo 
        FOREIGN KEY (promo_id) REFERENCES KHUYEN_MAI(promo_id),
    CONSTRAINT UQ_AP_DUNG_KM_appointment UNIQUE (appointment_id), -- 1 lịch hẹn chỉ áp dụng 1 mã KM
    CONSTRAINT CK_AP_DUNG_KM_discount CHECK (discount_amount >= 0)
);
GO
-- INDEXES (tối ưu truy vấn)

-- NGUOI_DUNG
CREATE INDEX IX_NGUOI_DUNG_role ON NGUOI_DUNG(role);
CREATE INDEX IX_NGUOI_DUNG_status ON NGUOI_DUNG(status);

-- CHI_NHANH
CREATE INDEX IX_CHI_NHANH_status ON CHI_NHANH(status);

-- DICH_VU
CREATE INDEX IX_DICH_VU_category ON DICH_VU(category);
CREATE INDEX IX_DICH_VU_status ON DICH_VU(status);

-- CHUYEN_VIEN
CREATE INDEX IX_CHUYEN_VIEN_branch ON CHUYEN_VIEN(branch_id);
CREATE INDEX IX_CHUYEN_VIEN_status ON CHUYEN_VIEN(status);

-- CA_LAM_VIEC
CREATE INDEX IX_CA_LAM_VIEC_specialist_date ON CA_LAM_VIEC(specialist_id, work_date);
CREATE INDEX IX_CA_LAM_VIEC_work_date ON CA_LAM_VIEC(work_date);

-- LICH_HEN (bảng trung tâm - index quan trọng)
CREATE INDEX IX_LICH_HEN_customer ON LICH_HEN(customer_id);
CREATE INDEX IX_LICH_HEN_branch ON LICH_HEN(branch_id);
CREATE INDEX IX_LICH_HEN_service ON LICH_HEN(service_id);
CREATE INDEX IX_LICH_HEN_specialist ON LICH_HEN(specialist_id);
CREATE INDEX IX_LICH_HEN_date ON LICH_HEN(appointment_date);
CREATE INDEX IX_LICH_HEN_status ON LICH_HEN(status);
CREATE INDEX IX_LICH_HEN_specialist_date ON LICH_HEN(specialist_id, appointment_date);

-- DANH_GIA
CREATE INDEX IX_DANH_GIA_customer ON DANH_GIA(customer_id);
CREATE INDEX IX_DANH_GIA_rating ON DANH_GIA(rating);

-- KHUYEN_MAI
CREATE INDEX IX_KHUYEN_MAI_code ON KHUYEN_MAI(code);
CREATE INDEX IX_KHUYEN_MAI_date ON KHUYEN_MAI(start_date, end_date);
CREATE INDEX IX_KHUYEN_MAI_status ON KHUYEN_MAI(status);

-- AP_DUNG_KM
CREATE INDEX IX_AP_DUNG_KM_promo ON AP_DUNG_KM(promo_id);
GO

-- DỮ LIỆU MẪU (Sample Data) - tùy chọn
-- Chi nhánh
INSERT INTO CHI_NHANH (name, address, phone, open_time, close_time, status)
VALUES 
(N'Chi Spa 1', N'10–12 đường 30/4', '02812345678', '09:00', '20:00', 1),
(N'Chi Spa 3', N'134/16 đường 30/4', '02887654321', '09:00', '20:00', 1);
GO

-- Người dùng
INSERT INTO NGUOI_DUNG (full_name, phone, email, password_hash, role, status)
VALUES 
(N'Admin An Nhiên', '0901000001', 'adminannhien@gmail.com', '$2b$10$5KDyPLC3LKikuY1030QmHezKbRiC2Idd39pl0PavgfDw7Q7qbwk86', 'admin', 1),
(N'Trần Thị Mai', '0901000002', 'mai@email.com', '$2b$10$tpzY1./YIJ2WjBAy.bVs9ez6TMB4n6P8yMVEXvCHBsNqbdIF8MGFW', 'customer', 1),
(N'Lê Văn Hùng', '0901000003', 'hung@email.com', '$2b$10$tpzY1./YIJ2WjBAy.bVs9ez6TMB4n6P8yMVEXvCHBsNqbdIF8MGFW', 'customer', 1),
(N'Nguyễn Ngọc Linh', '0901000004', 'chuyenvienannhien@spa.local', '$2b$10$eTGOd97Ry6uEB/MwJhMpwObn1PdL6Ez.sk44Py4Ta75wDp5i4nEhe', 'specialist', 1),
(N'Trần Minh Thư', '0901000005', 'minhthu@spa.local', '$2b$10$eTGOd97Ry6uEB/MwJhMpwObn1PdL6Ez.sk44Py4Ta75wDp5i4nEhe', 'specialist', 1);
GO

-- Dịch vụ
INSERT INTO DICH_VU (name, category, description, duration_min, price, status)
VALUES 
(N'Massage Body Relax', N'massage', N'Massage toàn thân giúp thư giãn, giảm stress', 60, 450000, 1),
(N'Chăm sóc da mặt', N'facial', N'Làm sạch, dưỡng ẩm và massage mặt', 60, 380000, 1),
(N'Gội đầu dưỡng sinh', N'body', N'Thư giãn da đầu và chăm sóc tóc', 45, 250000, 1);
GO

-- Chuyên viên
INSERT INTO CHUYEN_VIEN (user_id, branch_id, specialty, image, status)
VALUES 
(4, 1, N'Massage & Body treatment', N'/images/specialists/lan.jpg', 1),
(5, 2, N'Facial & Skincare', N'/images/specialists/tuan.jpg', 1);
GO

-- Ca làm việc
INSERT INTO CA_LAM_VIEC (specialist_id, work_date, start_time, end_time)
VALUES 
(1, '2026-10-02', '09:00', '20:00'),
(1, '2026-10-03', '09:00', '20:00'),
(2, '2026-10-02', '09:00', '20:00'),
(2, '2026-10-03', '09:00', '20:00');
GO

-- Khuyến mãi
INSERT INTO KHUYEN_MAI (code, type, value, min_order, quantity, start_date, end_date, status)
VALUES 
('WELCOME10', 'percent', 10, 200000, 100, '2026-09-01', '2026-12-31', 1),
('SPA50K', 'fixed', 50000, 300000, 50, '2026-09-01', '2026-10-31', 1);
GO

-- Lịch hẹn mẫu
INSERT INTO LICH_HEN (customer_id, branch_id, service_id, specialist_id, appointment_date, start_time, end_time, status, total_amount)
VALUES 
(2, 1, 1, 1, '2026-10-02', '09:00', '10:00', 'confirmed', 450000),
(3, 2, 2, 2, '2026-10-03', '10:00', '11:00', 'pending', 380000);
GO

-- Áp dụng khuyến mãi
INSERT INTO AP_DUNG_KM (appointment_id, promo_id, discount_amount)
VALUES 
(1, 1, 35000);  -- 10% của 350000
GO

-- Đánh giá
INSERT INTO DANH_GIA (appointment_id, customer_id, rating, comment, status)
VALUES 
(1, 2, 5, N'Dịch vụ tuyệt vời, chuyên viên rất chuyên nghiệp!', 1);
GO

PRINT N'=== TẠO DATABASE SpaBookingDB THÀNH CÔNG ===';
PRINT N'Đã tạo 9 bảng + indexes + dữ liệu mẫu.';
GO
