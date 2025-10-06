const jwt = require("jsonwebtoken");
const pool = require("../config/db");

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("🟢 유저 연결됨:", socket.id);

    const token = socket.handshake.auth?.token;
    if (!token) {
      console.log("❌ 인증 토큰 없음:", socket.id);
      socket.emit("unauthorized", { message: "토큰이 없습니다." });
      socket.disconnect();
      return;
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded; 
      console.log(` 인증된 유저: ${decoded.username} (id: ${decoded.id})`);
    } catch (err) {
      console.error("❌ 토큰 검증 실패:", err.message);
      socket.emit("unauthorized", { message: "토큰이 유효하지 않습니다." });
      socket.disconnect();
      return;
    }

    socket.on("joinRoom", (roomId) => {
      if (!roomId) {
        return;
      }
      socket.join(roomId);
      console.log(`👥 ${socket.user.username} 님이 ${roomId} 방에 참여`);
    });

    socket.on("leaveRoom", (roomId) => {
      if (!roomId) {
        return;
      }
      socket.leave(roomId);
      console.log(`🚪 ${socket.user.username} 님이 ${roomId} 방에서 나감`);
    });

    socket.on("sendMessage", async ({ roomId, content }) => {
      const trimmed = typeof content === "string" ? content.trim() : "";
      if (!roomId || !trimmed) {
        socket.emit("errorMessage", { message: "메세지를 입력해주세요." });
        return;
      }

      try {
        const userId = socket.user.id;
        const [result] = await pool.query(
          "INSERT INTO messages (room_id, user_id, content) VALUES (?, ?, ?)",
          [roomId, userId, trimmed]
        );

        const createdAt = new Date().toISOString();

        io.to(roomId).emit("receiveMessage", {
          id: result.insertId,
          roomId,
          userId,
          username: socket.user.username,
          content: trimmed,
          created_at: createdAt,
        });
      } catch (err) {
        console.error("❌ 메세지 전송 에러:", err.message);
        socket.emit("errorMessage", { message: "메세지 전송 실패" });
      }
    });

    socket.on("disconnect", () => {
      console.log("🔴 유저 연결 해제:", socket.id);
    });
  });
};
