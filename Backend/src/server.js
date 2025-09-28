const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const authMiddleware = require("./middlewares/jwt");

const app = express();

app.use("/uploads", express.static("uploads"));

// 미들웨어
app.use(cors());
app.use(express.json());

// 라우터 등록
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);

// 테스트용 보호 라우트
app.get("/api/protected", authMiddleware, (req, res) => {
  res.json({ message: "보호된 API 접근 성공!", user: req.user });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});