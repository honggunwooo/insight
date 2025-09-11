const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const express = require('express');
const http = require('http');
const cors = require('cors');
const morgan = require('morgan');
const { Server } = require('socket.io');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const { pool, testConnection } = require('./db');
const { attachSocket } = require('./socket');
const messagesRouter = require('./routes/messages');

const app = express();

// 기본 보안/공통 미들웨어
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', methods: ['GET', 'POST'] }));
app.use(rateLimit({ windowMs: 15 * 1000, max: 150 }));
app.use(morgan('dev'));
app.use(express.json());

// 핑(헬스)
app.get('/', (_req, res) => res.json({ ok: true, name: 'Insight API' }));

// 라우터 (pool 주입)
app.use(messagesRouter(pool));

// DB 헬스체크 (MySQL용 쿼리로 수정)
app.get('/db/health', async (_req, res) => {
  if (!pool) return res.json({ db: false, reason: 'no DATABASE_URL' });
  try {
    const [now] = await pool.query('SELECT NOW() AS now');
    const [cnt] = await pool.query('SELECT COUNT(*) AS messages FROM messages');
    res.json({ db: true, now: now[0].now, messages: cnt[0].messages });
  } catch (e) {
    res.status(500).json({ db: false, error: e.message });
  }
});

// 파비콘 204
app.get('/favicon.ico', (_req, res) => res.sendStatus(204));

// Socket.IO 부착
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CORS_ORIGIN || '*', methods: ['GET', 'POST'] }
});
attachSocket(io, pool);

// 시작
const port = process.env.PORT || 4000;
server.listen(port, async () => {
  console.log(`Server running on http://localhost:${port}`);
  await testConnection(); // DB 연결 테스트 실행
});
