-- ============================================================
-- Gift Code system — run on Supabase Dashboard SQL editor
-- ============================================================

CREATE TABLE IF NOT EXISTS gift_codes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code         TEXT UNIQUE NOT NULL,
  vip_plan_id  TEXT NOT NULL,
  plan_subject TEXT NOT NULL,
  duration_days INT NOT NULL,
  max_uses     INT NOT NULL DEFAULT 1,
  used_count   INT NOT NULL DEFAULT 0,
  valid_until  TIMESTAMPTZ,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gift_code_uses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_code_id  UUID REFERENCES gift_codes(id) ON DELETE SET NULL,
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_text     TEXT,            -- tên mã (UPPER/TRIM) để chặn trùng theo tên, sống sót khi xóa mã
  redeemed_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (gift_code_id, user_id)
);

-- Mỗi học sinh chỉ dùng 1 lần cho 1 TÊN mã (kể cả khi mã bị xóa & tạo lại cùng tên)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_gift_use_codetext_user
  ON gift_code_uses (code_text, user_id) WHERE code_text IS NOT NULL;

-- ============================================================
-- Migration cho DB đã tồn tại (chạy 1 lần trên Supabase):
-- ALTER TABLE gift_code_uses ADD COLUMN IF NOT EXISTS code_text TEXT;
-- UPDATE gift_code_uses u SET code_text = g.code
--   FROM gift_codes g WHERE u.gift_code_id = g.id AND u.code_text IS NULL;
-- ALTER TABLE gift_code_uses ALTER COLUMN gift_code_id DROP NOT NULL;
-- ALTER TABLE gift_code_uses DROP CONSTRAINT IF EXISTS gift_code_uses_gift_code_id_fkey;
-- ALTER TABLE gift_code_uses ADD CONSTRAINT gift_code_uses_gift_code_id_fkey
--   FOREIGN KEY (gift_code_id) REFERENCES gift_codes(id) ON DELETE SET NULL;
-- CREATE UNIQUE INDEX IF NOT EXISTS uniq_gift_use_codetext_user
--   ON gift_code_uses (code_text, user_id) WHERE code_text IS NOT NULL;
-- ============================================================

DROP FUNCTION IF EXISTS redeem_gift_code(UUID, TEXT);

-- Tham số đặt tên input_code để không trùng tên cột code_text trong gift_code_uses
CREATE OR REPLACE FUNCTION redeem_gift_code(uid UUID, input_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  gc         gift_codes%ROWTYPE;
  cur_expiry TIMESTAMPTZ;
  new_expiry TIMESTAMPTZ;
  normalized TEXT := UPPER(TRIM(input_code));
BEGIN
  SELECT * INTO gc FROM gift_codes
  WHERE code = normalized
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Mã không tồn tại');
  END IF;
  IF NOT gc.is_active THEN
    RETURN jsonb_build_object('error', 'Mã đã bị vô hiệu hóa');
  END IF;
  IF gc.valid_until IS NOT NULL AND gc.valid_until < NOW() THEN
    RETURN jsonb_build_object('error', 'Mã đã hết hạn sử dụng');
  END IF;
  IF gc.used_count >= gc.max_uses THEN
    RETURN jsonb_build_object('error', 'Mã đã được sử dụng hết lượt');
  END IF;

  -- Chặn trùng theo TÊN mã — chặn cả khi mã bị xóa & tạo lại cùng tên
  IF EXISTS (SELECT 1 FROM gift_code_uses gcu WHERE gcu.code_text = gc.code AND gcu.user_id = uid) THEN
    RETURN jsonb_build_object('error', 'Bạn đã sử dụng mã này rồi');
  END IF;

  SELECT vip_expires_at INTO cur_expiry FROM users WHERE id = uid;
  new_expiry := GREATEST(COALESCE(cur_expiry, NOW()), NOW())
                + (gc.duration_days || ' days')::INTERVAL;

  UPDATE users SET
    is_vip         = true,
    vip_expires_at = new_expiry,
    plan           = gc.plan_subject,
    vip_plan       = gc.vip_plan_id
  WHERE id = uid;

  INSERT INTO gift_code_uses (gift_code_id, user_id, code_text) VALUES (gc.id, uid, gc.code);
  UPDATE gift_codes SET used_count = used_count + 1 WHERE id = gc.id;

  RETURN jsonb_build_object(
    'success',       true,
    'vip_plan_id',   gc.vip_plan_id,
    'plan_subject',  gc.plan_subject,
    'duration_days', gc.duration_days,
    'vip_expires_at', new_expiry
  );
END;
$$;
