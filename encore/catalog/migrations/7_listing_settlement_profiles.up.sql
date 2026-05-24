CREATE TABLE IF NOT EXISTS listing_settlement_profiles (
  listing_id TEXT PRIMARY KEY,
  payment_method TEXT,
  payment_instructions TEXT,
  payment_reference_prefix TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS listing_settlement_profiles_updated_at_idx
  ON listing_settlement_profiles (updated_at DESC);
