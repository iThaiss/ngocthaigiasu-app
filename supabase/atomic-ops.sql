-- ============================================================
-- Atomic wallet, payment, affiliate, and solve quota operations
-- Run this on Supabase before deploying the matching API changes.
-- ============================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS vip_plan TEXT;
ALTER TABLE affiliate_referrals ADD COLUMN IF NOT EXISTS commission_points INTEGER DEFAULT 0;
ALTER TABLE affiliate_referrals ADD COLUMN IF NOT EXISTS commission_amount BIGINT DEFAULT 10000;

DROP FUNCTION IF EXISTS commission_pending_referral(UUID, INTEGER, BIGINT, TEXT);
DROP FUNCTION IF EXISTS purchase_vip_plan(UUID, TEXT, INTEGER, TIMESTAMPTZ, UUID, TEXT);
DROP FUNCTION IF EXISTS purchase_vip_plan(UUID, TEXT, INTEGER, TIMESTAMPTZ, UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS complete_pending_topup(UUID, BIGINT);
DROP FUNCTION IF EXISTS release_solve_usage(UUID, DATE);
DROP FUNCTION IF EXISTS reserve_solve_usage(UUID, DATE, INTEGER, BOOLEAN);
DROP FUNCTION IF EXISTS increment_points(UUID, INTEGER);

CREATE OR REPLACE FUNCTION increment_points(uid UUID, delta INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_points INTEGER;
BEGIN
  UPDATE wallets
  SET points = COALESCE(points, 0) + delta,
      updated_at = NOW()
  WHERE user_id = uid
  RETURNING points INTO new_points;

  IF new_points IS NULL THEN
    IF delta < 0 THEN
      RAISE EXCEPTION 'wallet_not_found';
    END IF;

    INSERT INTO wallets(user_id, balance, points)
    VALUES (uid, 0, delta)
    ON CONFLICT (user_id) DO UPDATE
    SET points = COALESCE(wallets.points, 0) + EXCLUDED.points,
        updated_at = NOW()
    RETURNING wallets.points INTO new_points;
  END IF;

  RETURN new_points;
END;
$$;

CREATE OR REPLACE FUNCTION reserve_solve_usage(
  uid UUID,
  solve_date DATE,
  solve_limit INTEGER,
  reset_first BOOLEAN DEFAULT FALSE
)
RETURNS TABLE(allowed BOOLEAN, used INTEGER, remaining INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count INTEGER;
  existing_count INTEGER;
BEGIN
  IF solve_limit = 0 THEN
    RETURN QUERY SELECT FALSE, 0, 0;
    RETURN;
  END IF;

  IF reset_first THEN
    INSERT INTO daily_solve_count(user_id, date, count)
    VALUES (uid, solve_date, 0)
    ON CONFLICT (user_id, date) DO UPDATE SET count = 0;
  END IF;

  INSERT INTO daily_solve_count(user_id, date, count)
  VALUES (uid, solve_date, 1)
  ON CONFLICT (user_id, date) DO UPDATE
  SET count = daily_solve_count.count + 1
  WHERE solve_limit < 0 OR daily_solve_count.count < solve_limit
  RETURNING count INTO new_count;

  IF new_count IS NULL THEN
    SELECT count INTO existing_count
    FROM daily_solve_count
    WHERE user_id = uid AND date = solve_date;

    RETURN QUERY SELECT
      FALSE,
      COALESCE(existing_count, solve_limit),
      CASE WHEN solve_limit < 0 THEN 0 ELSE GREATEST(0, solve_limit - COALESCE(existing_count, solve_limit)) END;
    RETURN;
  END IF;

  RETURN QUERY SELECT
    TRUE,
    new_count,
    CASE WHEN solve_limit < 0 THEN -1 ELSE GREATEST(0, solve_limit - new_count) END;
END;
$$;

CREATE OR REPLACE FUNCTION release_solve_usage(uid UUID, solve_date DATE)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE daily_solve_count
  SET count = GREATEST(count - 1, 0)
  WHERE user_id = uid AND date = solve_date
  RETURNING count INTO new_count;

  RETURN COALESCE(new_count, 0);
END;
$$;

CREATE OR REPLACE FUNCTION complete_pending_topup(txid UUID, transfer_amount BIGINT)
RETURNS TABLE(
  success BOOLEAN,
  transaction_id UUID,
  user_id UUID,
  amount BIGINT,
  points_added INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tx RECORD;
  add_points INTEGER;
BEGIN
  UPDATE transactions AS t
  SET status = 'completed'
  WHERE t.id = txid
    AND t.status = 'pending'
    AND t.amount = transfer_amount
  RETURNING t.id, t.user_id, t.amount, t.metadata
  INTO tx;

  IF tx.id IS NULL THEN
    RETURN QUERY SELECT FALSE, txid, NULL::UUID, transfer_amount, 0;
    RETURN;
  END IF;

  add_points := COALESCE((tx.metadata->>'pointsToAdd')::INTEGER, FLOOR(tx.amount / 1000)::INTEGER);

  PERFORM increment_points(tx.user_id, add_points);

  INSERT INTO point_transactions(user_id, amount, type, description, reference_id)
  VALUES (
    tx.user_id,
    add_points,
    'topup',
    'Nạp tiền ' || to_char(tx.amount, 'FM999G999G999G999') || 'đ',
    tx.id
  );

  RETURN QUERY SELECT TRUE, tx.id, tx.user_id, tx.amount, add_points;
END;
$$;

-- plan_id: planId granular ('math_monthly', 'combo_1week', ...) -> lưu vào users.vip_plan
-- plan_subject: giá trị môn ('math_vip'|'english_vip'|'combo_vip') -> lưu vào users.plan (feature gates)
CREATE OR REPLACE FUNCTION purchase_vip_plan(
  uid UUID,
  plan_id TEXT,
  cost_points INTEGER,
  expires_at TIMESTAMPTZ,
  coupon_id UUID DEFAULT NULL,
  tx_description TEXT DEFAULT NULL,
  plan_subject TEXT DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, reason TEXT, points_remaining INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  remaining_points INTEGER;
  selected_coupon RECORD;
  coupon_updated UUID;
BEGIN
  IF cost_points < 0 THEN
    RAISE EXCEPTION 'invalid_cost';
  END IF;

  IF coupon_id IS NOT NULL THEN
    SELECT id, max_uses, used_count
    INTO selected_coupon
    FROM coupons
    WHERE coupons.id = purchase_vip_plan.coupon_id
      AND is_active = TRUE
      AND (valid_until IS NULL OR valid_until >= NOW())
      AND used_count < max_uses
    FOR UPDATE;

    IF selected_coupon.id IS NULL THEN
      RETURN QUERY SELECT FALSE, 'coupon_unavailable', NULL::INTEGER;
      RETURN;
    END IF;

    IF EXISTS (
      SELECT 1 FROM coupon_uses
      WHERE coupon_uses.coupon_id = purchase_vip_plan.coupon_id
        AND coupon_uses.user_id = uid
    ) THEN
      RETURN QUERY SELECT FALSE, 'coupon_used', NULL::INTEGER;
      RETURN;
    END IF;
  END IF;

  UPDATE wallets
  SET points = COALESCE(points, 0) - cost_points,
      updated_at = NOW()
  WHERE wallets.user_id = uid
    AND COALESCE(points, 0) >= cost_points
  RETURNING points INTO remaining_points;

  IF remaining_points IS NULL THEN
    RETURN QUERY SELECT FALSE, 'insufficient_points', NULL::INTEGER;
    RETURN;
  END IF;

  IF coupon_id IS NOT NULL THEN
    UPDATE coupons
    SET used_count = used_count + 1
    WHERE coupons.id = purchase_vip_plan.coupon_id
      AND used_count < max_uses
    RETURNING id INTO coupon_updated;

    IF coupon_updated IS NULL THEN
      RAISE EXCEPTION 'coupon_unavailable';
    END IF;

    INSERT INTO coupon_uses(coupon_id, user_id)
    VALUES (purchase_vip_plan.coupon_id, uid);
  END IF;

  INSERT INTO point_transactions(user_id, amount, type, description)
  VALUES (uid, -cost_points, 'subscribe', COALESCE(tx_description, 'Đăng ký VIP'));

  UPDATE users
  SET is_vip = TRUE,
      vip_expires_at = expires_at,
      vip_plan = plan_id,
      plan = COALESCE(plan_subject, plan_id)
  WHERE id = uid;

  RETURN QUERY SELECT TRUE, NULL::TEXT, remaining_points;
END;
$$;

CREATE OR REPLACE FUNCTION commission_pending_referral(
  referee UUID,
  commission_points INTEGER,
  commission_amount BIGINT,
  tx_description TEXT
)
RETURNS TABLE(
  success BOOLEAN,
  referral_id UUID,
  referrer_id UUID,
  points_added INTEGER,
  commissioned_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  referral RECORD;
  total_count BIGINT;
BEGIN
  UPDATE affiliate_referrals AS ar
  SET status = 'commissioned',
      commission_amount = commission_pending_referral.commission_amount,
      commission_points = commission_pending_referral.commission_points
  WHERE ar.referee_id = referee
    AND ar.status = 'pending'
    AND ar.referrer_id <> referee
  RETURNING ar.id, ar.referrer_id
  INTO referral;

  IF referral.id IS NULL THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::UUID, 0, 0::BIGINT;
    RETURN;
  END IF;

  PERFORM increment_points(referral.referrer_id, commission_points);

  INSERT INTO point_transactions(user_id, amount, type, description, reference_id)
  VALUES (referral.referrer_id, commission_points, 'commission', tx_description, referral.id);

  SELECT COUNT(*) INTO total_count
  FROM affiliate_referrals AS ar
  WHERE ar.referrer_id = referral.referrer_id
    AND ar.status = 'commissioned';

  RETURN QUERY SELECT TRUE, referral.id, referral.referrer_id, commission_points, total_count;
END;
$$;
