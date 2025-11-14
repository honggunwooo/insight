import express from "express";
import { RoomController } from "../../../controllers/RoomController";
import { MessageController } from "../../../controllers/MessageController";
import { authMiddleware } from "../../../middleware/auth";
import catchAsyncErrors from "../../../utils/catchAsyncError";

const roomRouter = express.Router();

/**
 * @swagger
 * tags:
 *   name: Rooms
 *   description: 채팅방 관련 API
 */

/**
 * @swagger
 * /rooms:
 *   post:
 *     summary: 새 채팅방 생성
 *     description: 로그인한 사용자가 새로운 채팅방을 생성합니다.
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: 개발자 토론방
 *               isPrivate:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       201:
 *         description: 채팅방 생성 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 방이 생성되었습니다.
 *       401:
 *         description: 인증 실패
 */
roomRouter.post("/", authMiddleware, catchAsyncErrors(RoomController.create));

/**
 * @swagger
 * /rooms:
 *   get:
 *     summary: 모든 채팅방 조회
 *     description: 전체 공개된 채팅방 목록을 가져옵니다.
 *     tags: [Rooms]
 *     responses:
 *       200:
 *         description: 채팅방 목록 반환 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 rooms:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       name:
 *                         type: string
 *                         example: 개발자 토론방
 *                       owner_id:
 *                         type: integer
 *                         example: 2
 *                       is_private:
 *                         type: boolean
 *                         example: false
 */
roomRouter.get("/", catchAsyncErrors(RoomController.getAll));

/**
 * @swagger
 * /rooms/{id}:
 *   get:
 *     summary: 특정 채팅방 조회
 *     description: 채팅방 ID를 기준으로 상세 정보를 가져옵니다.
 *     tags: [Rooms]
 *     parameters:
 *       - name: id
 *         in: path
 *         description: 채팅방 ID
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: 채팅방 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 room:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     owner_id:
 *                       type: integer
 *                     is_private:
 *                       type: boolean
 *       404:
 *         description: 채팅방을 찾을 수 없음
 */
roomRouter.get("/:id", catchAsyncErrors(RoomController.getOne));

/**
 * @swagger
 * /rooms/{id}:
 *   delete:
 *     summary: 채팅방 삭제
 *     description: 본인이 만든 채팅방만 삭제할 수 있습니다.
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: 채팅방 ID
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: 채팅방 삭제 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 방이 삭제되었습니다.
 *       401:
 *         description: 인증 실패
 *       403:
 *         description: 권한 없음 (본인이 아닌 경우)
 *       404:
 *         description: 채팅방을 찾을 수 없음
 */
roomRouter.delete("/:id", authMiddleware, catchAsyncErrors(RoomController.delete));

/**
 * @swagger
 * /rooms/{id}/messages:
 *   get:
 *     summary: 특정 방의 메시지 조회
 *     tags: [Rooms]
 *   post:
 *     summary: 특정 방에 메시지 작성
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 */
roomRouter.get("/:id/messages", catchAsyncErrors(MessageController.getByRoom));
roomRouter.post(
  "/:id/messages",
  authMiddleware,
  catchAsyncErrors(MessageController.create)
);

export default roomRouter;
