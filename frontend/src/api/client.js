// frontend/src/api/client.js
// 整個前端「統一管理所有 API 請求」
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE || "http://localhost:8080";

// 簡單的 token 存取: JWT token 存在 localStorage
export const tokenStore = {
  get: () => localStorage.getItem("token"),         // 登入成功後把 token 存起來
  set: (t) => localStorage.setItem("token", t),     //呼叫 API 時能讀出來
  clear: () => localStorage.removeItem("token"),    //呼叫 API 時能讀出來
};

// 建立一個 axios 實例(所有 API 都會走這個連線)
export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

// 自動帶上 Authorization(加上 JWT token)
api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 簡單處理 401（可在這裡導回登入頁）
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      // 可選：清 token、導頁
      // tokenStore.clear();
      // window.location.href = "/login";
      // token 失效可在這裡自動登出或跳回登入頁
    }
    return Promise.reject(err);
  }
);