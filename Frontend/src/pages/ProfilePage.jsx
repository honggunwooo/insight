import React, { useEffect, useRef, useState } from "react";
import axios from "axios";

function ProfilePage() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({ username: "", location: "", bio: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    axios
      .get("http://localhost:4000/api/profile/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setUser(res.data);
        setFormData({
          username: res.data.username || "",
          location: res.data.location || "",
          bio: res.data.bio || "",
        });
        setStatus(null);
      })
      .catch((err) => {
        console.error("프로필 불러오기 실패:", err);
        setStatus({ type: "error", text: "프로필 정보를 불러오지 못했습니다." });
      });
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditToggle = () => {
    if (!user) return;
    setIsEditing((prev) => !prev);
    setStatus(null);
  };

  const handleCancel = () => {
    if (!user) return;
    setFormData({
      username: user.username || "",
      location: user.location || "",
      bio: user.bio || "",
    });
    setIsEditing(false);
    setStatus(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      setStatus({ type: "loading", text: "수정 내용을 저장하는 중입니다..." });

      const payload = {
        username: formData.username.trim(),
        location: formData.location.trim(),
        bio: formData.bio.trim(),
      };

      await axios.put("http://localhost:4000/api/profile/me", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const updatedUser = { ...user, ...payload };
      setUser(updatedUser);
      setFormData({
        username: updatedUser.username || "",
        location: updatedUser.location || "",
        bio: updatedUser.bio || "",
      });
      setIsEditing(false);
      setStatus({ type: "success", text: "프로필이 수정되었습니다." });
    } catch (err) {
      console.error("프로필 수정 실패:", err);
      setStatus({ type: "error", text: err.response?.data?.message || "프로필 수정에 실패했습니다." });
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileTrigger = () => {
    if (!fileInputRef.current) return;
    fileInputRef.current.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setStatus({ type: "info", text: "미리보기를 확인하고 업로드 버튼을 눌러주세요." });
  };

  const handleUploadAvatar = async () => {
    const token = localStorage.getItem("token");
    if (!token || !selectedFile) {
      return;
    }

    const formDataPayload = new FormData();
    formDataPayload.append("profileImage", selectedFile);

    setIsUploading(true);
    setStatus({ type: "loading", text: "프로필 이미지를 업로드하는 중입니다..." });

    try {
      const { data } = await axios.post(
        "http://localhost:4000/api/profile/me/avatar",
        formDataPayload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const imageUrl = data?.imageUrl;
      setUser((prev) => ({
        ...prev,
        profile_image: imageUrl || prev.profile_image,
      }));
      setPreviewUrl(null);
      setSelectedFile(null);
      setStatus({ type: "success", text: data?.message || "프로필 이미지가 변경되었습니다." });
    } catch (err) {
      console.error("프로필 이미지 업로드 실패:", err);
      setStatus({
        type: "error",
        text: err.response?.data?.message || "프로필 이미지 업로드에 실패했습니다.",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  if (!user) {
    return (
      <div className="profile-page">
        <div className="profile-card profile-card--loading">
          {status?.type === "error" ? status.text : "프로필 정보를 불러오는 중..."}
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-card">
        {status?.text && (
          <p className={`profile-status profile-status--${status.type}`}>{status.text}</p>
        )}

        <div className="profile-header">
          <img
            src={previewUrl || user.profile_image || "https://cdn-icons-png.flaticon.com/512/1946/1946429.png"}
            alt="프로필"
            className="profile-avatar"
          />
          <div className="profile-header-meta">
            <p className="profile-badge">내 정보</p>
            <h2 className="profile-name">{user.username}</h2>
            <p className="profile-email">{user.email}</p>
            <div className="profile-avatar-actions">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
              <button type="button" className="btn btn-outline" onClick={handleFileTrigger}>
                프로필 이미지 선택
              </button>
              {selectedFile && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleUploadAvatar}
                  disabled={isUploading}
                >
                  {isUploading ? "업로드 중..." : "업로드"}
                </button>
              )}
              {selectedFile && !isUploading && (
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    setSelectedFile(null);
                    if (previewUrl) {
                      URL.revokeObjectURL(previewUrl);
                      setPreviewUrl(null);
                    }
                    setStatus(null);
                  }}
                >
                  취소
                </button>
              )}
            </div>
          </div>
        </div>

        {!isEditing ? (
          <div className="profile-body">
            <div className="profile-field">
              <span className="profile-field-label">활동 지역</span>
              <span className="profile-field-value">{user.location || "위치 정보 없음"}</span>
            </div>
            <div className="profile-field">
              <span className="profile-field-label">자기소개</span>
              <span className="profile-field-value profile-field-value--multiline">
                {user.bio || "자기소개가 없습니다."}
              </span>
            </div>
            <button className="btn btn-primary profile-edit-btn" onClick={handleEditToggle}>
              프로필 수정
            </button>
          </div>
        ) : (
          <form className="profile-form" onSubmit={handleSubmit}>
            <label className="profile-form-field">
              닉네임
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="profile-input"
                required
              />
            </label>
            <label className="profile-form-field">
              활동 지역
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="profile-input"
                placeholder="예: 서울 마포구"
              />
            </label>
            <label className="profile-form-field">
              자기소개
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                className="profile-textarea"
                rows={3}
                placeholder="나를 소개하는 한 문장을 적어보세요"
              />
            </label>
            <div className="profile-form-actions">
              <button type="submit" className="btn btn-primary" disabled={status?.type === "loading"}>
                {status?.type === "loading" ? "저장 중..." : "저장"}
              </button>
              <button type="button" className="btn btn-outline" onClick={handleCancel}>
                취소
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default ProfilePage;
