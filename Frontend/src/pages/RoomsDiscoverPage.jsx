import React, { useCallback, useEffect, useState } from "react";
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
const ROOM_JOIN_ROUTE = (roomId) =>
  `${API_BASE_URL}${API_PREFIX}/rooms/${roomId}/join`;

function RoomsDiscoverPage() {
  const [rooms, setRooms] = useState([]);
  const [myRooms, setMyRooms] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(null);
  const [joining, setJoining] = useState(null);

  const headers = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchRooms = useCallback(async () => {
    try {
      const keyword = search.trim();
      const url = keyword
        ? `${ROOMS_ROUTE}?search=${encodeURIComponent(keyword)}`
        : ROOMS_ROUTE;
      const [allRes, myRes] = await Promise.all([
        axios.get(url, { headers: headers() }),
        axios.get(MY_ROOMS_ROUTE, { headers: headers() }),
      ]);
      setRooms(allRes.data.rooms || allRes.data || []);
      setMyRooms(myRes.data.rooms || myRes.data || []);
      setStatus(null);
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error?.response?.data?.message || "채팅방 목록을 불러오지 못했습니다.",
      });
    }
  }, [search]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const membershipSet = new Set(myRooms.map((room) => room.id));

  const handleJoin = async (roomId) => {
    try {
      setJoining(roomId);
      await axios.post(
        ROOM_JOIN_ROUTE(roomId),
        {},
        {
          headers: headers(),
        }
      );
      setStatus({ type: "success", message: "방에 참여했습니다." });
      fetchRooms();
    } catch (error) {
      setStatus({
        type: "error",
        message: error?.response?.data?.message || "참여에 실패했습니다.",
      });
    } finally {
      setJoining(null);
    }
  };

  return (
    <section className="discover-page">
      <div className="discover-hero">
        <div>
          <p className="panel-eyebrow">Rooms</p>
          <h1>새로운 채팅방 발견하기</h1>
          <p>
            관심사나 지역으로 방을 검색하고, 마음에 드는 공간에 바로
            참여해보세요.
          </p>
        </div>
        <div className="discover-search">
          <input
            type="search"
            placeholder="예: 고양동, 여행, 개발자"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      {status?.message && (
        <p className={`room-status room-status--${status.type}`}>
          {status.message}
        </p>
      )}

      <div className="discover-grid">
        {rooms.length === 0 ? (
          <div className="chat-empty-state">
            <h3>조건에 맞는 채팅방이 없어요</h3>
            <p>검색어를 바꿔 다양한 방을 탐색해보세요.</p>
          </div>
        ) : (
          rooms.map((room) => {
            const isMember = membershipSet.has(room.id);
            return (
              <article key={room.id} className="room-card">
                <div>
                  <p className="room-card-tag">
                    {room.is_private ? "비공개" : "공개"}
                  </p>
                  <h3>{room.name}</h3>
                  <p className="room-card-meta">
                    방장 #{room.owner_id ?? "미확인"}
                  </p>
                </div>
                {isMember ? (
                  <span className="room-card-joined">참여 중</span>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={joining === room.id}
                    onClick={() => handleJoin(room.id)}
                  >
                    {joining === room.id ? "참여 중..." : "참여하기"}
                  </button>
                )}
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}

export default RoomsDiscoverPage;
