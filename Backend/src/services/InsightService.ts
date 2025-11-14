import { RowDataPacket } from "mysql2";
import { getPool } from "../config/mysql";

const singleValue = async (query: string, params: any[] = []) => {
  const pool = getPool();
  const [rows] = await pool.query<RowDataPacket[]>(query, params);
  const value = rows[0] || {};
  const key = Object.keys(value)[0];
  return Number(value[key]) || 0;
};

export const InsightService = {
  async getSummary() {
    const [totalRooms, activeRooms, totalUsers, totalMessages, messagesToday, newRoomsToday] =
      await Promise.all([
        singleValue("SELECT COUNT(*) AS value FROM rooms"),
        singleValue(
          "SELECT COUNT(DISTINCT room_id) AS value FROM room_members"
        ),
        singleValue("SELECT COUNT(*) AS value FROM users"),
        singleValue("SELECT COUNT(*) AS value FROM messages"),
        singleValue(
          "SELECT COUNT(*) AS value FROM messages WHERE DATE(created_at) = CURDATE()"
        ),
        singleValue(
          "SELECT COUNT(*) AS value FROM rooms WHERE DATE(created_at) = CURDATE()"
        ),
      ]);

    return {
      totalRooms,
      activeRooms,
      totalUsers,
      totalMessages,
      messagesToday,
      newRoomsToday,
    };
  },
};

export default InsightService;
