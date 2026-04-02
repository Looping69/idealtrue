CREATE TABLE IF NOT EXISTS notification_reads (
  notification_id TEXT NOT NULL REFERENCES notifications (id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (notification_id, user_id)
);

CREATE INDEX IF NOT EXISTS notification_reads_user_id_idx
ON notification_reads (user_id, read_at DESC);
