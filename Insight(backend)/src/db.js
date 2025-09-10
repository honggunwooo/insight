const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,  // ✅ 반드시 password로 전달
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});

async function testConnection() {
  try {
    const conn = await pool.getConnection();
    console.log("✅ DB 연결 성공");
    conn.release();
  } catch (err) {
    console.error("❌ DB 연결 실패:", err.message);
  }
}

module.exports = { pool, testConnection };