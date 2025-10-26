// backend/routes/ingredients.js
// INGREDIENT MANAGEMENT
import { Router } from "express";
import { pool } from "../db.js";
import { verifyToken } from "./auth.js";

const router = Router();

// ====== GET all ingredients ======
router.get("/", verifyToken, async (req, res) => {
  const { uid } = req.user;
  const { rows } = await pool.query(
    `SELECT * FROM ingredients WHERE user_id = $1 ORDER BY expiry_date ASC`,
    [uid]
  );
  res.json(rows);
});

// ====== Add a new ingredient ======
router.post("/", verifyToken, async (req, res) => {
  const { uid } = req.user;
  const { ingredient_name, expiry_date, quantity, unit } = req.body;

  if (!ingredient_name || !unit) {
    return res.status(400).json({ error: "ingredient_name and unit are required" });
  }

  const { rows } = await pool.query(
    `INSERT INTO ingredients (user_id, ingredient_name, expiry_date, quantity, unit)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [uid, ingredient_name, expiry_date ?? null, quantity ?? 0, unit]
  );
  res.status(201).json(rows[0]);
});

// ====== Delete ingredient ======
router.delete("/:id", verifyToken, async (req, res) => {
  const { uid } = req.user;
  const { id } = req.params;
  const result = await pool.query(
    `DELETE FROM ingredients WHERE ingredient_id = $1 AND user_id = $2`,
    [id, uid]
  );
  if (!result.rowCount) return res.status(404).json({ error: "not found" });
  res.status(204).end();
});

// ====== List out Expitring soon ======
router.get("/expiring-soon", verifyToken, async (req, res) => {
  const { uid } = req.user;
  const days = Math.max(1, Math.min(31, Number(req.query.days ?? 3))); // clamp 1–31 days

  const { rows } = await pool.query(
    `SELECT ingredient_id, user_id, ingredient_name, expiry_date,
            quantity, unit, created_at, updated_at
     FROM ingredients
     WHERE user_id = $1
       AND expiry_date IS NOT NULL
       AND expiry_date <= (CURRENT_DATE + ($2 || ' days')::interval)
     ORDER BY expiry_date ASC`,
    [uid, days]
  );

  res.json(rows);
});

// ====== Partial Update Ingredient ======
// PATCH /api/ingredients/:id  (partial update)
router.patch("/:id", verifyToken, async (req, res) => {
  const { uid } = req.user;
  const { id } = req.params;

  // only allow these fields
  const allowed = new Set(["ingredient_name", "quantity", "unit", "expiry_date"]);
  const entries = Object.entries(req.body || {}).filter(([k]) => allowed.has(k));
  if (!entries.length) return res.status(400).json({ error: "no updatable fields" });

  // build dynamic SQL
  const sets = [];
  const params = [];
  let i = 1;
  for (const [k, v] of entries) {
    sets.push(`${k} = $${i++}`);
    params.push(v);
  }
  sets.push(`updated_at = now()`);
  params.push(id, uid);

  const { rows } = await pool.query(
    `UPDATE ingredients
     SET ${sets.join(", ")}
     WHERE ingredient_id = $${i++} AND user_id = $${i}
     RETURNING ingredient_id, user_id, ingredient_name, expiry_date,
               quantity, unit, created_at, updated_at`,
    params
  );

  if (!rows.length) return res.status(404).json({ error: "not found" });
  res.json(rows[0]);
});

export default router;