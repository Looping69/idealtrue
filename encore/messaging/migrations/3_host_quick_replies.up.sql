CREATE TABLE IF NOT EXISTS host_message_quick_replies (
  host_id TEXT PRIMARY KEY,
  checkin TEXT,
  checkout TEXT,
  payment_info TEXT,
  directions TEXT,
  house_rules TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
