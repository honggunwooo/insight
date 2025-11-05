const mysql = require("mysql2/promise");
require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });
console.log("🔍 Loaded DB config:", {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  name: process.env.DB_NAME,
});

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
});

(async () => {
  try {
    const conn = await pool.getConnection();
    console.log("✅ DB Connected!");
    conn.release();
  } catch (err) {
    console.error("❌ DB Connection Error:", err.message);
  }
})();

module.exports = pool;