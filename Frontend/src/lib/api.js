import axios from "axios";

const sanitizeUrl = (value) => value?.replace(/\/+$/, "");

export const API_BASE_URL =
  sanitizeUrl(import.meta.env.VITE_API_BASE_URL) || "http://localhost:4000";

export const SOCKET_URL =
  sanitizeUrl(import.meta.env.VITE_SOCKET_URL) || API_BASE_URL;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 12000,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
