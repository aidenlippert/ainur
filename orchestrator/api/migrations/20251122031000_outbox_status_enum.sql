-- Constrain outbox status to known values and add uniqueness on bid/result agents per task.
ALTER TABLE outbound_extrinsics
    ADD CONSTRAINT outbound_extrinsics_status_chk CHECK (status IN ('pending', 'finalized', 'failed', 'dead'));

-- Ensure one bid per task/agent and one result per task/agent.
ALTER TABLE bids
    ADD CONSTRAINT bids_task_agent_unique UNIQUE (task_id, agent_id);

ALTER TABLE results
    ADD CONSTRAINT results_task_agent_unique UNIQUE (task_id, agent_id);

