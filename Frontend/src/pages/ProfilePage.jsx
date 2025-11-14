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

const normalizeImagePath = (value) => {
  if (!value) return "";
  if (value.startsWith("blob:") || value.startsWith("http")) return value;
  const trimmed = value.replace(/^https?:\/\/[^/]+/, "").replace(/^\/+/, "");
  if (trimmed.startsWith("uploads/")) {
    return `/uploads/${trimmed.replace(/^uploads\//, "")}`;
  }
  return `/${trimmed}`;
};

function ProfilePage() {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState({
    type: "loading",
    text: "프로필을 불러오는 중입니다...",
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    nickname: "",
    location: "",
    bio: "",
    interests: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setStatus({ type: "error", text: "로그인 정보가 없습니다." });
      return;
    }

    axios
      .get(PROFILE_ROUTE, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        const profile = res.data.user || res.data;
        setUser({
          ...profile,
          profile_image: profile.profile_image
            ? normalizeImagePath(profile.profile_image)
            : null,
        });
        setForm({
          nickname: profile.nickname || "",
          location: profile.location || "",
          bio: profile.bio || "",
          interests: profile.interests || "",
        });
        setStatus(null);
      })
      .catch((error) => {
        setStatus({
          type: "error",
          text:
            error?.response?.data?.message || "프로필 정보를 불러오지 못했습니다.",
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

  const handleDeleteAccount = async () => {
    const confirmation = window.confirm(
      "정말 회원 탈퇴하시겠어요? 참여 중인 채팅방 정보도 함께 삭제됩니다."
    );
    if (!confirmation) return;

    const token = localStorage.getItem("token");
    if (!token) {
      setStatus({ type: "error", text: "로그인 후 이용해주세요." });
      return;
    }

    try {
      setStatus({ type: "loading", text: "회원 탈퇴를 진행하고 있습니다..." });
      await axios.delete(PROFILE_ROUTE, {
        headers: { Authorization: `Bearer ${token}` },
      });
      localStorage.removeItem("token");
      setStatus({ type: "success", text: "탈퇴가 완료되었습니다." });
      setTimeout(() => {
        window.location.href = "/signup";
      }, 1200);
    } catch (error) {
      setStatus({
        type: "error",
        text: error?.response?.data?.message || "회원 탈퇴에 실패했습니다.",
      });
    }
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      setStatus({ type: "error", text: "로그인이 필요합니다." });
      return;
    }

    try {
      setStatus({ type: "loading", text: "프로필을 저장하는 중입니다..." });
      await axios.patch(PROFILE_ROUTE, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser((prev) => ({
        ...(prev ?? {}),
        ...form,
      }));
      setIsEditing(false);
      setStatus({ type: "success", text: "프로필이 수정되었습니다." });
    } catch (error) {
      setStatus({
        type: "error",
        text: error?.response?.data?.message || "프로필 수정에 실패했습니다.",
      });
    }
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
        profile_image: normalizeImagePath(data.imageUrl),
      }));
      setSelectedFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      setStatus({ type: "success", text: data.message || "프로필 이미지가 업데이트되었습니다." });
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
    const normalized = normalizeImagePath(src);
    if (!normalized) return null;
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

  const joinedAt = user.created_at || user.createdAt
    ? new Date(user.created_at || user.createdAt).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
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
            <p className="profile-field-value">활동 지역: {user.location || "미입력"}</p>
          </div>
        </div>

        <div className="profile-body">
          <div className="profile-field">
            <span className="profile-field-label">자기소개</span>
            <span className="profile-field-value profile-field-value--multiline">
              {user.bio || "자기소개가 없습니다."}
            </span>
          </div>
          <div className="profile-field">
            <span className="profile-field-label">관심사</span>
            <span className="profile-field-value">{user.interests || "미입력"}</span>
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
            <button type="button" className="btn btn-primary" onClick={handleUpload}>
              업로드
            </button>
          )}
        </div>

        {isEditing ? (
          <form className="profile-form" onSubmit={handleSaveProfile}>
            <label className="profile-form-field">
              닉네임
              <input
                type="text"
                name="nickname"
                value={form.nickname}
                onChange={handleFormChange}
                className="profile-input"
                required
              />
            </label>
            <label className="profile-form-field">
              활동 지역
              <input
                type="text"
                name="location"
                value={form.location}
                onChange={handleFormChange}
                className="profile-input"
              />
            </label>
            <label className="profile-form-field">
              자기소개
              <textarea
                name="bio"
                rows={3}
                value={form.bio}
                onChange={handleFormChange}
                className="profile-textarea"
              />
            </label>
            <label className="profile-form-field">
              관심사 (쉼표로 구분)
              <input
                type="text"
                name="interests"
                value={form.interests}
                onChange={handleFormChange}
                className="profile-input"
              />
            </label>
            <div className="profile-form-actions">
              <button type="submit" className="btn btn-primary">
                저장
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setIsEditing(false);
                  setForm({
                    nickname: user.nickname || "",
                    location: user.location || "",
                    bio: user.bio || "",
                    interests: user.interests || "",
                  });
                  setStatus(null);
                }}
              >
                취소
              </button>
            </div>
          </form>
        ) : (
          <div className="profile-form-actions">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setIsEditing(true)}
            >
              프로필 수정
            </button>
            <button type="button" className="btn btn-outline" onClick={handleRefresh}>
              새로고침
            </button>
            <button type="button" className="btn btn-primary" onClick={handleLogout}>
              로그아웃
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleDeleteAccount}
            >
              회원 탈퇴
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfilePage;
