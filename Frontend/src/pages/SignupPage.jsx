import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const trimTrailingSlash = (value) => value?.replace(/\/+$/, "") || "";
const ensureLeadingSlash = (value) =>
  value ? (value.startsWith("/") ? value : `/${value}`) : "";
const API_BASE_URL =
  trimTrailingSlash(import.meta.env.VITE_API_BASE_URL) ||
  "http://localhost:4000";
const API_PREFIX =
  ensureLeadingSlash(
    trimTrailingSlash(import.meta.env.VITE_API_PREFIX || "/api/v1")
  ) || "";
const SIGNUP_ROUTE = `${API_BASE_URL}${API_PREFIX}/auth/signup`;

function SignupPage() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [status, setStatus] = useState({ type: null, message: "" });
  const navigate = useNavigate();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSignup = async (event) => {
    event.preventDefault();
    setStatus({ type: "loading", message: "회원가입 진행 중입니다..." });

    if (!SIGNUP_ROUTE) {
      setStatus({ type: "error", message: "SIGNUP_ROUTE를 먼저 설정해주세요." });
      return;
    }

    try {
      await axios.post(SIGNUP_ROUTE, {
        email: form.email,
        password: form.password,
        nickname: form.username,
      });
      setStatus({
        type: "success",
        message: "가입이 완료되었습니다! 곧 로그인 페이지로 이동합니다.",
      });
      setTimeout(() => navigate("/login"), 800);
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error?.response?.data?.message || "회원가입 중 문제가 발생했습니다.",
      });
    }
  };

  const isLoading = status.type === "loading";

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <p className="auth-badge">시작해 볼까요?</p>
        <h2 className="auth-title">INSIGHT 회원가입</h2>
        <p className="auth-subtitle">
          몇 가지 정보만 입력하면 동네 이웃과 바로 연결돼요.
        </p>

        <form className="auth-form" onSubmit={handleSignup}>
          <label className="auth-label">
            닉네임
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              className="auth-input"
              placeholder="사용하실 닉네임"
              required
            />
          </label>

          <label className="auth-label">
            이메일
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="auth-input"
              placeholder="example@insight.com"
              required
            />
          </label>

          <label className="auth-label">
            비밀번호
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="auth-input"
              placeholder="8자 이상 입력해주세요"
              required
              minLength={8}
            />
          </label>

          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading ? "가입 중..." : "회원가입"}
          </button>
        </form>

        <p className="auth-helper">
          이미 계정이 있으신가요?{" "}
          <button type="button" className="auth-link" onClick={() => navigate("/login")}>
            로그인하기
          </button>
        </p>

        {status.message && (
          <p className={`auth-status auth-status--${status.type}`}>
            {status.message}
          </p>
        )}
      </div>
    </div>
  );
}

export default SignupPage;
