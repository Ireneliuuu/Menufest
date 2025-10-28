// frontend/src/api/profile.ts
import { api } from "./client";

export interface ProfileJSON {
  allergies: string[];
  preferences: string[];
}

export interface MeResponse {
  uid: string;
  username: string;
  email: string;
  birthday: string | null; // YYYY-MM-DD or null
  profile: ProfileJSON;
}

/** Request body for PUT /profiles/me */
export interface UpdateProfilePayload {
  birthday?: string | null;
  allergies?: string[];
  preferences?: string[];
}

/**
 * Get current user's profile.
 * Normal backend route: GET /profiles/me
 */
export async function getMe(): Promise<MeResponse> {
  const { data } = await api.get<MeResponse>("/profiles/me");
  return data;
}

/**
 * Update current user's profile.
 * Backend route expected: PUT /profiles/me
 */
export async function updateMyProfile(payload: UpdateProfilePayload): Promise<MeResponse> {
  const { data } = await api.put("/profiles/me", payload);
  return data;
}