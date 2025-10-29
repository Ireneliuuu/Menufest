// backend/routes/ingredients.js
// INGREDIENT MANAGEMENT
import { Router } from "express";
import { pool } from "../db.js";
import { verifyToken } from "./auth.js";

const router = Router();
const ALLOWED_UNITS = new Set(["個", "克", "毫升"]);

// ====== GET all ingredients ======
router.get("/", verifyToken, async (req, res) => {
  const { uid } = req.user;
  try {
    const { rows } = await pool.query(
      `SELECT
         ingredient_id    AS id,
         ingredient_name  AS name,
         expiry_date,
         quantity,
         unit,
         created_at,
         updated_at
       FROM ingredients
       WHERE user_id = $1
       ORDER BY expiry_date NULLS LAST, created_at DESC`,
      [uid]
    );
    res.json({ items: rows });
  } catch (err) {
    console.error("[GET /ingredients] error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ====== Add a new ingredient ======
router.post("/", verifyToken, async (req, res) => {
  const { uid } = req.user;
  let { ingredient_name, expiry_date = null, quantity = 0, unit = "個" } = req.body || {};

  if (!ingredient_name?.trim()) {
    return res.status(400).json({ error: "ingredient_name is required" });
  }
  if (!ALLOWED_UNITS.has(unit)) {
    return res.status(400).json({ error: "invalid unit (個/克/毫升)" });
  }
  if (Number.isNaN(Number(quantity))) {
    return res.status(400).json({ error: "quantity must be a number" });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO ingredients (user_id, ingredient_name, expiry_date, quantity, unit)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING
         ingredient_id    AS id,
         ingredient_name  AS name,
         expiry_date,
         quantity,
         unit,
         created_at,
         updated_at`,
      [uid, ingredient_name.trim(), expiry_date, quantity, unit]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("[POST /ingredients] error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ====== Delete ingredient ======
router.delete("/:id", verifyToken, async (req, res) => {
  const { uid } = req.user;
  const { id } = req.params;
  try {
    const result = await pool.query(
      `DELETE FROM ingredients WHERE ingredient_id = $1 AND user_id = $2`,
      [id, uid]
    );
    if (!result.rowCount) return res.status(404).json({ error: "not found" });
    res.status(204).end();
  } catch (err) {
    console.error("[DELETE /ingredients/:id] error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ====== List out Expitring soon ======
router.get("/expiring-soon", verifyToken, async (req, res) => {
  const { uid } = req.user;
  const days = Math.max(1, Math.min(31, Number(req.query.days ?? 3))); // clamp 1–31
  try {
    const { rows } = await pool.query(
      `SELECT
         ingredient_id    AS id,
         ingredient_name  AS name,
         expiry_date,
         quantity,
         unit,
         created_at,
         updated_at
       FROM ingredients
       WHERE user_id = $1
         AND expiry_date IS NOT NULL
         AND expiry_date <= (CURRENT_DATE + ($2 || ' days')::interval)
       ORDER BY expiry_date ASC`,
      [uid, days]
    );
    res.json({ items: rows });
  } catch (err) {
    console.error("[GET /ingredients/expiring-soon] error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ====== Partial Update Ingredient ======
// PATCH /api/ingredients/:id  (partial update)
router.patch("/:id", verifyToken, async (req, res) => {
  const { uid } = req.user;
  const { id } = req.params;

  const allowed = new Set(["ingredient_name", "quantity", "unit", "expiry_date"]);
  const entries = Object.entries(req.body || {}).filter(([k]) => allowed.has(k));
  if (!entries.length) return res.status(400).json({ error: "no updatable fields" });

  // basic validation if unit/quantity provided
  for (const [k, v] of entries) {
    if (k === "unit" && !ALLOWED_UNITS.has(v)) {
      return res.status(400).json({ error: "invalid unit (個/克/毫升)" });
    }
    if (k === "quantity" && Number.isNaN(Number(v))) {
      return res.status(400).json({ error: "quantity must be a number" });
    }
  }

  try {
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
       RETURNING
         ingredient_id    AS id,
         ingredient_name  AS name,
         expiry_date,
         quantity,
         unit,
         created_at,
         updated_at`,
      params
    );

    if (!rows.length) return res.status(404).json({ error: "not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error("[PATCH /ingredients/:id] error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;