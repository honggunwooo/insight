import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { RoomMemberService } from "../services/RoomMemberService";

export const RoomMemberController = {
  async list(req: AuthRequest, res: Response) {
    const members = await RoomMemberService.list(Number(req.params.id));
    res.status(200).json({ success: true, members });
  },

  async add(req: AuthRequest, res: Response) {
    const roomId = Number(req.params.id);
    const { userId, role } = req.body;
    const result = await RoomMemberService.add(roomId, req.user!.id, Number(userId), role);
    res.status(201).json({ success: true, ...result });
  },

  async join(req: AuthRequest, res: Response) {
    const roomId = Number(req.params.id);
    const result = await RoomMemberService.join(roomId, req.user!.id);
    res.status(200).json({ success: true, ...result });
  },

  async updateRole(req: AuthRequest, res: Response) {
    const roomId = Number(req.params.id);
    const targetUserId = Number(req.params.userId);
    const { role } = req.body;
    const result = await RoomMemberService.updateRole(roomId, req.user!.id, targetUserId, role);
    res.status(200).json({ success: true, ...result });
  },

  async remove(req: AuthRequest, res: Response) {
    const roomId = Number(req.params.id);
    const targetUserId = Number(req.params.userId);
    const result = await RoomMemberService.remove(roomId, req.user!.id, targetUserId);
    res.status(200).json({ success: true, ...result });
  },
};
