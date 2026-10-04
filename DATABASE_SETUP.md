# SQL Server setup

The app uses SQL Server through Next.js route handlers. Browser code never receives the SQL credentials. The core tables used by the app are `NGUOI_DUNG`, `LICH_HEN`, `CHI_NHANH`, `DICH_VU`, and `CHUYEN_VIEN`.

## First-time setup

1. Start SQL Server and enable TCP/IP. For local SQL authentication, enable Mixed Mode and create a SQL login for the app.
2. In SSMS, connect to the SQL Server instance and run `spa_database.sql` once. It creates `SpaBookingDB` only if missing, then creates the schema and sample rows. It no longer drops an existing database, but the table/seed statements are intended for a new, empty database. Do not rerun it after tables exist.
3. If the database already has the older appointment constraint, back it up and run `spa_migrate_3_status.sql`. The migration stops without changing data if it finds `cancelled` or `no_show` rows; decide how to handle those rows before retrying.
4. Copy `.env.example` to `.env.local` and set the SQL Server host, port, database, login, and password. Do not commit `.env.local`.
5. Generate a session secret with `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"` and put the result in `SESSION_SECRET`.
6. Start the app with `npm run dev`.

Check the connection by opening `/api/health/database`. It returns `{"database":"connected"}` when the app can reach SQL Server; it does not expose connection details.

For a named local instance, `SQLSERVER_SERVER` can be `localhost\\SQLEXPRESS`. For Azure SQL, set `SQLSERVER_ENCRYPT=true`. In production, use a least-privilege SQL login with read/write access to `SpaBookingDB`, not a `sa` account.

## Demo accounts

- Admin: `adminannhien@gmail.com` / `Admin@2026`
- Specialist: `chuyenvienannhien` / `Chuyenvien@2026`
- Sample customers: `mai@email.com` or `hung@email.com` / `Khach@2026`

New customer registrations are inserted into `NGUOI_DUNG` with bcrypt password hashes. New bookings are inserted into `LICH_HEN` using the selected branch, service, specialist, and authenticated customer IDs. Admins and specialists update the same row; customers see only their own appointments.

If SQL Server is not configured or reachable, auth and appointment API calls return an error rather than falling back to browser storage.