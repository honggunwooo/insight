import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import apiClient from "../lib/api";

const AuthContext = createContext(null);

const getErrorMessage = (error) =>
  error?.response?.data?.message || error?.message || "알 수 없는 오류가 발생했습니다.";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  const hydrate = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUser(null);
      setInitializing(false);
      return;
    }

    setInitializing(true);
    try {
      const { data } = await apiClient.get("/api/auth/me");
      setUser(data);
    } catch (error) {
      console.error("❌ Failed to fetch profile:", error);
      localStorage.removeItem("token");
      setUser(null);
    } finally {
      setInitializing(false);
    }
  }, []);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const login = useCallback(
    async (email, password) => {
      const { data } = await apiClient.post("/api/auth/login", {
        email,
        password,
      });

      localStorage.setItem("token", data.token);
      await hydrate();
      return data;
    },
    [hydrate]
  );

  const signup = useCallback(async ({ username, email, password }) => {
    const { data } = await apiClient.post("/api/auth/register", {
      username,
      email,
      password,
    });

    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.post("/api/auth/logout");
    } catch (error) {
      console.warn("⚠️ Logout request failed:", getErrorMessage(error));
    } finally {
      localStorage.removeItem("token");
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      initializing,
      isAuthenticated: Boolean(user),
      login,
      signup,
      logout,
      refresh: hydrate,
    }),
    [user, initializing, login, signup, logout, hydrate]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth는 AuthProvider 내부에서만 사용할 수 있습니다.");
  }
  return context;
};
