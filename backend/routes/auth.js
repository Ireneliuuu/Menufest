// routes/auth.js
import { Router } from "express";
import { pool } from "../db.js";
import bcrypt from "bcryptjs";            // hashing 演算法
import jwt from "jsonwebtoken";

const router = Router();

// ====== 環境設定 ======
const JWT_SECRET = process.env.JWT_SECRET || "menufest-demo";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || "10", 10);

// ====== 輸入驗證: 驗證使用者輸入 ======
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateSignup({ username, email, password }) {
  const errors = {};
  if (!username?.trim()) errors.username = "username is required";
  if (!email?.trim() || !emailRegex.test(email)) errors.email = "valid email is required";
  if (!password || password.length < 8) errors.password = "password must be at least 8 chars";
  return errors;
}

// 產生登入 token
function signJwt(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// ====== Middleware：驗證 JWT ======
export function verifyToken(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: "missing bearer token" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { uid, username, email }
    return next();
  } catch {
    return res.status(401).json({ error: "invalid or expired token" });
  }
}

// ====== POST /signup ======
router.post("/signup", async (req, res) => {
  try {
    const { username, email, password, birthday } = req.body || {};
    const errors = validateSignup({ username, email, password });
    if (Object.keys(errors).length) return res.status(400).json({ error: errors });

    // 檢查是否已存在相同 email 或 username
    const dupe = await pool.query(
      `SELECT uid, username, email FROM users WHERE email=$1 OR username=$2`,
      [email, username]
    );
    if (dupe.rows.length) {
      const exists = dupe.rows[0];
      const msg =
        exists.email?.toLowerCase() === email.toLowerCase()
          ? "email already registered"
          : "username already taken";
      return res.status(409).json({ error: msg });
    }

    // 產生密碼雜湊
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // 建立user
    const insert = await pool.query(
      `INSERT INTO users (username, email, password_hash, birthday)
       VALUES ($1, $2, $3, $4)
       RETURNING uid, username, email, birthday`,
      [username.trim(), email.trim(), passwordHash, birthday ?? null]
    );
    const user = insert.rows[0];

    // 簽發 JWT（避免把 password_hash 放進去）
    const token = signJwt({ uid: user.uid, username: user.username, email: user.email });

    return res.status(201).json({ token, user });
  } catch (err) {
    console.error("[/signup] error:", err);
    return res.status(500).json({ error: "server error" });
  }
});

// ====== POST /login ======
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "email and password required" });

    // 以 email 查找使用者
    const result = await pool.query(
      `SELECT uid, username, email, password_hash
       FROM users
       WHERE email=$1`,
      [email.trim()]
    );
    if (!result.rows.length) return res.status(404).json({ error: "user not found" });

    const user = result.rows[0];

    // 比對密碼
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "invalid password" });

    // 簽發 JWT
    const token = signJwt({ uid: user.uid, username: user.username, email: user.email });

    // 回傳時不要曝露 password_hash
    delete user.password_hash;
    return res.json({ token, user });
  } catch (err) {
    console.error("[/login] error:", err);
    return res.status(500).json({ error: "server error" });
  }
});

// ====== GET /me（受保護路由示範） ======
router.get("/me", verifyToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const result = await pool.query(
      `SELECT uid, username, email, birthday FROM users WHERE uid=$1`,
      [uid]
    );
    if (!result.rows.length) return res.status(404).json({ error: "user not found" });
    return res.json({ user: result.rows[0] });
  } catch (err) {
    console.error("[/me] error:", err);
    return res.status(500).json({ error: "server error" });
  }
});

export default router;