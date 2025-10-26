// frontend/src/api/ingredients.js
import { api } from "./client";

// 列表（可帶 query：{ q, order='expiry'|'created', limit, offset }）
export async function listIngredients(query = {}) {
  const params = {};
  if (query.q) params.q = query.q;
  if (query.order) params.order = query.order;
  if (query.limit != null) params.limit = query.limit;
  if (query.offset != null) params.offset = query.offset;

  const { data } = await api.get("/api/ingredients", { params });
  return data; // Array
}

// 新增
export async function createIngredient({
  ingredient_name,
  quantity = 0,
  unit,
  expiry_date,
}) {
  const { data } = await api.post("/api/ingredients", {
    ingredient_name,
    quantity,
    unit,           // '個' | '克' | '毫升'
    expiry_date,    // 'YYYY-MM-DD'
  });
  return data; // created row
}

// 讀單筆
export async function getIngredient(id) {
  const { data } = await api.get(`/api/ingredients/${id}`);
  return data;
}

// 更新（部分欄位）
export async function updateIngredient(id, patch) {
  const { data } = await api.patch(`/api/ingredients/${id}`, patch);
  return data;
}

// 刪除
export async function deleteIngredient(id) {
  await api.delete(`/api/ingredients/${id}`);
  return true;
}

// 即將到期（預設 3 天；可傳 days=7）
export async function listExpiringSoon(days = 3) {
  const { data } = await api.get(`/api/ingredients/expiring-soon`, {
    params: { days },
  });
  return data;
}