-- ============================================================
-- Giải toán AI — SQL cần chạy trên Supabase
-- ============================================================

CREATE TABLE IF NOT EXISTS solve_history (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  image_url    TEXT,
  problem_text TEXT,
  solution     JSONB,
  topics       TEXT[],
  difficulty   TEXT,
  model_used   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS daily_solve_count (
  id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date    DATE NOT NULL DEFAULT CURRENT_DATE,
  count   INTEGER NOT NULL DEFAULT 0,
  UNIQUE (user_id, date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_solve_history_user_id ON solve_history(user_id);
CREATE INDEX IF NOT EXISTS idx_solve_history_created ON solve_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_daily_solve_count_user_date ON daily_solve_count(user_id, date);

-- RLS
ALTER TABLE solve_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_solve_count ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own solve history" ON solve_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users manage own daily count" ON daily_solve_count
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- Supabase Storage:
-- Tạo bucket 'solve-images' trên Supabase Dashboard > Storage
-- Chọn Public bucket để ảnh có thể hiển thị trực tiếp
-- ============================================================
