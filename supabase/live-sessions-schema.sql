-- ============================================================
-- Lớp học Live — SQL cần chạy trên Supabase
-- ============================================================

CREATE TYPE live_status AS ENUM ('upcoming', 'live', 'ended');
CREATE TYPE subject_type AS ENUM ('math', 'english');

CREATE TABLE IF NOT EXISTS live_sessions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title              VARCHAR(255) NOT NULL,
  teacher            VARCHAR(100) NOT NULL,
  start_time         TIMESTAMPTZ NOT NULL,
  end_time           TIMESTAMPTZ NOT NULL,
  status             live_status DEFAULT 'upcoming' NOT NULL,
  subject            subject_type NOT NULL,
  meet_url           TEXT NOT NULL,          -- Link Google Meet gốc (chỉ hiển thị với Admin hoặc đi qua API redirect)
  external_event_id  VARCHAR(255),  -- ID sự kiện Lịch để gọi Google Calendar API
  recording_url      TEXT,              -- Video xem lại (phần 1) sau khi học xong
  recording_url_2    TEXT,              -- Video xem lại (phần 2) — tùy chọn
  document_url       TEXT,              -- File viết tay (PDF/ảnh) đính kèm
  homework_file_url  TEXT,              -- BTVN: link đề PDF/Drive học sinh nhìn song song
  homework_title     TEXT,              -- BTVN: tên bài tập
  homework_answer_key JSONB,            -- BTVN: mảng slot đáp án [{stt,type,correct}]
  view_count         INTEGER NOT NULL DEFAULT 0,   -- lượt xem thật (tự tăng)
  view_count_base    INTEGER NOT NULL DEFAULT 0,   -- số nền admin đặt (fake boost)
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

-- Nếu bảng đã tồn tại trước đó, chạy các dòng này để thêm cột mới:
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS recording_url_2 TEXT;
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS homework_file_url TEXT;
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS homework_title TEXT;
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS homework_answer_key JSONB;
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS view_count_base INTEGER NOT NULL DEFAULT 0;

-- BTVN: lưu mọi lần nộp của học sinh (cho AI phân tích sau)
CREATE TABLE IF NOT EXISTS homework_submissions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  live_session_id    UUID REFERENCES live_sessions(id) ON DELETE CASCADE,
  user_id            UUID REFERENCES users(id),
  answers            JSONB NOT NULL,   -- [{stt,type,answer,correct,correctAnswer,points,maxPoints}]
  score              NUMERIC NOT NULL,
  max_score          NUMERIC NOT NULL,
  correct_count      INTEGER,
  total_count        INTEGER,
  time_spent_seconds INTEGER,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_hw_sub_session ON homework_submissions(live_session_id);
CREATE INDEX IF NOT EXISTS idx_hw_sub_user    ON homework_submissions(user_id);

-- Bật RLS
ALTER TABLE live_sessions ENABLE ROW LEVEL SECURITY;

-- Cho phép tất cả người dùng đã đăng nhập xem danh sách buổi học
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'live_sessions' AND policyname = 'Authenticated users read live sessions'
  ) THEN
    CREATE POLICY "Authenticated users read live sessions" ON live_sessions
      FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- Cho phép Admin được toàn quyền quản lý (CRUD)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'live_sessions' AND policyname = 'Admin manages live sessions'
  ) THEN
    CREATE POLICY "Admin manages live sessions" ON live_sessions
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid() AND users.role = 'admin'
        )
      );
  END IF;
END $$;
