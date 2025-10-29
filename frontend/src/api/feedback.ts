// frontend/src/api/feedback.ts
import { api } from "./client";

export interface Feedback {
  feedback_id: string;
  raw_text: string | null;
  tags: string[];
  created_at: string;
  meta?: Record<string, unknown>; // backend may return it; safe to ignore
}

export async function listFeedback(): Promise<Feedback[]> {
  const { data } = await api.get<Feedback>("/feedback");
  return data as unknown as Feedback[]; // some backends wrap/flatten; adjust if needed
}

export async function createFeedback(raw_text: string, tags: string[] = []): Promise<Feedback> {
  const clean = raw_text?.trim();
  if (!clean) throw new Error("feedback is empty");
  const { data } = await api.post<Feedback>("/feedback", { raw_text: clean, tags });
  return data;
}

export async function deleteFeedback(id: string): Promise<boolean> {
  await api.delete(`/feedback/${id}`);
  return true;
}