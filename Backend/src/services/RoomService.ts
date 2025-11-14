import { RoomModel } from "../models/RoomModel";
import { RoomMemberModel } from "../models/RoomMemberModel";
import { RoomReadModel } from "../models/RoomReadModel";
import { MessageModel } from "../models/MessageModel";

export const RoomService = {
  // 방 생성
  async createRoom(ownerId: number, name: string, isPrivate: boolean = false) {
    const roomId = await RoomModel.createRoom(name, ownerId, isPrivate);
    await RoomMemberModel.addMember(roomId, ownerId, "owner");
    return { message: "방이 생성되었습니다.", roomId };
  },

  // 모든 방 조회
  async getAllRooms(search?: string) {
    const rooms = await RoomModel.findAll(search);
    return rooms;
  },

  async getRoomsForUser(userId: number, search?: string) {
    const rooms = await RoomModel.findAll(search);
    const memberships = await RoomMemberModel.getRoomsForUser(userId);
    const states = await RoomReadModel.getStatesForUser(userId);

    const membershipMap = new Map<number, string>();
    memberships.forEach((m: any) => {
      membershipMap.set(m.room_id, m.role);
    });

    const stateMap = new Map<number, any>();
    states.forEach((s: any) => stateMap.set(s.room_id, s));

    const enriched = [];
    for (const room of rooms as any[]) {
      if (!membershipMap.has(room.id)) continue;
      const state = stateMap.get(room.id);
      const unreadCount = await MessageModel.countUnread(room.id, state?.last_read_message_id);
      enriched.push({ ...room, role: membershipMap.get(room.id), unreadCount });
    }
    return enriched;
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

    await RoomMemberModel.removeAll(id);
    await RoomModel.deleteRoom(id);
    return { message: "방이 삭제되었습니다." };
  },
};
