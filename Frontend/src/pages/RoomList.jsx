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
const ROOMS_ROUTE = `${API_BASE_URL}${API_PREFIX}/rooms`;
const MY_ROOMS_ROUTE = `${API_BASE_URL}${API_PREFIX}/rooms/my`;
const MEMBERS_ROUTE = (roomId) =>
  `${API_BASE_URL}${API_PREFIX}/rooms/${roomId}/members`;
const PROFILE_ROUTE = `${API_BASE_URL}${API_PREFIX}/users/me`;
const ROLE_OPTIONS = [
  { value: "member", label: "일반 멤버" },
  { value: "moderator", label: "관리자" },
];

function RoomList() {
  const [rooms, setRooms] = useState([]);
  const [roomSearch, setRoomSearch] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [members, setMembers] = useState([]);
  const [memberStatus, setMemberStatus] = useState(null);
  const [inviteForm, setInviteForm] = useState({ userId: "", role: "member" });
  const [name, setName] = useState("");
  const [status, setStatus] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    axios
      .get(PROFILE_ROUTE, { headers })
      .then((res) => setCurrentUser(res.data.user || res.data))
      .catch(() => setCurrentUser(null));
  }, []);

  const fetchRooms = async () => {
    try {
      const keyword = roomSearch.trim();
      const query = keyword ? `?search=${encodeURIComponent(keyword)}` : "";
      const { data } = await axios.get(`${MY_ROOMS_ROUTE}${query}`, {
        headers,
      });
      const list = data.rooms || data;
      setRooms(list);
      if (!list.find((room) => room.id === selectedRoomId)) {
        setSelectedRoomId(list[0]?.id ?? null);
      }
      setStatus(null);
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error?.response?.data?.message || "방 목록을 불러오지 못했습니다.",
      });
    }
  };

  const fetchMembers = async (roomId) => {
    if (!roomId) return;
    try {
      const { data } = await axios.get(MEMBERS_ROUTE(roomId), { headers });
      setMembers(data.members || data);
      setMemberStatus(null);
    } catch (error) {
      setMemberStatus({
        type: "error",
        message:
          error?.response?.data?.message || "멤버 정보를 불러오지 못했습니다.",
      });
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [roomSearch]);

  useEffect(() => {
    if (selectedRoomId) {
      fetchMembers(selectedRoomId);
    } else {
      setMembers([]);
    }
  }, [selectedRoomId]);

  const handleCreateRoom = async (event) => {
    event.preventDefault();
    if (!name.trim()) {
      setStatus({ type: "error", message: "방 이름을 입력해주세요." });
      return;
    }
    try {
      setStatus({ type: "loading", message: "방을 생성하는 중입니다..." });
      await axios.post(
        ROOMS_ROUTE,
        { name: name.trim() },
        { headers }
      );
      setName("");
      setStatus({ type: "success", message: "방이 생성되었습니다." });
      fetchRooms();
    } catch (error) {
      setStatus({
        type: "error",
        message: error?.response?.data?.message || "방 생성에 실패했습니다.",
      });
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm("정말 이 방을 삭제할까요?")) return;
    try {
      await axios.delete(`${ROOMS_ROUTE}/${roomId}`, { headers });
      setStatus({ type: "success", message: "방이 삭제되었습니다." });
      if (selectedRoomId === roomId) {
        setSelectedRoomId(null);
        setMembers([]);
      }
      fetchRooms();
    } catch (error) {
      setStatus({
        type: "error",
        message: error?.response?.data?.message || "방 삭제에 실패했습니다.",
      });
    }
  };

  const handleInvite = async (event) => {
    event.preventDefault();
    if (!selectedRoomId) return;
    if (!inviteForm.userId.trim()) {
      setMemberStatus({
        type: "error",
        message: "추가할 사용자 ID를 입력해주세요.",
      });
      return;
    }
    const numericUserId = Number(inviteForm.userId);
    if (Number.isNaN(numericUserId)) {
      setMemberStatus({
        type: "error",
        message: "숫자로 된 사용자 ID만 입력할 수 있습니다.",
      });
      return;
    }
    try {
      await axios.post(
        MEMBERS_ROUTE(selectedRoomId),
        {
          userId: numericUserId,
          role: inviteForm.role,
        },
        { headers }
      );
      setInviteForm({ userId: "", role: "member" });
      setMemberStatus({ type: "success", message: "멤버를 초대했습니다." });
      fetchMembers(selectedRoomId);
    } catch (error) {
      setMemberStatus({
        type: "error",
        message: error?.response?.data?.message || "멤버 초대에 실패했습니다.",
      });
    }
  };

  const handleRoleChange = async (roomId, userId, role) => {
    try {
      await axios.patch(
        `${MEMBERS_ROUTE(roomId)}/${userId}`,
        { role },
        { headers }
      );
      fetchMembers(roomId);
    } catch (error) {
      setMemberStatus({
        type: "error",
        message: error?.response?.data?.message || "역할 변경에 실패했습니다.",
      });
    }
  };

  const handleRemoveMember = async (roomId, userId) => {
    if (!window.confirm("이 멤버를 제거할까요?")) return;
    try {
      await axios.delete(`${MEMBERS_ROUTE(roomId)}/${userId}`, { headers });
      fetchMembers(roomId);
    } catch (error) {
      setMemberStatus({
        type: "error",
        message: error?.response?.data?.message || "멤버 제거에 실패했습니다.",
      });
    }
  };

  const selectedRoom = useMemo(
    () => rooms.find((room) => room.id === selectedRoomId) || null,
    [rooms, selectedRoomId]
  );

  return (
    <section className="room-manage-grid">
      <div className="room-manage-column room-manage-column--list">
        <header className="room-manage-header">
          <div>
            <p className="panel-eyebrow">Manage</p>
            <h2>채팅방 관리</h2>
          </div>
          <p>새 방을 만들고 멤버를 관리하세요.</p>
        </header>

        <form className="room-form" onSubmit={handleCreateRoom}>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="새 방 이름"
          />
          <button className="btn btn-primary" type="submit">
            방 만들기
          </button>
        </form>

        <div className="room-form" style={{ marginTop: "0.75rem" }}>
          <input
            type="search"
            value={roomSearch}
            onChange={(event) => setRoomSearch(event.target.value)}
            placeholder="방 검색"
          />
        </div>

        {status?.message && (
          <p className={`room-status room-status--${status.type}`}>
            {status.message}
          </p>
        )}

        <div className="room-manage-list">
          {rooms.length === 0 ? (
            <p className="chat-room-empty">
              아직 참여 중인 방이 없습니다. 방을 만들거나 참여해보세요.
            </p>
          ) : (
            rooms.map((room) => {
              const isActive = room.id === selectedRoomId;
              const canDelete = currentUser?.id === room.owner_id;
              return (
                <article
                  key={room.id}
                  className={`room-manage-item ${isActive ? "is-active" : ""}`}
                >
                  <div>
                    <p className="room-card-tag">#{room.name}</p>
                    <p className="room-meta">역할: {room.role || "참여자"}</p>
                  </div>
                  <div className="room-manage-actions">
                    <button
                      type="button"
                      className="btn btn-light"
                      onClick={() => setSelectedRoomId(room.id)}
                    >
                      멤버 보기
                    </button>
                    {canDelete && (
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => handleDeleteRoom(room.id)}
                      >
                        삭제
                      </button>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>

      <div className="room-manage-column room-manage-column--members">
        {!selectedRoom ? (
          <div className="room-manage-placeholder">
            <h3>멤버를 확인할 방을 선택해주세요</h3>
            <p>왼쪽 목록에서 ‘멤버 보기’를 누르면 상세 정보가 여기에 표시돼요.</p>
          </div>
        ) : (
          <>
            <header className="room-manage-header">
              <div>
                <p className="panel-eyebrow">Members</p>
                <h2># {selectedRoom.name} 멤버</h2>
              </div>
              <p>역할을 조정하고 새로운 멤버를 초대할 수 있어요.</p>
            </header>

            {memberStatus?.message && (
              <p className={`room-status room-status--${memberStatus.type}`}>
                {memberStatus.message}
              </p>
            )}

            <form className="room-form" onSubmit={handleInvite}>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="사용자 ID"
                value={inviteForm.userId}
                onChange={(e) =>
                  setInviteForm({ ...inviteForm, userId: e.target.value })
                }
              />
              <select
                value={inviteForm.role}
                onChange={(e) =>
                  setInviteForm({ ...inviteForm, role: e.target.value })
                }
              >
                {ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button className="btn btn-primary" type="submit">
                초대
              </button>
            </form>

            <p className="room-helper-text">
              사용자 ID는 회원 목록에서 확인한 숫자 ID를 입력해 주세요. 관리자는 대화
              정리 및 멤버 관리 권한을 갖습니다.
            </p>

            <ul className="room-list room-member-list">
              {members.map((member) => (
                <li key={member.user_id}>
                  <div>
                    <strong>{member.nickname || `사용자 ${member.user_id}`}</strong>
                    <p className="room-meta">역할: {member.role}</p>
                  </div>
                  <div className="room-member-actions">
                    {currentUser?.id === selectedRoom.owner_id &&
                      member.role !== "owner" && (
                        <>
                          <select
                            value={member.role}
                            onChange={(e) =>
                              handleRoleChange(
                                selectedRoom.id,
                                member.user_id,
                                e.target.value
                              )
                            }
                          >
                            {ROLE_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <button
                            className="btn btn-outline"
                            type="button"
                            onClick={() =>
                              handleRemoveMember(selectedRoom.id, member.user_id)
                            }
                          >
                            제거
                          </button>
                        </>
                      )}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}

export default RoomList;
