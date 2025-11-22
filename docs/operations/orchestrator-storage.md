# Orchestrator Storage and Chain Bridge Plan

This note captures the initial storage design for the orchestrator and how it will bridge to the Temporal chain via Subxt.

## Goals
- Durable state for agents, tasks, bids, and results (Postgres).
- Idempotent chain event ingestion with replay safety.
- Clear API/storage separation so in-memory and Postgres backends share the same trait surface.

## Schema (Postgres)
- `agents(id text primary key, label text, created_at timestamptz not null default now())`
- `tasks(id uuid primary key, client_task_id text, requester_id bytea, description text, task_type text, input_base64 text, max_budget numeric, deadline timestamptz, status text, created_at timestamptz, updated_at timestamptz)`
- `bids(id uuid primary key, task_id uuid references tasks(id), agent_id bytea, value numeric, quality_score integer, completion_time bigint, created_at timestamptz)`
- `results(id uuid primary key, task_id uuid references tasks(id), agent_id bytea, output_base64 text, completed_at timestamptz, proof bytea)`
- `chain_events(block_number bigint, event_index integer, pallet text, variant text, payload jsonb, primary key(block_number, event_index))` for replay/idempotency.

## Bridge Strategy
1. Subxt client subscribes to pallets: `agent-registry`, `task-market`, `commitments/escrow`, `reputation`.
2. For every event, convert into orchestrator models and upsert via storage trait.
3. Maintain `last_processed` cursor (block number + event index) and store it in Postgres; on restart, replay from cursor to ensure convergence.
4. Outbound: orchestrator submits extrinsics for agent registration, task creation, bid submission, and result settlement; ensure correlation IDs are stored to map extrinsic status to local records.

## API/Storage Abstraction
- `Storage` trait (in-code) defines CRUD for agents, tasks, bids, results.
- `InMemoryStorage` satisfies tests and local dev (already wired).
- `PostgresStorage` will implement the same trait using SQLx with prepared statements, connection pooling, and migrations (`orchestrator/api/migrations`).

## Data Integrity & Resilience
- All writes inside a transaction per operation (task + bids + results).
- Unique constraints on `(task_id, agent_id)` for bids and results to avoid duplicates.
- Use checks to prevent status regressions (`completed` cannot move back to `pending`).
- Apply base64 validation on ingress and size limits to avoid oversized payloads.

## Next Steps
- Add SQLx dependency behind a `postgres` feature flag and implement `PostgresStorage`.
- Add migrations folder (`sqlx migrate` compatible) with the schema above.
- Add Subxt client crate (or module) with pallet event types and a replay worker.
- Extend integration tests to spin Postgres + devnet chain and assert end-to-end register → task → bid → settle persists correctly.
- Track outbound extrinsics with correlation IDs (see `outbound_extrinsics` table) to map orchestrator actions to chain status.
- Configure via env: `DATABASE_URL`, `DB_MAX_CONNECTIONS`, `DB_CONNECT_TIMEOUT_SECS`, `CHAIN_WS_URL`, `CHAIN_METADATA_PATH`, `EXECUTION_ENGINE` (`local`/`wasm`), `WASM_MODULE_PATH`.
- Chain bridge env: `CHAIN_WS_URL` (e.g. `ws://127.0.0.1:9944`), optional `CHAIN_METADATA_PATH`, and `OUTBOX_POLL_MS` (poll interval for the outbound submitter; default `500` ms).
- For local Postgres: use `docker-compose.postgres.yml` and `scripts/dev-postgres.sh up` (defaults user/db/password to `ainur`, port `5432`; set `POSTGRES_PORT=5433` to avoid host conflicts). The data directory lives under `.data/postgres` (gitignored). Connection string example: `postgresql://ainur:ainur@localhost:5433/ainur`.

## Outbox API (chain-bridge feature)

- `POST /v1/outbox` enqueues an extrinsic for the outbox worker. Body:
  ```json
  {
    "pallet": "TaskMarket",
    "call": "create_task",
    "payload": {
      "spec_hash": "0x<32-byte-hex>",
      "budget": 1000000,
      "deadline": 100,
      "verification_level": "best_effort"
    }
  }
  ```
  Response: `{ "correlation_id": "<uuid>", "status": "queued" }`.
- `GET /v1/outbox/:id` (Postgres only) returns status, retry_count, and last_error for a correlation id.
- `GET /v1/outbox?status=pending&limit=50&offset=0` (Postgres only) lists recent entries with optional status filter; default limit 50, max 200.
- When chain-bridge is enabled, POSTs to `/v1/agents`, `/v1/tasks`, `/v1/bids`, `/v1/results` auto-enqueue an outbound extrinsic and return `x-correlation-id` header for tracking.
- Request bodies are capped at 1 MiB by default; outbox payloads are capped at 4 KiB; `payload` and `last_error` columns are constrained in Postgres.
