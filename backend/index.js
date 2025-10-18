import express from "express";
import cors from "cors";

const app = express();

// 中介層：允許跨域、解析 JSON
app.use(cors());
app.use(express.json());

// 健康檢查：給你/前端/Docker 判斷服務是否存活
app.get("/healthz", (_req, res) => {
  res.json({ status: "ok" });
});

// （保留位子）未來會在這裡掛上 /api/v1/ingredients 等路由

// 啟動伺服器
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`OK: Backend server running on port ${PORT}`);
});