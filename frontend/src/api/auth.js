// frontend/src/api/auth.js
import { api, tokenStore } from "./client";

// 註冊
export async function signup({ username, email, password, birthday }) {
  const { data } = await api.post("/auth/signup", { username, email, password, birthday});
  // 取得 token 並保存
  if (data?.token) tokenStore.set(data.token);
  return data; // { token, user }
}

// 登入
export async function login({ email, password }) {
  const { data } = await api.post("/auth/login", { email, password });
  if (data?.token) tokenStore.set(data.token);
  return data; // { token, user }
}

// 取得自己
export async function me() {
  const { data } = await api.get("/auth/me");
  return data; // { uid, username, email, ... }
}

// 登出（前端清 token）
export function logout() {
  tokenStore.clear();
}

// 狀態輔助
export const auth = {
  get token() {
    return tokenStore.get();
  },
  isAuthed() {
    return !!tokenStore.get();
  },
};