-- AI Feedback History: stores each AI-generated English analysis per user
CREATE TABLE IF NOT EXISTS ai_feedback_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,           -- full markdown text from AI
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_feedback_history_user_id ON ai_feedback_history(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_history_created ON ai_feedback_history(user_id, created_at DESC);

-- RLS: users can only read/insert their own rows
ALTER TABLE ai_feedback_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own feedback history"
  ON ai_feedback_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own feedback"
  ON ai_feedback_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own feedback"
  ON ai_feedback_history FOR DELETE
  USING (auth.uid() = user_id);
