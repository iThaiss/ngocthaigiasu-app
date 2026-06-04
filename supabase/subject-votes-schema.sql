-- ============================================================
-- Bảng subject_votes — Lưu bình chọn môn học mới của học sinh
-- ============================================================

CREATE TABLE IF NOT EXISTS subject_votes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_name TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bật Row Level Security (RLS)
ALTER TABLE subject_votes ENABLE ROW LEVEL SECURITY;

-- Các chính sách bảo mật (Policies)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'subject_votes' AND policyname = 'Users can insert their own votes'
  ) THEN
    CREATE POLICY "Users can insert their own votes" ON subject_votes
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'subject_votes' AND policyname = 'Users can view their own votes'
  ) THEN
    CREATE POLICY "Users can view their own votes" ON subject_votes
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;
