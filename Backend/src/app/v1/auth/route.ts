import express from "express";
import { AuthController } from "../../../controllers/AuthController";
import { authMiddleware } from "../../../middleware/auth";

const router = express.Router();

router.post("/signup", AuthController.register);
router.post("/login", AuthController.login);
router.post("/logout", authMiddleware, AuthController.logout);

export default router;