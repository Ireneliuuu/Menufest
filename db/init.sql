CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- 以便使用 gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS citext;    -- 不分大小寫的 email

-- ========== 1) users ==========
-- 關係：users 1–1 profiles、users 1–多 family_members、users 1–多 ingredients、users 1–多 feedback
CREATE TABLE users (
  uid              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username         TEXT NOT NULL UNIQUE,
  email            CITEXT NOT NULL UNIQUE,       -- email 登入用，唯一且大小寫不敏感
  password_hash    TEXT NOT NULL,                -- 儲存加密後的密碼
  birthday         DATE,                         -- 可為 NULL（使用者未填）
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========== 2) profiles ==========
-- 關係：profiles 與 users 1–1（user_id UNIQUE）
CREATE TABLE profiles (
  profile_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL UNIQUE REFERENCES users(uid) ON DELETE CASCADE,
  allergies        JSONB NOT NULL DEFAULT '[]'::jsonb,   -- 使用者自身過敏
  preferences      JSONB NOT NULL DEFAULT '[]'::jsonb,   -- 使用者口味/偏好（tags 也可放這）
  -- 之後可以加 likes/dislikes 分欄位，但現在先極簡
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========== 3) family_members ==========
-- 關係：users 1–多 family_members
-- 讓使用者可以新增家人，每位家人有自己的 allergies/preferences(JSONB)
CREATE TABLE family_members (
  family_member_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
  name             TEXT NOT NULL,                         -- 家人顯示名稱（例如：爸爸、妹妹、Grandma）
  relation         TEXT,                                  -- 可選：親屬關係字串
  allergies        JSONB NOT NULL DEFAULT '{}'::jsonb,
  preferences      JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_family_members_user ON family_members(user_id);

-- ========== 4) ingredients (fridge) ==========
-- 關係：users 1–多 ingredients
CREATE TABLE ingredients (
  ingredient_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
  ingredient_name  TEXT NOT NULL,                         -- 使用者自取中文名稱
  expiry_date      DATE,                                  -- 可為 NULL（無標示）
  quantity         NUMERIC(12,2) NOT NULL DEFAULT 0,      -- 數量
  unit             TEXT NOT NULL CHECK (unit IN ('個','克','毫升')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ingredients_user ON ingredients(user_id);
CREATE INDEX idx_ingredients_expiry ON ingredients(expiry_date);

-- ========== 5) feedback ==========
-- 關係：users 1–多 feedback
-- 你的想法是把使用者的回饋丟給 LLM 生成 tags 再存回 DB。
-- 這裡同時保留 raw_text（原始回饋）與 tags（LLM 生成標籤）以利日後重跑/調整。
CREATE TABLE feedback (
  feedback_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
  raw_text         TEXT,                                  -- 使用者原始留言（可選）
  tags             JSONB NOT NULL DEFAULT '[]'::jsonb,    -- LLM 解析後的標籤陣列，如 ["清淡","不吃香菜"]
  meta             JSONB NOT NULL DEFAULT '{}'::jsonb,    -- 可放 LLM model/version、打分等
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_feedback_user ON feedback(user_id);
CREATE INDEX idx_feedback_tags_gin ON feedback USING GIN (tags);

-- ========== 通用更新時間 Trigger（可選，但很實用） ==========
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_family_members_updated_at
BEFORE UPDATE ON family_members
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_ingredients_updated_at
BEFORE UPDATE ON ingredients
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
