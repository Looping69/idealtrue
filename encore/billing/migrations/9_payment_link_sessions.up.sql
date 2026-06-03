-- (|/) Klaasvaakie - server-owned Yoco payment links with provider order reconciliation.
CREATE TABLE billing_payment_link_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  session_type TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'yoco',
  status TEXT NOT NULL DEFAULT 'pending',
  currency TEXT NOT NULL DEFAULT 'ZAR',
  amount INTEGER NOT NULL,
  host_plan TEXT,
  billing_interval TEXT,
  credit_quantity INTEGER,
  payment_link_id TEXT,
  provider_order_id TEXT,
  provider_payment_id TEXT,
  provider_mode TEXT,
  redirect_url TEXT,
  customer_reference TEXT NOT NULL,
  customer_description TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT billing_payment_link_session_type_valid CHECK (session_type IN ('subscription', 'content_credits', 'host_billing_setup')),
  CONSTRAINT billing_payment_link_status_valid CHECK (status IN ('pending', 'paid', 'failed', 'cancelled')),
  CONSTRAINT billing_payment_link_plan_valid CHECK (host_plan IS NULL OR host_plan IN ('free', 'standard', 'professional', 'premium')),
  CONSTRAINT billing_payment_link_interval_valid CHECK (billing_interval IS NULL OR billing_interval IN ('monthly', 'annual')),
  CONSTRAINT billing_payment_link_credit_qty_valid CHECK (credit_quantity IS NULL OR credit_quantity > 0)
);

CREATE INDEX billing_payment_link_sessions_user_id_idx ON billing_payment_link_sessions (user_id, created_at DESC);
CREATE INDEX billing_payment_link_sessions_status_idx ON billing_payment_link_sessions (status);
CREATE UNIQUE INDEX billing_payment_link_sessions_payment_link_id_idx ON billing_payment_link_sessions (payment_link_id) WHERE payment_link_id IS NOT NULL;
CREATE UNIQUE INDEX billing_payment_link_sessions_provider_order_id_idx ON billing_payment_link_sessions (provider_order_id) WHERE provider_order_id IS NOT NULL;
