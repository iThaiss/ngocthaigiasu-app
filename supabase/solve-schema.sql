-- ============================================================
-- Giải toán AI — SQL cần chạy trên Supabase
-- ============================================================

CREATE TABLE IF NOT EXISTS solve_history (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  image_url    TEXT,
  problem_text TEXT,
  solution     JSONB,
  topic        TEXT,
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

-- Migrate old schema if topics column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'solve_history' AND column_name = 'topics'
  ) THEN
    ALTER TABLE solve_history ADD COLUMN IF NOT EXISTS topic TEXT;
    UPDATE solve_history SET topic = topics[1] WHERE topic IS NULL AND topics IS NOT NULL;
    ALTER TABLE solve_history DROP COLUMN IF EXISTS topics;
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_solve_history_user_id ON solve_history(user_id);
CREATE INDEX IF NOT EXISTS idx_solve_history_created ON solve_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_daily_solve_count_user_date ON daily_solve_count(user_id, date);

-- RLS
ALTER TABLE solve_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_solve_count ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'solve_history' AND policyname = 'Users view own solve history'
  ) THEN
    CREATE POLICY "Users view own solve history" ON solve_history
      FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'daily_solve_count' AND policyname = 'Users manage own daily count'
  ) THEN
    CREATE POLICY "Users manage own daily count" ON daily_solve_count
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================================
-- Bảng student_answers — lưu đáp án luyện tập
-- ============================================================
CREATE TABLE IF NOT EXISTS student_answers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id),
  question_id UUID REFERENCES questions(id),
  answer      TEXT,
  is_correct  BOOLEAN,
  time_spent  INTEGER,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE student_answers ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'student_answers' AND policyname = 'Users manage own answers'
  ) THEN
    CREATE POLICY "Users manage own answers" ON student_answers
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================================
-- Storage:
-- Tạo bucket 'solve-images' trên Supabase Dashboard > Storage
-- Chọn Public bucket để ảnh có thể hiển thị trực tiếp
-- ============================================================
