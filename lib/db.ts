import sql from 'mssql'

const globalForSql = globalThis as typeof globalThis & {
  spaSqlPool?: Promise<sql.ConnectionPool>
}

export const sqlServerConnectionMessage = 'SQL Server chưa nhận kết nối. Bật TCP/IP và khởi động lại dịch vụ MSSQLSERVER.'

export function isSqlServerConnectionError(error: unknown) {
  if (!error || typeof error !== 'object') return false

  const details = error as { code?: unknown; message?: unknown; originalError?: { code?: unknown; message?: unknown } }
  const codes = [details.code, details.originalError?.code].map(String)
  const messages = [details.message, details.originalError?.message].map(String).join(' ')

  return codes.some(code => ['ESOCKET', 'ECONNREFUSED', 'ETIMEOUT', 'ETIMEDOUT'].includes(code)) ||
    /failed to connect|connection is closed|ECONNREFUSED/i.test(messages)
}

export async function getDbPool() {
  const server = process.env.SQLSERVER_SERVER
  const database = process.env.SQLSERVER_DATABASE
  const useWindowsAuth = process.env.SQLSERVER_WINDOWS_AUTH === 'true'
  const user = process.env.SQLSERVER_USER
  const password = process.env.SQLSERVER_PASSWORD

  if (!server || !database || (!useWindowsAuth && (!user || !password))) {
    throw new Error('SQLSERVER_NOT_CONFIGURED')
  }

  if (!globalForSql.spaSqlPool) {
    const config = useWindowsAuth
      ? {
          database,
          connectionString: `Driver={ODBC Driver 18 for SQL Server};Server=${server};Database=${database};Trusted_Connection=Yes;TrustServerCertificate=Yes;`,
          pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
        }
      : {
          server,
          database,
          user,
          password,
          port: Number(process.env.SQLSERVER_PORT || 1433),
          pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
          options: {
            encrypt: process.env.SQLSERVER_ENCRYPT === 'true',
            trustServerCertificate: process.env.SQLSERVER_TRUST_SERVER_CERTIFICATE !== 'false',
          },
        }

    const connectionPool = useWindowsAuth
      ? (eval('require')('mssql/msnodesqlv8') as typeof sql).ConnectionPool
      : sql.ConnectionPool

    globalForSql.spaSqlPool = new connectionPool(config as never).connect().catch(error => {
      globalForSql.spaSqlPool = undefined
      throw error
    })
  }

  return globalForSql.spaSqlPool
}

export { sql }