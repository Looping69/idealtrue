CREATE UNIQUE INDEX IF NOT EXISTS reviews_booking_id_unique_idx
  ON reviews (booking_id);

CREATE INDEX IF NOT EXISTS reviews_status_idx
  ON reviews (status, created_at DESC);
