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
const CREATE_ROOM_ROUTE = `${API_BASE_URL}${API_PREFIX}/rooms`;

function ChannelCreatePage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [status, setStatus] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!name.trim()) {
      setStatus({ type: "error", message: "채널 이름을 입력해주세요." });
      return;
    }

    if (!CREATE_ROOM_ROUTE) {
      setStatus({ type: "error", message: "CREATE_ROOM_ROUTE를 먼저 설정해주세요." });
      return;
    }

    setStatus({ type: "loading", message: "채널을 생성하고 있습니다..." });

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        CREATE_ROOM_ROUTE,
        { name: name.trim() },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      setStatus({ type: "success", message: "채널이 성공적으로 생성되었습니다!" });
      setTimeout(() => navigate("/chat"), 600);
    } catch (err) {
      setStatus({
        type: "error",
        message: err.response?.data?.message || "채널 생성 중 오류가 발생했습니다.",
      });
    }
  };

  return (
    <div className="channel-create-wrapper">
      <div className="channel-create-card">
        <p className="channel-create-badge">채널 설정</p>
        <h2 className="channel-create-title">새 채널 만들기</h2>
        <p className="channel-create-subtitle">
          관심사나 목적에 맞는 채널을 만들어 이웃들과 더 집중된 대화를 나눠보세요.
        </p>

        <form className="channel-create-form" onSubmit={handleSubmit}>
          <label className="channel-create-label">
            채널 이름
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="예: 마포구-맛집"
              required
            />
          </label>

          <div className="channel-create-actions">
            <button type="submit" className="btn btn-primary" disabled={status?.type === "loading"}>
              {status?.type === "loading" ? "생성 중..." : "채널 생성"}
            </button>
            <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>
              돌아가기
            </button>
          </div>
        </form>

        {status?.message && (
          <p className={`channel-create-status channel-create-status--${status.type}`}>
            {status.message}
          </p>
        )}
      </div>
    </div>
  );
}

export default ChannelCreatePage;
