-- ============================================================
-- GRAMMAR & READING MODULE SCHEMA
-- ngocthaigiasu.id.vn — Ngữ pháp + Đọc hiểu Tiếng Anh
-- Chạy file này trong Supabase SQL Editor
-- ============================================================

-- -------------------------------------------------------
-- 1. Grammar Lessons
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS grammar_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_group     TEXT NOT NULL,   -- "Thì động từ", "Câu điều kiện", ...
  topic_group_en  TEXT NOT NULL,   -- "Verb Tenses", "Conditionals", ...
  topic_group_icon TEXT DEFAULT '📐',
  title           TEXT NOT NULL,   -- "Present Perfect vs Past Simple"
  title_vi        TEXT NOT NULL,   -- "Thì Hiện tại hoàn thành vs Quá khứ đơn"
  level           TEXT NOT NULL CHECK (level IN ('B1','B2','C1','C2')),
  content_md      TEXT NOT NULL DEFAULT '',  -- Markdown: lý thuyết + bảng + ví dụ
  key_rules       JSONB DEFAULT '[]',        -- ["Rule 1", "Rule 2"]
  common_mistakes JSONB DEFAULT '[]',        -- ["❌ Wrong → ✓ Correct"]
  exercise_count  INTEGER DEFAULT 0,
  is_system       BOOLEAN DEFAULT TRUE,
  is_active       BOOLEAN DEFAULT TRUE,
  order_index     INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_grammar_lessons_group  ON grammar_lessons(topic_group);
CREATE INDEX IF NOT EXISTS idx_grammar_lessons_level  ON grammar_lessons(level);
CREATE INDEX IF NOT EXISTS idx_grammar_lessons_order  ON grammar_lessons(order_index);

-- -------------------------------------------------------
-- 2. Grammar Exercises
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS grammar_exercises (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id       UUID NOT NULL REFERENCES grammar_lessons(id) ON DELETE CASCADE,
  question_text   TEXT NOT NULL,
  option_a        TEXT NOT NULL DEFAULT '',
  option_b        TEXT NOT NULL DEFAULT '',
  option_c        TEXT NOT NULL DEFAULT '',
  option_d        TEXT NOT NULL DEFAULT '',
  correct_answer  CHAR(1) NOT NULL CHECK (correct_answer IN ('A','B','C','D')),
  explanation     TEXT DEFAULT '',
  difficulty      TEXT DEFAULT 'basic' CHECK (difficulty IN ('basic','intermediate','advanced')),
  question_type   TEXT DEFAULT 'fill_blank',
  order_index     INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_grammar_exercises_lesson ON grammar_exercises(lesson_id);

-- Trigger: tự cập nhật exercise_count
CREATE OR REPLACE FUNCTION update_grammar_lesson_exercise_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE grammar_lessons SET exercise_count = exercise_count + 1 WHERE id = NEW.lesson_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE grammar_lessons SET exercise_count = GREATEST(exercise_count - 1, 0) WHERE id = OLD.lesson_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE TRIGGER grammar_exercise_count_trigger
AFTER INSERT OR DELETE ON grammar_exercises
FOR EACH ROW EXECUTE FUNCTION update_grammar_lesson_exercise_count();

-- -------------------------------------------------------
-- 3. Grammar Progress (per user per lesson)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS grammar_progress (
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id       UUID NOT NULL REFERENCES grammar_lessons(id) ON DELETE CASCADE,
  mastered        BOOLEAN DEFAULT FALSE,
  best_score      INTEGER DEFAULT 0,   -- % correct (0-100)
  attempts        INTEGER DEFAULT 0,
  last_practiced  TIMESTAMPTZ,
  PRIMARY KEY (user_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_grammar_progress_user   ON grammar_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_grammar_progress_lesson ON grammar_progress(lesson_id);

-- -------------------------------------------------------
-- 4. Reading Passages
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS reading_passages (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title          TEXT NOT NULL,
  title_vi       TEXT,
  content        TEXT NOT NULL,       -- Passage text (~200-300 words)
  topic          TEXT NOT NULL,       -- Khớp với vocab topic group ("Environment & Climate Change", ...)
  topic_vi       TEXT,
  level          TEXT NOT NULL CHECK (level IN ('B1','B2','C1')),
  word_count     INTEGER DEFAULT 0,
  question_count INTEGER DEFAULT 0,
  is_system      BOOLEAN DEFAULT TRUE,
  is_active      BOOLEAN DEFAULT TRUE,
  order_index    INTEGER DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reading_passages_topic ON reading_passages(topic);
CREATE INDEX IF NOT EXISTS idx_reading_passages_level ON reading_passages(level);

-- -------------------------------------------------------
-- 5. Reading Questions
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS reading_questions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  passage_id     UUID NOT NULL REFERENCES reading_passages(id) ON DELETE CASCADE,
  question_text  TEXT NOT NULL,
  option_a       TEXT NOT NULL DEFAULT '',
  option_b       TEXT NOT NULL DEFAULT '',
  option_c       TEXT NOT NULL DEFAULT '',
  option_d       TEXT NOT NULL DEFAULT '',
  correct_answer CHAR(1) NOT NULL CHECK (correct_answer IN ('A','B','C','D')),
  explanation    TEXT DEFAULT '',
  question_type  TEXT DEFAULT 'detail',
  order_index    INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_reading_questions_passage ON reading_questions(passage_id);

-- Trigger: tự cập nhật question_count
CREATE OR REPLACE FUNCTION update_reading_passage_question_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE reading_passages SET question_count = question_count + 1 WHERE id = NEW.passage_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE reading_passages SET question_count = GREATEST(question_count - 1, 0) WHERE id = OLD.passage_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE TRIGGER reading_question_count_trigger
AFTER INSERT OR DELETE ON reading_questions
FOR EACH ROW EXECUTE FUNCTION update_reading_passage_question_count();

-- -------------------------------------------------------
-- 6. Reading Progress
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS reading_progress (
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  passage_id     UUID NOT NULL REFERENCES reading_passages(id) ON DELETE CASCADE,
  completed      BOOLEAN DEFAULT FALSE,
  score          INTEGER DEFAULT 0,     -- Số câu đúng
  total          INTEGER DEFAULT 0,     -- Tổng số câu
  answers        JSONB DEFAULT '{}',    -- {question_id: "A"|"B"|"C"|"D"}
  completed_at   TIMESTAMPTZ,
  PRIMARY KEY (user_id, passage_id)
);

CREATE INDEX IF NOT EXISTS idx_reading_progress_user    ON reading_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_progress_passage ON reading_progress(passage_id);

-- -------------------------------------------------------
-- ROW LEVEL SECURITY
-- -------------------------------------------------------
ALTER TABLE grammar_lessons   ENABLE ROW LEVEL SECURITY;
ALTER TABLE grammar_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE grammar_progress  ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_passages  ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_progress  ENABLE ROW LEVEL SECURITY;

-- Grammar: ai cũng đọc được (public content)
CREATE POLICY "Anyone reads grammar lessons"   ON grammar_lessons   FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone reads grammar exercises" ON grammar_exercises FOR SELECT USING (true);

-- Reading: ai cũng đọc được
CREATE POLICY "Anyone reads reading passages"  ON reading_passages  FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone reads reading questions" ON reading_questions FOR SELECT USING (true);

-- Progress: user-scoped
CREATE POLICY "Users manage own grammar progress" ON grammar_progress FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own reading progress" ON reading_progress FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
