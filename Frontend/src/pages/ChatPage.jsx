import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import axios from "axios";
import { io } from "socket.io-client";

const formatMessageTime = (value) =>
  new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

const formatFeedTime = (value) =>
  new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    day: "numeric",
  }).format(new Date(value));

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
const buildApiUrl = (path) =>
  `${API_BASE_URL}${API_PREFIX}${ensureLeadingSlash(path)}`;

const SOCKET_SERVER_URL =
  trimTrailingSlash(import.meta.env.VITE_SOCKET_URL) || API_BASE_URL;
const ROUTES = {
  me: buildApiUrl("/users/me"),
  rooms: buildApiUrl("/rooms"),
  createRoom: buildApiUrl("/rooms"),
};

const ROOM_MESSAGES_ROUTE = (roomId) =>
  buildApiUrl(`/rooms/${roomId}/messages`);

const normalizeMessage = (message, fallbackRoomId = null) => {
  if (!message) return null;
  return {
    id: message.id,
    roomId: message.roomId ?? message.room_id ?? fallbackRoomId,
    userId: message.userId ?? message.user_id,
    username: message.username ?? message.nickname ?? "이웃",
    content: message.content,
    createdAt: message.createdAt ?? message.created_at ?? new Date().toISOString(),
  };
};

const normalizeMessages = (items = [], roomId = null) =>
  items
    .map((message) => normalizeMessage(message, roomId))
    .filter(Boolean);

