import { getPool } from "../config/mysql";

export const RoomModel = {
  async createRoom(name: string, ownerId: number, isPrivate = false) {
    const pool = getPool();
    const sql = `
      INSERT INTO rooms (name, owner_id, is_private, created_at, updated_at)
      VALUES (?, ?, ?, NOW(), NOW())
    `;
    const [result] = await pool.query(sql, [name, ownerId, isPrivate]);
    return result;
  },

  async findAll() {
    const pool = getPool();
    const [rows] = await pool.query("SELECT * FROM rooms");
    return rows;
  },

  async findById(id: number) {
    const pool = getPool();
    const [rows] = await pool.query("SELECT * FROM rooms WHERE id = ?", [id]);
    return (rows as any[])[0] || null;
  },

  async deleteRoom(id: number) {
    const pool = getPool();
    const [result] = await pool.query("DELETE FROM rooms WHERE id = ?", [id]);
    return result;
  },
};