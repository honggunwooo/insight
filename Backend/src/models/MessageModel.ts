import { ResultSetHeader, RowDataPacket } from "mysql2";
import { getPool } from "../config/mysql";

const SELECT_BASE = `
  SELECT 
    m.id,
    m.room_id AS roomId,
    m.user_id AS userId,
    m.content,
    m.created_at AS createdAt,
    u.nickname AS username
  FROM messages m
  LEFT JOIN users u ON u.id = m.user_id
`;

export const MessageModel = {
  async create(roomId: number, userId: number, content: string) {
    const pool = getPool();
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO messages (room_id, user_id, content, created_at)
       VALUES (?, ?, ?, NOW())`,
      [roomId, userId, content]
    );
    return result.insertId;
  },

  async getById(id: number) {
    const pool = getPool();
    const [rows] = await pool.query<RowDataPacket[]>(
      `${SELECT_BASE} WHERE m.id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  async getByRoom(roomId: number) {
    const pool = getPool();
    const [rows] = await pool.query<RowDataPacket[]>(
      `${SELECT_BASE} WHERE m.room_id = ? ORDER BY m.created_at ASC`,
      [roomId]
    );
    return rows;
  },
};
