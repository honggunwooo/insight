import { Response } from "express";
import { MessageService } from "../services/MessageService";
import { AuthRequest } from "../middleware/auth";

export const MessageController = {
  async getByRoom(req: AuthRequest, res: Response) {
    const roomId = Number(req.params.id);
    if (Number.isNaN(roomId)) {
      return res.status(400).json({ success: false, message: "유효한 방 ID가 아닙니다." });
    }

    const search = typeof req.query.search === "string" ? req.query.search : undefined;

    const messages = await MessageService.getMessages(roomId, search);
    res.status(200).json({ success: true, messages });
  },

  async create(req: AuthRequest, res: Response) {
    const roomId = Number(req.params.id);
    if (Number.isNaN(roomId)) {
      return res.status(400).json({ success: false, message: "유효한 방 ID가 아닙니다." });
    }

    const userId = req.user?.id;
    const { content } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: "인증되지 않은 사용자입니다." });
    }

    if (!content?.trim()) {
      return res.status(400).json({ success: false, message: "메시지 내용을 입력해주세요." });
    }

    const message = await MessageService.saveMessage(roomId, userId, content.trim());
    res.status(201).json({ success: true, message });
  },

  async markRead(req: AuthRequest, res: Response) {
    const roomId = Number(req.params.id);
    if (Number.isNaN(roomId)) {
      return res.status(400).json({ success: false, message: "유효한 방 ID가 아닙니다." });
    }
    const { messageId } = req.body;
    const result = await MessageService.markRead(roomId, req.user!.id, messageId);
    res.status(200).json({ success: true, ...result });
  },
};
