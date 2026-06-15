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
  gift_code_id  UUID NOT NULL REFERENCES gift_codes(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  redeemed_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (gift_code_id, user_id)
);

DROP FUNCTION IF EXISTS redeem_gift_code(UUID, TEXT);

CREATE OR REPLACE FUNCTION redeem_gift_code(uid UUID, code_text TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  gc         gift_codes%ROWTYPE;
  cur_expiry TIMESTAMPTZ;
  new_expiry TIMESTAMPTZ;
BEGIN
  SELECT * INTO gc FROM gift_codes
  WHERE code = UPPER(TRIM(code_text))
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

  IF EXISTS (SELECT 1 FROM gift_code_uses WHERE gift_code_id = gc.id AND user_id = uid) THEN
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

  INSERT INTO gift_code_uses (gift_code_id, user_id) VALUES (gc.id, uid);
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
