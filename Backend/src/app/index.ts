import "dotenv/config";
import express from "express";
import { createServer } from "http";
import cors from "cors";
import cookieParser from "cookie-parser";
import { initializeSocket } from "../config/socket";
import connectDB from "../config/mysql";
import v1Router from "./route";                    
import router from "./v1/auth/route";
const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 4000;

app.use("/api", router)

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("🚀 Insight Backend Server is running!");
});

app.use("/api/v1", v1Router);

(async () => {
  try {
    await connectDB();
    console.log("✅ MySQL Database connected.");

    initializeSocket(server);
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Server startup failed:", err);
  }
})();