import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";

const links = [
  { to: "/", label: "홈" },
  { to: "/chat", label: "채팅" },
  { to: "/channels/new", label: "채널 만들기", private: true },
  { to: "/rooms/manage", label: "방 관리", private: true },
];

function Navbar() {
  const navigate = useNavigate();
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <header className="shell-nav">
      <div className="shell-brand">
        <Link to="/" className="shell-logo">
          Insight
          <span className="shell-logo-glow" aria-hidden="true">
            ●
          </span>
        </Link>
        <span className="shell-pill">Neighbourhood Live</span>
      </div>

      <nav className="shell-links">
        {links
          .filter((link) => (link.private ? Boolean(token) : true))
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

      <div className="shell-user">
        {token ? (
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
    </header>
  );
}

export default Navbar;
