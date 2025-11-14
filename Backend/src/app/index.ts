import "dotenv/config";
import express from "express";
import { createServer } from "http";
import cors from "cors";
import cookieParser from "cookie-parser";
import { setupSwagger } from "../config/swagger";
import dotenv from "dotenv";
import connectDB from "../config/mysql";
import { initializeSocket } from "../config/socket";
import { TspecDocsMiddleware } from "tspec";
import route from "./route";

dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 4000;


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

// Favicon route
app.get('/favicon.ico', (req, res) => {
    res.status(204).end();
});

app.get('/', (req, res) => {
    res.status(204).end();
});

// Swagger 설정
setupSwagger(app);

app.use("/api", route);

(async () => {
    await connectDB();
    app.use("/docs", TspecDocsMiddleware);

    initializeSocket(server);

    const port = +(process.env.PORT ?? 8080);
    server.listen(port, "0.0.0.0", () => {
        console.log(`Server Start, port : ${port}`);
    });
})();