import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("로그인 후 이용할 수 있습니다!");
    return <Navigate to="/login" />;
  }
  return children;
};

export default ProtectedRoute;