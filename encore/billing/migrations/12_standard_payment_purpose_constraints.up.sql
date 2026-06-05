-- (|/) Klaasvaakie - align persisted Yoco purposes with the standard billing payment endpoint.
ALTER TABLE billing_payment_intents
DROP CONSTRAINT IF EXISTS billing_payment_intent_purpose_valid;

ALTER TABLE billing_payment_intents
ADD CONSTRAINT billing_payment_intent_purpose_valid
CHECK (purpose IN ('subscription', 'content_credits', 'host_billing_setup', 'managed_hosting'));

ALTER TABLE billing_checkout_sessions
DROP CONSTRAINT IF EXISTS billing_checkout_type_valid;

ALTER TABLE billing_checkout_sessions
ADD CONSTRAINT billing_checkout_type_valid
CHECK (checkout_type IN ('subscription', 'content_credits', 'host_billing_setup', 'managed_hosting'));

ALTER TABLE billing_payment_link_sessions
DROP CONSTRAINT IF EXISTS billing_payment_link_session_type_valid;

ALTER TABLE billing_payment_link_sessions
ADD CONSTRAINT billing_payment_link_session_type_valid
CHECK (session_type IN ('subscription', 'content_credits', 'host_billing_setup', 'managed_hosting'));
