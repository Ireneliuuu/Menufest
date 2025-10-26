// frontend/src/api/family.js (自動帶上jwt)
import { api } from "./client";

/**
 * Family API (backend mounts at /api/family)
 * All requests automatically include Authorization via client.js interceptor.
 */

// List family members (optional query: { q, limit, offset })
export async function listFamily(query = {}) {
  const params = {};
  if (query.q) params.q = query.q;
  if (query.limit != null) params.limit = query.limit;
  if (query.offset != null) params.offset = query.offset;

  const { data } = await api.get("/api/family", { params });
  return data; // Array<{ family_member_id, name, relation, allergies, preferences, ... }>
}

// Create one
export async function createFamily({ name, relation = null, allergies = {}, preferences = {} }) {
  const { data } = await api.post("/api/family", {
    name,
    relation,
    allergies,
    preferences,
  });
  return data; // created row
}

// Read one
export async function getFamily(fid) {
  const { data } = await api.get(`/api/family/${fid}`);
  return data; // single row
}

// Patch (partial update)
export async function updateFamily(fid, patch) {
  // patch can include: { name?, relation?, allergies?, preferences? }
  const { data } = await api.patch(`/api/family/${fid}`, patch);
  return data; // updated row
}

// Delete
export async function deleteFamily(fid) {
  await api.delete(`/api/family/${fid}`);
  return true;
}