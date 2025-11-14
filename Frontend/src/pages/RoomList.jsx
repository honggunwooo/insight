import React, { useEffect, useState } from "react";
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

function RoomList() {
  const [rooms, setRooms] = useState([]);
  const [name, setName] = useState("");
  const [status, setStatus] = useState(null);
  const token = localStorage.getItem("token");

  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const fetchRooms = async () => {
    try {
      const { data } = await axios.get(ROOMS_ROUTE, { headers });
      setRooms(data.rooms || data);
    } catch (error) {
      setStatus({ type: "error", message: error?.response?.data?.message || "방 목록을 불러오지 못했습니다." });
    }
  };

  const createRoom = async (event) => {
    event.preventDefault();
    if (!name.trim()) {
      setStatus({ type: "error", message: "방 이름을 입력해주세요." });
      return;
    }

    try {
      setStatus({ type: "loading", message: "방을 생성 중입니다..." });
      await axios.post(ROOMS_ROUTE, { name: name.trim() }, { headers });
      setName("");
      setStatus({ type: "success", message: "방이 생성되었습니다." });
      fetchRooms();
    } catch (error) {
      setStatus({ type: "error", message: error?.response?.data?.message || "방 생성에 실패했습니다." });
    }
  };

  const deleteRoom = async (roomId) => {
    if (!window.confirm("정말 이 방을 삭제할까요?")) return;
    try {
      await axios.delete(`${ROOMS_ROUTE}/${roomId}`, { headers });
      setStatus({ type: "success", message: "방이 삭제되었습니다." });
      fetchRooms();
    } catch (error) {
      setStatus({ type: "error", message: error?.response?.data?.message || "방 삭제에 실패했습니다." });
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  if (!token) {
    return (
      <div className="room-manage">
        <div className="room-card">
          <p className="room-status room-status--error">
            방 관리는 로그인 후 이용할 수 있습니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="room-manage">
      <div className="room-card">
        <h2>채팅방 관리</h2>
        <form className="room-form" onSubmit={createRoom}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="새 채팅방 이름"
            required
          />
          <button className="btn btn-primary" type="submit">
            방 만들기
          </button>
        </form>

        {status?.message && (
          <p className={`room-status room-status--${status.type}`}>{status.message}</p>
        )}

        <ul className="room-list">
          {rooms.map((room) => (
            <li key={room.id}>
              <div>
                <strong>#{room.name}</strong>
                <p className="room-meta">
                  소유자: {room.owner_id ?? "알 수 없음"}
                </p>
              </div>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => deleteRoom(room.id)}
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default RoomList;
