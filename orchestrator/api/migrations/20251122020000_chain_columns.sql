-- Add chain-facing columns to agents/tasks for bridge ingestion.
ALTER TABLE agents
    ADD COLUMN IF NOT EXISTS chain_agent_id BIGINT,
    ADD COLUMN IF NOT EXISTS account_address TEXT;

CREATE INDEX IF NOT EXISTS agents_chain_agent_idx ON agents (chain_agent_id);
CREATE INDEX IF NOT EXISTS agents_account_address_idx ON agents (account_address);

ALTER TABLE tasks
    ADD COLUMN IF NOT EXISTS chain_task_id BIGINT,
    ADD COLUMN IF NOT EXISTS result_hash TEXT;

CREATE INDEX IF NOT EXISTS tasks_chain_task_idx ON tasks (chain_task_id);
