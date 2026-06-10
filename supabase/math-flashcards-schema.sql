-- Math flashcards for FSRS review.
-- Safe to run multiple times.

CREATE TABLE IF NOT EXISTS math_flashcards (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id     UUID NOT NULL REFERENCES math_lessons(id) ON DELETE CASCADE,
  card_kind     TEXT NOT NULL CHECK (card_kind IN ('formula', 'concept', 'when_to_use', 'mistake', 'mini_example')),
  front         TEXT NOT NULL,
  back          TEXT NOT NULL,
  hint          TEXT,
  explanation   TEXT,
  order_index   INTEGER DEFAULT 0,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_math_flashcards_lesson ON math_flashcards(lesson_id, order_index);
CREATE INDEX IF NOT EXISTS idx_math_flashcards_active ON math_flashcards(is_active);

ALTER TABLE math_flashcards ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'math_flashcards'
      AND policyname = 'Anyone reads active math flashcards'
  ) THEN
    CREATE POLICY "Anyone reads active math flashcards"
      ON math_flashcards FOR SELECT
      USING (is_active = true);
  END IF;
END $$;
