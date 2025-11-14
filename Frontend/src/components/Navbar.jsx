import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";

const links = [
  { to: "/", label: "홈" },
  { to: "/chat", label: "채팅" },
  { to: "/rooms/discover", label: "방 찾기", private: true },
  { to: "/rooms/manage", label: "방 관리", private: true },
  { to: "/channels/new", label: "채널 만들기", private: true },
];

function Navbar() {
  const navigate = useNavigate();
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const isAuthenticated = Boolean(token);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <header className="shell-nav">
      <div className="shell-brand-block">
        <Link to="/" className="shell-logo">
          <span className="shell-logo-mark" aria-hidden="true">
            ✺
          </span>
          Insight
        </Link>
        <p className="shell-brand-caption">Neighbourhood Flow Studio</p>
      </div>

      <nav className="shell-links">
        {links
          .filter((link) => (link.private ? isAuthenticated : true))
          .map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `shell-link${isActive ? " is-active" : ""}`
              }
            >
              {link.label}
            </NavLink>
          ))}
      </nav>

      <div className="shell-user-panel">
        <div className={`shell-status-indicator ${isAuthenticated ? "is-online" : "is-offline"}`}>
          <span className="shell-status-dot" />
          {isAuthenticated ? "온라인 · 연결됨" : "게스트 모드"}
        </div>
        <div className="shell-user">
          {isAuthenticated ? (
            <>
              <Link to="/profile" className="shell-link shell-link--ghost">
                마이페이지
              </Link>
              <button type="button" className="btn btn-outline" onClick={handleLogout}>
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="shell-link shell-link--ghost">
                로그인
              </Link>
              <Link to="/signup" className="btn btn-primary">
                회원가입
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
