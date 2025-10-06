import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (event) => {
    event.preventDefault();
    setStatus({ type: "loading", message: "로그인 중입니다..." });

    try {
      const res = await axios.post("http://localhost:4000/api/auth/login", {
        email,
        password,
      });

      localStorage.setItem("token", res.data.token);
      setStatus({ type: "success", message: "로그인 성공! 채팅방으로 이동합니다." });
      setTimeout(() => {
        window.location.href = "/chat";
      }, 600);
    } catch (err) {
      console.error(err);
      setStatus({
        type: "error",
        message: err.response?.data?.message || "이메일 또는 비밀번호를 다시 확인해주세요.",
      });
    }
  };

  const isLoading = status?.type === "loading";

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <p className="auth-badge">다시 만나 반가워요!</p>
        <h2 className="auth-title">INSIGHT 계정으로 로그인</h2>
        <p className="auth-subtitle">동네 이웃과의 대화가 당신을 기다리고 있어요.</p>

        <form className="auth-form" onSubmit={handleLogin}>
          <label className="auth-label">
            이메일
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
              placeholder="example@insight.com"
              required
            />
          </label>

          <label className="auth-label">
            비밀번호
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
              placeholder="비밀번호를 입력하세요"
              required
            />
          </label>

          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <p className="auth-helper">
          아직 INSIGHT가 처음이신가요?{" "}
          <button type="button" className="auth-link" onClick={() => navigate("/signup")}>
            회원가입하기
          </button>
        </p>

        {status?.message && (
          <p className={`auth-status auth-status--${status.type}`}>
            {status.message}
          </p>
        )}
      </div>
    </div>
  );
}

export default LoginPage;
