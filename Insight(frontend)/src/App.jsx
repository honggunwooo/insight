import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function App() {
  const [channel, setChannel] = useState("general");
  const [channels, setChannels] = useState([]); // ✅ 채널 목록 상태
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState("disconnected");
  const [nickname, setNickname] = useState(localStorage.getItem("nickname") || ""); // ✅ 닉네임 상태
  const socketRef = useRef(null);
  const endRef = useRef(null);

  // ✅ 닉네임 입력 (최초 1번)
  useEffect(() => {
    if (!nickname) {
      const name = prompt("닉네임을 입력하세요:") || "익명";
      setNickname(name);
      localStorage.setItem("nickname", name);
    }
  }, []);

  // ✅ 소켓 연결 (처음 1번)
  useEffect(() => {
    const s = io(API_URL);
    socketRef.current = s;

    s.on("connect", () => {
      setStatus("connected");
      s.emit("join_channel", { channel });
      loadHistory(channel);
    });
    s.on("connect_error", () => setStatus("error"));
    s.on("new_message", (m) => {
      setMessages((prev) => [...prev, m]);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 0);
    });

    return () => s.disconnect();
  }, []);

  // ✅ 채널 바뀌면 재입장 + 과거 로딩
  useEffect(() => {
    if (!socketRef.current) return;
    socketRef.current.emit("join_channel", { channel });
    setMessages([]);
    loadHistory(channel);
  }, [channel]);

  // ✅ 채널 목록 불러오기 (최초 실행 시)
  useEffect(() => {
    fetch(`${API_URL}/channels`)
      .then((res) => res.json())
      .then(setChannels)
      .catch(console.error);
  }, []);

  async function loadHistory(ch) {
    try {
      const res = await fetch(
        `${API_URL}/messages?channel=${encodeURIComponent(ch)}&limit=50`
      );
      const data = await res.json(); // 서버는 최신순 → 화면은 오래된순
      setMessages(data.slice().reverse());
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 0);
    } catch (e) {
      console.error(e);
    }
  }

  function send() {
    const text = input.trim();
    if (!text) return;
    socketRef.current?.emit("send_message", {
      channel: channel.trim(),
      content: text,
      author: nickname, // ✅ author 포함
    });
    setInput("");
  }

  return (
    <div style={{ maxWidth: 960, margin: "24px auto", fontFamily: "system-ui" }}>
      <h1>
        Insight{" "}
        <small
          style={{
            color: status === "connected" ? "green" : "#999",
            fontSize: 12,
          }}
        >
          ● {status}
        </small>
      </h1>

      <div style={{ display: "flex", border: "1px solid #ddd" }}>
        {/* ✅ 사이드바 */}
        <div style={{ width: 200, borderRight: "1px solid #ddd", padding: 8 }}>
          <h3>Channels</h3>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {channels.map((ch) => (
              <li key={ch}>
                <button
                  style={{
                    background: ch === channel ? "#eee" : "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px 8px",
                    textAlign: "left",
                    width: "100%",
                  }}
                  onClick={() => setChannel(ch)}
                >
                  # {ch}
                </button>
              </li>
            ))}
          </ul>

          {/* 채널 추가 입력 */}
          <input
            type="text"
            placeholder="새 채널 입력 후 Enter"
            style={{ width: "100%", marginTop: 8 }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const newCh = e.target.value.trim();
                if (newCh && !channels.includes(newCh)) {
                  setChannel(newCh);
                  setChannels((prev) => [...prev, newCh]);
                  e.target.value = "";
                }
              }
            }}
          />
        </div>

        {/* ✅ 채팅 영역 */}
        <div style={{ flex: 1, padding: 12, display: "flex", flexDirection: "column" }}>
          {/* 메시지 리스트 */}
          <div
            style={{
              flex: 1,
              overflow: "auto",
              border: "1px solid #ddd",
              padding: 8,
              marginBottom: 8,
              height: 420,
            }}
          >
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  padding: "4px 0",
                  textAlign: m.author === nickname ? "right" : "left",
                }}
              >
                <strong style={{ color: "#555" }}>
                  {m.author || "익명"}
                </strong>
                : {m.content}
              </div>
            ))}
            <div ref={endRef} />
          </div>

          {/* 입력창 */}
          <div style={{ display: "flex", gap: 8 }}>
            <input
              style={{ flex: 1 }}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="메시지 입력"
            />
            <button onClick={send}>보내기</button>
          </div>
        </div>
      </div>
    </div>
  );

}
