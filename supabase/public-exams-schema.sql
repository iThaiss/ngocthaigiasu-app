-- ============================================================
-- Public Exams — Đề thi THPTQG (chương trình mới 2025)
-- ============================================================

CREATE TABLE IF NOT EXISTS public_exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  year INTEGER,
  subject TEXT DEFAULT 'math',
  pdf_url TEXT,
  time_limit_minutes INTEGER DEFAULT 90,
  question_count INTEGER DEFAULT 22,
  max_score NUMERIC(5,2) DEFAULT 10,
  attempt_count INTEGER DEFAULT 0,
  avg_score NUMERIC(5,2),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Đáp án từng câu (chỉ admin đọc được correct_answer)
CREATE TABLE IF NOT EXISTS public_exam_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID REFERENCES public_exams(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL,
  part TEXT NOT NULL CHECK (part IN ('part_1', 'part_2', 'part_3')),
  question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false', 'short_answer')),
  -- MC: 'A'|'B'|'C'|'D'
  -- TF: JSON object {"a":true,"b":false,"c":true,"d":false}
  -- SA: số dạng string, vd "3.14"
  correct_answer TEXT,
  max_score NUMERIC(5,2) NOT NULL,
  -- TF: {"score_by_correct_count":{"1":0.1,"2":0.25,"3":0.5,"4":1.0}}
  scoring_rule JSONB,
  UNIQUE(exam_id, question_number)
);

-- Bài làm của học sinh
CREATE TABLE IF NOT EXISTS public_exam_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID REFERENCES public_exams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '{}',
  score NUMERIC(5,2),
  time_spent_seconds INTEGER,
  attempt_number INTEGER DEFAULT 1,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_public_exam_submissions_exam_user ON public_exam_submissions(exam_id, user_id);
CREATE INDEX IF NOT EXISTS idx_public_exam_submissions_leaderboard ON public_exam_submissions(exam_id, score DESC);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE public_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_exam_submissions ENABLE ROW LEVEL SECURITY;

-- public_exams: everyone can read published, admin can do all
CREATE POLICY "Anyone can view published exams"
  ON public_exams FOR SELECT
  USING (status = 'published' OR auth.uid() IN (
    SELECT id FROM users WHERE role = 'admin'
  ));

CREATE POLICY "Admin can manage exams"
  ON public_exams FOR ALL
  USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- public_exam_questions: students cannot see correct_answer (handled at API layer)
-- RLS just allows reads for published exams
CREATE POLICY "Anyone can view questions of published exams"
  ON public_exam_questions FOR SELECT
  USING (
    exam_id IN (SELECT id FROM public_exams WHERE status = 'published')
    OR auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

CREATE POLICY "Admin can manage questions"
  ON public_exam_questions FOR ALL
  USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- public_exam_submissions: users see their own, admin sees all
CREATE POLICY "Users view own submissions"
  ON public_exam_submissions FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() IN (
    SELECT id FROM users WHERE role = 'admin'
  ));

CREATE POLICY "Users can insert submissions"
  ON public_exam_submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can manage submissions"
  ON public_exam_submissions FOR ALL
  USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- ============================================================
-- Function: cập nhật attempt_count và avg_score sau mỗi lần thi
-- ============================================================
CREATE OR REPLACE FUNCTION update_public_exam_stats(p_exam_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public_exams
  SET
    attempt_count = (
      SELECT COUNT(*) FROM public_exam_submissions
      WHERE exam_id = p_exam_id AND attempt_number = 1
    ),
    avg_score = (
      SELECT ROUND(AVG(score)::NUMERIC, 2) FROM public_exam_submissions
      WHERE exam_id = p_exam_id AND attempt_number = 1
    )
  WHERE id = p_exam_id;
END;
$$;
