import express from "express";
import { AuthController } from "../../../controllers/AuthController";
import { authMiddleware } from "../../../middleware/auth";
import catchAsyncErrors from "../../../utils/catchAsyncError";

const authRouter = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: 인증 관련 API
 */

/**
 * @swagger
 * /api/v1/auth/signup:
 *   post:
 *     summary: 회원가입
 *     description: 이메일, 비밀번호, 닉네임으로 새 계정을 생성합니다.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: test@example.com
 *               password:
 *                 type: string
 *                 example: "1234"
 *               nickname:
 *                 type: string
 *                 example: "홍박사"
 *     responses:
 *       201:
 *         description: 회원가입 성공
 *       400:
 *         description: 이미 존재하는 이메일
 */
authRouter.post("/signup", catchAsyncErrors(AuthController.signup));

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: 로그인
 *     description: 이메일과 비밀번호로 로그인합니다.
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: 로그인 성공
 *       400:
 *         description: 로그인 실패
 */
authRouter.post("/login", catchAsyncErrors(AuthController.login));

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: 로그아웃
 *     description: JWT 토큰을 무효화합니다.
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: 로그아웃 성공
 */
authRouter.post("/logout", authMiddleware, catchAsyncErrors(AuthController.logout));

export default authRouter;