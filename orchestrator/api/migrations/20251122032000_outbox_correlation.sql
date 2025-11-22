-- Track tx hash and correlated chain ids for outbound extrinsics, and store optional correlation id on chain events.
ALTER TABLE outbound_extrinsics
    ADD COLUMN IF NOT EXISTS tx_hash TEXT,
    ADD COLUMN IF NOT EXISTS chain_task_id BIGINT,
    ADD COLUMN IF NOT EXISTS chain_agent_id BIGINT;

ALTER TABLE chain_events
    ADD COLUMN IF NOT EXISTS correlation_id TEXT;

