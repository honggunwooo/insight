import React from "react";
import { useNavigate } from "react-router-dom";

function MainPage() {
  const navigate = useNavigate();
  const hasToken =
    typeof window !== "undefined" ? Boolean(localStorage.getItem("token")) : false;

  return (
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
        <h3>오늘 INSIGHT에서는</h3>
        <ul className="home-topics">
          <li>🏡 "새로 생긴 카페 가보신 분 있나요?"</li>
          <li>🌿 "주말 플로깅 함께 하실 가족 모집"</li>
          <li>🎉 "동네 주민 소모임, 이번 주 금요일!"</li>
        </ul>
        <div className="home-stat-grid">
          <div className="home-stat">
            <span className="home-stat-number">24</span>
            <span className="home-stat-label">실시간 채팅방</span>
          </div>
          <div className="home-stat">
            <span className="home-stat-number">98%</span>
            <span className="home-stat-label">만족도</span>
          </div>
          <div className="home-stat">
            <span className="home-stat-number">1,200+</span>
            <span className="home-stat-label">함께하는 이웃</span>
          </div>
        </div>
      </aside>
    </div>
  );
}

export default MainPage;
