import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function ChannelCreatePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", description: "" });
  const [status, setStatus] = useState(null);

  const token = localStorage.getItem("token");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!token) {
      setStatus({ type: "error", message: "로그인 정보가 만료되었습니다. 다시 로그인해주세요." });
      setTimeout(() => navigate("/login"), 500);
      return;
    }

    if (!form.name.trim()) {
      setStatus({ type: "error", message: "채널 이름을 입력해주세요." });
      return;
    }

    setStatus({ type: "loading", message: "채널을 생성하고 있습니다..." });

    try {
      const { data } = await axios.post(
        "http://localhost:4000/api/rooms",
        {
          name: form.name.trim(),
          description: form.description.trim() || null,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const createdRoomId = data?.roomId;
      setStatus({ type: "success", message: "채널이 성공적으로 생성되었습니다!" });

      setTimeout(() => {
        if (createdRoomId) {
          navigate(`/chat?roomId=${createdRoomId}`);
        } else {
          navigate("/chat");
        }
      }, 600);
    } catch (err) {
      console.error("채널 생성 실패", err);
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
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="예: 마포구-맛집"
              required
            />
          </label>

          <label className="channel-create-label">
            채널 소개 (선택)
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="채널에서 어떤 이야기를 나눌지 소개를 작성해보세요."
              rows={3}
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
