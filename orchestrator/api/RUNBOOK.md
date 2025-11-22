# Orchestrator + Outbox Runbook

This doc is a lightweight guide to run the Ainur orchestrator API + chain bridge on a server (e.g., DigitalOcean droplet) with Postgres and a Temporal dev node/testnet.

## Prereqs
- Rust toolchain installed.
- Postgres running and reachable.
- Temporal node (dev or testnet) reachable via WS (`CHAIN_WS_URL`).

## Env vars
- `DATABASE_URL` (required): e.g., `postgresql://ainur:ainur@localhost:5433/ainur`
- `CHAIN_WS_URL` (required for chain bridge): e.g., `ws://127.0.0.1:9944` or testnet wss.
- `OUTBOX_POLL_MS` (optional, default 500)
- `METRICS_BIND` (optional): e.g., `0.0.0.0:9000` to expose `/metrics` in Prometheus text format.
- `BACKFILL_INTERVAL_MS` (optional, default 10000)
- `BIND_ADDR` (optional, default `127.0.0.1:8080`)

## Migrations
```
DATABASE_URL=... cargo sqlx migrate run -p ainur-orchestrator-api --features postgres
```

## Run (local/dev)
```
CHAIN_WS_URL=ws://127.0.0.1:9944 \
DATABASE_URL=postgresql://ainur:ainur@localhost:5433/ainur \
OUTBOX_POLL_MS=500 \
METRICS_BIND=0.0.0.0:9000 \
cargo run -p ainur-orchestrator-api --features "postgres,chain-bridge"
```
Metrics will be on `/metrics` (Prometheus text format).

## Systemd unit (example)
Save to `/etc/systemd/system/ainur-orchestrator.service`:
```
[Unit]
Description=Ainur Orchestrator API
After=network-online.target
Wants=network-online.target

[Service]
Environment=DATABASE_URL=postgresql://ainur:ainur@localhost:5433/ainur
Environment=CHAIN_WS_URL=ws://127.0.0.1:9944
Environment=OUTBOX_POLL_MS=500
Environment=BACKFILL_INTERVAL_MS=10000
Environment=METRICS_BIND=127.0.0.1:9000
Environment=BIND_ADDR=127.0.0.1:8080
WorkingDirectory=/opt/ainur-network
ExecStart=/usr/bin/env cargo run -p ainur-orchestrator-api --features postgres,chain-bridge
Restart=always
RestartSec=5
User=ainur
Group=ainur

[Install]
WantedBy=multi-user.target
```
Then:
```
sudo systemctl daemon-reload
sudo systemctl enable --now ainur-orchestrator.service
```

## Health and metrics
- Health: `GET /health`
- Outbox status: `GET /v1/outbox`, `GET /v1/outbox/:correlation_id`
- Metrics: `GET /metrics` (Prometheus format) if `METRICS_BIND` is set.

## Tests (against live node + Postgres)
```
CHAIN_WS_URL=ws://127.0.0.1:9944 \
DATABASE_URL=postgresql://ainur:ainur@localhost:5433/ainur \
cargo test -p ainur-orchestrator-api --features "postgres,chain-bridge" -- --ignored
```
