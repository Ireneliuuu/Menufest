// frontend/src/api/feedback.js
import { api } from "./client";

/**
 * Feedback API
 * Routes:
 *  GET    /api/feedback           → list all (supports ?q, ?tag, ?limit, ?offset)
 *  POST   /api/feedback           → create new
 *  GET    /api/feedback/:fid      → read single
 *  PATCH  /api/feedback/:fid      → update
 *  DELETE /api/feedback/:fid      → delete
 */

// List feedback (w/ optional filters)
export async function listFeedback(query = {}) {
  const params = {};
  if (query.q) params.q = query.q;
  if (query.tag) params.tag = query.tag;
  if (query.limit != null) params.limit = query.limit;
  if (query.offset != null) params.offset = query.offset;

  const { data } = await api.get("/api/feedback", { params });
  return data; // Array<{ feedback_id, raw_text, tags, meta, created_at }>
}

// Create new feedback
export async function createFeedback({ raw_text, tags = [], meta = {} }) {
  const { data } = await api.post("/api/feedback", {
    raw_text,
    tags,
    meta,
  });
  return data; // created row
}

// Read single feedback by ID
export async function getFeedback(fid) {
  const { data } = await api.get(`/api/feedback/${fid}`);
  return data;
}

// Update existing feedback
export async function updateFeedback(fid, patch) {
  // patch can include any subset of { raw_text, tags, meta }
  const { data } = await api.patch(`/api/feedback/${fid}`, patch);
  return data;
}

// Delete feedback
export async function deleteFeedback(fid) {
  await api.delete(`/api/feedback/${fid}`);
  return true;
}