import { RoomModel } from "../models/RoomModel";
import { RoomMemberModel, RoomRole } from "../models/RoomMemberModel";

const OWNER_ONLY: RoomRole[] = ["owner"];

const isOwner = (role?: RoomRole | string | null) => role === "owner";
const isModerator = (role?: RoomRole | string | null) => role === "moderator";

export const RoomMemberService = {
  async ensureRoomExists(roomId: number) {
    const room = await RoomModel.findById(roomId);
    if (!room) throw new Error("존재하지 않는 방입니다.");
    return room;
  },

  async list(roomId: number) {
    await this.ensureRoomExists(roomId);
    return RoomMemberModel.getMembers(roomId);
  },

  async add(roomId: number, requesterId: number, targetUserId: number, role: RoomRole = "member") {
    const room = await this.ensureRoomExists(roomId);
    if (room.owner_id !== requesterId) {
      throw new Error("방장만 멤버를 추가할 수 있습니다.");
    }
    await RoomMemberModel.addMember(roomId, targetUserId, role);
    return { message: "멤버가 추가되었습니다." };
  },

  async join(roomId: number, userId: number) {
    await this.ensureRoomExists(roomId);
    await RoomMemberModel.addMember(roomId, userId, "member");
    return { message: "방에 참여했습니다." };
  },

  async updateRole(roomId: number, requesterId: number, targetUserId: number, role: RoomRole) {
    const room = await this.ensureRoomExists(roomId);
    if (room.owner_id !== requesterId) {
      throw new Error("방장만 역할을 변경할 수 있습니다.");
    }
    if (room.owner_id === targetUserId) {
      throw new Error("방장 역할은 변경할 수 없습니다.");
    }
    await RoomMemberModel.updateRole(roomId, targetUserId, role);
    return { message: "역할이 변경되었습니다." };
  },

  async remove(roomId: number, requesterId: number, targetUserId: number) {
    const room = await this.ensureRoomExists(roomId);
    if (room.owner_id !== requesterId && requesterId !== targetUserId) {
      throw new Error("방장만 멤버를 제거할 수 있습니다.");
    }
    if (room.owner_id === targetUserId) {
      throw new Error("방장은 제거할 수 없습니다.");
    }
    await RoomMemberModel.remove(roomId, targetUserId);
    return { message: "멤버가 제거되었습니다." };
  },
};
