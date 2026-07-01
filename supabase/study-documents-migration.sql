-- Tài liệu học tập (PDF nhúng từ Google Drive)
-- Chạy trong Supabase SQL Editor

CREATE TABLE IF NOT EXISTS study_documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  subject         TEXT NOT NULL DEFAULT 'math',   -- hiện chỉ 'math'
  drive_url       TEXT NOT NULL,                  -- link file Google Drive
  folder_label    TEXT,                           -- gom nhóm theo thư mục
  view_count      INTEGER NOT NULL DEFAULT 0,     -- lượt xem thật
  view_count_base INTEGER NOT NULL DEFAULT 0,     -- lượt nền (tùy chọn)
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_study_documents_subject_created
  ON study_documents (subject, created_at DESC);

-- Ghi/sửa/xóa qua API admin (service role); đọc qua API (service role) → bật RLS chặn truy cập trực tiếp
ALTER TABLE study_documents ENABLE ROW LEVEL SECURITY;
