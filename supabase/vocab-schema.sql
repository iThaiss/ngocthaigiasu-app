-- ============================================================
-- VOCABULARY MODULE SCHEMA
-- Học từ vựng Tiếng Anh — ngocthaigiasu.id.vn
-- ============================================================

-- -------------------------------------------------------
-- 1. Kho từ điển chính (~70k+ từ Webster + pipeline data)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS dictionary_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word TEXT NOT NULL,
  phonetic TEXT,              -- /ˈstreŋkθn/
  audio_url TEXT,             -- URL phát âm MP3
  definitions JSONB,          -- [{pos: "v", definition: "...", example: "..."}]
  synonyms TEXT[],
  antonyms TEXT[],
  level TEXT,                 -- A1, A2, B1, B2, C1, C2
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT dictionary_entries_word_unique UNIQUE (word)
);

CREATE INDEX IF NOT EXISTS idx_dictionary_word ON dictionary_entries(lower(word));
CREATE INDEX IF NOT EXISTS idx_dictionary_level ON dictionary_entries(level);

-- -------------------------------------------------------
-- 2. Bộ từ vựng (vocab sets)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS vocab_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  topic TEXT,                 -- "Environment", "Technology", "Collocations"
  subtopic_code TEXT,         -- E2X.01..E2X.08
  word_count INTEGER DEFAULT 0,
  question_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  is_public BOOLEAN DEFAULT FALSE,     -- TRUE = cộng đồng thấy được
  is_ai_generated BOOLEAN DEFAULT FALSE,
  is_system BOOLEAN DEFAULT FALSE,     -- TRUE = set mặc định từ admin/pipeline
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  featured BOOLEAN DEFAULT FALSE,      -- Admin ghim set hay
  likes INTEGER DEFAULT 0,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vocab_sets_public ON vocab_sets(is_public, is_active);
CREATE INDEX IF NOT EXISTS idx_vocab_sets_created_by ON vocab_sets(created_by);
CREATE INDEX IF NOT EXISTS idx_vocab_sets_subtopic ON vocab_sets(subtopic_code);

-- -------------------------------------------------------
-- 3. Từ trong mỗi bộ
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS vocab_set_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  set_id UUID NOT NULL REFERENCES vocab_sets(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  pronunciation TEXT,          -- /ˈstreŋkθn/
  part_of_speech TEXT,         -- n, v, adj, adv
  definition_vi TEXT NOT NULL, -- nghĩa tiếng Việt
  definition_en TEXT,          -- định nghĩa tiếng Anh (optional)
  level TEXT,                  -- A2, B1, B2, C1, C2
  synonyms TEXT[],
  antonyms TEXT[],
  example_sentence TEXT,       -- câu ví dụ
  image_url TEXT,
  audio_url TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vocab_words_set ON vocab_set_words(set_id);
CREATE INDEX IF NOT EXISTS idx_vocab_words_word ON vocab_set_words(lower(word));

-- -------------------------------------------------------
-- 4. Câu hỏi luyện tập gắn với bộ từ
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS vocab_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  set_id UUID NOT NULL REFERENCES vocab_sets(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  option_a TEXT,
  option_b TEXT,
  option_c TEXT,
  option_d TEXT,
  correct_answer TEXT,         -- A, B, C, D
  explanation TEXT,
  question_type TEXT,          -- synonym, antonym, fill_blank, meaning, collocation
  difficulty TEXT,             -- basic, intermediate, advanced
  source_id TEXT,              -- question_id gốc từ pipeline
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vocab_questions_set ON vocab_questions(set_id);
CREATE INDEX IF NOT EXISTS idx_vocab_questions_type ON vocab_questions(question_type);

-- -------------------------------------------------------
-- 5. Tiến độ học từng từ (FSRS spaced repetition)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS vocab_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  set_id UUID NOT NULL REFERENCES vocab_sets(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  -- FSRS-4.5 fields (ts-fsrs compatible)
  due TIMESTAMPTZ DEFAULT NOW(),
  stability DECIMAL(10,4) DEFAULT 0,
  difficulty_fsrs DECIMAL(10,4) DEFAULT 0,
  elapsed_days INTEGER DEFAULT 0,
  scheduled_days INTEGER DEFAULT 0,
  reps INTEGER DEFAULT 0,
  lapses INTEGER DEFAULT 0,
  state TEXT DEFAULT 'New' CHECK (state IN ('New', 'Learning', 'Review', 'Relearning')),
  last_review TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, set_id, word)
);

CREATE INDEX IF NOT EXISTS idx_vocab_progress_user ON vocab_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_vocab_progress_due ON vocab_progress(user_id, due);
CREATE INDEX IF NOT EXISTS idx_vocab_progress_set ON vocab_progress(user_id, set_id);

-- -------------------------------------------------------
-- 6. AI generation requests
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS vocab_ai_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  prompt TEXT NOT NULL,
  result_set_id UUID REFERENCES vocab_sets(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vocab_ai_requests_user ON vocab_ai_requests(user_id, created_at);

-- -------------------------------------------------------
-- 7. Likes cho public sets
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS vocab_set_likes (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  set_id UUID REFERENCES vocab_sets(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, set_id)
);

-- -------------------------------------------------------
-- 8. User saved sets (bookmark)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS vocab_set_saves (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  set_id UUID REFERENCES vocab_sets(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, set_id)
);

-- -------------------------------------------------------
-- 9. Mở rộng users: English VIP + plan
-- -------------------------------------------------------
ALTER TABLE users ADD COLUMN IF NOT EXISTS english_vip BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS english_vip_expires_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free'
  CHECK (plan IN ('free', 'math_vip', 'english_vip', 'combo_vip'));

-- -------------------------------------------------------
-- ROW LEVEL SECURITY
-- -------------------------------------------------------
ALTER TABLE dictionary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocab_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocab_set_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocab_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocab_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocab_ai_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocab_set_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocab_set_saves ENABLE ROW LEVEL SECURITY;

-- dictionary_entries: ai đọc cũng được
CREATE POLICY "Anyone can read dictionary" ON dictionary_entries FOR SELECT USING (true);

-- vocab_sets: public sets ai cũng đọc; private chỉ owner
CREATE POLICY "Read public or own vocab sets" ON vocab_sets FOR SELECT
  USING (is_public = true OR auth.uid() = created_by);
CREATE POLICY "Users create own vocab sets" ON vocab_sets FOR INSERT
  WITH CHECK (
    auth.uid() = created_by 
    AND is_system = false 
    AND featured = false
  );
CREATE POLICY "Users update own vocab sets" ON vocab_sets FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (
    is_system = false 
    AND featured = false
  );
CREATE POLICY "Users delete own vocab sets" ON vocab_sets FOR DELETE
  USING (auth.uid() = created_by);

-- vocab_set_words: theo set
CREATE POLICY "Read words of accessible sets" ON vocab_set_words FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM vocab_sets s WHERE s.id = set_id
      AND (s.is_public = true OR s.created_by = auth.uid())
  ));

