import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:4000";

function ChatPage() {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [messagesByRoom, setMessagesByRoom] = useState({});
  const [messagesLoaded, setMessagesLoaded] = useState({});
  const [message, setMessage] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [roomSearch, setRoomSearch] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);

  const messageListRef = useRef(null);
  const tokenRef = useRef(localStorage.getItem("token"));
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const axiosAuthConfig = useMemo(() => {
    const token = tokenRef.current;
    return token
      ? {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      : {};
  }, []);

  const activeRoom = useMemo(
    () => rooms.find((room) => room.id === activeRoomId) || null,
    [rooms, activeRoomId]
  );

  const activeMessages = activeRoomId ? messagesByRoom[activeRoomId] || [] : [];

  const scrollToBottom = useCallback(() => {
    if (!messageListRef.current) return;
    messageListRef.current.scrollTo({ top: messageListRef.current.scrollHeight, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const token = tokenRef.current;
    if (!token) {
      return;
    }

    const newSocket = io(SOCKET_URL, {
      auth: { token },
    });

    setSocket(newSocket);

    const handleConnect = () => {
      setIsConnected(true);
      setStatusMessage(null);
    };
    const handleDisconnect = () => {
      setIsConnected(false);
      setStatusMessage({ type: "warning", text: "서버와 연결이 끊어졌습니다. 재연결 중..." });
    };
    const handleUnauthorized = (payload) => {
      alert(payload.message || "인증에 실패했습니다.");
      localStorage.removeItem("token");
      window.location.href = "/login";
    };
    const handleError = (payload) => {
      setStatusMessage({ type: "error", text: payload.message || "알 수 없는 오류가 발생했습니다." });
    };
    const handleReceive = (msg) => {
      if (!msg?.roomId) {
        return;
      }
      setMessagesByRoom((prev) => {
        const prevMessages = prev[msg.roomId] || [];
        return {
          ...prev,
          [msg.roomId]: [...prevMessages, msg],
        };
      });
    };

    newSocket.on("connect", handleConnect);
    newSocket.on("disconnect", handleDisconnect);
    newSocket.on("unauthorized", handleUnauthorized);
    newSocket.on("errorMessage", handleError);
    newSocket.on("receiveMessage", handleReceive);

    return () => {
      newSocket.off("connect", handleConnect);
      newSocket.off("disconnect", handleDisconnect);
      newSocket.off("unauthorized", handleUnauthorized);
      newSocket.off("errorMessage", handleError);
      newSocket.off("receiveMessage", handleReceive);
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    const token = tokenRef.current;
    if (!token) {
      return;
    }

    const fetchInitialData = async () => {
      try {
        const [profileRes, roomsRes] = await Promise.all([
          axios.get("http://localhost:4000/api/auth/me", axiosAuthConfig),
          axios.get("http://localhost:4000/api/rooms", axiosAuthConfig),
        ]);

        setCurrentUser(profileRes.data);
        setRooms(roomsRes.data);

        if (roomsRes.data.length > 0) {
          setActiveRoomId((prev) => {
            if (prev && roomsRes.data.some((room) => room.id === prev)) {
              return prev;
            }
            return roomsRes.data[0].id;
          });
        }
      } catch (err) {
        console.error("채팅 초기 데이터 로드 실패", err);
        setStatusMessage({ type: "error", text: "채팅 정보를 불러오지 못했습니다." });
      }
    };

    fetchInitialData();
  }, [axiosAuthConfig]);

  const roomIdParam = searchParams.get("roomId");

  useEffect(() => {
    if (!rooms.length) {
      return;
    }

    const parsedParam = roomIdParam ? Number(roomIdParam) : null;
    if (parsedParam && !Number.isNaN(parsedParam)) {
      const exists = rooms.some((room) => room.id === parsedParam);
      if (exists && parsedParam !== activeRoomId) {
        setActiveRoomId(parsedParam);
        return;
      }
    }

    if (!activeRoomId) {
      setActiveRoomId(rooms[0].id);
    }
  }, [rooms, roomIdParam, activeRoomId]);

  useEffect(() => {
    if (!socket || !activeRoomId) {
      return;
    }

    socket.emit("joinRoom", activeRoomId);

    if (!messagesLoaded[activeRoomId]) {
      const fetchMessages = async () => {
        try {
          const { data } = await axios.get(
            `http://localhost:4000/api/rooms/${activeRoomId}/messages`,
            axiosAuthConfig
          );

          setMessagesByRoom((prev) => ({
            ...prev,
            [activeRoomId]: data,
          }));
          setMessagesLoaded((prev) => ({
            ...prev,
            [activeRoomId]: true,
          }));
        } catch (err) {
          console.error("메세지 로드 실패", err);
          setStatusMessage({ type: "error", text: "채팅 기록을 불러오지 못했습니다." });
        }
      };

      fetchMessages();
    }

    return () => {
      socket.emit("leaveRoom", activeRoomId);
    };
  }, [socket, activeRoomId, axiosAuthConfig, messagesLoaded]);

  useEffect(() => {
    if (activeMessages.length === 0) {
      return;
    }
    const timeout = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timeout);
  }, [activeMessages, scrollToBottom]);

  const handleSendMessage = async (event) => {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || !socket || !activeRoomId || !isConnected) {
      return;
    }

    socket.emit("sendMessage", {
      roomId: activeRoomId,
      content: trimmed,
    });
    setMessage("");
  };

  const handleSelectRoom = (roomId) => {
    setActiveRoomId(roomId);
    setSidebarOpen(false);
  };

  const formatTimestamp = (value) => {
    if (!value) return "";
    try {
      return new Intl.DateTimeFormat("ko", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(value));
    } catch (err) {
      return "";
    }
  };

  const renderMessage = (msg) => {
    const isOwn = currentUser && msg.userId === currentUser.id;
    return (
      <div key={msg.id || `${msg.userId}-${msg.created_at}`} className={`chat-message ${isOwn ? "chat-message--own" : ""}`}>
        <div className="chat-message-header">
          <span className="chat-message-user">{msg.username || `유저 ${msg.userId}`}</span>
          <span className="chat-message-time">{formatTimestamp(msg.created_at)}</span>
        </div>
        <div className="chat-message-bubble">{msg.content}</div>
      </div>
    );
  };

  useEffect(() => {
    if (!activeRoomId) {
      return;
    }

    const currentParam = searchParams.get("roomId");
    if (currentParam === String(activeRoomId)) {
      return;
    }
    setSearchParams({ roomId: String(activeRoomId) }, { replace: true });
  }, [activeRoomId, setSearchParams, searchParams]);

  const filteredRooms = rooms.filter((room) => {
    if (!roomSearch.trim()) {
      return true;
    }
    const keyword = roomSearch.trim().toLowerCase();
    return (
      room.name.toLowerCase().includes(keyword) ||
      (room.description ? room.description.toLowerCase().includes(keyword) : false)
    );
  });

  return (
    <div className="chat-layout">
      <aside className={`chat-sidebar ${sidebarOpen ? "chat-sidebar--open" : ""}`}>
        <div className="chat-sidebar-header">
          <h2>채널</h2>
          <button className="chat-sidebar-close" onClick={() => setSidebarOpen(false)}>
            ✕
          </button>
        </div>

        <div className="chat-room-search">
          <input
            type="search"
            placeholder="채널 검색 (#이름, 설명)"
            value={roomSearch}
            onChange={(e) => setRoomSearch(e.target.value)}
          />
        </div>

        <div className="chat-room-list">
          {filteredRooms.map((room) => (
            <button
              key={room.id}
              className={`chat-room-item ${room.id === activeRoomId ? "is-active" : ""}`}
              onClick={() => handleSelectRoom(room.id)}
            >
              <span className="chat-room-name"># {room.name}</span>
              {room.description && <span className="chat-room-desc">{room.description}</span>}
            </button>
          ))}
          {rooms.length === 0 && <p className="chat-room-empty">아직 생성된 채널이 없습니다.</p>}
          {rooms.length > 0 && filteredRooms.length === 0 && (
            <p className="chat-room-empty">일치하는 채널이 없습니다.</p>
          )}
        </div>
      </aside>

      <main className="chat-main">
        <header className="chat-main-header">
          <button className="chat-sidebar-toggle" onClick={() => setSidebarOpen((prev) => !prev)}>
            ☰
          </button>
          {activeRoom ? (
            <div className="chat-room-info">
              <h1># {activeRoom.name}</h1>
              <p>{activeRoom.description || "모두가 함께 이야기하는 공간"}</p>
            </div>
          ) : (
            <div className="chat-room-info">
              <h1>채널을 선택하세요</h1>
              <p>왼쪽에서 대화할 채널을 선택하거나 새 채널을 만들어보세요.</p>
            </div>
          )}

          <div className="chat-header-actions">
            <button
              type="button"
              className="btn btn-light"
              onClick={() => navigate("/channels/new")}
            >
              + 새 채널
            </button>
            <div className={`chat-connection ${isConnected ? "chat-connection--online" : "chat-connection--offline"}`}>
              <span className="chat-connection-dot" />
              {isConnected ? "실시간" : "연결 중"}
            </div>
          </div>
        </header>

        {statusMessage && (
          <div className={`chat-banner chat-banner--${statusMessage.type || "info"}`}>
            {statusMessage.text}
          </div>
        )}

        <div className="chat-window">
          <div className="chat-messages" ref={messageListRef}>
            {activeRoom ? (
              activeMessages.length > 0 ? (
                activeMessages.map(renderMessage)
              ) : (
                <div className="chat-empty">
                  <h3>대화를 시작해보세요</h3>
                  <p>첫 메시지를 남겨 이 채널을 활기차게 만들어보세요!</p>
                </div>
              )
            ) : (
              <div className="chat-empty">
                <h3>채널을 선택해 주세요</h3>
                <p>채널을 만들거나 선택하면 메시지가 여기 표시됩니다.</p>
              </div>
            )}
          </div>

          <form className="chat-input" onSubmit={handleSendMessage}>
            <textarea
              rows={1}
              placeholder={activeRoom ? "메시지를 입력하세요..." : "채널을 먼저 선택하거나 생성하세요."}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                const isComposing = e.nativeEvent.isComposing || e.keyCode === 229;
                if (isComposing) {
                  return;
                }
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              disabled={!activeRoom || !socket || !isConnected}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!message.trim() || !activeRoom || !socket || !isConnected}
            >
              전송
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default ChatPage;
