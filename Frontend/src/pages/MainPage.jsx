import React, { useEffect, useMemo, useState } from "react";
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
          err?.response?.data?.message || "인사이트 정보를 불러오지 못했습니다."
        );
      })
      .finally(() => setLoading(false));
  }, []);

  const metrics = useMemo(
    () => [
      {
        label: "총 채팅방",
        value: summary?.totalRooms ?? "-",
      },
      {
        label: "함께하는 이웃",
        value: summary?.totalUsers ?? "-",
      },
      {
        label: "오늘 메시지",
        value: summary?.messagesToday ?? "-",
      },
    ],
    [summary]
  );

  const quickActions = [
    {
      label: "방 둘러보기",
      detail: "관심사로 방을 찾기",
      path: "/rooms/discover",
    },
    {
      label: "내 채팅방",
      detail: "참여 중인 공간",
      path: "/chat",
    },
    {
      label: "모임 만들기",
      detail: "새 채팅방 개설",
      path: "/channels/new",
    },
    {
      label: "프로필 관리",
      detail: "관심사 업데이트",
      path: "/profile",
    },
  ];

  const communityUpdates = [
    "🏡 새로 생긴 카페 오픈 채팅방이 열렸어요.",
    "🤝 동네 플로깅 팀 주말 모임 인원 모집 중!",
    "🎒 초등 돌봄 정보를 나누는 '학부모 라운지'가 활발하게 대화 중이에요.",
  ];

  const steps = [
    { icon: "①", title: "방 탐색", desc: "관심사 또는 동네 이름으로 검색하세요." },
    { icon: "②", title: "참여 및 인사", desc: "간단한 소개와 함께 첫 메시지를 남겨보세요." },
    { icon: "③", title: "알림 설정", desc: "놓치지 않고 대화 흐름을 따라갈 수 있어요." },
  ];

  return (
    <div className="landing-shell">
      <section className="hero-card">
        <div className="hero-primary">
          <p className="hero-eyebrow">INSIGHT COMMUNITY</p>
          <h1 className="hero-title">우리 동네와 가장 가까운 대화방</h1>
          <p className="hero-subtitle">
            관심사와 위치로 방을 찾아 실시간으로 소통하세요. 새 이웃을 만나고 동네 소식을 빠르게 확인할 수 있어요.
          </p>

          {error && <p className="home-error">{error}</p>}

          <div className="hero-actions">
            <button
              className="btn btn-primary"
              onClick={() => navigate(hasToken ? "/chat" : "/signup")}
            >
              {hasToken ? "바로 채팅 참여하기" : "회원가입 후 이용하기"}
            </button>
            <button className="btn btn-outline" onClick={() => navigate("/rooms/discover")}>
              방 둘러보기
            </button>
          </div>

          <div className="hero-tags">
            <span className="hero-tag">실시간 메시지</span>
            <span className="hero-tag">동네 소식</span>
            <span className="hero-tag">관심사 그룹</span>
          </div>

          <div className="hero-metrics">
            {metrics.map((metric) => (
              <div key={metric.label} className="metric-card">
                <span className="metric-label">{metric.label}</span>
                <span className="metric-value">{loading ? "…" : metric.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="hero-aside">
          <h4>지금 이야기 중인 주제</h4>
          <ul>
            {communityUpdates.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="dashboard-grid">
        <article className="dashboard-card">
          <h3>빠른 동작</h3>
          <div className="quick-actions-grid">
            {quickActions.map((action) => (
              <button
                key={action.label}
                type="button"
                className="quick-action"
                onClick={() => navigate(action.path)}
              >
                <strong>{action.label}</strong>
                <span>{action.detail}</span>
              </button>
            ))}
          </div>
        </article>

        <article className="dashboard-card">
          <h3>지금 뜨는 이야기</h3>
          <ul className="community-feed">
            {communityUpdates.map((item) => (
              <li key={`feed-${item}`}>{item}</li>
            ))}
          </ul>
        </article>

        <article className="dashboard-card">
          <h3>3단계 시작 가이드</h3>
          <div className="timeline">
            {steps.map((step) => (
              <div key={step.title} className="timeline-step">
                <span className="timeline-step-icon">{step.icon}</span>
                <div className="timeline-step-content">
                  <strong>{step.title}</strong>
                  <span>{step.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="dashboard-card">
          <h3>알림 & 꿀팁</h3>
          <div className="helper-card">
            프로필 이미지를 등록하면 이웃들이 더 쉽게 알아볼 수 있어요. 마이페이지에서 관심사와 지역을 업데이트하면
            맞춤형 방 추천을 받을 수 있습니다.
          </div>
          <button className="btn btn-light" onClick={() => navigate("/profile")}>
            프로필 꾸미기
          </button>
        </article>
      </section>
    </div>
  );
}

export default MainPage;
