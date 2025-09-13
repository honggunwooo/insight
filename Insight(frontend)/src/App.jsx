import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function App() {
  const [channel, setChannel] = useState("general");
  const [channels, setChannels] = useState([]); // ✅ 채널 목록 상태
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState("disconnected");
  const [loading, setLoading] = useState(true); // 첫 진입 로딩
  const [readyChannels, setReadyChannels] = useState(false);
  const [readyHistory, setReadyHistory] = useState(false);
  const [nickname, setNickname] = useState(localStorage.getItem("nickname") || ""); // ✅ 닉네임 상태
  const [mobileOpen, setMobileOpen] = useState(false); // 모바일 사이드바
  const [splashShow, setSplashShow] = useState(true);  // 스플래시 표시 여부
  const [splashHide, setSplashHide] = useState(false); // 스플래시 페이드아웃
  const socketRef = useRef(null);
  const endRef = useRef(null);
  const brandRef = useRef(null);     // 상단 타깃 로고

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
      .then((list) => {
        setChannels(list);
        setReadyChannels(true);
      })
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
      if (!readyHistory) setReadyHistory(true);
    } catch (e) {
      console.error(e);
    }
  }

  // 모든 초기 준비 완료 시, 로딩 해제(부드러운 전환을 위해 약간 딜레이)
  useEffect(() => {
    if (status === "connected" && readyChannels && readyHistory) {
      const t = setTimeout(() => setLoading(false), 450);
      return () => clearTimeout(t);
    }
  }, [status, readyChannels, readyHistory]);

  // 스플래시: 잠깐 보였다가 자연스럽게 사라짐
  useEffect(() => {
    const t = setTimeout(() => setSplashHide(true), 850);
    return () => clearTimeout(t);
  }, []);

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
    <div className={`shell ${!loading ? "fade-in" : ""} ${mobileOpen ? "mobile-open" : ""}`}>
      {/* Splash: 잠깐 보였다가 자연스럽게 페이드아웃 */}
      {splashShow && (
        <div className={`splash ${splashHide ? 'hide' : ''}`} onTransitionEnd={() => setSplashShow(false)}>
          <div className="splash__card center-stack">
            <div className="logo-box"><div className="logo-mark big">Insight</div></div>
            <div className="spinner-dots" aria-label="loading">
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
            </div>
          </div>
        </div>
      )}

      {/* 상단 바 */}
      <header className="topbar glass card">
        <div ref={brandRef} className="brand-box"><span className="brand">Insight</span></div>
        <div className="topbar-right">
          <button className="hamburger" aria-label="toggle menu" onClick={() => setMobileOpen(v => !v)}>
            <span/>
            <span/>
            <span/>
          </button>
          <span className={`status-pill ${status}`}>{status}</span>
          {nickname && <span className="nick">{nickname}</span>}
        </div>
      </header>

      {mobileOpen && <div className="backdrop" onClick={() => setMobileOpen(false)} />}

      <div className="panel glass card">
        {/* ✅ 사이드바 */}
        <aside className="sidebar" onClick={() => setMobileOpen(false)}>
          <h3 className="muted" style={{ fontSize: 14, margin: '6px 0 10px' }}>Channels</h3>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {channels.map((ch) => (
              <li key={ch}>
                <button
                  className={`chan-btn ${ch === channel ? "active" : ""}`}
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
            className="input"
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
        </aside>

        {/* ✅ 채팅 영역 */}
        <main className="content">
          {/* 메시지 리스트 */}
          <div className="messages">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`message ${m.author === nickname ? "me" : ""}`}
              >
                <div className="bubble">
                  <div className="meta">{m.author || "익명"}</div>
                  <div className="text">{m.content}</div>
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          {/* 입력창 */}
          <div className="input-row">
            <input
              className="input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="메시지 입력"
            />
            <button className="btn primary" onClick={send}>보내기</button>
          </div>
        </main>
      </div>
    </div>
  );

}
