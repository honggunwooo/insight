import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";

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

const ROUTES = {
  me: `${API_BASE_URL}${API_PREFIX}/users/me`,
  rooms: `${API_BASE_URL}${API_PREFIX}/rooms`,
  myRooms: `${API_BASE_URL}${API_PREFIX}/rooms/my`,
  createRoom: `${API_BASE_URL}${API_PREFIX}/rooms`,
};

const ROOM_MESSAGES_ROUTE = (roomId) =>
  `${API_BASE_URL}${API_PREFIX}/rooms/${roomId}/messages`;
const ROOM_READ_ROUTE = (roomId) =>
  `${API_BASE_URL}${API_PREFIX}/rooms/${roomId}/read`;
const ROOM_JOIN_ROUTE = (roomId) =>
  `${API_BASE_URL}${API_PREFIX}/rooms/${roomId}/join`;

const SOCKET_SERVER_URL =
  trimTrailingSlash(import.meta.env.VITE_SOCKET_URL) || API_BASE_URL;

const normalizeMessage = (message, fallbackRoomId = null) => {
  if (!message) return null;
  return {
    id: message.id,
    roomId: message.roomId ?? message.room_id ?? fallbackRoomId,
    userId: message.userId ?? message.user_id,
    username: message.username ?? message.nickname ?? "이웃",
    content: message.content,
    createdAt:
      message.createdAt ?? message.created_at ?? new Date().toISOString(),
  };
};

const normalizeMessages = (items = [], roomId = null) =>
  items
    .map((message) => normalizeMessage(message, roomId))
    .filter(Boolean);

function ChatPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const [rooms, setRooms] = useState([]);
  const [roomSearch, setRoomSearch] = useState("");
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [messages, setMessages] = useState({});
  const [messageLoading, setMessageLoading] = useState(false);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [composer, setComposer] = useState("");
  const [socketStatus, setSocketStatus] = useState("idle");
  const [currentUser, setCurrentUser] = useState(null);
  const [joiningRoomId, setJoiningRoomId] = useState(null);
  const [notificationPermission, setNotificationPermission] = useState(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      return Notification.permission;
    }
    return "denied";
  });
  const notificationsSupported =
    typeof window !== "undefined" && "Notification" in window;

  const messageListRef = useRef(null);
  const socketRef = useRef(null);
  const activeRoomRef = useRef(null);
  const roomsRef = useRef([]);

  const authHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const scrollToBottom = useCallback(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTo({
        top: messageListRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, []);

  const fetchRooms = useCallback(async () => {
    if (!ROUTES.rooms) return;

    setRoomsLoading(true);
    try {
      const searchQuery = roomSearch.trim();
      const query = searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : "";

      const [myRes, allRes] = await Promise.all([
        axios.get(`${ROUTES.myRooms}${query}`, { headers: authHeaders() }),
        axios.get(`${ROUTES.rooms}${query}`, { headers: authHeaders() }),
      ]);

      const myRooms = myRes.data?.rooms || myRes.data || [];
      const allRooms = allRes.data?.rooms || allRes.data || [];

      const memberships = new Map();
      myRooms.forEach((room) => {
        memberships.set(room.id, {
          ...room,
          unreadCount: room.unreadCount ?? 0,
          isMember: true,
        });
      });

      const combined = allRooms.map((room) => {
        const membership = memberships.get(room.id);
        if (membership) {
          memberships.delete(room.id);
          return membership;
        }
        return { ...room, unreadCount: 0, isMember: false, role: null };
      });

      memberships.forEach((room) => combined.push(room));
      setRooms(combined);

      const preferredId = roomId ? Number(roomId) : activeRoomRef.current;
      const preferredRoom = combined.find(
        (room) => room.id === preferredId && room.isMember
      );
      if (preferredRoom) {
        setActiveRoomId(preferredRoom.id);
      } else {
        const firstMemberRoom = combined.find((room) => room.isMember);
        setActiveRoomId(firstMemberRoom?.id ?? null);
      }
    } catch (error) {
      console.error("방 목록 로딩 실패", error);
    } finally {
      setRoomsLoading(false);
    }
  }, [roomId, roomSearch]);

  const fetchMessages = useCallback(
    async (roomIdToLoad) => {
      if (!roomIdToLoad) return;
      const targetRoute = ROOM_MESSAGES_ROUTE(roomIdToLoad);
      setMessageLoading(true);
      try {
        const { data } = await axios.get(targetRoute, {
          headers: authHeaders(),
        });
        const list = normalizeMessages(data.messages || data, roomIdToLoad);
        setMessages((prev) => ({ ...prev, [roomIdToLoad]: list }));
        requestAnimationFrame(() => scrollToBottom());
      } catch (error) {
        console.error("메시지 로딩 실패", error);
      } finally {
        setMessageLoading(false);
      }
    },
    [scrollToBottom]
  );

  const handleSendMessage = (event) => {
    event.preventDefault();
    const trimmed = composer.trim();

    const activeRoom = rooms.find((room) => room.id === activeRoomId);
    if (!trimmed || !activeRoom || !activeRoom.isMember || !socketRef.current) return;

    socketRef.current.emit("sendMessage", {
      roomId: activeRoomId,
      userId: currentUser?.id,
      content: trimmed,
    });
    setComposer("");
  };

  const handleJoinRoom = async (roomIdToJoin) => {
    if (!roomIdToJoin) return;
    try {
      setJoiningRoomId(roomIdToJoin);
      await axios.post(
        ROOM_JOIN_ROUTE(roomIdToJoin),
        {},
        { headers: authHeaders() }
      );
      await fetchRooms();
      navigate(`/chat/${roomIdToJoin}`);
    } catch (error) {
      console.error("방 참여 실패", error);
    } finally {
      setJoiningRoomId(null);
    }
  };

  const markRoomAsRead = useCallback(
    async (roomIdToMark, messageId) => {
      if (!roomIdToMark || !ROOM_READ_ROUTE(roomIdToMark)) return;
      try {
        await axios.post(
          ROOM_READ_ROUTE(roomIdToMark),
          { messageId },
          { headers: authHeaders() }
        );
        setRooms((prev) =>
          prev.map((room) =>
            room.id === roomIdToMark ? { ...room, unreadCount: 0 } : room
          )
        );
      } catch (error) {
        console.warn("읽음 처리 실패", error);
      }
    },
    []
  );

  useEffect(() => {
    axios
      .get(ROUTES.me, { headers: authHeaders() })
      .then((res) => setCurrentUser(res.data.user || res.data))
      .catch(() => setCurrentUser(null));
  }, []);

  useEffect(() => {
    roomsRef.current = rooms;
  }, [rooms]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  useEffect(() => {
    activeRoomRef.current = activeRoomId;
  }, [activeRoomId]);

  useEffect(() => {
    if (!activeRoomId) return;
    fetchMessages(activeRoomId);
    if (socketRef.current) {
      socketRef.current.emit("joinRoom", activeRoomId);
    }
  }, [activeRoomId, fetchMessages]);

  useEffect(() => {
    if (!activeRoomId) return;
    const roomMessages = messages[activeRoomId] || [];
    const latest = roomMessages[roomMessages.length - 1];
    if (latest) {
      const activeRoom = rooms.find((room) => room.id === activeRoomId);
      if (activeRoom?.isMember) {
        markRoomAsRead(activeRoomId, latest.id);
      }
    }
  }, [activeRoomId, messages, markRoomAsRead, rooms]);

  const requestNotificationPermission = useCallback(async () => {
    if (!notificationsSupported) return;
    if (Notification.permission === "granted") {
      setNotificationPermission("granted");
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
    } catch (error) {
      console.warn("알림 권한 요청 실패", error);
    }
  }, [notificationsSupported]);

  useEffect(() => {
    if (notificationsSupported) {
      setNotificationPermission(Notification.permission);
    }
  }, [notificationsSupported]);

  const notifyNewMessage = useCallback(
    (message) => {
      if (!notificationsSupported) return;
      if (notificationPermission !== "granted") return;
      if (!document.hidden && activeRoomRef.current === message.roomId) return;
      const room = roomsRef.current.find((item) => item.id === message.roomId);
      const title = room ? `# ${room.name}` : "새 메시지";
      const body = `${message.username || "이웃"}: ${(message.content || "").slice(
        0,
        120
      )}`;
      try {
        new Notification(title, {
          body,
          tag: `room-${message.roomId}`,
        });
      } catch (error) {
        console.warn("브라우저 알림 표시 실패", error);
      }
    },
    [notificationPermission, notificationsSupported]
  );

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !SOCKET_SERVER_URL) return;

    const socket = io(SOCKET_SERVER_URL, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: Infinity,
    });

    socketRef.current = socket;

    socket.on("connect", () => setSocketStatus("connected"));
    socket.on("disconnect", () => setSocketStatus("disconnected"));
    socket.on("newMessage", (payload) => {
      const message = normalizeMessage(payload, payload.roomId);
      if (!message?.roomId) return;

      setMessages((prev) => ({
        ...prev,
        [message.roomId]: [...(prev[message.roomId] || []), message],
      }));

      setRooms((prev) =>
        prev.map((room) =>
          room.id === message.roomId
            ? {
                ...room,
                unreadCount:
                  activeRoomRef.current === message.roomId
                    ? 0
                    : (room.unreadCount || 0) + 1,
              }
            : room
        )
      );

      if (activeRoomRef.current === message.roomId) {
        requestAnimationFrame(() => scrollToBottom());
      } else {
        notifyNewMessage(message);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [notifyNewMessage, scrollToBottom]);

  useEffect(() => {
    if (roomId) {
      const numericId = Number(roomId);
      if (!Number.isNaN(numericId)) {
        setActiveRoomId(numericId);
      }
    }
  }, [roomId]);

  const filteredRooms = useMemo(() => {
    const keyword = roomSearch.trim().toLowerCase();
    return rooms.filter((room) => room.name.toLowerCase().includes(keyword));
  }, [rooms, roomSearch]);

  const joinedRooms = filteredRooms.filter((room) => room.isMember);
  const availableRooms = filteredRooms.filter((room) => !room.isMember);

  const activeRoom = rooms.find((room) => room.id === activeRoomId);
  const activeMessages = activeRoomId ? messages[activeRoomId] || [] : [];
  const connectionClass =
    socketStatus === "connected"
      ? "chat-connection chat-connection--online"
      : "chat-connection chat-connection--offline";

  const sideShortcuts = [
    { label: "방 둘러보기", path: "/rooms/discover" },
    { label: "방 관리", path: "/rooms/manage" },
    { label: "새 방 만들기", path: "/channels/new" },
  ];

  const sideFeed = [
    "💡 채팅방 주제에 맞는 첫 인사를 남겨보세요.",
    "🔔 알림을 켜두면 새 메시지를 놓치지 않아요.",
    "📌 프로필에 관심사를 추가하면 추천 방이 더 정확해집니다.",
  ];

  return (
    <div className="chat-layout">
      <aside className="chat-sidebar">
        <div className="chat-sidebar-header">
          <h2>내 공간</h2>
          <div className="panel-links">
            <Link to="/rooms/discover">방 찾기</Link>
            <Link to="/rooms/manage">방 관리</Link>
          </div>
        </div>
        <div className="chat-room-search">
          <input
            type="search"
            placeholder="채팅방 검색"
            value={roomSearch}
            onChange={(event) => setRoomSearch(event.target.value)}
          />
        </div>
        <div className="room-section">
          <p className="room-section-title">참여 중</p>
          {roomsLoading ? (
            <p className="chat-room-empty">로딩 중...</p>
          ) : joinedRooms.length === 0 ? (
            <p className="chat-room-empty">
              참여 중인 방이 없습니다.{" "}
              <Link to="/rooms/discover">방 찾기</Link>
            </p>
          ) : (
            joinedRooms.map((room) => {
              const isActive = room.id === activeRoomId;
              return (
                <button
                  key={room.id}
                  type="button"
                  className={`chat-room-item ${isActive ? "is-active" : ""}`}
                  onClick={() => {
                    navigate(`/chat/${room.id}`);
                    setActiveRoomId(room.id);
                  }}
                >
                  <div>
                    <span className="chat-room-name">#{room.name}</span>
                    <span className="chat-room-desc">
                      {room.role ? `역할: ${room.role}` : "참여 중"}
                    </span>
                  </div>
                  {room.unreadCount > 0 && (
                    <span className="chat-room-pill">{room.unreadCount}</span>
                  )}
                </button>
              );
            })
          )}
        </div>
        <div className="room-section">
          <p className="room-section-title">참여 가능</p>
          {availableRooms.length === 0 ? (
            <p className="chat-room-empty">
              검색 결과가 없습니다. 다른 키워드를 입력해보세요.
            </p>
          ) : (
            availableRooms.map((room) => (
              <div key={room.id} className="chat-room-item">
                <div>
                  <span className="chat-room-name">#{room.name}</span>
                  <span className="chat-room-desc">미참여</span>
                </div>
                <button
                  type="button"
                  className="btn btn-outline"
                  disabled={joiningRoomId === room.id}
                  onClick={() => handleJoinRoom(room.id)}
                >
                  {joiningRoomId === room.id ? "참여 중..." : "참여"}
                </button>
              </div>
            ))
          )}
        </div>
      </aside>

      <section className="chat-main">
        <div className="chat-main-header">
          <div className="chat-room-info">
            <h1>{activeRoom ? `# ${activeRoom.name}` : "채팅방을 선택해주세요"}</h1>
            <p>
              {activeRoom
                ? "따뜻한 대화를 이어가 보세요."
                : "왼쪽에서 참여 중인 방을 선택하거나 새 방에 참여할 수 있어요."}
            </p>
          </div>
          <div className="chat-header-actions">
            <span className={connectionClass}>
              <span className="chat-connection-dot" />
              {socketStatus === "connected" ? "실시간 연결" : "오프라인"}
            </span>
            {notificationsSupported && (
              <button
                type="button"
                className="btn btn-light btn-notify"
                onClick={requestNotificationPermission}
                disabled={notificationPermission === "granted"}
                title={
                  notificationPermission === "denied"
                    ? "브라우저 설정에서 알림을 허용해주세요."
                    : "브라우저 알림 권한을 요청합니다."
                }
              >
                {notificationPermission === "granted"
                  ? "알림 사용 중"
                  : "알림 켜기"}
              </button>
            )}
          </div>
        </div>

        {!activeRoom || !activeRoom.isMember ? (
          <div className="chat-empty-state">
            <h3>참여 중인 채팅방을 선택해주세요</h3>
            <p>오른쪽 상단의 버튼을 눌러 새로운 방을 찾을 수도 있어요.</p>
            <div className="empty-actions">
              <Link className="btn btn-primary" to="/rooms/discover">
                방 찾기
              </Link>
              <Link className="btn btn-outline" to="/rooms/manage">
                방 관리
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="chat-window">
              <div className="chat-messages" ref={messageListRef}>
                {messageLoading ? (
                  <p className="chat-room-empty">메시지를 불러오는 중입니다...</p>
                ) : activeMessages.length === 0 ? (
                  <div className="chat-empty">
                    <h3>아직 메시지가 없어요</h3>
                    <p>첫 메시지를 보내 대화를 시작해보세요.</p>
                  </div>
                ) : (
                  activeMessages.map((msg) => (
                    <div
                      key={msg.id || `${msg.userId}-${msg.createdAt}`}
                      className={`chat-message ${
                        msg.userId === currentUser?.id ? "chat-message--own" : ""
                      }`}
                    >
                      <div className="chat-message-header">
                        <strong>{msg.username}</strong>
                        <span>
                          {new Intl.DateTimeFormat("ko", {
                            hour: "2-digit",
                            minute: "2-digit",
                          }).format(new Date(msg.createdAt))}
                        </span>
                      </div>
                      <div className="chat-message-bubble">{msg.content}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <form className="chat-input" onSubmit={handleSendMessage}>
              <textarea
                placeholder="메시지를 입력해주세요..."
                value={composer}
                onChange={(event) => setComposer(event.target.value)}
                rows={1}
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!composer.trim()}
              >
                전송
              </button>
            </form>
          </>
        )}
      </section>

      <aside className="chat-sidepanel">
        <div className="chat-sidepanel-card">
          <div className="chat-sidepanel-header">
            <h3>빠른 이동</h3>
          </div>
          <div className="quick-actions-grid">
            {sideShortcuts.map((action) => (
              <button
                key={action.label}
                type="button"
                className="quick-action"
                onClick={() => navigate(action.path)}
              >
                <strong>{action.label}</strong>
                <span>{action.detail ?? "바로가기"}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="chat-sidepanel-card">
          <div className="chat-sidepanel-header">
            <h3>대화 팁</h3>
          </div>
          <ul className="chat-feed">
            {sideFeed.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </div>

        <div className="chat-tip-card">
          <p className="chat-tip-eyebrow">알림 설정</p>
          <h4>소중한 메시지를 놓치지 마세요</h4>
          <p className="chat-tip-muted">
            모바일 푸시와 브라우저 알림을 모두 활성화하면 초대나 공지에 즉시 응답할 수 있어요.
          </p>
        </div>
      </aside>
    </div>
  );
}

export default ChatPage;
