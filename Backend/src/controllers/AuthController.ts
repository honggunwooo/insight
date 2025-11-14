import { Request, Response } from "express";
import { AuthService } from "../services/AuthService";

export const AuthController = {
  async signup(req: Request, res: Response) {
    const { email, password, nickname } = req.body;
    const result = await AuthService.signup(email, password, nickname);
    res.status(201).json({ success: true, ...result });
  },

  async login(req: Request, res: Response) {
    const { email, password } = req.body;
    const result = await AuthService.login(email, password);
    res.status(200).json({ success: true, ...result });
  },

  async logout(_req: Request, res: Response) {
    const result = await AuthService.logout();
    res.status(200).json({ success: true, ...result });
  },
};