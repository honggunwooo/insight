import { RoomModel } from "../models/RoomModel";

export const RoomService = {
  // 방 생성
  async createRoom(ownerId: number, name: string, isPrivate: boolean = false) {
    const result = await RoomModel.createRoom(name, ownerId, isPrivate);
    return { message: "방이 생성되었습니다.", result };
  },

  // 모든 방 조회
  async getAllRooms() {
    const rooms = await RoomModel.findAll();
    return rooms;
  },

  // ID로 방 조회
  async getRoomById(id: number) {
    const room = await RoomModel.findById(id);
    if (!room) throw new Error("존재하지 않는 방입니다.");
    return room;
  },

  // 방 삭제
  async deleteRoom(id: number, ownerId: number) {
    const room = await RoomModel.findById(id);
    if (!room) throw new Error("방을 찾을 수 없습니다.");
    if (room.owner_id !== ownerId) throw new Error("본인이 만든 방만 삭제할 수 있습니다.");

    await RoomModel.deleteRoom(id);
    return { message: "방이 삭제되었습니다." };
  },
};