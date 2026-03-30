UPDATE users
SET host_plan = 'standard',
    updated_at = NOW()
WHERE host_plan = 'free';

ALTER TABLE users
ALTER COLUMN host_plan SET DEFAULT 'standard';
