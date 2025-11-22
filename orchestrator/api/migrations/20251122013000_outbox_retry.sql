ALTER TABLE outbound_extrinsics
    ADD COLUMN IF NOT EXISTS retry_count INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_error TEXT,
    ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;

ALTER TABLE outbound_extrinsics
    ALTER COLUMN status SET DEFAULT 'pending';

UPDATE outbound_extrinsics
SET status = COALESCE(status, 'pending'),
    retry_count = COALESCE(retry_count, 0)
WHERE status IS NULL OR retry_count IS NULL;