-- vocab_questions: theo set
CREATE POLICY "Read questions of accessible sets" ON vocab_questions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM vocab_sets s WHERE s.id = set_id
      AND (s.is_public = true OR s.created_by = auth.uid())
  ));

-- vocab_progress: user-scoped
CREATE POLICY "Users manage own progress" ON vocab_progress FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- vocab_ai_requests: user-scoped
CREATE POLICY "Users view own ai requests" ON vocab_ai_requests FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users create ai requests" ON vocab_ai_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- likes & saves
CREATE POLICY "Users manage own likes" ON vocab_set_likes FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own saves" ON vocab_set_saves FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- -------------------------------------------------------
-- FUNCTION: tăng/giảm likes count
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION update_vocab_set_likes_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE vocab_sets SET likes = likes + 1 WHERE id = NEW.set_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE vocab_sets SET likes = GREATEST(likes - 1, 0) WHERE id = OLD.set_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE TRIGGER vocab_set_likes_count_trigger
AFTER INSERT OR DELETE ON vocab_set_likes
FOR EACH ROW EXECUTE FUNCTION update_vocab_set_likes_count();

-- FUNCTION: tự cập nhật word_count khi thêm/xóa từ
CREATE OR REPLACE FUNCTION update_vocab_set_word_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE vocab_sets SET word_count = word_count + 1, updated_at = NOW() WHERE id = NEW.set_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE vocab_sets SET word_count = GREATEST(word_count - 1, 0), updated_at = NOW() WHERE id = OLD.set_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE TRIGGER vocab_word_count_trigger
AFTER INSERT OR DELETE ON vocab_set_words
FOR EACH ROW EXECUTE FUNCTION update_vocab_set_word_count();

-- FUNCTION: tự cập nhật question_count
CREATE OR REPLACE FUNCTION update_vocab_set_question_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE vocab_sets SET question_count = question_count + 1 WHERE id = NEW.set_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE vocab_sets SET question_count = GREATEST(question_count - 1, 0) WHERE id = OLD.set_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE TRIGGER vocab_question_count_trigger
AFTER INSERT OR DELETE ON vocab_questions
FOR EACH ROW EXECUTE FUNCTION update_vocab_set_question_count();
