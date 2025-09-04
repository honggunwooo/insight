import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function App() {
  const [channel, setChannel] = useState("general");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState("disconnected");
  const socketRef = useRef(null);
  const endRef = useRef(null);

  // 소켓 연결 (처음 1번)
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

  // 채널 바뀌면 재입장 + 과거 로딩
  useEffect(() => {
    if (!socketRef.current) return;
    socketRef.current.emit("join_channel", { channel });
    setMessages([]);
    loadHistory(channel);
  }, [channel]);

  async function loadHistory(ch) {
    try {
      const res = await fetch(`${API_URL}/messages?channel=${encodeURIComponent(ch)}&limit=50`);
      const data = await res.json();           // 서버는 최신순 → 화면은 오래된순
      setMessages(data.slice().reverse());
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 0);
    } catch (e) {
      console.error(e);
    }
  }

  function send() {
    const text = input.trim();
    if (!text) return;
    socketRef.current?.emit("send_message", { channel: channel.trim(), content: text });
    setInput("");
  }

  return (
    <div style={{ maxWidth: 760, margin: "24px auto", fontFamily: "system-ui" }}>
      <h1>Insight{" "}
        <small style={{ color: status === "connected" ? "green" : "#999", fontSize: 12 }}>
          ● {status}
        </small>
      </h1>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input value={channel} onChange={(e) => setChannel(e.target.value)} placeholder="channel" />
        <button onClick={() => setChannel((c) => c.trim() || "general")}>Join</button>
      </div>

      <div style={{ border: "1px solid #ddd", padding: 8, height: 420, overflow: "auto" }}>
        {messages.map((m) => (
          <div key={m.id} style={{ padding: "4px 0" }}>
            <strong style={{ color: "#555" }}>[{m.channel}]</strong> {m.content}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
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
  );
}
