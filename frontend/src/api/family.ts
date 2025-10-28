import { api } from "./client";

/** ========== Types ========== */
export type FamilyMemberDTO = {
  family_member_id: string;
  name: string;
  relation?: string;
  allergies?: string[];
  preferences?: string[];
};

type ListFamilyWire = FamilyMemberDTO[] | { members?: FamilyMemberDTO[] };

/** ========== API functions ========== */

/** Get all family members for the current user. */
export async function listFamily(): Promise<FamilyMemberDTO[]> {
  const { data } = await api.get<ListFamilyWire>("/family");
  const arr = Array.isArray(data) ? data : (data?.members ?? []);
  if (!Array.isArray(arr)) {
    console.error("Unexpected /family payload:", data);
    throw new Error("Family API did not return an array");
  }
  return arr;
}

/** Create a new family member. */
export async function createFamily(payload: {
  name: string;
  relation?: string;
  allergies?: string[];
  preferences?: string[];
}): Promise<FamilyMemberDTO> {
  const { data } = await api.post<FamilyMemberDTO>("/family", payload);
  return data;
}

/** Get a single family member by ID. */
export async function getFamily(fid: string): Promise<FamilyMemberDTO> {
  const { data } = await api.get<FamilyMemberDTO>(`/family/${fid}`);
  return data;
}

/** Update (partial) a family member. */
export async function updateFamily(
  fid: string,
  patch: Partial<{
    name: string;
    relation: string;
    allergies: string[];
    preferences: string[];
  }>
): Promise<FamilyMemberDTO> {
  const { data } = await api.patch<FamilyMemberDTO>(`/family/${fid}`, patch);
  return data;
}

/** Delete a family member by ID. */
export async function deleteFamily(fid: string): Promise<boolean> {
  await api.delete(`/family/${fid}`);
  return true;
}