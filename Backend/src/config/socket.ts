import { Server } from "socket.io";
import { ChatService } from "../services/MessageService";

export function initializeSocket(server: any) {
  const io = new Server(server, {
    cors: {
      origin: [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
      ],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`🟢 User connected: ${socket.id}`);

    socket.on("joinRoom", (roomId) => {
      socket.join(`room_${roomId}`);
      console.log(`✅ User joined room ${roomId}`);
    });

    socket.on("sendMessage", async ({ roomId, userId, content }) => {
      if (!content?.trim()) return;

      const message = await ChatService.saveMessage(roomId, userId, content.trim());
      if (!message) return;

      io.to(`room_${roomId}`).emit("newMessage", message);
    });

    socket.on("disconnect", () => {
      console.log(`🔴 User disconnected: ${socket.id}`);
    });
  });

  console.log("🟢 Socket initialized");
  return io;
}
