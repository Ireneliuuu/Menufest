// frontend/src/api/client.ts
// 統一管理所有 API 請求（TypeScript 版）
import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";

const BASE_URL: string =
  (import.meta.env.VITE_API_BASE as string | undefined) || "http://localhost:8080";

// 簡單的 token 存取：JWT token 存在 localStorage
export const tokenStore = {
  get(): string | null {
    return localStorage.getItem("token");
  },
  set(token: string): void {
    localStorage.setItem("token", token);
    // 設定到 axios 預設 header，避免刷新頁面後第一發請求沒帶到
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  },
  clear(): void {
    localStorage.removeItem("token");
    delete api.defaults.headers.common["Authorization"];
  },
};

// 建立一個 axios 實例（所有 API 都會走這個連線）
export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

// 開發時也可以 console.log(BASE_URL) 來確認是否吃到正確 .env
// console.log("[API] baseURL =", BASE_URL);

// 自動帶上 Authorization（加上 JWT token）
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStore.get();
  if (token) {
    // handle Axios v1 headers (AxiosHeaders or plain object)
    if ((config.headers as any)?.set) {
      (config.headers as any).set("Authorization", `Bearer ${token}`);
    } else {
      (config.headers as any) = {
        ...(config.headers as any),
        Authorization: `Bearer ${token}`,
      };
    }
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
    }
    return Promise.reject(err);
  }
);

// 動時把既有 token 補進 axios 預設 header（避免刷新後授權遺失）
const existing = tokenStore.get();
if (existing) {
  api.defaults.headers.common["Authorization"] = `Bearer ${existing}`;
}