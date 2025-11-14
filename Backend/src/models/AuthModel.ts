import { getPool } from "../config/mysql";
import { User } from "../interfaces/User";

export const UserModel = {
  async findByEmail(email: string): Promise<User | null> {
    const pool = getPool();
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    const user = (rows as User[])[0];
    return user || null;
  },

  async findById(id: number): Promise<User | null> {
    const pool = getPool();
    const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [id]);
    const user = (rows as User[])[0];
    return user || null;
  },

  async create(user: User): Promise<void> {
    const pool = getPool();
    await pool.query(
      "INSERT INTO users (email, password, nickname, created_at) VALUES (?, ?, ?, NOW())",
      [user.email, user.password, user.nickname]
    );
  },
};