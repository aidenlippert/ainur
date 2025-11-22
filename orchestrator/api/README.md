# Ainur Orchestrator API

This crate exposes a small Axum HTTP surface for task/agent/bid/result flows, plus a Postgres-backed outbox that bridges to the Temporal chain via Subxt.

## Correlation flow (API -> outbox -> chain -> backfill)

1. Client hits `/v1/agents|tasks|bids|results` (or `/v1/outbox`) with a JSON body.
2. The handler validates the payload, generates a `correlation_id` (UUID), and inserts a row into `outbound_extrinsics` with `status='pending'` and the raw payload.
3. The outbox worker pulls pending rows, builds the Subxt extrinsic, signs with `//Alice`, submits, waits for finalization, records `tx_hash`, and sets `status='finalized'` (or `failed/dead` after retries). `retry_count` increments on every attempt.
4. The chain replay worker subscribes to finalized blocks, writes events to `chain_events` (including `correlation_id` when the event’s extrinsic hash matches), and backfills application tables:
   - `AgentRegistered` -> agents table (`chain_agent_id`) and updates matching outbox rows.
   - `TaskCreated` -> tasks table (`chain_task_id`) and patches pending payloads with placeholders `task_id:0`.
   - `BidSubmitted` -> bids table and patches pending payloads with placeholders `task_id:0/agent_id:0`.
   - `TaskCompleted` -> results table, sets task status, and patches pending payloads.

Outbox GET endpoints:
- `/v1/outbox?status=pending|failed|finalized|dead&limit=...&offset=...`
- `/v1/outbox/:correlation_id`

Each auto-enqueue response body includes `correlation_id`; status changes are visible via the endpoints above.

### Observability / metrics

The outbox worker emits structured logs with cumulative counters:
`submitted`, `failed`, `dead`, `retried`. Add your preferred tracing/metrics subscriber to scrape/export them (e.g., `RUST_LOG=outbox=info`).

## Supported extrinsics and payload schemas

```
AgentRegistry::register_agent
{ "did": "did:ainur:...", "capabilities": ["a","b"], "metadata": "opt", "verification_level": "best_effort|optimistic|tee|zksnark|redundant" }

TaskMarket::create_task
{ "spec_hash": "0x...32bytes", "budget": u64, "deadline": u32, "verification_level": "<as above>" }

TaskMarket::submit_bid
{ "task_id": u64, "agent_id": u64, "commitment": "0x...32bytes", "estimated_duration": u32 }

TaskMarket::reveal_bid
{ "task_id": u64, "agent_id": u64, "cost": u64, "nonce": "0x...32bytes" }

TaskMarket::allocate_task
{ "task_id": u64 }

TaskMarket::submit_result
{ "task_id": u64, "agent_id": u64, "result_hash": "0x...32bytes", "proof": "optional bytes" }
```

Payloads are capped at 4 KiB in the outbox layer and request bodies at 1 MiB via `RequestBodyLimitLayer`.

## Status / constraints

- `status` enum: `pending | failed | finalized | dead`
- `retry_count` increments on each attempt; after 5 failures the row is marked `dead`.
- `last_error` truncated to 512 chars; payload stored as text with length checks enforced in migrations and code.

## Running integration tests (optional)

Requires a running dev node and Postgres:
```
CHAIN_WS_URL=ws://127.0.0.1:9944 DATABASE_URL=postgresql://ainur:ainur@localhost:5433/ainur \
  cargo test -p ainur-orchestrator-api --features "postgres,chain-bridge" -- --ignored
```
