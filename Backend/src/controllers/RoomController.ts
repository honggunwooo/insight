import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { RoomService } from "../services/RoomService";

export const RoomController = {
  // 방 만들기
  async create(req: AuthRequest, res: Response) {
    const { name, isPrivate } = req.body;
    const room = await RoomService.createRoom(req.user!.id, name, isPrivate);
    res.status(201).json({ success: true, room });
  },
  // 방 조회
  async getAll(_req: AuthRequest, res: Response) {
    const rooms = await RoomService.getAllRooms();
    res.status(200).json({ success: true, rooms });
  },
  // 방 전체 조회
  async getOne(req: AuthRequest, res: Response) {
    const room = await RoomService.getRoomById(Number(req.params.id));
    res.status(200).json({ success: true, room });
  },
  // 방 삭제
  async delete(req: AuthRequest, res: Response) {
    const result = await RoomService.deleteRoom(Number(req.params.id), req.user!.id);
    res.status(200).json({ success: true, ...result });
  },
};