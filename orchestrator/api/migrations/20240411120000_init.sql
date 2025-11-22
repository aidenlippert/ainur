-- Agents registered via orchestrator or chain events
CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tasks tracked by orchestrator; stored_json holds the full representation for lossless roundtrips
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY,
    client_task_id TEXT,
    requester_id BYTEA NOT NULL,
    description TEXT NOT NULL,
    task_type TEXT NOT NULL,
    input_base64 TEXT NOT NULL,
    max_budget NUMERIC(39,0) NOT NULL,
    deadline TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    stored_json JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS tasks_status_idx ON tasks (status);
CREATE INDEX IF NOT EXISTS tasks_deadline_idx ON tasks (deadline);

-- Bids associated with tasks
CREATE TABLE IF NOT EXISTS bids (
    id UUID PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    agent_id BYTEA NOT NULL,
    value NUMERIC(39,0) NOT NULL,
    quality_score INTEGER NOT NULL,
    completion_time BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    stored_json JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS bids_task_idx ON bids (task_id);
CREATE UNIQUE INDEX IF NOT EXISTS bids_task_agent_unique ON bids (task_id, agent_id);

-- Results for tasks
CREATE TABLE IF NOT EXISTS results (
    id UUID PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    agent_id BYTEA NOT NULL,
    output_base64 TEXT NOT NULL,
    completed_at TIMESTAMPTZ NOT NULL,
    proof BYTEA,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    stored_json JSONB NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS results_task_unique ON results (task_id);

-- Chain event mirror for replay/idempotency
CREATE TABLE IF NOT EXISTS chain_events (
    block_number BIGINT NOT NULL,
    event_index INTEGER NOT NULL,
    pallet TEXT NOT NULL,
    variant TEXT NOT NULL,
    payload TEXT NOT NULL,
    correlation_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (block_number, event_index)
);

-- Cursor to resume from last ingested block/event
CREATE TABLE IF NOT EXISTS chain_cursors (
    id INTEGER PRIMARY KEY DEFAULT 1,
    block_number BIGINT NOT NULL,
    event_index INTEGER NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
