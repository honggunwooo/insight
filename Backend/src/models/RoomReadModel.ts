import { RowDataPacket } from "mysql2";
import { getPool } from "../config/mysql";

export const RoomReadModel = {
  async getState(roomId: number, userId: number) {
    const pool = getPool();
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM room_read_states WHERE room_id = ? AND user_id = ?",
      [roomId, userId]
    );
    return rows[0] || null;
  },

  async upsert(roomId: number, userId: number, messageId: number) {
    const pool = getPool();
    await pool.query(
      `INSERT INTO room_read_states (room_id, user_id, last_read_message_id, updated_at)
       VALUES (?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE last_read_message_id = VALUES(last_read_message_id), updated_at = NOW()`,
      [roomId, userId, messageId]
    );
  },

  async getStatesForUser(userId: number) {
    const pool = getPool();
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM room_read_states WHERE user_id = ?",
      [userId]
    );
    return rows;
  },
};
