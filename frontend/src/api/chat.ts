// frontend/src/api/chat.ts
export type GenerateMenuRequest = {
  days: number;
  meals: Array<"早餐" | "午餐" | "晚餐" >;
  family_member_ids: string[];
  appliances: string[];
};

export async function generateMenu(req: GenerateMenuRequest): Promise<any> {
  const token = localStorage.getItem("token");
  // 瀏覽器在本機，必須用 localhost:8080（不能用 gateway:8080）
  const apiBase = import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_URL || "http://localhost:8080";
  const r = await fetch(`${apiBase}/chat/generate-menu`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(req),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`generate-menu ${r.status}: ${t}`);
  }
  return r.json();
}