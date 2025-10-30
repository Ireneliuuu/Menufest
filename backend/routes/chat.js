// backend/routes/chat.js
import { Router } from "express";
import { pool } from "../db.js";
import { verifyToken } from "./auth.js";
import { callLLM } from "../services/llm.js";
import { buildMergedConstraints } from "../utils/merge.js";

const router = Router();

// verify mount
router.get("/ping", (_req, res) => res.json({ ok: true }));

// load user profile + selected family
async function fetchUserContext(userId, familyMemberIds = []) {
  const client = await pool.connect();
  try {

    // 1) user profile
    const profileRes = await client.query(
      `SELECT allergies, preferences FROM profiles WHERE user_id = $1`,
      [userId]
    );
    const profile = profileRes.rows[0] || { allergies: [], preferences: [] };

    // 2) selected family members
    let family = [];
    if (Array.isArray(familyMemberIds) && familyMemberIds.length > 0) {
      const famRes = await client.query(
        `SELECT family_member_id, name, allergies, preferences
         FROM family_members
         WHERE user_id = $1 AND family_member_id = ANY($2::uuid[])`,
        [userId, familyMemberIds]
      );
      family = famRes.rows;
    }

    return { profile, family };
  } finally {
    client.release();
  }
}

// === POST /chat/generate-menu ===
router.post("/generate-menu", verifyToken, async (req, res) => {
  try {
    // robustly read user id
    const userId = req.user?.uid;
    if (!userId) return res.status(401).json({ error: "Unauthorized: missing user id" });

    const { days, meals, family_member_ids = [] } = req.body || {}; // 沒有廚具
    if (!days || !Array.isArray(meals) || meals.length === 0) {
      return res.status(400).json({ error: "days and meals are required" });
    }

    //console.log("🟢 REQ body:", req.body);
    //console.log("🟢 family_member_ids:", family_member_ids);

    // fetch profile + chosen family, then merge constraints
    const ctx = await fetchUserContext(userId, family_member_ids);
    //console.log("🟡 ctx.profile:", ctx.profile);
    //console.log("🟡 ctx.family (rows):", ctx.family);           // ← should be an array with objects
    //console.log("🟡 ctx.family length:", ctx.family.length);

    const mergedConstraints = buildMergedConstraints(ctx.profile, ctx.family);
    //console.log("🟣 mergedConstraints:", mergedConstraints);

    // call LLM: prepare LLM request body
    const llmInput = {
      user_id: userId,
      people: 1 + ctx.family.length,
      days,
      meals,
      constraints: mergedConstraints,
      // appliances: appliances  ← only add back when server.py supports it
    };
    //console.log("→ LLM payload", JSON.stringify(llmInput));

    const result = await callLLM(llmInput); // forwards to llm’s API
    return res.json(result);
  } catch (err) {
    console.error("Error in /chat/generate-menu:", err);
    return res.status(500).json({ error: "Menu generation failed" });
  }
});

export default router;