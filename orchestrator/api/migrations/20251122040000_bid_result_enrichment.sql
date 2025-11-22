-- Optional enrichment columns for future on-chain fields.
ALTER TABLE bids
    ADD COLUMN IF NOT EXISTS cost NUMERIC,
    ADD COLUMN IF NOT EXISTS quality_score INTEGER,
    ADD COLUMN IF NOT EXISTS nonce TEXT;

ALTER TABLE results
    ADD COLUMN IF NOT EXISTS proof_base64 TEXT,
    ADD COLUMN IF NOT EXISTS resources JSONB,
    ADD COLUMN IF NOT EXISTS chain_task_id BIGINT;

-- Indexes to speed lookups by chain ids once populated.
CREATE INDEX IF NOT EXISTS bids_chain_task_idx ON bids USING btree ((stored_json->>'chain_task_id'));
CREATE INDEX IF NOT EXISTS results_chain_task_idx ON results USING btree (chain_task_id);
