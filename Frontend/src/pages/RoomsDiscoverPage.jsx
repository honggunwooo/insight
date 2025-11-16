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

const formatDate = (value) => {
  if (!value) return "정보 없음";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "정보 없음";
  }
  return date.toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
  });
};

function RoomsDiscoverPage() {
  const [rooms, setRooms] = useState([]);
  const [myRooms, setMyRooms] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(null);
  const [joining, setJoining] = useState(null);
  const [loading, setLoading] = useState(false);

  const headers = useCallback(() => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const fetchRooms = useCallback(async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  }, [headers, search]);

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

  const quickFilters = [
    "디지털 노마드",
    "스터디",
    "개발자",
    "여행",
    "취미",
  ];

  const handleQuickFilter = (keyword) => {
    setSearch(keyword);
  };

  const handleRefresh = () => {
    fetchRooms();
  };

  const publicRoomsCount = rooms.filter((room) => !room.is_private).length;
  const privateRoomsCount = rooms.filter((room) => room.is_private).length;
  const memberRoomsCount = rooms.filter((room) =>
    membershipSet.has(room.id)
  ).length;
  const highlightStats = [
    {
      label: "바로 참여 가능한 방",
      value: publicRoomsCount,
      detail: "승인 없이 입장 가능",
    },
    {
      label: "비공개 추천 방",
      value: privateRoomsCount,
      detail: "방장 승인 후 참여",
    },
    {
      label: "내가 참여 중인 방",
      value: memberRoomsCount,
      detail: "현재 활동 중",
    },
    {
      label: "전체 탐색 가능 방",
      value: rooms.length,
      detail: "조건에 맞게 필터링",
    },
  ];

  const insightBlocks = [
    {
      title: "지금 뜨는 방",
      description: "이번 주 신규 멤버가 가장 많이 합류한 방을 확인해보세요.",
      accent: "인기 급상승",
    },
    {
      title: "안정적인 운영",
      description: "한 달 이상 운영되고 있는 검증된 방만 엄선해 소개합니다.",
      accent: "운영 우수",
    },
    {
      title: "참여 팁",
      description: "참여 인사가 활발한 방일수록 메시지 응답률이 높아요.",
      accent: "소통 활발",
    },
  ];

  return (
    <section className="discover-shell">
      <header className="discover-hero-card">
        <div className="discover-hero-content">
          <p className="hero-eyebrow">방 둘러보기</p>
          <h1>내가 원하는 대화 공간을 찾아보세요</h1>
          <p className="discover-hero-subtitle">
            지역, 관심사, 목표에 맞는 방을 탐색하고 바로 참여할 수 있습니다.
            안정적인 운영 중인 방만 보여드려요.
          </p>
          <div className="discover-search-group">
            <input
              type="search"
              placeholder="예: 고양동, 여행, 개발자"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleRefresh}
              disabled={loading}
            >
              {loading ? "검색 중..." : "검색"}
            </button>
          </div>
          <div className="discover-hero-tags">
            {quickFilters.map((keyword) => (
              <button
                key={keyword}
                type="button"
                className="discover-tag"
                onClick={() => handleQuickFilter(keyword)}
              >
                {keyword}
              </button>
            ))}
          </div>
        </div>
        <div className="discover-hero-metrics">
          <div className="discover-hero-stat">
            <span>참여 중인 방</span>
            <strong>{myRooms.length}</strong>
          </div>
          <div className="discover-hero-stat">
            <span>탐색 가능한 방</span>
            <strong>{rooms.length}</strong>
          </div>
        </div>
      </header>

      <section className="discover-overview">
        {highlightStats.map((stat) => (
          <article key={stat.label} className="discover-overview-card">
            <p className="panel-eyebrow">{stat.label}</p>
            <strong>{stat.value}</strong>
            <span>{stat.detail}</span>
          </article>
        ))}
      </section>

      <div className="discover-body">
        <div className="discover-content">
          <div className="discover-list-header">
            <div>
              <p className="panel-eyebrow">추천 방</p>
              <h2>
                총 <span>{rooms.length}</span>개의 방을 찾았어요
              </h2>
              <p className="discover-description">
                관심사, 적극도, 공개 여부 정보를 확인하고 입장해보세요.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-light"
              onClick={handleRefresh}
              disabled={loading}
            >
              {loading ? "새로고침..." : "새로고침"}
            </button>
          </div>

          {status?.message && (
            <p className={`discover-status discover-status--${status.type}`}>
              {status.message}
            </p>
          )}

          <div className="discover-grid-shell">
            <div className="discover-grid" role="list">
              {loading ? (
                <div className="chat-empty-state">
                  <div className="loader" aria-label="방 불러오는 중" />
                  <p>방 정보를 업데이트하고 있어요...</p>
                </div>
              ) : rooms.length === 0 ? (
                <div className="chat-empty-state">
                  <h3>조건에 맞는 채팅방이 없어요</h3>
                  <p>검색어를 바꿔 다양한 방을 탐색해보세요.</p>
                </div>
              ) : (
                rooms.map((room) => {
                  const isMember = membershipSet.has(room.id);
                  const memberCount =
                    room.member_count ??
                    room.members_count ??
                    room.members?.length ??
                    null;
                  const recentActivity = formatDate(
                    room.updated_at || room.updatedAt || room.created_at
                  );
                  return (
                    <article key={room.id} className="discover-room-card" role="listitem">
                      <div className="discover-room-header">
                        <div className="discover-room-title">
                          <span
                            className={`discover-room-pill ${
                              room.is_private ? "is-private" : "is-public"
                            }`}
                          >
                            {room.is_private ? "비공개" : "공개"}
                          </span>
                          <h3>{room.name}</h3>
                          <p className="discover-room-desc">
                            {room.description ||
                              "소개 문구가 아직 없어요. 입장해서 분위기를 살펴보세요."}
                          </p>
                        </div>
                        <div className="discover-room-stats">
                          <div>
                            <span>참여자</span>
                            <strong>{memberCount ?? "-"}</strong>
                          </div>
                          <div>
                            <span>열림 상태</span>
                            <strong>
                              {room.is_private ? "승인 필요" : "바로 참여"}
                            </strong>
                          </div>
                        </div>
                      </div>

                      <div className="discover-room-meta">
                        <div>
                          <span>방장</span>
                          <strong>#{room.owner_id ?? "미확인"}</strong>
                        </div>
                        <div>
                          <span>최근 활동</span>
                          <strong>{recentActivity}</strong>
                        </div>
                        <div>
                          <span>입장 방식</span>
                          <strong>
                            {room.is_private ? "승인 필요" : "즉시 입장"}
                          </strong>
                        </div>
                      </div>

                      <div className="discover-room-footer">
                        <div className="discover-room-flags">
                          <span>
                            {memberCount
                              ? `${memberCount}명 참여 중`
                              : "참여자 정보 없음"}
                          </span>
                          <span>
                            {room.topic || room.category || "관심사 미등록"}
                          </span>
                        </div>
                        {isMember ? (
                          <span className="discover-chip is-active">
                            이미 참여 중
                          </span>
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
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <aside className="discover-aside discover-aside--right">
          <div className="discover-panel">
            <div className="discover-panel-head">
              <p className="panel-eyebrow">내 참여 현황</p>
              <span>{myRooms.length}개</span>
            </div>
            <ul className="discover-myrooms">
              {myRooms.length === 0 ? (
                <li className="discover-empty-line">아직 참여 중인 방이 없어요.</li>
              ) : (
                myRooms.slice(0, 4).map((room) => (
                  <li key={room.id}>
                    <strong>{room.name}</strong>
                    <span>{room.is_private ? "비공개" : "공개"}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
          <div className="discover-panel">
            <div className="discover-panel-head">
              <p className="panel-eyebrow">빠른 필터</p>
            </div>
            <div className="discover-chip-group">
              {quickFilters.map((keyword) => (
                <button
                  key={`chip-${keyword}`}
                  type="button"
                  className={`discover-chip ${
                    search === keyword ? "is-active" : ""
                  }`}
                  onClick={() => handleQuickFilter(keyword)}
                >
                  {keyword}
                </button>
              ))}
            </div>
          </div>
          <div className="discover-panel discover-panel--insight">
            <p className="panel-eyebrow">탐색 인사이트</p>
            <ul className="discover-insight-list">
              {insightBlocks.map((block) => (
                <li key={block.title}>
                  <div className="discover-insight-accent">{block.accent}</div>
                  <strong>{block.title}</strong>
                  <p>{block.description}</p>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </section>
  );
}

export default RoomsDiscoverPage;
