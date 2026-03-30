ALTER TABLE billing_checkout_sessions
DROP CONSTRAINT IF EXISTS billing_checkout_plan_valid;

ALTER TABLE billing_checkout_sessions
ADD CONSTRAINT billing_checkout_plan_valid
CHECK (host_plan IS NULL OR host_plan IN ('standard', 'professional', 'premium'));
