ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS decline_reason TEXT;

ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS decline_reason_note TEXT;
