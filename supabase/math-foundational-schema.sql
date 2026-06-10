-- ============================================================
-- FOUNDATIONAL MATH MODULE SCHEMA
-- ngocthaigiasu.id.vn — Toán nền tảng & Lập lịch FSRS
-- Chạy file này trong Supabase SQL Editor
-- ============================================================

-- -------------------------------------------------------
-- 1. Math Lessons
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS math_lessons (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id       UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  title_vi         TEXT,
  topic            TEXT,
  level            TEXT NOT NULL CHECK (level IN ('nhan_biet', 'thong_hieu', 'van_dung')),
  content_md       TEXT NOT NULL DEFAULT '',  -- Markdown + KaTeX: lý thuyết + bảng + ví dụ
  key_rules        JSONB DEFAULT '[]',        -- ["Rule 1", "Rule 2"]
  common_mistakes  JSONB DEFAULT '[]',        -- ["❌ Wrong → ✓ Correct"]
  video_url        TEXT,                      -- URL video bài giảng (Youtube, Vimeo, Bunny, v.v.)
  video_source     TEXT DEFAULT 'youtube' CHECK (video_source IN ('youtube', 'drive', 'vimeo', 'bunny')),
  exercise_count   INTEGER DEFAULT 0,
  is_active        BOOLEAN DEFAULT TRUE,
  order_index      INTEGER DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_math_lessons_chapter ON math_lessons(chapter_id);
CREATE INDEX IF NOT EXISTS idx_math_lessons_level   ON math_lessons(level);
CREATE INDEX IF NOT EXISTS idx_math_lessons_order   ON math_lessons(order_index);

-- -------------------------------------------------------
-- 2. Math Exercises
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS math_exercises (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id       UUID NOT NULL REFERENCES math_lessons(id) ON DELETE CASCADE,
  question_text   TEXT NOT NULL,
  question_type   TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false', 'short_answer')),
  difficulty      TEXT DEFAULT 'Nhận biết' CHECK (difficulty IN ('Nhận biết', 'Thông hiểu', 'Vận dụng')),
  
  -- MCQ Options
  option_a        TEXT,
  option_b        TEXT,
  option_c        TEXT,
  option_d        TEXT,
  correct_answer  TEXT, -- 'A' | 'B' | 'C' | 'D'
  
  -- True / False Statements (JSON: [{"label": "a", "text": "...", "answer": true}])
  statements      JSONB,
  
  -- Short Answer / Numeric Answer
  numeric_answer  DECIMAL(10, 4),
  
  explanation     TEXT,
  order_index     INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_math_exercises_lesson ON math_exercises(lesson_id);
CREATE INDEX IF NOT EXISTS idx_math_exercises_type   ON math_exercises(question_type);

-- -------------------------------------------------------
-- 2b. Math Flashcards (content for FSRS review)
-- -------------------------------------------------------
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

-- Trigger: tự động cập nhật exercise_count cho math_lessons
CREATE OR REPLACE FUNCTION update_math_lesson_exercise_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE math_lessons SET exercise_count = exercise_count + 1 WHERE id = NEW.lesson_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE math_lessons SET exercise_count = GREATEST(exercise_count - 1, 0) WHERE id = OLD.lesson_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE TRIGGER math_exercise_count_trigger
AFTER INSERT OR DELETE ON math_exercises
FOR EACH ROW EXECUTE FUNCTION update_math_lesson_exercise_count();

-- -------------------------------------------------------
-- 3. Math Progress (per user per lesson)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS math_progress (
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id       UUID NOT NULL REFERENCES math_lessons(id) ON DELETE CASCADE,
  mastered        BOOLEAN DEFAULT FALSE,
  best_score      INTEGER DEFAULT 0,   -- % đúng (0-100)
  attempts        INTEGER DEFAULT 0,
  last_practiced  TIMESTAMPTZ,
  PRIMARY KEY (user_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_math_progress_user   ON math_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_math_progress_lesson ON math_progress(lesson_id);

-- -------------------------------------------------------
-- 4. Math FSRS Progress (spaced repetition)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS math_fsrs_progress (
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_type       TEXT NOT NULL CHECK (card_type IN ('formula', 'lesson', 'exercise')),
  item_id         UUID NOT NULL, -- UUID tham chiếu đến math_lessons hoặc math_exercises
  due             TIMESTAMPTZ NOT NULL,
  stability       DECIMAL(10,4) DEFAULT 0,
  difficulty_fsrs DECIMAL(10,4) DEFAULT 0,
  elapsed_days    INTEGER DEFAULT 0,
  scheduled_days  INTEGER DEFAULT 0,
  reps            INTEGER DEFAULT 0,
  lapses          INTEGER DEFAULT 0,
  state           TEXT DEFAULT 'New',
  last_review     TIMESTAMPTZ,
  PRIMARY KEY (user_id, card_type, item_id)
);

CREATE INDEX IF NOT EXISTS idx_math_fsrs_user_due ON math_fsrs_progress(user_id, due);

-- -------------------------------------------------------
-- ROW LEVEL SECURITY (RLS)
-- -------------------------------------------------------
ALTER TABLE math_lessons       ENABLE ROW LEVEL SECURITY;
ALTER TABLE math_exercises     ENABLE ROW LEVEL SECURITY;
ALTER TABLE math_flashcards    ENABLE ROW LEVEL SECURITY;
ALTER TABLE math_progress      ENABLE ROW LEVEL SECURITY;
ALTER TABLE math_fsrs_progress ENABLE ROW LEVEL SECURITY;

-- Cấu hình chính sách SELECT công khai cho bài học & bài tập đang hoạt động
CREATE POLICY "Anyone reads active math lessons"   ON math_lessons   FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone reads math exercises"        ON math_exercises FOR SELECT USING (true);
CREATE POLICY "Anyone reads active math flashcards" ON math_flashcards FOR SELECT USING (is_active = true);

-- Chính sách bảo mật người dùng cho Tiến độ & FSRS
CREATE POLICY "Users manage own math progress" ON math_progress FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "Users manage own math fsrs"     ON math_fsrs_progress FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
