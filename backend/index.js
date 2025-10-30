import express from "express";
import cors from "cors";
import authRouter from "./routes/auth.js";
import ingredientRouter from "./routes/ingredients.js";
import familyRouter from "./routes/family.js";
import feedbackRouter from "./routes/feedback.js";
import profilesRouter from "./routes/profiles.js";
import chatRoutes from "./routes/chat.js";

const app = express();

// 中介層：允許跨域、解析 JSON
app.use(cors());
app.use(express.json());

// 健康檢查：給你/前端/Docker 判斷服務是否存活
app.get("/healthz", (_req, res) => res.json({ status: "ok" }));
app.use("/auth", authRouter);
app.use("/profiles", profilesRouter);
app.use("/ingredients", ingredientRouter);
app.use("/family", familyRouter);
app.use("/feedback", feedbackRouter);
app.use("/chat", chatRoutes);

// （保留位子）未來會在這裡掛上 /api/v1/ingredients 等路由

// // 轉發 /api/select 請求到 LLM 服務
// app.post("/api/select", async (req, res) => {
//   const r = await fetch(process.env.LLM_BASE_URL + "/select", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(req.body),
//   });
//   const data = await r.json();
//   res.status(r.status).json(data);
// });
// 轉發 /api/select 到 LLM（FastAPI）的 /select_react
app.post("/api/select", async (req, res) => {
  try {
    const base = process.env.LLM_BASE_URL;
    console.log("LLM_BASE_URL:", base);
    if (!base) {
      return res.status(500).json({ error: "LLM_BASE_URL not set" });
    }

    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 60_000); // 60s 超時

    const r = await fetch(`${base}/select_react`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
      signal: ctrl.signal,
    });
    clearTimeout(t);

    const text = await r.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    res.status(r.status).json(data);
  } catch (e) {
    console.error("proxy error:", e);
    res.status(502).json({ error: "bad_gateway", detail: String(e) });
  }
});


// 啟動伺服器
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`OK: Backend server running on port ${PORT}`);
});

