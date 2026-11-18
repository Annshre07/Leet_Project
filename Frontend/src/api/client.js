import axios from "axios";
import { getToken, clearSession } from "../auth/session";

export const API_URL = (process.env.REACT_APP_API_URL || "http://localhost:5000").replace(/\/$/, "");

const api = axios.create({ baseURL: API_URL, timeout: 120000 });

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error) => {
    const url = error.config?.url || "";
    if (error.response?.status === 401 && !url.startsWith("/api/auth/login") && !url.startsWith("/api/auth/signup")) {
      clearSession();
      if (window.location.pathname !== "/") window.location.assign("/");
    }
    return Promise.reject(error);
  }
);

export const errorMessage = (error, fallback = "Something went wrong") =>
  error?.response?.data?.message || (error?.code === "ECONNABORTED" ? "The request timed out" : error?.message) || fallback;

export default api;
