-- (|/) Klaasvaakie - standard payment intents use Yoco Checkout API provider ids.
ALTER TABLE billing_payment_intents
ADD COLUMN IF NOT EXISTS provider_checkout_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS billing_payment_intents_provider_checkout_id_idx
  ON billing_payment_intents (provider_checkout_id)
  WHERE provider_checkout_id IS NOT NULL;
