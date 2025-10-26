import { Router } from "express";
import { pool } from "../db.js";
import { verifyToken } from "./auth.js";

const router = Router();

/**
 * GET /family
 * 取得使用者的所有家人
 */
router.get("/", verifyToken, async (req, res) => {
  const { uid } = req.user;
  try {
    const { rows } = await pool.query(
      `SELECT family_member_id, user_id, name, relation, allergies, preferences, created_at, updated_at
       FROM family_members
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [uid]
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching family members:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /family
 * 新增家人
 * body: { name, relation?, allergies?, preferences? }
 */
router.post("/", verifyToken, async (req, res) => {
  const { uid } = req.user;
  const { name, relation, allergies, preferences } = req.body || {};

  if (!name?.trim()) {
    return res.status(400).json({ error: "name is required" });
  }

  const allergyData = typeof allergies === "object" ? allergies : {};
  const prefData = typeof preferences === "object" ? preferences : {};

  try {
    const { rows } = await pool.query(
      `INSERT INTO family_members (user_id, name, relation, allergies, preferences)
       VALUES ($1, $2, $3, $4::jsonb, $5::jsonb)
       RETURNING family_member_id, user_id, name, relation, allergies, preferences, created_at, updated_at`,
      [uid, name.trim(), relation || null, JSON.stringify(allergyData), JSON.stringify(prefData)]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("Error inserting family member:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /family/:id
 * 取得單一家人資料
 */
router.get("/:id", verifyToken, async (req, res) => {
  const { uid } = req.user;
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT family_member_id, user_id, name, relation, allergies, preferences, created_at, updated_at
       FROM family_members
       WHERE family_member_id = $1 AND user_id = $2`,
      [id, uid]
    );
    if (!rows.length) return res.status(404).json({ error: "not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error("Error fetching family member:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * PATCH /family/:id
 * 局部更新家人資料
 */
router.patch("/:id", verifyToken, async (req, res) => {
  const { uid } = req.user;
  const { id } = req.params;

  const allowed = new Set(["name", "relation", "allergies", "preferences"]);
  const entries = Object.entries(req.body || {}).filter(([k]) => allowed.has(k));
  if (!entries.length) return res.status(400).json({ error: "no updatable fields" });

  try {
    const sets = [];
    const params = [];
    let i = 1;

    for (const [key, value] of entries) {
      if (["allergies", "preferences"].includes(key)) {
        sets.push(`${key} = $${i++}::jsonb`);
        params.push(JSON.stringify(typeof value === "object" ? value : {}));
      } else {
        sets.push(`${key} = $${i++}`);
        params.push(value);
      }
    }

    sets.push("updated_at = now()");
    params.push(id, uid);

    const { rows } = await pool.query(
      `UPDATE family_members
       SET ${sets.join(", ")}
       WHERE family_member_id = $${i++} AND user_id = $${i}
       RETURNING family_member_id, user_id, name, relation, allergies, preferences, created_at, updated_at`,
      params
    );

    if (!rows.length) return res.status(404).json({ error: "not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error("Error updating family member:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * DELETE /family/:id
 * 刪除家人資料
 */
router.delete("/:id", verifyToken, async (req, res) => {
  const { uid } = req.user;
  const { id } = req.params;
  try {
    const result = await pool.query(
      "DELETE FROM family_members WHERE family_member_id = $1 AND user_id = $2",
      [id, uid]
    );
    if (!result.rowCount) return res.status(404).json({ error: "not found" });
    res.status(204).end();
  } catch (err) {
    console.error("Error deleting family member:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
