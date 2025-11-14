import { UserModel } from "../models/UserModel";
import { hashPassword } from "../utils/password";

export const UserService = {
  async getProfile(userId: number) {
    const user = await UserModel.findById(userId);
    if (!user) throw new Error("사용자를 찾을 수 없습니다.");
    const { password, ...safeUser } = user;
    return safeUser;
  },

  async updateProfile(userId: number, nickname?: string, password?: string) {
    const user = await UserModel.findById(userId);
    if (!user) throw new Error("사용자를 찾을 수 없습니다.");

    const updates: any = {};
    if (nickname) updates.nickname = nickname;
    if (password) updates.password = await hashPassword(password);

    await UserModel.update(userId, updates);
    return { message: "프로필이 수정되었습니다." };
  },

  async deleteAccount(userId: number) {
    await UserModel.delete(userId);
    return { message: "회원 탈퇴가 완료되었습니다." };
  },
};