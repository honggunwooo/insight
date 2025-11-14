import { MessageModel } from "../models/MessageModel";
import { RoomReadModel } from "../models/RoomReadModel";

export const MessageService = {
  async saveMessage(roomId: number, userId: number, content: string) {
    const insertId = await MessageModel.create(roomId, userId, content);
    return await MessageModel.getById(insertId);
  },

  async getMessages(roomId: number, search?: string) {
    if (search) {
      return await MessageModel.searchInRoom(roomId, search);
    }
    return await MessageModel.getByRoom(roomId);
  },

  async getLatest(roomId: number) {
    return await MessageModel.getLatest(roomId);
  },

  async markRead(roomId: number, userId: number, messageId?: number) {
    let targetId = messageId;
    if (!targetId) {
      const latest = await MessageModel.getLatest(roomId);
      targetId = latest?.id;
    }
    if (!targetId) return { message: "읽을 메시지가 없습니다." };
    await RoomReadModel.upsert(roomId, userId, targetId);
    return { message: "읽음 처리되었습니다.", lastReadMessageId: targetId };
  },
};

export const ChatService = MessageService;
