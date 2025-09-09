const { Pool } = require('pg');

function makePool() {
  const url = process.env.DATABASE_URL || '';
  if (!url) return null;

  let isLocal = false;
  try {
    const { hostname } = new URL(url);
    isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
  } catch { /* ignore malformed URL */ }

  // 로컬은 SSL X, 클라우드는 SSL O
  return isLocal
    ? new Pool({ connectionString: url })
    : new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });
}

const pool = makePool();

async function ensureTables() {
  if (!pool) { console.log('DB OFF (no DATABASE_URL)'); return; }
  await pool.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id BIGSERIAL PRIMARY KEY,
      channel  TEXT NOT NULL,
      content  TEXT NOT NULL CHECK (char_length(content) <= 1000),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_messages_ch_created
      ON messages(channel, created_at DESC);
  `);
  console.log('DB ready');
}

module.exports = { pool, ensureTables };

console.log('DB module loaded');
