// backend/routes/profiles.js
import { Router } from "express";
import { pool } from "../db.js";
import { verifyToken } from "./auth.js";

const router = Router();

/* GET 目前登入者的 profile（合併 users + profiles） */
router.get("/me", verifyToken, async (req, res) => {
  const { uid } = req.user;
  try {
    const { rows } = await pool.query(
      `
      SELECT 
        u.uid, u.username, u.email, u.birthday::date AS birthday,
        COALESCE(p.allergies, '{}'::jsonb)  AS allergies,
        COALESCE(p.preferences, '{}'::jsonb) AS preferences
      FROM users u
      LEFT JOIN profiles p ON p.user_id = u.uid
      WHERE u.uid = $1
      `,
      [uid]
    );
    if (!rows.length) return res.status(404).json({ error: "user not found" });

    const r = rows[0];
    return res.json({
      uid: r.uid,
      username: r.username,
      email: r.email,
      birthday: r.birthday, // YYYY-MM-DD or null
      profile: {
        allergies: r.allergies,
        preferences: r.preferences,
      },
    });
  } catch (err) {
    console.error("[GET /profiles/me] error:", err?.message, err?.stack);
    return res.status(500).json({ error: "server error" });
  }
});

/* UPDATE: PUT 目前登入者的 profile（含生日） */
router.put("/me", verifyToken, async (req, res) => {
  const { uid } = req.user;
  const { birthday = null, allergies = {}, preferences = {} } = req.body || {};

  // 基礎驗證
  if (birthday !== null && typeof birthday !== "string") {
    return res.status(400).json({ error: "birthday 必須為 YYYY-MM-DD 或 null" });
  }
  // allergies / preferences 可接受任何可序列化 JSON（object/array/primitive）

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1) 更新 users.birthday（可為 null）
    await client.query(
      `UPDATE users SET birthday = $2 WHERE uid = $1`,
      [uid, birthday]
    );

    // 2) upsert profiles
    // 重要：把 JS 物件轉成 JSON 字串，並在 SQL 端用 ::jsonb
    await client.query(
      `
      INSERT INTO profiles (user_id, allergies, preferences, updated_at)
      VALUES ($1, $2::jsonb, $3::jsonb, now())
      ON CONFLICT (user_id) DO UPDATE
      SET allergies   = EXCLUDED.allergies,
          preferences = EXCLUDED.preferences,
          updated_at  = now()
      `,
      [uid, JSON.stringify(allergies), JSON.stringify(preferences)]
    );

    await client.query("COMMIT");

    // 回傳更新後的最新資料
    const { rows } = await pool.query(
      `
      SELECT 
        u.uid, u.username, u.email, u.birthday::date AS birthday,
        COALESCE(p.allergies, '{}'::jsonb)  AS allergies,
        COALESCE(p.preferences, '{}'::jsonb) AS preferences,
        p.updated_at
      FROM users u
      LEFT JOIN profiles p ON p.user_id = u.uid
      WHERE u.uid = $1
      `,
      [uid]
    );
    const r = rows[0];
    return res.json({
      uid: r.uid,
      username: r.username,
      email: r.email,
      birthday: r.birthday,
      profile: {
        allergies: r.allergies,
        preferences: r.preferences,
        updated_at: r.updated_at,
      },
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[PUT /profiles/me] error:", err?.message, err?.stack);
    return res.status(500).json({ error: "server error" });
  } finally {
    client.release();
  }
});

export default router;
