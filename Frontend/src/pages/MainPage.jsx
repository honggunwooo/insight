import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

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
const SUMMARY_ROUTE = `${API_BASE_URL}${API_PREFIX}/insight/summary`;

function MainPage() {
  const navigate = useNavigate();
  const hasToken =
    typeof window !== "undefined" ? Boolean(localStorage.getItem("token")) : false;
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const formatNumber = (value, suffix = "") => {
    if (value === undefined || value === null) return "-";
    return `${Number(value).toLocaleString()}${suffix}`;
  };

  const spotlightCards = [
    {
      icon: "💬",
      title: "열린 채팅",
      desc: summary
        ? `총 ${formatNumber(summary.totalRooms)}개의 방이 이야기 중`
        : "새로운 이야기를 기다리는 방",
    },
    {
      icon: "🌱",
      title: "새로 합류한 이웃",
      desc: summary
        ? `${formatNumber(summary.totalUsers)}명이 함께합니다`
        : "이웃들이 곧 등장합니다",
    },
    {
      icon: "🎯",
      title: "오늘의 대화",
      desc: summary
        ? `오늘만 ${formatNumber(summary.messagesToday)}개의 메시지`
        : "따뜻한 대화를 준비 중",
    },
  ];

  const stats = [
    {
      label: "활성 채팅방",
      value: formatNumber(summary?.activeRooms),
      detail: "참여 중인 이웃 공간",
    },
    {
      label: "전체 이웃",
      value: formatNumber(summary?.totalUsers),
      detail: "가입한 이웃 수",
    },
    {
      label: "오늘 메시지",
      value: formatNumber(summary?.messagesToday),
      detail: "오늘 공유된 이야기",
    },
  ];

  const quickLinks = [
    { label: "방 둘러보기", path: "/rooms/discover" },
    { label: "참여 중인 방", path: "/chat" },
    { label: "모임 만들기", path: "/channels/new" },
  ];
  const featurePanels = [
    {
      icon: "🌲",
      title: "자연스러운 흐름",
      desc: "관심사 기반의 방을 만들어 느긋하게 대화를 이어가세요.",
      cta: "새 방 만들기",
      path: "/channels/new",
    },
    {
      icon: "🧭",
      title: "동네 탐험",
      desc: "지도 대신 대화로 이웃을 만나고, 비슷한 사람을 발견합니다.",
      cta: "방 탐색",
      path: "/rooms/discover",
    },
    {
      icon: "🔔",
      title: "흐름을 놓치지 마세요",
      desc: "실시간 알림으로 중요한 메시지를 빠르게 확인하세요.",
      cta: "채팅 열기",
      path: "/chat",
    },
  ];

  useEffect(() => {
    setLoading(true);
    axios
      .get(SUMMARY_ROUTE)
      .then((res) => {
        setSummary(res.data.summary || null);
        setError(null);
      })
      .catch((err) => {
        setSummary(null);
        setError(
          err.response?.data?.message || "통계를 불러오지 못했습니다."
        );
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div className="home-container">
        <section className="home-content">
          <p className="home-eyebrow">INSIGHT COMMUNITY</p>
          <h1 className="home-title">우리 동네와 더 가까워지는 가장 쉬운 방법</h1>
          <p className="home-subtitle">
            실시간 채팅으로 이웃과 소식을 나누고, 프로필로 관심사를 공유하며 더 따뜻한 연결을 만들어 보세요.
          </p>

          <div className="home-actions">
            {hasToken ? (
              <>
                <button className="btn btn-primary" onClick={() => navigate("/chat")}>
                  💬 채팅 시작하기
                </button>
                <button className="btn btn-light" onClick={() => navigate("/profile")}>
                  🙋 마이페이지
                </button>
              </>
            ) : (
              <>
                <button className="btn btn-primary" onClick={() => navigate("/signup")}>
                  회원가입
                </button>
                <button className="btn btn-outline" onClick={() => navigate("/login")}>
                  이미 계정이 있어요
                </button>
              </>
            )}
          </div>

          <div className="home-highlights">
            <div className="highlight-pill">실시간 메시지</div>
            <div className="highlight-pill">동네 소식</div>
            <div className="highlight-pill">관심사 그룹</div>
          </div>
        </section>

        <aside className="home-sidecard">
          <section className="sidecard-section">
            {error && <p className="home-error">{error}</p>}
            <p className="sidecard-eyebrow">오늘의 INSIGHT</p>
            <div className="sidecard-spotlight">
              {spotlightCards.map((card) => (
                <article key={card.title}>
                  <div className="spotlight-icon">{card.icon}</div>
                  <div>
                    <h4>{card.title}</h4>
                    <p>{card.desc}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="sidecard-section">
            {loading ? (
              <p className="home-error" style={{ color: "var(--color-muted)", background: "transparent" }}>
                통계를 불러오는 중입니다...
              </p>
            ) : (
              <div className="home-stat-grid">
                {stats.map((stat) => (
                  <div className="home-stat" key={stat.label}>
                    <span className="home-stat-number">{stat.value}</span>
                    <span className="home-stat-label">{stat.label}</span>
                    <small>{stat.detail}</small>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="sidecard-links">
            {quickLinks.map((link) => (
              <button
                key={link.label}
                type="button"
                onClick={() => navigate(link.path)}
              >
                {link.label}
              </button>
            ))}
          </section>
        </aside>
      </div>

      <section className="home-panels">
        {featurePanels.map((panel) => (
          <article key={panel.title} className="forest-panel">
            <div className="forest-panel-head">
              <span className="forest-panel-icon" aria-hidden="true">
                {panel.icon}
              </span>
              <h3>{panel.title}</h3>
            </div>
            <p>{panel.desc}</p>
            <button
              type="button"
              className="btn btn-light"
              onClick={() => navigate(panel.path)}
            >
              {panel.cta}
            </button>
          </article>
        ))}
      </section>
    </>
  );
}

export default MainPage;
