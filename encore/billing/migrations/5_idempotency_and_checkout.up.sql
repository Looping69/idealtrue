ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS checkout_session_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_checkout_session_id_idx
  ON subscriptions (checkout_session_id)
  WHERE checkout_session_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS content_credit_ledger_reference_id_idx
  ON content_credit_ledger (reference_id)
  WHERE reference_id IS NOT NULL;
