const express = require('express');

module.exports = (pool) => {
  const router = express.Router();

  // ======================
  // 채널 관련 API
  // ======================

  // 채널 목록 조회 API
  router.get('/channels', async (req, res) => {
    try {
      const { rows } = await pool.query(`
        SELECT name FROM channels ORDER BY name
      `);
      res.json(rows.map(r => r.name));
    } catch (err) {
      console.error('[GET /channels error]', err);
      res.status(500).json({ error: 'db-fail' });
    }
  });

  // 새 채널 추가 API
  router.post('/channels', async (req, res) => {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "invalid-name" });
    }

    try {
      await pool.query(
        `INSERT INTO channels (name) VALUES ($1) ON CONFLICT DO NOTHING`,
        [name.trim()]
      );
      res.json({ ok: true });
    } catch (err) {
      console.error('[POST /channels error]', err);
      res.status(500).json({ error: 'db-fail' });
    }
  });

  router.get('/messages', async (req, res) => {
    try {
      const { channel, limit = 50, before } = req.query;

      const sql = `
        SELECT id, channel, content, author, created_at
        FROM messages
        WHERE channel = $1
        ${before ? 'AND created_at < $2' : ''}
        ORDER BY created_at DESC
        LIMIT $${before ? 3 : 2}
      `;
      const params = before ? [channel, before, limit] : [channel, limit];
      const { rows } = await pool.query(sql, params);

      const messages = rows.map(r => ({
        id: r.id,
        channel: r.channel,
        content: r.content,
        author: r.author,
        createdAt: r.created_at.toISOString(),
      }));

      res.json(messages);
    } catch (err) {
      console.error('[GET /messages error]', err);
      res.status(500).json({ error: 'db-fail' });
    }
  });

  return router;
};
