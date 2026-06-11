CREATE TABLE IF NOT EXISTS ai_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL, -- 'generate_lesson_plan'
  status TEXT DEFAULT 'pending', -- pending/processing/completed/failed
  input JSONB NOT NULL,
  result JSONB,
  error TEXT,
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE ai_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin view all jobs" ON ai_jobs FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

