CREATE UNIQUE INDEX IF NOT EXISTS referral_rewards_source_subscription_unique_idx
  ON referral_rewards (source_subscription_id)
  WHERE source_subscription_id IS NOT NULL;
