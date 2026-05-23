-- ============================================================
-- Exam practice support: question reports + saved review list
-- ============================================================

CREATE TABLE IF NOT EXISTS question_reports (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id      UUID NOT NULL,
  exam_question_id UUID,
  exam_set_id      UUID,
  source           TEXT NOT NULL DEFAULT 'standard_exam',
  issue_type       TEXT NOT NULL DEFAULT 'other',
  description      TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewing', 'resolved', 'rejected')),
  admin_note       TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS saved_questions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL,
  source      TEXT NOT NULL DEFAULT 'standard_exam',
  note        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, question_id, source)
);

CREATE INDEX IF NOT EXISTS idx_question_reports_user_id ON question_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_question_reports_question_id ON question_reports(question_id);
CREATE INDEX IF NOT EXISTS idx_question_reports_status ON question_reports(status);
CREATE INDEX IF NOT EXISTS idx_question_reports_created_at ON question_reports(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_saved_questions_user_id ON saved_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_questions_question_id ON saved_questions(question_id);
CREATE INDEX IF NOT EXISTS idx_saved_questions_created_at ON saved_questions(created_at DESC);

ALTER TABLE question_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_questions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'question_reports' AND policyname = 'Users create own question reports'
  ) THEN
    CREATE POLICY "Users create own question reports" ON question_reports
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'question_reports' AND policyname = 'Users view own question reports'
  ) THEN
    CREATE POLICY "Users view own question reports" ON question_reports
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'saved_questions' AND policyname = 'Users manage own saved questions'
  ) THEN
    CREATE POLICY "Users manage own saved questions" ON saved_questions
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
