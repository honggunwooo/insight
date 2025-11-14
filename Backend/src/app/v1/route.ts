import express from "express";
import catchAsyncErrors from "../../utils/catchAsyncError";
import authRouter from "./auth/route";
import userRouter from "./user/route";
import roomRouter from "./rooms/route";
import insightRouter from "./insight/route";

const v1Router = express.Router();

v1Router.get("/", catchAsyncErrors(async (_req, res) => {
  return res.status(200).json({ message: "test" });
}));

v1Router.use("/auth", authRouter);
v1Router.use("/users", userRouter);
v1Router.use("/rooms", roomRouter);
v1Router.use("/insight", insightRouter);

export default v1Router;
