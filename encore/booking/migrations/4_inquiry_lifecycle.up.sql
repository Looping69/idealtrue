ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS inquiry_state TEXT;

ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS payment_state TEXT;

ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMPTZ;

ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ;

ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS payment_unlocked_at TIMESTAMPTZ;

ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS booked_at TIMESTAMPTZ;

UPDATE bookings
SET inquiry_state = CASE status
  WHEN 'pending' THEN 'PENDING'
  WHEN 'awaiting_guest_payment' THEN 'APPROVED'
  WHEN 'payment_submitted' THEN 'APPROVED'
  WHEN 'confirmed' THEN 'BOOKED'
  WHEN 'completed' THEN 'BOOKED'
  WHEN 'declined' THEN 'DECLINED'
  WHEN 'cancelled' THEN 'DECLINED'
  ELSE 'PENDING'
END
WHERE inquiry_state IS NULL;

UPDATE bookings
SET payment_state = CASE status
  WHEN 'awaiting_guest_payment' THEN 'INITIATED'
  WHEN 'payment_submitted' THEN 'INITIATED'
  WHEN 'confirmed' THEN 'COMPLETED'
  WHEN 'completed' THEN 'COMPLETED'
  ELSE 'UNPAID'
END
WHERE payment_state IS NULL;

UPDATE bookings
SET payment_unlocked_at = COALESCE(payment_unlocked_at, updated_at)
WHERE inquiry_state IN ('APPROVED', 'BOOKED')
  AND payment_unlocked_at IS NULL;

UPDATE bookings
SET booked_at = COALESCE(booked_at, payment_confirmed_at, updated_at)
WHERE inquiry_state = 'BOOKED'
  AND booked_at IS NULL;

ALTER TABLE bookings
ALTER COLUMN inquiry_state SET NOT NULL;

ALTER TABLE bookings
ALTER COLUMN payment_state SET NOT NULL;

ALTER TABLE bookings
ALTER COLUMN inquiry_state SET DEFAULT 'PENDING';

ALTER TABLE bookings
ALTER COLUMN payment_state SET DEFAULT 'UNPAID';

CREATE TABLE IF NOT EXISTS inquiry_ledger (
  id TEXT PRIMARY KEY,
  inquiry_id TEXT NOT NULL REFERENCES bookings (id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  from_state TEXT,
  to_state TEXT,
  actor TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS inquiry_ledger_inquiry_id_idx ON inquiry_ledger (inquiry_id, created_at DESC);

INSERT INTO inquiry_ledger (id, inquiry_id, event, from_state, to_state, actor, metadata, created_at)
SELECT
  md5(id || ':inquiry-created'),
  id,
  'INQUIRY_CREATED',
  NULL,
  inquiry_state,
  'guest',
  jsonb_build_object('payment_state', payment_state),
  created_at
FROM bookings
WHERE NOT EXISTS (
  SELECT 1
  FROM inquiry_ledger ledger
  WHERE ledger.inquiry_id = bookings.id
);
