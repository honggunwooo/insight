import express from "express";
import { InsightController } from "../../../controllers/InsightController";
import catchAsyncErrors from "../../../utils/catchAsyncError";

const insightRouter = express.Router();

/**
 * @swagger
 * tags:
 *   name: Insight
 *   description: 서비스 요약/통계 API
 */

/**
 * @swagger
 * /insight/summary:
 *   get:
 *     summary: 전체 서비스 요약 지표
 *     description: 누적 방/사용자/메시지 수와 당일 메시지 집계를 반환합니다.
 *     tags: [Insight]
 *     responses:
 *       200:
 *         description: 지표 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 summary:
 *                   type: object
 *                   properties:
 *                     rooms:
 *                       type: integer
 *                       example: 12
 *                     users:
 *                       type: integer
 *                       example: 58
 *                     messages:
 *                       type: integer
 *                       example: 420
 *                     todayMessages:
 *                       type: integer
 *                       example: 37
 */
insightRouter.get(
  "/summary",
  catchAsyncErrors(InsightController.getSummary)
);

export default insightRouter;
