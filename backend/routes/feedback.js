import { Router } from "express";
import { pool } from "../db.js";
import { verifyToken } from "./auth.js";

const router = Router();

/**
 * Table: feedback
 * - feedback_id UUID PK
 * - user_id     UUID FK -> users(uid)
 * - raw_text    TEXT (nullable)
 * - tags        JSONB array, default []
 * - meta        JSONB object, default {}
 * - created_at  TIMESTAMPTZ default now()
 */

// List feedback (可query ?q=, ?tag=, ?limit=, ?offset=)
router.get("/", verifyToken, async (req, res) => {
  const { uid } = req.user;
  const { q, tag } = req.query;
  const limit = Math.min(100, Number(req.query.limit ?? 50));
  const offset = Math.max(0, Number(req.query.offset ?? 0));

  const clauses = ["user_id = $1"];
  const params = [uid];
  let i = 2;

  if (q?.trim()) {
    clauses.push(`(raw_text ILIKE $${i})`);
    params.push(`%${q}%`);
    i++;
  }
  if (tag?.trim()) {
    clauses.push(`(tags ? $${i})`); // JSONB array (contains string element)
    params.push(tag);
    i++;
  }

  const sql = `
    SELECT feedback_id, user_id, raw_text, tags, meta, created_at
    FROM feedback
    WHERE ${clauses.join(" AND ")}
    ORDER BY created_at DESC
    LIMIT $${i} OFFSET $${i + 1}
  `;
  params.push(limit, offset);

  const { rows } = await pool.query(sql, params);
  res.json(rows);
});

// Create feedback
router.post("/", verifyToken, async (req, res) => {
  const { uid } = req.user;
  const { raw_text, tags, meta } = req.body || {};
  const tagsArr = Array.isArray(tags) ? tags : [];
  const metaObj = typeof meta === "object" && meta !== null ? meta : {};

  const { rows } = await pool.query(
    `INSERT INTO feedback (user_id, raw_text, tags, meta)
     VALUES ($1, $2, $3::jsonb, $4::jsonb)
     RETURNING feedback_id, user_id, raw_text, tags, meta, created_at`,
    [uid, raw_text ?? null, JSON.stringify(tagsArr), JSON.stringify(metaObj)]
  );
  res.status(201).json(rows[0]);
});

// Read feedbakc
router.get("/:fid", verifyToken, async (req, res) => {
  const { uid } = req.user;
  const { fid } = req.params;
  const { rows } = await pool.query(
    `SELECT feedback_id, user_id, raw_text, tags, meta, created_at
     FROM feedback
     WHERE feedback_id = $1 AND user_id = $2`,
    [fid, uid]
  );
  if (!rows.length) return res.status(404).json({ error: "not found" });
  res.json(rows[0]);
});

// Patch (update raw_text / tags / meta)
router.patch("/:fid", verifyToken, async (req, res) => {
  const { uid } = req.user;
  const { fid } = req.params;

  const allowed = new Set(["raw_text", "tags", "meta"]);
  const body = req.body || {};
  const entries = Object.entries(body).filter(([k]) => allowed.has(k));
  if (!entries.length) return res.status(400).json({ error: "no updatable fields" });

  const sets = [];
  const params = [];
  let i = 1;

  for (const [k, v] of entries) {
    if (k === "tags") {
      const arr = Array.isArray(v) ? v : [];
      sets.push(`tags = $${i++}::jsonb`);
      params.push(JSON.stringify(arr));
    } else if (k === "meta") {
      const obj = typeof v === "object" && v !== null ? v : {};
      sets.push(`meta = $${i++}::jsonb`);
      params.push(JSON.stringify(obj));
    } else {
      sets.push(`raw_text = $${i++}`);
      params.push(v ?? null);
    }
  }

  params.push(fid, uid);

  const { rows } = await pool.query(
    `UPDATE feedback
     SET ${sets.join(", ")}
     WHERE feedback_id = $${i++} AND user_id = $${i}
     RETURNING feedback_id, user_id, raw_text, tags, meta, created_at`,
    params
  );

  if (!rows.length) return res.status(404).json({ error: "not found" });
  res.json(rows[0]);
});

// Delete feedback
router.delete("/:fid", verifyToken, async (req, res) => {
  const { uid } = req.user;
  const { fid } = req.params;
  const result = await pool.query(
    `DELETE FROM feedback WHERE feedback_id = $1 AND user_id = $2`,
    [fid, uid]
  );
  if (!result.rowCount) return res.status(404).json({ error: "not found" });
  res.status(204).end();
});

export default router;