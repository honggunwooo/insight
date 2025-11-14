import { Response } from "express";
import { UserService } from "../services/UserService";
import { AuthRequest } from "../middleware/auth";
import { relativeFromRoot, toPublicPath } from "../middleware/upload";

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
        const { nickname, password, location, bio, interests } = req.body;
        const result = await UserService.updateProfile(
            userId,
            nickname,
            password,
            location,
            bio,
            interests
        );
        res.status(200).json({ success: true, ...result });
    },

    // 회원 탈퇴
    async deleteAccount(req: AuthRequest, res: Response) {
        const userId = req.user!.id;
        const result = await UserService.deleteAccount(userId);
        res.status(200).json({ success: true, ...result });
    },

    async uploadAvatar(req: AuthRequest, res: Response) {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "업로드된 파일이 없습니다." });
        }

        const relativePath = relativeFromRoot(req.file.path);
        const { imagePath, message } = await UserService.updateAvatar(req.user!.id, relativePath);

        res.status(200).json({
            success: true,
            message,
            imageUrl: toPublicPath(imagePath),
        });
    },
};
