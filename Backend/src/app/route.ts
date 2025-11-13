import express from "express";
import v1Router from "../app/v1/auth/route";
const route = express.Router();

route.use("/auth", v1Router);

export default route;