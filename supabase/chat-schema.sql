-- ============================================================
-- Chat cộng đồng realtime
-- ============================================================

CREATE TABLE IF NOT EXISTS chat_rooms (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id           UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  author_name       TEXT NOT NULL,
  author_avatar_url TEXT,
  content           TEXT NOT NULL CHECK (char_length(trim(content)) > 0 AND char_length(content) <= 1000),
  is_hidden         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_rooms_slug ON chat_rooms(slug);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_active_order ON chat_rooms(is_active, order_index);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_created ON chat_messages(room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_visible ON chat_messages(room_id, is_hidden, created_at DESC);

INSERT INTO chat_rooms (slug, name, description, order_index) VALUES
  ('math', 'Toán', 'Hỏi đáp và trao đổi môn Toán', 1),
  ('english', 'Tiếng Anh', 'Hỏi đáp và trao đổi môn Tiếng Anh', 2),
  ('general', 'Tổng', 'Trao đổi chung trong cộng đồng', 3)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  order_index = EXCLUDED.order_index,
  is_active = TRUE;

ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'chat_rooms' AND policyname = 'Anyone can view active chat rooms'
  ) THEN
    CREATE POLICY "Anyone can view active chat rooms" ON chat_rooms
      FOR SELECT USING (is_active = TRUE);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'chat_messages' AND policyname = 'Anyone can view visible chat messages'
  ) THEN
    CREATE POLICY "Anyone can view visible chat messages" ON chat_messages
      FOR SELECT USING (is_hidden = FALSE);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'chat_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
  END IF;
END $$;
