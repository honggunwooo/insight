import { getPool } from "../config/mysql";
import { User } from "../interfaces/User";

export const UserModel = {
  async findByEmail(email: string): Promise<User | null> {
    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT id, email, password, nickname, profile_image, location, bio, interests, created_at
         FROM users WHERE email = ?`,
      [email]
    );
    const user = (rows as User[])[0];
    return user || null;
  },

  async findById(id: number): Promise<User | null> {
    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT id, email, password, nickname, profile_image, location, bio, interests, created_at
         FROM users WHERE id = ?`,
      [id]
    );
    const user = (rows as User[])[0];
    return user || null;
  },

  async create(user: User): Promise<void> {
    const pool = getPool();
    await pool.query(
      `INSERT INTO users (email, password, nickname, profile_image, location, bio, interests, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        user.email,
        user.password,
        user.nickname,
        user.profile_image ?? null,
        user.location ?? null,
        user.bio ?? null,
        user.interests ?? null,
      ]
    );
  },

  async update(id: number, updates: Partial<User>): Promise<void> {
    const fields = Object.keys(updates)
      .map((key) => `${key} = ?`)
      .join(", ");
    const values = Object.values(updates);
    const pool = getPool();
    if (fields.length > 0)
      await pool.query(`UPDATE users SET ${fields} WHERE id = ?`, [...values, id]);
  },

  async delete(id: number): Promise<void> {
    const pool = getPool();
    await pool.query("DELETE FROM users WHERE id = ?", [id]);
  },
};
