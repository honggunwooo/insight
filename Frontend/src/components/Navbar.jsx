import React from "react";
import { Link, useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    alert("로그아웃되었습니다!");
    navigate("/login");
  };

  return (
    <nav style={styles.navbar}>
      <h2 style={styles.logo}>Insight 🌐</h2>
      <div style={styles.links}>
        <Link to="/" style={styles.link}>홈</Link>

        {!token ? (
          <>
            <Link to="/login" style={styles.link}>로그인</Link>
            <Link to="/signup" style={styles.link}>회원가입</Link>
          </>
        ) : (
          <>
            <Link to="/profile" style={styles.link}>마이페이지</Link>
            <button onClick={handleLogout} style={styles.logoutBtn}>로그아웃</button>
          </>
        )}
      </div>
    </nav>
  );
}

const styles = {
  navbar: {
    backgroundColor: "#ffefb0",
    padding: "10px 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "2px solid #f2c94c",
  },
  logo: {
    margin: 0,
    fontWeight: "bold",
    color: "#333",
  },
  links: {
    display: "flex",
    gap: "15px",
    alignItems: "center",
  },
  link: {
    textDecoration: "none",
    color: "#333",
    fontWeight: "bold",
  },
  logoutBtn: {
    background: "#f57c00",
    color: "white",
    border: "none",
    padding: "6px 12px",
    borderRadius: "6px",
    cursor: "pointer",
  },
};

export default Navbar;