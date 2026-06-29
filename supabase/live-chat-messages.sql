-- Lưu lịch sử chat lớp học live
-- Chạy trong Supabase SQL Editor

CREATE TABLE IF NOT EXISTS live_chat_messages (
  id          TEXT PRIMARY KEY,            -- dạng "${userId}-${time}" (khớp id broadcast)
  session_id  UUID NOT NULL,
  user_id     UUID,
  user_name   TEXT,
  user_avatar TEXT,
  text        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tải nhanh lịch sử theo buổi học, sắp theo thời gian
CREATE INDEX IF NOT EXISTS idx_live_chat_session_time
  ON live_chat_messages (session_id, created_at);

-- Ghi/đọc đều qua API route dùng service role nên không cần RLS policy riêng.
-- Bật RLS để chặn truy cập trực tiếp bằng anon key (an toàn mặc định).
ALTER TABLE live_chat_messages ENABLE ROW LEVEL SECURITY;
