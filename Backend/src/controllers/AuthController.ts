import { Request, Response } from "express";
import { AuthService } from "../services/AuthService";

export const AuthController = {
  // 회원 가입
  async signup(req: Request, res: Response) {
    const { email, password, nickname } = req.body;
    const result = await AuthService.signup(email, password, nickname);
    res.status(201).json({ success: true, ...result });
  },
  // 로그인
  async login(req: Request, res: Response) {
    const { email, password } = req.body;
    const result = await AuthService.login(email, password);
    res.status(200).json({ success: true, ...result });
  },
  // 로그아웃
  async logout(_req: Request, res: Response) {
    const result = await AuthService.logout();
    res.status(200).json({ success: true, ...result });
  },
};