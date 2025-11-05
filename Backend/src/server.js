const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const pool = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const authMiddleware = require("./middlewares/jwt");
const initChatSocket = require("./socket/chatSocket");
const roomRoutes = require("./routes/roomRoutes");

const app = express();
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());
app.use("/uploads", express.static("uploads"));

app.get("/api/protected", authMiddleware, (req, res) => {
  res.json({ message: "보호된 API 접근 성공", user: req.user });
});

// DB 연결 테스트
pool.getConnection()
  .then(conn => {
    console.log("✅ DB Connected!");
    conn.release();
  })
  .catch(err => {
    console.error("❌ DB 연결 실패:", err);
  });

// 라우터 등록
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/rooms", roomRoutes);

// http 서버와 socket.io 연결
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// 소켓 이벤트 실행
initChatSocket(io);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});