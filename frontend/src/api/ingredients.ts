// frontend/src/api/ingredients.ts
import { api } from "./client";

/** Matches backend aliases: ingredient_id AS id, ingredient_name AS name */
export type IngredientDTO = {
  id: string;
  name: string;
  quantity: number;
  unit: "個" | "克" | "毫升";
  expiry_date: string | null;   // "YYYY-MM-DD" or null
  created_at?: string;
  updated_at?: string;
};

type ListWire = { items?: IngredientDTO[] } | IngredientDTO[];

/** GET all ingredients
 * NOTE: your current backend doesn’t support q/order/limit/offset.
 * If you later add them, extend the params below.
 */
export async function listIngredients(): Promise<IngredientDTO[]> {
  const { data } = await api.get<ListWire>("/ingredients");
  return Array.isArray(data) ? data : (data.items ?? []);
}

/** CREATE one ingredient (backend expects ingredient_name)
 * name is required (maps to ingredient_name on server).
 */
export async function createIngredient(payload: {
  name: string;                      // required
  quantity?: number;                 // default 0
  unit?: "個" | "克" | "毫升";        // default "個"
  expiry_date?: string | null;       // "YYYY-MM-DD" or null
}): Promise<IngredientDTO> {
  const { name, ...rest } = payload;
  const { data } = await api.post<IngredientDTO>("/ingredients", {
    ingredient_name: name,
    ...rest,
  });
  return data;
}

/** GET one (only if you add a GET /ingredients/:id route on backend) */
export async function getIngredient(id: string): Promise<IngredientDTO> {
  const { data } = await api.get<IngredientDTO>(`/ingredients/${id}`);
  return data;
}

/** PATCH partial update
 * Use `name` here for ergonomics; backend expects ingredient_name.
 */
export async function updateIngredient(
  id: string,
  patch: Partial<{
    name: string;
    quantity: number;
    unit: "個" | "克" | "毫升";
    expiry_date: string | null;
  }>
): Promise<IngredientDTO> {
  const { name, ...rest } = patch;
  const body = name !== undefined ? { ingredient_name: name, ...rest } : rest;
  const { data } = await api.patch<IngredientDTO>(`/ingredients/${id}`, body);
  return data;
}

/** DELETE one */
export async function deleteIngredient(id: string): Promise<boolean> {
  await api.delete(`/ingredients/${id}`);
  return true;
}

/** GET expiring soon (default 3 days) */
export async function listExpiringSoon(days = 3): Promise<IngredientDTO[]> {
  const { data } = await api.get<ListWire>("/ingredients/expiring-soon", {
    params: { days },
  });
  return Array.isArray(data) ? data : (data.items ?? []);
}