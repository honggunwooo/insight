import { MessageModel } from "../models/MessageModel";

export const MessageService = {
  async saveMessage(roomId: number, userId: number, content: string) {
    const insertId = await MessageModel.create(roomId, userId, content);
    return await MessageModel.getById(insertId);
  },

  async getMessages(roomId: number) {
    return await MessageModel.getByRoom(roomId);
  },
};

export const ChatService = MessageService;
