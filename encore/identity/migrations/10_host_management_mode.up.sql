ALTER TABLE users
ADD COLUMN IF NOT EXISTS management_mode TEXT NOT NULL DEFAULT 'self_service';

UPDATE users
SET management_mode = 'self_service'
WHERE management_mode IS NULL;
