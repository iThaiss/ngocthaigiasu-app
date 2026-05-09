-- Profile fields on users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS school TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS province TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE;

-- Affiliate referral code
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

-- Add commission_amount to affiliate_referrals if not present
ALTER TABLE affiliate_referrals ADD COLUMN IF NOT EXISTS commission_points INTEGER DEFAULT 0;

-- Index for referral lookups
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_referee ON affiliate_referrals(referee_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_referrer ON affiliate_referrals(referrer_id);

-- RLS for affiliate_referrals
ALTER TABLE affiliate_referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Users view own referrals as referrer" ON affiliate_referrals
  FOR SELECT USING (auth.uid() = referrer_id);
