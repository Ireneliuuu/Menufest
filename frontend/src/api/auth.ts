// frontend/src/api/auth.ts
import { api, tokenStore } from "./client";

export interface User {
  uid: string;
  username: string;
  email: string;
  birthday?: string | null;
}

export interface AuthSuccess {
  token: string;
  user: User;
}

export interface SignupPayload {
  username: string;
  email: string;
  password: string;
  birthday?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

// 小工具：把後端的 error（字串或物件）轉成好讀的字串
function extractErrorMessage(err: any): string {
  const e = err?.response?.data?.error ?? err?.message;
  if (!e) return "Request failed";
  if (typeof e === "string") return e;
  if (typeof e === "object") return Object.values(e as Record<string, string>).join("; ");
  return "Request failed";
}

// 註冊（你的後端目前回 201 並帶 { token, user } → 自動登入）
export async function signup(payload: SignupPayload): Promise<AuthSuccess> {
  try {
    const { data, status } = await api.post(
      "/auth/signup",
      payload,
      { validateStatus: (s) => s >= 200 && s < 500 }
    );

    if (status >= 200 && status < 300 && data?.token && data?.user) {
      tokenStore.set(data.token);
      return data as AuthSuccess;
    }
    throw new Error(data?.error || "Signup failed");
  } catch (err: any) {
    throw new Error(extractErrorMessage(err));
  }
}

// 登入
export async function login(payload: LoginPayload): Promise<AuthSuccess> {
  try {
    const { data, status } = await api.post(
      "/auth/login",
      payload,
      { validateStatus: (s) => s >= 200 && s < 500 }
    );

    if (status >= 200 && status < 300 && data?.token && data?.user) {
      tokenStore.set(data.token);
      return data as AuthSuccess;
    }
    throw new Error(data?.error || "Login failed");
  } catch (err: any) {
    throw new Error(extractErrorMessage(err));
  }
}

// 取得自己
export async function me(): Promise<{ user: User }> {
  const { data } = await api.get("/auth/me");
  return data as { user: User };
}

// 登出（前端清 token）
export function logout(): void {
  tokenStore.clear();
}

export const auth = {
  get token(): string | null {
    return tokenStore.get();
  },
  isAuthed(): boolean {
    return !!tokenStore.get();
  },
};