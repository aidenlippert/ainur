-- Track matched agent for tasks once TaskMatched event observed
ALTER TABLE tasks
    ADD COLUMN IF NOT EXISTS matched_agent BIGINT;

CREATE INDEX IF NOT EXISTS tasks_matched_agent_idx ON tasks (matched_agent);
