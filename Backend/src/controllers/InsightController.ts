import { Response } from "express";
import { InsightService } from "../services/InsightService";
import { AuthRequest } from "../middleware/auth";

export const InsightController = {
  async getSummary(_req: AuthRequest, res: Response) {
    const summary = await InsightService.getSummary();
    res.status(200).json({ success: true, summary });
  },
};

export default InsightController;
