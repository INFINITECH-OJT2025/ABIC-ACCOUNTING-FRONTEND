import mysql from 'mysql2/promise'

const connectionConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'admin_head',
  port: parseInt(process.env.DB_PORT || '3306'),
}

export async function getConnection() {
  try {
    const connection = await mysql.createConnection(connectionConfig)
    return connection
  } catch (error) {
    console.error('Database connection error:', error)
    throw error
  }
}

export async function query(sql: string, values?: any[]) {
  const connection = await getConnection()
  try {
    const [results] = await connection.execute(sql, values)
    return results
  } finally {
    await connection.end()
  }
}
