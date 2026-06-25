-- Thêm cột livekit_room_name vào bảng live_sessions
-- Chạy lệnh này trong Supabase SQL Editor

ALTER TABLE live_sessions
  ADD COLUMN IF NOT EXISTS livekit_room_name TEXT;

-- Index để tìm nhanh theo room name (nếu cần)
CREATE INDEX IF NOT EXISTS idx_live_sessions_room_name
  ON live_sessions (livekit_room_name)
  WHERE livekit_room_name IS NOT NULL;
