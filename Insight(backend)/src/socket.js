const MAX_MSG_LEN = 500;      // 메시지 최대 길이
const MAX_CH_LEN  = 50;       // 채널명 최대 길이
const TOKENS_PER_SEC = 5;     // 초당 허용 메시지 수
const BURST_LIMIT   = 10;     // 순간 버스트 허용치
const DUP_WINDOW_MS = 1500;   // 같은 내용 연속 전송 차단 시간

// 채널 키 정규화
const roomKey = (ch) => `ch:${String(ch || '').slice(0, MAX_CH_LEN).trim().toLowerCase()}`;

// 소켓별 토큰 버킷(레이트리밋) & 최근 메시지 기록
const buckets = new Map();   // socket.id -> { tokens, ts }
const lastMsg = new Map();   // socket.id -> { content, at }

function refillBucket(socketId) {
  const now = Date.now();
  const b = buckets.get(socketId) ?? { tokens: BURST_LIMIT, ts: now };
  const elapsedSec = Math.floor((now - b.ts) / 1000);
  if (elapsedSec > 0) {
    b.tokens = Math.min(BURST_LIMIT, b.tokens + elapsedSec * TOKENS_PER_SEC);
    b.ts = now;
  }
  buckets.set(socketId, b);
  return b;
}

function attachSocket(io, pool) {
  io.on('connection', (socket) => {
    // 채널 입장
    socket.on('join_channel', ({ channel }, ack) => {
      const room = roomKey(channel);
      if (!room) return ack?.({ ok: false, error: 'invalid-channel' });

      if (socket.data?.room && socket.data.room !== room) {
        socket.leave(socket.data.room);
      }
      socket.join(room);
      socket.data = { ...(socket.data || {}), room };
      ack?.({ ok: true, room });
    });

    // 메시지 전송 -> (레이트리밋/검증) -> DB 저장 -> 같은 채널 브로드캐스트
    socket.on('send_message', async ({ channel, content }, ack) => {
      try {
        // ---- 1) 채널/내용 정리 & 기본 검증 ----
        const ch   = String(channel || '').slice(0, MAX_CH_LEN).trim();
        const text = String(content || '').trim().slice(0, MAX_MSG_LEN);
        if (!ch || !text) return ack?.({ ok: false, error: 'empty' });

        // ---- 2) 레이트리밋(토큰 버킷) ----
        const b = refillBucket(socket.id);
        if (b.tokens <= 0) return ack?.({ ok: false, error: 'slow-down' });
        b.tokens -= 1;

        // ---- 3) 짧은 시간 내 동일 내용 연속 전송 차단 ----
        const prev = lastMsg.get(socket.id);
        const now = Date.now();
        if (prev && prev.content === text && now - prev.at < DUP_WINDOW_MS) {
          return ack?.({ ok: false, error: 'duplicate' });
        }
        lastMsg.set(socket.id, { content: text, at: now });

        // ---- 4) DB 저장 또는 임시 메시지 생성 ----
        let msg;
        if (pool) {
          const { rows } = await pool.query(
            `INSERT INTO messages(channel, content)
             VALUES ($1, $2)
             RETURNING id, channel, content, created_at`,
            [ch, text]
          );
          const r = rows[0];
          msg = {
            id: r.id,
            channel: r.channel,
            content: r.content,
            createdAt: r.created_at.toISOString(),
          };
        } else {
          msg = { id: Date.now(), channel: ch, content: text, createdAt: new Date().toISOString() };
        }

        // ---- 5) 같은 채널로 브로드캐스트 ----
        io.to(roomKey(ch)).emit('new_message', msg);
        ack?.({ ok: true, id: msg.id, createdAt: msg.createdAt });
      } catch (e) {
        console.error('[send_message error]', e);
        ack?.({ ok: false, error: 'db-fail' });
      }
    });

    socket.on('disconnect', () => {
      buckets.delete(socket.id);
      lastMsg.delete(socket.id);
    });
  });
}

module.exports = { attachSocket };