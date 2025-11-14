import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

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

const PROFILE_ROUTE = `${API_BASE_URL}${API_PREFIX}/users/me`;
const PROFILE_UPLOAD_ROUTE = `${API_BASE_URL}${API_PREFIX}/users/me/avatar`;

function ProfilePage() {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState({
    type: "loading",
    text: "프로필을 불러오는 중입니다...",
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setStatus({
        type: "error",
        text: "로그인 정보가 없습니다. 다시 로그인해주세요.",
      });
      return;
    }

    axios
      .get(PROFILE_ROUTE, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        setUser(res.data.user || res.data);
        setStatus(null);
      })
      .catch((error) => {
        setStatus({
          type: "error",
          text: error?.response?.data?.message || "프로필 정보를 불러오지 못했습니다.",
        });
      });
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setStatus({ type: "info", text: "미리보기를 확인한 뒤 업로드를 누르세요." });
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    const token = localStorage.getItem("token");
    if (!token) {
      setStatus({ type: "error", text: "로그인이 필요합니다." });
      return;
    }

    const formData = new FormData();
    formData.append("avatar", selectedFile);

    try {
      setStatus({ type: "loading", text: "이미지를 업로드 중입니다..." });
      const { data } = await axios.post(PROFILE_UPLOAD_ROUTE, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setUser((prev) => ({
        ...(prev ?? {}),
        profile_image: data.imageUrl.replace(/^\/uploads\//, "uploads/"),
      }));
      setSelectedFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      setStatus({
        type: "success",
        text: data.message || "프로필 이미지가 업데이트되었습니다.",
      });
    } catch (error) {
      setStatus({
        type: "error",
        text: error?.response?.data?.message || "프로필 이미지 업로드에 실패했습니다.",
      });
    }
  };

  const avatarSrc = useMemo(() => {
    const src = previewUrl || user?.profile_image;
    if (!src) return null;
    if (src.startsWith("blob:") || src.startsWith("http")) return src;
    const normalized = src.startsWith("/uploads")
      ? src
      : `/uploads/${src.replace(/^\/+/, "").replace(/^uploads\//, "")}`;
    return `${API_BASE_URL}${normalized}`;
  }, [previewUrl, user?.profile_image]);

  if (!user) {
    return (
      <div className="profile-page">
        <div className="profile-card profile-card--loading">
          {status?.text || "프로필 정보를 불러오는 중입니다..."}
        </div>
      </div>
    );
  }

  const joinedAt =
    user.created_at || user.createdAt
      ? new Date(user.created_at || user.createdAt).toLocaleDateString(
          "ko-KR",
          {
            year: "numeric",
            month: "long",
            day: "numeric",
          }
        )
      : "알 수 없음";

  return (
    <div className="profile-page">
      <div className="profile-card">
        {status?.text && (
          <p className={`profile-status profile-status--${status.type}`}>
            {status.text}
          </p>
        )}

        <div className="profile-header">
          <div className="profile-avatar">
            {avatarSrc ? (
              <img src={avatarSrc} alt="프로필" />
            ) : (
              (user.nickname || user.username || "U").slice(0, 1)
            )}
          </div>
          <div className="profile-header-meta">
            <p className="profile-badge">내 정보</p>
            <h2 className="profile-name">{user.nickname || user.username}</h2>
            <p className="profile-email">{user.email}</p>
          </div>
        </div>

        <div className="profile-body">
          <div className="profile-field">
            <span className="profile-field-label">회원 번호</span>
            <span className="profile-field-value">#{user.id}</span>
          </div>
          <div className="profile-field">
            <span className="profile-field-label">가입일</span>
            <span className="profile-field-value">{joinedAt}</span>
          </div>
        </div>

        <div className="profile-avatar-actions">
          <input
            type="file"
            accept="image/*"
            id="avatar-input"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
          <label htmlFor="avatar-input" className="btn btn-outline">
            이미지 선택
          </label>
          {selectedFile && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleUpload}
            >
              업로드
            </button>
          )}
        </div>

        <div className="profile-form-actions">
          <button type="button" className="btn btn-outline" onClick={handleRefresh}>
            새로고침
          </button>
          <button type="button" className="btn btn-primary" onClick={handleLogout}>
            로그아웃
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
