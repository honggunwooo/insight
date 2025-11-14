import multer from "multer";
import path from "path";
import fs from "fs";
import type { Request } from "express";

export interface UploadedFile {
  originalname: string;
  path: string;
  [key: string]: unknown;
}

const UPLOAD_ROOT = path.resolve(process.cwd(), "uploads");
const AVATAR_DIR = path.join(UPLOAD_ROOT, "avatars");
fs.mkdirSync(AVATAR_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req: Request, _file: UploadedFile, cb: (error: Error | null, destination: string) => void) => {
    cb(null, AVATAR_DIR);
  },
  filename: (_req: Request, file: UploadedFile, cb: (error: Error | null, filename: string) => void) => {
    const ext = path.extname(file.originalname) || "";
    const basename = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${basename}${ext}`);
  },
});

export const avatarUpload = multer({ storage });
export const relativeFromRoot = (absolutePath: string) =>
  path
    .relative(process.cwd(), absolutePath)
    .replace(/\\/g, "/");
export const toPublicPath = (relativePath: string) =>
  `/${relativePath.replace(/^\/+/, "")}`;
