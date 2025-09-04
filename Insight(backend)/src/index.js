// src/routes/messages.js
const express = require('express');
module.exports = (pool) => {
  const r = express.Router();
  r.get('/messages', async (req, res) => {
    if (!pool) return res.json([]);
    const ch = String(req.query.channel || 'general').trim();
    const limit = Math.min(parseInt(req.query.limit || '30', 10), 100);
    const before = req.query.before || null;
    const { rows } = await pool.query(
      `SELECT id, channel, content, created_at
         FROM messages
        WHERE channel = $1
          AND ($2::timestamptz IS NULL OR created_at < $2)
        ORDER BY created_at DESC
        LIMIT $3`,
      [ch, before, limit]
    );
    res.json(rows);
  });
  return r;
};
// touch: Fri, Sep  5, 2025  1:21:16 AM
