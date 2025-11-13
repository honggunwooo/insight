import { Request, Response } from "express";
import { AuthService } from "../services/AuthService";
import catchAsyncErrors from "../utils/catchAsyncError";

export const AuthController = {
  register: catchAsyncErrors(async (req: Request, res: Response) => {
    const { email, password, nickname } = req.body;
    const result = await AuthService.register(email, password, nickname);
    res.status(201).json(result);
  }, (err, res) => {
    res.status(400).json({ success: false, message: (err as Error).message });
  }),

  login: catchAsyncErrors(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const result = await AuthService.login(email, password);
    res.status(200).json(result);
  }, (err, res) => {
    res.status(400).json({ success: false, message: (err as Error).message });
  }),

  logout: catchAsyncErrors(async (req: Request, res: Response) => {
    const result = await AuthService.logout();
    res.status(200).json(result);
  }, (err, res) => {
    res.status(500).json({ success: false, message: "로그아웃 실패" });
  }),
};