import express from "express";
import { UserController } from "../../../controllers/UserController";
import { authMiddleware } from "../../../middleware/auth";
import catchAsyncErrors from "../../../utils/catchAsyncError";
import { avatarUpload } from "../../../middleware/upload";

const userRouter = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: 사용자 프로필 및 계정 관리 API
 */

/**
 * @swagger
 * /api/v1/users/me:
 *   get:
 *     summary: 내 정보 조회
 *     description: 로그인된 사용자의 정보를 반환합니다.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 사용자 정보 반환 성공
 *       401:
 *         description: 인증 실패
 */
userRouter.get("/me", authMiddleware, catchAsyncErrors(UserController.getProfile));

/**
 * @swagger
 * /api/v1/users/me:
 *   patch:
 *     summary: 내 정보 수정
 *     description: 로그인된 사용자의 닉네임 또는 비밀번호를 수정합니다.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nickname:
 *                 type: string
 *                 example: 홍건우
 *               password:
 *                 type: string
 *                 example: newpassword123
 *     responses:
 *       200:
 *         description: 수정 성공
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: 인증 실패
 */
userRouter.patch("/me", authMiddleware, catchAsyncErrors(UserController.updateProfile));

/**
 * @swagger
 * /api/v1/users/me:
 *   delete:
 *     summary: 회원 탈퇴
 *     description: 로그인된 사용자의 계정을 삭제합니다.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 삭제 성공
 *       401:
 *         description: 인증 실패
 */
userRouter.delete("/me", authMiddleware, catchAsyncErrors(UserController.deleteAccount));

userRouter.post(
  "/me/avatar",
  authMiddleware,
  avatarUpload.single("avatar"),
  catchAsyncErrors(UserController.uploadAvatar)
);

export default userRouter;
