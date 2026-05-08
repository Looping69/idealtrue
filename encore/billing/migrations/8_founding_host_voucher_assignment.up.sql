ALTER TABLE host_voucher_codes
ADD COLUMN IF NOT EXISTS assigned_to TEXT,
ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ;

UPDATE host_voucher_codes
SET duration_months = 1,
    updated_at = NOW()
WHERE campaign = 'founding-hosts-2026-q2'
  AND status = 'available';
