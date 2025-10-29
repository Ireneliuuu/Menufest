# Menufest

智能菜單規劃系統 - 基於 LangChain Agents 的多天菜單規劃工具

## 🚀 快速開始

### 1. 環境準備

```bash
# 建立 .env 檔案
# Postgres
POSTGRES_USER=menufest
POSTGRES_PASSWORD=menufest
POSTGRES_DB=menufest

# Backend
NODE_ENV=production
DATABASE_URL=postgresql+psycopg://menufest:menufest@db:5432/menufest
LLM_BASE_URL=http://llm:8080


OPENAI_API_KEY="your key"
## from langsmith
LANGCHAIN_API_KEY="your key"
LANGCHAIN_PROJECT=menufest
```

### 2. 啟動服務

```bash
# 啟動所有 Docker 容器
docker-compose up -d --build

# 創建用戶並取得 user_id
```

### 3. 插入食材

```bash
# 修改腳本中的 user_id
vim insert_ingredients_complete.sh
./insert_ingredients_complete.sh
```

### 4. 測試 API

```bash
# 修改 JSON 文件中的 user_id
vim select_agent_request.json
vim planner_agent_request.json

# 測試 API (select 和 planner 已可用)
./test_api.sh select [user_id]| jq
./test_api.sh planner [user_id]| jq
```

## 📋 功能狀態

- ✅ **Selector Agent** - 食材選擇和菜單規劃
- ✅ **Planner Agent** - 食譜推薦和菜單生成
- 🚧 **Full Pipeline** - 完整流程整合 (開發中)

## 🛠️ 技術架構

- **Backend**: Node.js + Express
- **LLM Service**: Python + FastAPI + LangChain
- **Database**: PostgreSQL
- **Frontend**: React + Vite
- **Agents**: LangChain ReAct Agent

## 📁 專案結構

```
Menufest/
├── backend/          # Node.js 後端服務
├── llm/             # Python LLM 服務
├── frontend/        # React 前端
├── db/              # 資料庫初始化
├── test_api.sh      # API 測試腳本
└── docker-compose.yml
```

## 🔧 開發工具

- `test_api.sh` - API 測試腳本
- `insert_ingredients_complete.sh` - 食材插入腳本
