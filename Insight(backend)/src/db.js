const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

let pool;

function createPool() {
  if (pool) return pool;

  pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  return pool;
}

// 연결 테스트
async function testConnection() {
  try {
    const conn = await pool.getConnection();
    console.log('✅ MySQL 연결 성공!');
    conn.release();
  } catch (err) {
    console.error('❌ DB 연결 실패:', err.message);
  }
}

module.exports = {
  pool: createPool(),
  testConnection,
};
