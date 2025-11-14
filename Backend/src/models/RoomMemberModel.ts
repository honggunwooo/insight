import { ResultSetHeader, RowDataPacket } from "mysql2";
import { getPool } from "../config/mysql";

export type RoomRole = "owner" | "moderator" | "member";

export const RoomMemberModel = {
  async addMember(roomId: number, userId: number, role: RoomRole = "member") {
    const pool = getPool();
    const sql = `
      INSERT INTO room_members (room_id, user_id, role, joined_at, updated_at)
      VALUES (?, ?, ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE role = VALUES(role), updated_at = NOW()
    `;
    await pool.query<ResultSetHeader>(sql, [roomId, userId, role]);
  },

  async updateRole(roomId: number, userId: number, role: RoomRole) {
    const pool = getPool();
    await pool.query("UPDATE room_members SET role = ?, updated_at = NOW() WHERE room_id = ? AND user_id = ?", [role, roomId, userId]);
  },

  async remove(roomId: number, userId: number) {
    const pool = getPool();
    await pool.query("DELETE FROM room_members WHERE room_id = ? AND user_id = ?", [roomId, userId]);
  },

  async removeAll(roomId: number) {
    const pool = getPool();
    await pool.query("DELETE FROM room_members WHERE room_id = ?", [roomId]);
  },

  async getMember(roomId: number, userId: number) {
    const pool = getPool();
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM room_members WHERE room_id = ? AND user_id = ?",
      [roomId, userId]
    );
    return rows[0] || null;
  },

  async getMembers(roomId: number) {
    const pool = getPool();
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT rm.room_id, rm.user_id, rm.role, rm.joined_at, u.nickname, u.email, u.profile_image
         FROM room_members rm
         LEFT JOIN users u ON u.id = rm.user_id
        WHERE rm.room_id = ?
        ORDER BY rm.role = 'owner' DESC, rm.role = 'moderator' DESC, rm.joined_at ASC`,
      [roomId]
    );
    return rows;
  },

  async getRoomsForUser(userId: number) {
    const pool = getPool();
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT room_id, role FROM room_members WHERE user_id = ?",
      [userId]
    );
    return rows;
  },
};
