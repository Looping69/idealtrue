-- (|/) Klaasvaakie - standard Yoco payment intent ledger for all new billing payments.
CREATE TABLE billing_payment_intents (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  purpose TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'yoco',
  provider_mode TEXT NOT NULL DEFAULT 'live',
  status TEXT NOT NULL DEFAULT 'pending',
  currency TEXT NOT NULL DEFAULT 'ZAR',
  amount INTEGER NOT NULL,
  host_plan TEXT,
  billing_interval TEXT,
  credit_quantity INTEGER,
  provider_payment_link_id TEXT,
  provider_order_id TEXT,
  provider_payment_id TEXT,
  redirect_url TEXT,
  customer_reference TEXT NOT NULL,
  customer_description TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT billing_payment_intent_purpose_valid CHECK (purpose IN ('subscription', 'content_credits', 'host_billing_setup')),
  CONSTRAINT billing_payment_intent_provider_mode_valid CHECK (provider_mode IN ('live', 'test')),
  CONSTRAINT billing_payment_intent_status_valid CHECK (status IN ('pending', 'paid', 'failed', 'cancelled')),
  CONSTRAINT billing_payment_intent_plan_valid CHECK (host_plan IS NULL OR host_plan IN ('free', 'standard', 'professional', 'premium')),
  CONSTRAINT billing_payment_intent_interval_valid CHECK (billing_interval IS NULL OR billing_interval IN ('monthly', 'annual')),
  CONSTRAINT billing_payment_intent_credit_qty_valid CHECK (credit_quantity IS NULL OR credit_quantity > 0)
);

CREATE INDEX billing_payment_intents_user_id_idx ON billing_payment_intents (user_id, created_at DESC);
CREATE INDEX billing_payment_intents_status_idx ON billing_payment_intents (status);
CREATE UNIQUE INDEX billing_payment_intents_provider_order_id_idx ON billing_payment_intents (provider_order_id) WHERE provider_order_id IS NOT NULL;
CREATE UNIQUE INDEX billing_payment_intents_provider_payment_link_id_idx ON billing_payment_intents (provider_payment_link_id) WHERE provider_payment_link_id IS NOT NULL;
