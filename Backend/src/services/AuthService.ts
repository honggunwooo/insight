import { UserModel } from "../models/AuthModel";
import { hashPassword, comparePassword } from "../utils/password";
import { generateToken } from "../utils/jwt";

export const AuthService = {
  async signup(email: string, password: string, nickname: string) {
    const existing = await UserModel.findByEmail(email);
    if (existing) throw new Error("이미 존재하는 이메일입니다.");

    const hashed = await hashPassword(password);
    await UserModel.create({ email, password: hashed, nickname });

    return { message: "회원가입 성공" };
  },

  async login(email: string, password: string) {
    const user = await UserModel.findByEmail(email);
    if (!user) throw new Error("존재하지 않는 계정입니다.");

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) throw new Error("비밀번호가 올바르지 않습니다.");

    const token = generateToken({ id: user.id, email: user.email });
    return { message: "로그인 성공", token };
  },

  async logout() {
    return { message: "로그아웃 성공" };
  },
};