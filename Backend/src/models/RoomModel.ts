import { ResultSetHeader, RowDataPacket } from "mysql2";
import { getPool } from "../config/mysql";

export const RoomModel = {
  async createRoom(name: string, ownerId: number, isPrivate = false) {
    const pool = getPool();
    const sql = `
      INSERT INTO rooms (name, owner_id, is_private, created_at, updated_at)
      VALUES (?, ?, ?, NOW(), NOW())
    `;
    const [result] = await pool.query<ResultSetHeader>(sql, [name, ownerId, isPrivate]);
    return result.insertId;
  },

  async findAll(search?: string) {
    const pool = getPool();
    if (search) {
      const term = `%${search}%`;
      const [rows] = await pool.query<RowDataPacket[]>(
        "SELECT * FROM rooms WHERE name LIKE ? ORDER BY updated_at DESC",
        [term]
      );
      return rows;
    }
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM rooms ORDER BY updated_at DESC"
    );
    return rows;
  },

  async findById(id: number) {
    const pool = getPool();
    const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM rooms WHERE id = ?", [id]);
    return rows[0] || null;
  },

  async deleteRoom(id: number) {
    const pool = getPool();
    const [result] = await pool.query("DELETE FROM rooms WHERE id = ?", [id]);
    return result;
  },
};