function ChatPage() {
  const [rooms, setRooms] = useState([]);
  const [search, setSearch] = useState("");
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [messages, setMessages] = useState({});
  const [messageLoading, setMessageLoading] = useState(false);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [composer, setComposer] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [systemFeed, setSystemFeed] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quickRoomName, setQuickRoomName] = useState("");
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [socketStatus, setSocketStatus] = useState("idle");
  const [currentUser, setCurrentUser] = useState(null);

  const messageListRef = useRef(null);
  const socketRef = useRef(null);
  const activeRoomRef = useRef(null);

  const pushSystemMessage = useCallback((entry) => {
    setSystemFeed((prev) =>
      [
        {
          ...entry,
          time: entry.time || new Date().toISOString(),
        },
        ...prev,
      ].slice(0, 6)
    );
  }, []);

  const scrollToBottom = useCallback(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTo({
        top: messageListRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, []);

  const authHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchRooms = useCallback(async () => {
    if (!ROUTES.rooms) {
      pushSystemMessage({
        type: "error",
        text: "ROUTES.rooms 값을 먼저 설정해주세요.",
      });
      return;
    }

    setRoomsLoading(true);
    try {
      const { data } = await axios.get(ROUTES.rooms, {
        headers: authHeaders(),
      });
      const list = data.rooms || data;
      setRooms(list);
      setActiveRoomId((prev) => prev ?? list[0]?.id ?? null);
    } catch (error) {
      pushSystemMessage({
        type: "error",
        text: "채팅방 목록을 불러오지 못했습니다.",
      });
    } finally {
      setRoomsLoading(false);
    }
  }, [pushSystemMessage]);

  const fetchMessages = useCallback(
    async (roomId) => {
      const targetRoute = ROOM_MESSAGES_ROUTE(roomId);
      if (!targetRoute) {
        pushSystemMessage({
          type: "error",
          text: "ROOM_MESSAGES_ROUTE 함수를 먼저 설정해주세요.",
        });
        return;
      }

      setMessageLoading(true);
      try {
        const { data } = await axios.get(targetRoute, {
          headers: authHeaders(),
        });
        const list = normalizeMessages(data.messages || data, roomId);
        setMessages((prev) => ({ ...prev, [roomId]: list }));
        requestAnimationFrame(() => scrollToBottom());
      } catch (error) {
        pushSystemMessage({
          type: "error",
          text: "메시지를 불러오지 못했습니다.",
        });
      } finally {
        setMessageLoading(false);
      }
    },
    [pushSystemMessage, scrollToBottom]
  );

  const handleSendMessage = (event) => {
    event.preventDefault();
    const trimmed = composer.trim();
    if (!trimmed || !activeRoomId || !currentUser || !socketRef.current) return;

    setIsSending(true);
    socketRef.current.emit("sendMessage", {
      roomId: activeRoomId,
      userId: currentUser.id,
      content: trimmed,
    });
    setComposer("");
    setIsSending(false);
  };

  const handleCreateRoom = async (event) => {
    event.preventDefault();
    const value = quickRoomName.trim();
    if (!value) return;

    if (!ROUTES.createRoom) {
      pushSystemMessage({
        type: "error",
        text: "ROUTES.createRoom 값을 먼저 설정해주세요.",
      });
      return;
    }

    setIsCreatingRoom(true);
    try {
      await axios.post(
        ROUTES.createRoom,
        { name: value },
        { headers: authHeaders() }
      );
      setQuickRoomName("");
      await fetchRooms();
      pushSystemMessage({
        type: "success",
        text: `새 채팅방 '${value}'을 만들었습니다.`,
      });
    } catch (error) {
      pushSystemMessage({
        type: "error",
        text: error?.response?.data?.message || "채팅방 생성에 실패했습니다.",
      });
    } finally {
      setIsCreatingRoom(false);
    }
  };

  useEffect(() => {
    if (!ROUTES.me) {
      pushSystemMessage({
        type: "warning",
        text: "ROUTES.me 값을 설정하면 사용자 정보를 표시할 수 있어요.",
      });
      return;
    }

    axios
      .get(ROUTES.me, { headers: authHeaders() })
      .then((res) => setCurrentUser(res.data.user || res.data))
      .catch(() => {
        pushSystemMessage({
          type: "error",
          text: "사용자 정보를 불러오지 못했습니다.",
        });
      });
  }, [pushSystemMessage]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  useEffect(() => {
    activeRoomRef.current = activeRoomId;
  }, [activeRoomId]);

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

      if (activeRoomRef.current === message.roomId) {
        requestAnimationFrame(() => scrollToBottom());
      }
    });

    socket.on("systemMessage", (payload) => {
      pushSystemMessage({
        type: payload.type || "info",
        text: payload.text,
        time: payload.time,
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [pushSystemMessage, scrollToBottom]);

  useEffect(() => {
    if (!activeRoomId) return;
    fetchMessages(activeRoomId);
    if (socketRef.current) {
      socketRef.current.emit("joinRoom", activeRoomId);
    }
    setSidebarOpen(false);
  }, [activeRoomId, fetchMessages]);

  const filteredRooms = useMemo(() => {
    return rooms.filter((room) =>
      room.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [rooms, search]);

  const activeRoom = rooms.find((room) => room.id === activeRoomId) || null;
  const activeMessages = activeRoomId ? messages[activeRoomId] || [] : [];

  const connectionClass =
    socketStatus === "connected"
      ? "chat-connection chat-connection--online"
      : "chat-connection chat-connection--offline";

  return (
    <div className="chat-layout">
      <aside className={`chat-sidebar ${sidebarOpen ? "chat-sidebar--open" : ""}`}>
        <div className="chat-sidebar-header">
          <h2>채팅방</h2>
          <button
            className="chat-sidebar-close"
            onClick={() => setSidebarOpen(false)}
            type="button"
          >
            ✕
          </button>
        </div>

        <div className="chat-room-search">
          <input
            type="search"
            placeholder="채팅방 검색"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="chat-room-list">
          {roomsLoading ? (
            <p className="chat-room-empty">채팅방을 불러오는 중입니다...</p>
          ) : filteredRooms.length === 0 ? (
            <p className="chat-room-empty">조건에 맞는 채팅방이 없어요.</p>
          ) : (
            filteredRooms.map((room) => (
              <button
                key={room.id}
                type="button"
                className={`chat-room-item ${
                  room.id === activeRoomId ? "is-active" : ""
                }`}
                onClick={() => setActiveRoomId(room.id)}
              >
                <span className="chat-room-name">#{room.name}</span>
                <span className="chat-room-desc">실시간 대화</span>
              </button>
            ))
          )}
        </div>

        <form className="chat-room-quick" onSubmit={handleCreateRoom}>
          <input
            type="text"
            placeholder="새 채팅방 이름"
            value={quickRoomName}
            onChange={(event) => setQuickRoomName(event.target.value)}
          />
          <button type="submit" disabled={isCreatingRoom}>
            {isCreatingRoom ? "생성 중" : "추가"}
          </button>
        </form>
      </aside>

      <section className="chat-main">
        <div className="chat-main-header">
          <div className="chat-room-info">
            <h1>{activeRoom ? `# ${activeRoom.name}` : "채팅방을 선택해주세요"}</h1>
            <p>
              {activeRoom
                ? "실시간으로 이웃과 이야기를 나눠보세요."
                : "왼쪽 목록에서 방을 선택하거나 새로 만들어보세요."}
            </p>
          </div>
          <div className="chat-header-actions">
            <span className={connectionClass}>
              <span className="chat-connection-dot" />
              {socketStatus === "connected" ? "실시간 연결" : "오프라인"}
            </span>
            <button
              type="button"
              className="chat-sidebar-toggle"
              onClick={() => setSidebarOpen(true)}
            >
              방 목록
            </button>
          </div>
        </div>

        <div className="chat-window">
          {messageLoading && (
            <div className="chat-banner chat-banner--info">메시지를 불러오는 중입니다...</div>
          )}

          <div className="chat-messages" ref={messageListRef}>
            {!activeRoomId ? (
              <div className="chat-empty">
                <h3>채팅방을 선택해주세요</h3>
                <p>왼쪽에서 방을 선택하거나 새 방을 만들 수 있어요.</p>
              </div>
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
                    <span className="chat-message-user">
                      {msg.username || "이웃"}
                    </span>
                    <span>{formatMessageTime(msg.createdAt)}</span>
                  </div>
                  <div className="chat-message-bubble">{msg.content}</div>
                </div>
              ))
            )}
          </div>

          {activeRoomId && (
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
                disabled={!composer.trim() || isSending}
              >
                {isSending ? "전송 중..." : "전송"}
              </button>
            </form>
          )}
        </div>
      </section>

      <aside className="chat-sidepanel">
        <div className="chat-sidepanel-card">
          <div className="chat-sidepanel-header">
            <h3>라이브 알림</h3>
            <button type="button" onClick={() => setSystemFeed([])}>
              초기화
            </button>
          </div>
          <ul className="chat-feed">
            {systemFeed.length === 0 ? (
              <li>아직 알림이 없습니다.</li>
            ) : (
              systemFeed.map((item, index) => (
                <li key={`${item.time}-${index}`}>
                  <p>{item.text}</p>
                  <span>{formatFeedTime(item.time)}</span>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="chat-tip-card">
          <p className="chat-tip-eyebrow">내 상태</p>
          <h4>{currentUser?.nickname || currentUser?.username || "이웃"} 님</h4>
          <p className="chat-tip-muted">{currentUser?.email || "이메일 미확인"}</p>
          <ul>
            <li>현재 방: {activeRoom ? `#${activeRoom.name}` : "미선택"}</li>
            <li>메시지 수: {activeMessages.length}</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}

export default ChatPage;
