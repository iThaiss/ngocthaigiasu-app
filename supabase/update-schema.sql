-- Thêm cột points vào wallets
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;

-- Bảng lịch sử giao dịch điểm
CREATE TABLE IF NOT EXISTS point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  amount INTEGER NOT NULL, -- số điểm (+ cộng, - trừ)
  type TEXT NOT NULL, -- 'topup'/'subscribe'/'commission'/'refund'
  description TEXT,
  reference_id UUID, -- transaction_id hoặc referral_id
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Thêm index
CREATE INDEX IF NOT EXISTS idx_point_transactions_user ON point_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_user ON wallets(user_id);

-- RLS cho point_transactions
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own points" ON point_transactions
  FOR SELECT USING (auth.uid() = user_id);
