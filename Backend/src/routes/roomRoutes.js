const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const authMiddleware = require("../middlewares/jwt");

router.post("/", authMiddleware, async (req, res) => {
  const { name, description } = req.body;
  const userId = req.user.id;

  try {
    const [result] = await pool.query(
      "INSERT INTO rooms (name, description, created_by) VALUES (?, ?, ?)",
      [name, description, userId]
    );
    res.status(201).json({ message: "방이 생성되었습니다.", roomId: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const [rooms] = await pool.query("SELECT * FROM rooms");
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:roomId/messages", authMiddleware, async (req, res) => {
  const { roomId } = req.params;

  try {
    const [messages] = await pool.query(
      `SELECT m.id,
              m.room_id     AS roomId,
              m.user_id     AS userId,
              u.username    AS username,
              m.content,
              m.created_at  AS createdAt
         FROM messages m
         LEFT JOIN users u ON u.id = m.user_id
        WHERE m.room_id = ?
        ORDER BY m.created_at ASC
        LIMIT 200`,
      [roomId]
    );

    const formatted = messages.map((message) => ({
      id: message.id,
      roomId: message.roomId,
      userId: message.userId,
      username: message.username,
      content: message.content,
      created_at: message.createdAt ? new Date(message.createdAt).toISOString() : null,
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
