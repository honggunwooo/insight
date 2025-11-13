import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

let pool: mysql.Pool;

const connectDB = async () => {
  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
    console.log("✅ MySQL Database connected.");
    return pool;
  } catch (error) {
    console.error("❌ MySQL connection failed:", error);
    throw error;
  }
};

export const getPool = () => pool;
export default connectDB;