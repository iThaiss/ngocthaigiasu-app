-- ============================================================
-- Admin Panel — SQL cần chạy trên Supabase
-- ============================================================

-- 1. Bảng coupons
CREATE TABLE IF NOT EXISTS coupons (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code             TEXT UNIQUE NOT NULL,
  discount_percent INTEGER NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
  max_uses         INTEGER NOT NULL DEFAULT 1,
  used_count       INTEGER NOT NULL DEFAULT 0,
  valid_from       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until      TIMESTAMPTZ,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Bảng coupon_uses (mỗi user chỉ dùng 1 coupon 1 lần)
CREATE TABLE IF NOT EXISTS coupon_uses (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id  UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  used_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (coupon_id, user_id)
);

-- 3. Index hỗ trợ tìm kiếm coupon nhanh
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupon_uses_user ON coupon_uses(user_id);
CREATE INDEX IF NOT EXISTS idx_coupon_uses_coupon ON coupon_uses(coupon_id);

-- 4. RLS: chỉ admin đọc/ghi coupons (nếu dùng RLS)
-- ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "admin_all" ON coupons USING (auth.jwt() ->> 'role' = 'admin');

-- ============================================================
-- Ghi chú về các bảng khác mà Admin Panel cần (đã tồn tại):
-- - users          (id, name, email, role, is_vip, vip_expires_at, province, school, phone, ...)
-- - wallets        (user_id, points, balance)
-- - point_transactions (user_id, amount, type, description, created_at)
--   type values: subscribe | topup | commission | milestone | gift
-- - notifications  (user_id, title, content, type, is_read, created_at)
--   type values: payment | commission | exam | solve | system | milestone
-- - transactions   (id, user_id, amount, type, status, reference_code, created_at)
-- - questions      (id, question_text, question_type, difficulty, correct_answer,
--                   option_a, option_b, option_c, option_d,
--                   statement_a/b/c/d, answer_a/b/c/d,
--                   numeric_answer, source, has_image, created_at)
-- - raw_documents  (id, filename, source, total_pages, status, created_at)
-- ============================================================
