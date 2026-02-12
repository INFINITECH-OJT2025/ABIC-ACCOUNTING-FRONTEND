import mysql from 'mysql2/promise'

const connectionConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  port: parseInt(process.env.DB_PORT || '3306'),
}

async function runMigrations() {
  let connection
  try {
    connection = await mysql.createConnection(connectionConfig)

    // Create database if not exists
    await connection.execute(`CREATE DATABASE IF NOT EXISTS admin_head`)
    await connection.execute(`USE admin_head`)

    // Create employees table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS employees (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `)

    console.log('✅ Database migrations completed successfully!')
    console.log('✅ Table "employees" created/verified')
  } catch (error) {
    console.error('❌ Migration error:', error)
    process.exit(1)
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}

runMigrations()
