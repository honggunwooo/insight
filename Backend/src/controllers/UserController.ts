import { Response } from "express";
import { UserService } from "../services/UserService";
import { AuthRequest } from "../middleware/auth";

export const UserController = {
    // 내 정보 조회
    async getProfile(req: AuthRequest, res: Response) {
        const userId = req.user!.id;
        const user = await UserService.getProfile(userId);
        res.status(200).json({ success: true, user });
    },

    // 내 정보 수정
    async updateProfile(req: AuthRequest, res: Response) {
        const userId = req.user!.id;
        const { nickname, password } = req.body;
        const result = await UserService.updateProfile(userId, nickname, password);
        res.status(200).json({ success: true, ...result });
    },

    // 회원 탈퇴
    async deleteAccount(req: AuthRequest, res: Response) {
        const userId = req.user!.id;
        const result = await UserService.deleteAccount(userId);
        res.status(200).json({ success: true, ...result });
    },
};