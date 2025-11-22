#![cfg(feature = "chain-bridge")]

use std::sync::Arc;

use tracing::{debug, info, warn};

use crate::error::ApiError;
use crate::model::{StoredBid, StoredResult};
use crate::storage::{ChainEventSink, Storage};
use ainur_core::{AgentId, Bid, ExecutionProof, ResourceUsage, TaskId, TaskResult};
use hex::ToHex;
use metrics::{counter, histogram};
use serde_json::json;
use std::str::FromStr;
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::Duration;
use std::time::Instant;
use subxt::utils::{AccountId32, MultiAddress};
use subxt_signer::sr25519;
use uuid::Uuid;
#[cfg(feature = "postgres")]
use {
    sqlx::{Pool, Postgres, Row},
    tokio::time::sleep,
};

static OUTBOX_SUBMITTED: AtomicU64 = AtomicU64::new(0);
static OUTBOX_FAILED: AtomicU64 = AtomicU64::new(0);
static OUTBOX_DEAD: AtomicU64 = AtomicU64::new(0);
static OUTBOX_RETRIED: AtomicU64 = AtomicU64::new(0);

/// Lightweight chain replay worker that connects to the Temporal chain via Subxt,
/// mirrors events into durable storage, and maintains a cursor for idempotent replay.
pub async fn run_chain_replay(
    ws_url: String,
    metadata_path: Option<String>,
    _storage: Arc<dyn Storage>,
    sink: Arc<dyn ChainEventSink>,
    #[cfg(feature = "postgres")] pg_pool: Option<Pool<Postgres>>,
) -> Result<(), ApiError> {
    if let Some(path) = metadata_path {
        info!("CHAIN_METADATA_PATH provided ({}); static metadata loading not yet wired, using live metadata from node", path);
    }

    loop {
        let client =
            match subxt::OnlineClient::<subxt::config::SubstrateConfig>::from_url(ws_url.clone())
                .await
            {
                Ok(c) => c,
                Err(err) => {
                    warn!("chain replay: connect failed: {err}; retrying in 3s");
                    tokio::time::sleep(Duration::from_secs(3)).await;
                    continue;
                }
            };

        info!("chain replay worker connected to {}", ws_url);

        let mut blocks = match client.blocks().subscribe_finalized().await {
            Ok(b) => b,
            Err(err) => {
                warn!("chain replay: subscribe failed: {err}; retrying");
                continue;
            }
        };

        let mut last_cursor = sink.last_chain_cursor().await?.unwrap_or((0, 0));

        while let Some(block) = blocks.next().await {
            let block = match block {
                Ok(b) => b,
                Err(err) => {
                    warn!("block subscription error: {err}; reconnecting");
                    break;
                }
            };

            let block_number_u32 = block.number();
            let block_number = block_number_u32 as u64;
            // Skip already processed blocks/events based on cursor.
            let mut max_cursor = last_cursor;

            let events = match block.events().await {
                Ok(evts) => evts,
                Err(err) => {
                    warn!("failed to fetch events for block {block_number}: {err}");
                    continue;
                }
            };

            let mut iter = events.iter();
            while let Some(event) = iter.next() {
                let event = match event {
                    Ok(ev) => ev,
                    Err(err) => {
                        warn!("failed to decode event in block {block_number}: {err}");
                        continue;
                    }
                };

                let pallet = event.pallet_name().to_string();
                let variant = event.variant_name().to_string();
                let idx = event.index();

                // Cursor skip logic
                if block_number < last_cursor.0
                    || (block_number == last_cursor.0 && (idx as u32) <= last_cursor.1)
                {
                    continue;
                }

                let supported = is_supported(&pallet, &variant);
                if !supported {
                    continue;
                }
                let payload = match event.field_values() {
                    Ok(values) => format!("{values:?}"),
                    Err(_) => "<undecodable>".to_string(),
                };
                let correlation = match event.phase() {
                    subxt::events::Phase::ApplyExtrinsic(ex_idx) => {
                        match block.extrinsics().await {
                            Ok(extrs) => extrs
                                .iter()
                                .enumerate()
                                .find(|(i, _)| *i == ex_idx as usize)
                                .map(|(_, ex)| format!("0x{}", hex::encode(ex.hash().as_ref()))),
                            Err(err) => {
                                warn!("failed to fetch extrinsics for block {block_number}: {err}");
                                None
                            }
                        }
                    }
                    _ => None,
                };
                #[cfg(feature = "postgres")]
                if let Some(pool) = &pg_pool {
                    if pallet == "AgentRegistry" && variant == "AgentRegistered" {
                        if let Ok(Some(ev)) = event
                        .as_event::<temporal_bindings::api::agent_registry::events::AgentRegistered>()
                    {
                        let did = format!("did:ainur:{}", ev.agent_id);
                        let account_address = format!("{}", ev.owner);
                        let label = did.clone();
                        let _ = sqlx::query(
                            r#"
                            INSERT INTO agents (id, label, chain_agent_id, account_address)
                            VALUES ($1, $2, $3, $4)
                            ON CONFLICT (id) DO UPDATE
                            SET chain_agent_id = EXCLUDED.chain_agent_id,
                                account_address = EXCLUDED.account_address,
                                label = EXCLUDED.label,
                                updated_at = now()
                            "#,
                        )
                        .bind(&did)
                        .bind(&label)
                        .bind(ev.agent_id as i64)
                        .bind(&account_address)
                        .execute(pool)
                        .await;

                        if let Some(ref corr) = correlation {
                            let _ = sqlx::query(
                                r#"
                                UPDATE outbound_extrinsics
                                SET chain_agent_id = $2, status = 'finalized'
                                WHERE tx_hash = $1
                                "#,
                            )
                            .bind(corr)
                            .bind(ev.agent_id as i64)
                            .execute(pool)
                            .await;
                        }

                        // Also try to backfill any agent rows that match by account_address but have no chain id.
                        let _ = sqlx::query(
                            r#"
                            UPDATE agents
                            SET chain_agent_id = $1, updated_at = now()
                            WHERE account_address = $2 AND chain_agent_id IS NULL
                            "#,
                        )
                        .bind(ev.agent_id as i64)
                        .bind(&account_address)
                        .execute(pool)
                        .await;
                    }
                    } else if pallet == "TaskMarket" && variant == "TaskCreated" {
                        if let Ok(Some(ev)) =
                        event.as_event::<temporal_bindings::api::task_market::events::TaskCreated>()
                    {
                        // Build a stub task entry so chain tasks are visible via API.
                        let chain_task_id = ev.task_id as i64;
                        let requester_did = format!("did:ainur:{}", ev.requester);
                        let description = format!("chain task {}", ev.task_id);
                        let generated_id = uuid::Uuid::new_v4().to_string();
                        let created_at = chrono::Utc::now().timestamp() as i64;
                        let stored_json = serde_json::json!({
                            "id": generated_id,
                            "client_task_id": null,
                            "task": {
                                "requester": requester_did,
                                "specification": {
                                    "description": description,
                                    "task_type": { "custom": "chain" },
                                    "input": [],
                                    "output_format": "binary",
                                    "metadata": []
                                },
                                "budget": { "max_cost": ev.budget as u128, "currency": null },
                                "requirements": {
                                    "capabilities": [],
                                    "verification": "unknown",
                                    "deadline": 0,
                                    "trust": null
                                },
                                "deadline": 0
                            },
                            "status": "pending",
                            "created_at": created_at
                        });
                        let _ = sqlx::query(
                            r#"
                            INSERT INTO tasks (id, client_task_id, requester_id, description, task_type, input_base64, max_budget, deadline, status, created_at, updated_at, stored_json, chain_task_id)
                            VALUES ($1, NULL, $2, $3, $4, $5, $6, to_timestamp($7), $8, to_timestamp($9), to_timestamp($10), $11, $12)
                            ON CONFLICT (chain_task_id) DO UPDATE SET
                                requester_id = EXCLUDED.requester_id,
                                description = EXCLUDED.description,
                                status = EXCLUDED.status,
                                updated_at = now(),
                                stored_json = EXCLUDED.stored_json
                            "#,
                        )
                        .bind(&generated_id)
                        .bind(requester_did.as_bytes())
                        .bind(&description)
                        .bind("chain")
                        .bind("")
                        .bind(ev.budget as i64)
                        .bind(0_i64)
                        .bind("pending")
                        .bind(created_at)
                        .bind(created_at)
                        .bind(stored_json)
                        .bind(chain_task_id)
                        .execute(pool)
                        .await;

                        if let Some(ref corr) = correlation {
                            let _ = sqlx::query(
                                r#"
                                UPDATE outbound_extrinsics
                                SET chain_task_id = $2, status = 'finalized'
                                WHERE tx_hash = $1
                                "#,
                            )
                            .bind(corr)
                            .bind(chain_task_id)
                            .execute(pool)
                            .await;
                        }

                        // Try to backfill an existing task that was created via API but lacks chain_task_id.
                        let _ = sqlx::query(
                            r#"
                            UPDATE tasks
                            SET chain_task_id = $1, updated_at = now()
                            WHERE chain_task_id IS NULL
                            ORDER BY created_at ASC
                            LIMIT 1
                            "#,
                        )
                        .bind(chain_task_id)
                        .execute(pool)
                        .await;

                        let _ = patch_pending_with_ids(pool, Some(chain_task_id), None).await;
                    }
                    } else if pallet == "TaskMarket" && variant == "BidSubmitted" {
                        if let Ok(Some(ev)) = event
                        .as_event::<temporal_bindings::api::task_market::events::BidSubmitted>(
                    ) {
                        if let Ok(Some(task_row)) =
                            sqlx::query("SELECT id FROM tasks WHERE chain_task_id = $1 LIMIT 1")
                                .bind(ev.task_id as i64)
                                .fetch_optional(pool)
                                .await
                        {
                            let task_uuid: String = task_row.get("id");
                            let did = sqlx::query(
                                "SELECT id FROM agents WHERE chain_agent_id = $1 LIMIT 1",
                            )
                            .bind(ev.agent_id as i64)
                            .fetch_optional(pool)
                            .await
                            .ok()
                            .flatten()
                            .map(|row| row.get::<String, _>("id"))
                            .unwrap_or_else(|| format!("did:ainur:{}", ev.agent_id));
                            let agent_bytes = agent_bytes_from_chain_id(ev.agent_id);
                            let agent_id = AgentId::new(agent_bytes);
                            let stored = StoredBid {
                                id: Uuid::new_v4().to_string(),
                                task_id: task_uuid.clone(),
                                agent_id: did.clone(),
                                bid: Bid {
                                    agent_id,
                                    task_id: TaskId::new([0u8; 32]),
                                    value: 0,
                                    quality_score: 0,
                                    completion_time: 0,
                                    guarantees: Vec::new(),
                                },
                                created_at: block_number.into(),
                            };
                            let stored_json =
                                serde_json::to_value(&stored).unwrap_or_else(|_| json!({}));
                            let _ = sqlx::query(
                                r#"
                                INSERT INTO bids (id, task_id, agent_id, value, quality_score, completion_time, created_at, stored_json)
                                VALUES ($1, $2, $3, $4, $5, $6, to_timestamp($7), $8)
                                ON CONFLICT DO NOTHING
                                "#,
                            )
                            .bind(&stored.id)
                            .bind(&task_uuid)
                            .bind(agent_bytes.as_slice())
                            .bind(0_i64)
                            .bind(0_i32)
                            .bind(0_i64)
                            .bind(block_number as i64)
                            .bind(stored_json)
                            .execute(pool)
                            .await;

                            if let Some(ref corr) = correlation {
                                let _ = sqlx::query(
                                    r#"
                                UPDATE outbound_extrinsics
                                SET chain_task_id = $2, chain_agent_id = $3, status = 'finalized'
                                    WHERE tx_hash = $1
                                    "#,
                                )
                                .bind(corr)
                                .bind(ev.task_id as i64)
                                .bind(ev.agent_id as i64)
                                .execute(pool)
                                .await;
                            }
                        }
                    }
                    } else if pallet == "TaskMarket" && variant == "TaskCompleted" {
                        if let Ok(Some(ev)) = event
                        .as_event::<temporal_bindings::api::task_market::events::TaskCompleted>(
                    ) {
                        let result_hash = ev.result_hash.encode_hex::<String>();
                        if let Ok(Some(task_row)) =
                            sqlx::query("SELECT id FROM tasks WHERE chain_task_id = $1 LIMIT 1")
                                .bind(ev.task_id as i64)
                                .fetch_optional(pool)
                                .await
                        {
                            let task_uuid: String = task_row.get("id");
                            let agent_bytes = agent_bytes_from_chain_id(ev.agent_id);
                            let agent_id = AgentId::new(agent_bytes);
                            let stored = StoredResult {
                                id: Uuid::new_v4().to_string(),
                                task_id: task_uuid.clone(),
                                agent_id: format!("did:ainur:{}", ev.agent_id),
                                result: TaskResult {
                                    task_id: TaskId::new([0u8; 32]),
                                    executor: agent_id,
                                    output: Vec::new(),
                                    proof: Some(ExecutionProof::None),
                                    resources_used: ResourceUsage {
                                        cpu_time_ms: 0,
                                        memory_bytes: 0,
                                        storage_bytes: 0,
                                        bandwidth_bytes: 0,
                                        gpu_time_ms: None,
                                    },
                                    completed_at: block_number.into(),
                                },
                                created_at: block_number.into(),
                            };
                            let stored_json =
                                serde_json::to_value(&stored).unwrap_or_else(|_| json!({}));
                            let _ = sqlx::query(
                                r#"
                                INSERT INTO results (id, task_id, agent_id, output_base64, completed_at, proof, stored_json, chain_task_id, created_at)
                                VALUES ($1, $2, $3, $4, to_timestamp($5), $6, $7, $8, now())
                                ON CONFLICT (task_id) DO UPDATE SET
                                    output_base64 = EXCLUDED.output_base64,
                                    completed_at = EXCLUDED.completed_at,
                                    stored_json = EXCLUDED.stored_json,
                                    updated_at = now()
                                "#,
                            )
                            .bind(&stored.id)
                            .bind(&task_uuid)
                            .bind(agent_bytes.as_slice())
                            .bind("")
                            .bind(block_number as i64)
                            .bind(None::<Vec<u8>>)
                            .bind(stored_json)
                            .bind(ev.task_id as i64)
                            .execute(pool)
                            .await;

                            let _ = sqlx::query(
                                r#"
                                UPDATE tasks
                                SET status = 'completed', result_hash = $2, updated_at = now()
                                WHERE chain_task_id = $1
                                "#,
                            )
                            .bind(ev.task_id as i64)
                            .bind(result_hash)
                            .execute(pool)
                            .await;

                            if let Some(ref corr) = correlation {
                                let _ = sqlx::query(
                                    r#"
                                    UPDATE outbound_extrinsics
                                    SET chain_task_id = $2, chain_agent_id = $3, status = 'finalized'
                                    WHERE tx_hash = $1
                                    "#,
                                )
                                .bind(corr)
                                .bind(ev.task_id as i64)
                                .bind(ev.agent_id as i64)
                                .execute(pool)
                                .await;
                            }

                            let _ = patch_pending_with_ids(
                                pool,
                                Some(ev.task_id as i64),
                                Some(ev.agent_id as i64),
                            )
                            .await;
                        }
                    }
                    } else if pallet == "TaskMarket" && variant == "TaskMatched" {
                        let (task_id_opt, agent_id_opt) = extract_two_u64(&payload);
                        if let (Some(task_id), Some(agent_id)) = (task_id_opt, agent_id_opt) {
                            let _ = sqlx::query(
                                r#"
                            UPDATE tasks
                            SET status = 'pending', matched_agent = $2, updated_at = now()
                            WHERE chain_task_id = $1
                            "#,
                            )
                            .bind(task_id as i64)
                            .bind(agent_id as i64)
                            .execute(pool)
                            .await;

                            let _ = patch_pending_with_ids(
                                pool,
                                Some(task_id as i64),
                                Some(agent_id as i64),
                            )
                            .await;
                        }
                    }
                }
                sink.record_chain_event(
                    block_number.into(),
                    idx,
                    &pallet,
                    &variant,
                    &payload,
                    correlation.as_deref(),
                )
                .await?;

                max_cursor = (block_number.into(), idx);
            }

            if max_cursor.0 > last_cursor.0
                || (max_cursor.0 == last_cursor.0 && max_cursor.1 > last_cursor.1)
            {
                sink.update_chain_cursor(max_cursor.0, max_cursor.1).await?;
                last_cursor = max_cursor;
                debug!("ingested block {block_number}, cursor={:?}", last_cursor);
            }
        }

        // reconnect loop
    }
}

/// Record an outbound extrinsic intent for correlation. This does not yet
/// submit to the chain; it tracks the correlation_id for later status updates.
pub async fn record_outbound_extrinsic(
    sink: Arc<dyn ChainEventSink>,
    correlation_id: &str,
    pallet: &str,
    call: &str,
    payload: Option<&str>,
) -> Result<(), ApiError> {
    sink.record_outbound_extrinsic(correlation_id, pallet, call, payload, "pending")
        .await
}

/// Validate an outbound extrinsic payload without submitting it to the chain.
pub fn validate_outbox_payload(
    pallet: &str,
    call: &str,
    payload: Option<&str>,
) -> Result<(), ApiError> {
    decode_payload(pallet, call, payload).map_err(ApiError::BadRequest)
}

/// Minimal outbox worker that scans the `outbound_extrinsics` table and attempts
/// to push entries toward the chain. For now this marks rows as failed with a
/// clear error until dynamic extrinsic submission is wired.
#[cfg(feature = "postgres")]
pub async fn run_outbox(
    ws_url: String,
    metadata_path: Option<String>,
    pool: Pool<Postgres>,
    poll_ms: u64,
) -> Result<(), ApiError> {
    const MAX_RETRIES: i32 = 5;
    const BACKOFF_BASE_MS: u64 = 200;

    if let Some(path) = metadata_path {
        info!("CHAIN_METADATA_PATH provided ({}); static metadata loading not yet wired, using live metadata from node", path);
    }

    let signer = sr25519::dev::alice();
    let mut client = connect_client(&ws_url).await?;
    info!("chain outbox worker connected to {}", ws_url);

    loop {
        let mut tx = pool
            .begin()
            .await
            .map_err(|e| ApiError::Internal(format!("outbox: failed to open transaction: {e}")))?;

        let job = sqlx::query(
            r#"
                SELECT correlation_id, pallet, call, payload, retry_count
                FROM outbound_extrinsics
                WHERE status = 'pending'
                ORDER BY created_at ASC
                FOR UPDATE SKIP LOCKED
                LIMIT 1
            "#,
        )
        .fetch_optional(&mut *tx)
        .await
        .map_err(|e| ApiError::Internal(format!("outbox: failed to fetch job: {e}")))?;

        let Some(job) = job else {
            tx.commit()
                .await
                .map_err(|e| ApiError::Internal(format!("outbox: commit failed: {e}")))?;
            sleep(Duration::from_millis(poll_ms)).await;
            continue;
        };

        let correlation_id: String = job.get("correlation_id");
        let pallet: String = job.get("pallet");
        let call: String = job.get("call");
        let payload: Option<String> = job.get("payload");
        let retry_count: i32 = job.get("retry_count");

        let start = Instant::now();
        let submit_result =
            submit_extrinsic(&client, &signer, &pallet, &call, payload.as_deref()).await;
        let elapsed = start.elapsed();
        histogram!("outbox_submit_ms").record(elapsed.as_secs_f64() * 1000.0);
        let _tx_hash = submit_result.as_ref().ok().map(|h| h.clone());
        let was_err = submit_result.is_err();

        match submit_result {
            Ok(hash) => {
                OUTBOX_SUBMITTED.fetch_add(1, Ordering::Relaxed);
                counter!("outbox_submitted_total").increment(1);
                sqlx::query(
                    r#"
                    UPDATE outbound_extrinsics
                    SET status = 'finalized', retry_count = COALESCE(retry_count,0) + 1, last_error = NULL, processed_at = now(), tx_hash = $2
                    WHERE correlation_id = $1
                    "#,
                )
                .bind(&correlation_id)
                .bind(hash)
                .execute(&mut *tx)
                .await
                .map_err(|e| ApiError::Internal(format!("outbox: failed to update job: {e}")))?;
                info!(target: "outbox", %correlation_id, %pallet, %call, "submitted extrinsic");
            }
            Err(err) => {
                if is_connection_err(&err) {
                    // rollback transaction and reconnect, leave job pending
                    tx.rollback()
                        .await
                        .map_err(|e| ApiError::Internal(format!("outbox: rollback failed: {e}")))?;
                    warn!(target: "outbox", "connection error, reconnecting ws and retrying later: {err}");
                    client = connect_client(&ws_url).await?;
                    tokio::time::sleep(Duration::from_millis(poll_ms)).await;
                    continue;
                }
                let err = {
                    let mut s = err;
                    const MAX_ERR: usize = 512;
                    if s.len() > MAX_ERR {
                        s.truncate(MAX_ERR);
                    }
                    s
                };
                let next_status = if retry_count + 1 > MAX_RETRIES {
                    "dead"
                } else {
                    "failed"
                };
                if next_status == "dead" {
                    OUTBOX_DEAD.fetch_add(1, Ordering::Relaxed);
                    counter!("outbox_dead_total").increment(1);
                } else {
                    OUTBOX_FAILED.fetch_add(1, Ordering::Relaxed);
                    counter!("outbox_failed_total").increment(1);
                }
                OUTBOX_RETRIED.fetch_add(1, Ordering::Relaxed);
                counter!("outbox_retried_total").increment(1);
                sqlx::query(
                    r#"
                    UPDATE outbound_extrinsics
                    SET status = $3, retry_count = COALESCE(retry_count,0) + 1, last_error = $2, processed_at = now()
                    WHERE correlation_id = $1
                    "#,
                )
                .bind(&correlation_id)
                .bind(err)
                .bind(next_status)
                .execute(&mut *tx)
                .await
                .map_err(|e| ApiError::Internal(format!("outbox: failed to update job: {e}")))?;
                warn!(target: "outbox", %correlation_id, %pallet, %call, retry = retry_count + 1, "extrinsic failed");
            }
        }

        tx.commit()
            .await
            .map_err(|e| ApiError::Internal(format!("outbox: commit failed: {e}")))?;

        if was_err {
            let backoff = BACKOFF_BASE_MS.saturating_mul((retry_count + 1) as u64);
            sleep(Duration::from_millis(backoff.min(5_000))).await;
        } else {
            sleep(Duration::from_millis(poll_ms)).await;
        }

        info!(
            target: "outbox",
            submitted = OUTBOX_SUBMITTED.load(Ordering::Relaxed),
            failed = OUTBOX_FAILED.load(Ordering::Relaxed),
            dead = OUTBOX_DEAD.load(Ordering::Relaxed),
            retried = OUTBOX_RETRIED.load(Ordering::Relaxed),
            "outbox metrics"
        );
    }
}

/// Best-effort backfill: inspect chain_events by correlation_id and fill missing chain ids in outbound_extrinsics.
#[cfg(feature = "postgres")]
pub async fn run_outbox_backfill(pool: Pool<Postgres>, interval_ms: u64) -> Result<(), ApiError> {
    loop {
        if let Err(err) = backfill_once(&pool).await {
            warn!("backfill iteration failed: {err}");
        }
        sleep(Duration::from_millis(interval_ms)).await;
    }
}

#[cfg(feature = "postgres")]
async fn backfill_once(pool: &Pool<Postgres>) -> Result<(), ApiError> {
    // Find finalized or failed extrinsics that still lack chain ids but have a correlation_id or tx_hash.
    let rows = sqlx::query(
        r#"
        SELECT correlation_id
        FROM outbound_extrinsics
        WHERE correlation_id IS NOT NULL
          AND (chain_task_id IS NULL OR chain_agent_id IS NULL)
          AND status IN ('pending','failed','finalized')
        UNION
        SELECT tx_hash as correlation_id
        FROM outbound_extrinsics
        WHERE tx_hash IS NOT NULL
          AND (chain_task_id IS NULL OR chain_agent_id IS NULL)
          AND status IN ('pending','failed','finalized')
        LIMIT 50
        "#,
    )
    .fetch_all(pool)
    .await
    .map_err(|e| ApiError::Internal(format!("backfill query failed: {e}")))?;

    for row in rows {
        let corr: String = row.get("correlation_id");
        // Look for matching chain_events to extract ids.
        let events = sqlx::query(
            r#"
            SELECT pallet, variant, payload
            FROM chain_events
            WHERE correlation_id = $1
            ORDER BY block_number DESC, event_index DESC
            "#,
        )
        .bind(&corr)
        .fetch_all(pool)
        .await
        .map_err(|e| ApiError::Internal(format!("backfill chain_events failed: {e}")))?;

        for ev in events {
            let pallet: String = ev.get("pallet");
            let variant: String = ev.get("variant");
            let payload: String = ev.get("payload");
            if pallet == "AgentRegistry" && variant == "AgentRegistered" {
                if let Some(agent_id) = extract_first_u64(&payload) {
                    let _ = sqlx::query(
                        "UPDATE outbound_extrinsics SET chain_agent_id = $2 WHERE correlation_id = $1 AND chain_agent_id IS NULL",
                    )
                    .bind(&corr)
                    .bind(agent_id as i64)
                    .execute(pool)
                    .await;
                }
            } else if pallet == "TaskMarket" && variant == "TaskCreated" {
                if let Some(task_id) = extract_first_u64(&payload) {
                    let _ = sqlx::query(
                        "UPDATE outbound_extrinsics SET chain_task_id = $2 WHERE correlation_id = $1 AND chain_task_id IS NULL",
                    )
                    .bind(&corr)
                    .bind(task_id as i64)
                    .execute(pool)
                    .await;
                }
            } else if pallet == "TaskMarket" && variant == "BidSubmitted" {
                if let Some(task_id) = extract_first_u64(&payload) {
                    let _ = sqlx::query(
                        "UPDATE outbound_extrinsics SET chain_task_id = COALESCE(chain_task_id,$2) WHERE correlation_id = $1",
                    )
                    .bind(&corr)
                    .bind(task_id as i64)
                    .execute(pool)
                    .await;
                }
            } else if pallet == "TaskMarket" && variant == "TaskCompleted" {
                if let Some(task_id) = extract_first_u64(&payload) {
                    let _ = sqlx::query(
                        "UPDATE outbound_extrinsics SET chain_task_id = COALESCE(chain_task_id,$2) WHERE correlation_id = $1",
                    )
                    .bind(&corr)
                    .bind(task_id as i64)
                    .execute(pool)
                    .await;
                }
            }
        }
    }
    Ok(())
}

fn extract_first_u64(payload: &str) -> Option<u64> {
    let trimmed = payload.trim().trim_start_matches('[').trim_end_matches(']');
    let first = trimmed.split(',').next()?.trim();
    first.parse::<u64>().ok()
}

fn extract_two_u64(payload: &str) -> (Option<u64>, Option<u64>) {
    let trimmed = payload.trim().trim_start_matches('[').trim_end_matches(']');
    let mut parts = trimmed.split(',').map(|s| s.trim());
    let first = parts.next().and_then(|v| v.parse::<u64>().ok());
    let second = parts.next().and_then(|v| v.parse::<u64>().ok());
    (first, second)
}

fn is_connection_err(err: &str) -> bool {
    err.contains("disconnect") || err.contains("Connection") || err.contains("closed")
}

#[cfg(feature = "postgres")]
async fn connect_client(
    ws_url: &str,
) -> Result<subxt::OnlineClient<subxt::config::SubstrateConfig>, ApiError> {
    loop {
        match subxt::OnlineClient::<subxt::config::SubstrateConfig>::from_url(ws_url).await {
            Ok(c) => return Ok(c),
            Err(err) => {
                warn!("outbox: connect failed: {err}; retrying in 3s");
                tokio::time::sleep(Duration::from_secs(3)).await;
            }
        }
    }
}

/// Patch pending extrinsics payloads once real chain ids are known.
#[cfg(feature = "postgres")]
async fn patch_pending_with_ids(
    pool: &Pool<Postgres>,
    chain_task_id: Option<i64>,
    chain_agent_id: Option<i64>,
) -> Result<(), ApiError> {
    if let Some(tid) = chain_task_id {
        let _ = sqlx::query(
            r#"
            UPDATE outbound_extrinsics
            SET payload = jsonb_set(payload::jsonb, '{task_id}', to_jsonb($2::bigint))::text
            WHERE status = 'pending'
              AND payload::jsonb ? 'task_id'
              AND (payload::jsonb ->> 'task_id')::bigint = 0
        "#,
        )
        .bind(tid)
        .execute(pool)
        .await;
    }
    if let Some(aid) = chain_agent_id {
        let _ = sqlx::query(
            r#"
            UPDATE outbound_extrinsics
            SET payload = jsonb_set(payload::jsonb, '{agent_id}', to_jsonb($2::bigint))::text
            WHERE status = 'pending'
              AND payload::jsonb ? 'agent_id'
              AND (payload::jsonb ->> 'agent_id')::bigint = 0
        "#,
        )
        .bind(aid)
        .execute(pool)
        .await;
    }
    Ok(())
}

fn is_supported(pallet: &str, variant: &str) -> bool {
    matches!(
        (pallet, variant),
        ("AgentRegistry", "AgentRegistered")
            | ("AgentRegistry", "AgentUpdated")
            | ("AgentRegistry", "AgentRetired")
            | ("AgentRegistry", "AgentStatusForced")
            | ("TaskMarket", "TaskCreated")
            | ("TaskMarket", "BidSubmitted")
            | ("TaskMarket", "BidRevealed")
            | ("TaskMarket", "TaskAllocated")
            | ("TaskMarket", "TaskCompleted")
            | ("TaskMarket", "TaskFailed")
            | ("Commitments", "CommitmentProposed")
            | ("Commitments", "CommitmentSigned")
            | ("Commitments", "CommitmentFinalized")
            | ("Commitments", "CommitmentDisputed")
            | ("Commitments", "CommitmentCancelled")
    )
}

fn agent_bytes_from_chain_id(id: u64) -> [u8; 32] {
    let mut out = [0u8; 32];
    out[..8].copy_from_slice(&id.to_le_bytes());
    out
}

async fn submit_extrinsic(
    client: &subxt::OnlineClient<subxt::config::SubstrateConfig>,
    signer: &sr25519::Keypair,
    pallet: &str,
    call: &str,
    payload: Option<&str>,
) -> Result<String, String> {
    use temporal_bindings::api;
    use temporal_bindings::api::runtime_types::bounded_collections::bounded_vec::BoundedVec;
    let payload_val: serde_json::Value = if let Some(p) = payload {
        serde_json::from_str(p).map_err(|e| format!("payload json decode: {e}"))?
    } else {
        serde_json::json!({})
    };

    // Validate field presence/shape before attempting submission.
    decode_payload(pallet, call, payload)?;

    match (pallet, call) {
        ("AgentRegistry", "register_agent") => {
            let did_b64 = payload_val
                .get("did")
                .and_then(|v| v.as_str())
                .ok_or("missing did")?;
            let did_bytes = BoundedVec(did_b64.as_bytes().to_vec());
            let caps_vec: Vec<BoundedVec<u8>> = payload_val
                .get("capabilities")
                .and_then(|v| v.as_array())
                .ok_or("missing capabilities")?
                .iter()
                .map(|c| BoundedVec(c.as_str().unwrap_or_default().as_bytes().to_vec()))
                .collect();
            let caps = BoundedVec(caps_vec);
            let metadata = payload_val
                .get("metadata")
                .and_then(|v| v.as_str())
                .map(|s| BoundedVec(s.as_bytes().to_vec()));
            let attestation = payload_val
                .get("attestation")
                .and_then(|v| v.as_str())
                .map(|s| BoundedVec(s.as_bytes().to_vec()));
            let verification = parse_verification(payload_val.get("verification_level"))?;
            let tx = api::tx().agent_registry().register_agent(
                did_bytes,
                caps,
                metadata,
                attestation,
                verification,
            );
            let progress = client
                .tx()
                .sign_and_submit_then_watch_default(&tx, signer)
                .await
                .map_err(|e| format!("submit: {e}"))?;
            let tx_hash = format!("0x{}", hex::encode(progress.extrinsic_hash().as_ref()));
            progress
                .wait_for_finalized_success()
                .await
                .map_err(|e| format!("finalize: {e}"))?;
            Ok(tx_hash)
        }
        ("TaskMarket", "create_task") => {
            let spec_hash = hex_to_32(payload_val.get("spec_hash"))?;
            let budget = payload_val
                .get("budget")
                .and_then(|v| v.as_u64())
                .ok_or("missing budget")? as u128;
            let deadline = payload_val
                .get("deadline")
                .and_then(|v| v.as_u64())
                .ok_or("missing deadline")? as u32;
            let verification = parse_verification(payload_val.get("verification_level"))?;
            let tx = api::tx()
                .task_market()
                .create_task(spec_hash, budget, deadline, verification);
            let progress = client
                .tx()
                .sign_and_submit_then_watch_default(&tx, signer)
                .await
                .map_err(|e| format!("submit: {e}"))?;
            let tx_hash = format!("0x{}", hex::encode(progress.extrinsic_hash().as_ref()));
            progress
                .wait_for_finalized_success()
                .await
                .map_err(|e| format!("finalize: {e}"))?;
            Ok(tx_hash)
        }
        ("TaskMarket", "submit_bid") => {
            let task_id = payload_val
                .get("task_id")
                .and_then(|v| v.as_u64())
                .ok_or("missing task_id")?;
            let agent_id = payload_val
                .get("agent_id")
                .and_then(|v| v.as_u64())
                .ok_or("missing agent_id")?;
            let commitment = hex_to_32(payload_val.get("commitment"))?;
            let estimated_duration = payload_val
                .get("estimated_duration")
                .and_then(|v| v.as_u64())
                .ok_or("missing estimated_duration")? as u32;
            let tx = api::tx().task_market().submit_bid(
                task_id,
                agent_id,
                commitment,
                estimated_duration,
            );
            let progress = client
                .tx()
                .sign_and_submit_then_watch_default(&tx, signer)
                .await
                .map_err(|e| format!("submit: {e}"))?;
            let tx_hash = format!("0x{}", hex::encode(progress.extrinsic_hash().as_ref()));
            progress
                .wait_for_finalized_success()
                .await
                .map_err(|e| format!("finalize: {e}"))?;
            Ok(tx_hash)
        }
        ("TaskMarket", "reveal_bid") => {
            let task_id = payload_val
                .get("task_id")
                .and_then(|v| v.as_u64())
                .ok_or("missing task_id")?;
            let agent_id = payload_val
                .get("agent_id")
                .and_then(|v| v.as_u64())
                .ok_or("missing agent_id")?;
            let cost = payload_val
                .get("cost")
                .and_then(|v| v.as_u64())
                .ok_or("missing cost")? as u128;
            let nonce = hex_to_32(payload_val.get("nonce"))?;
            let tx = api::tx()
                .task_market()
                .reveal_bid(task_id, agent_id, cost, nonce);
            let progress = client
                .tx()
                .sign_and_submit_then_watch_default(&tx, signer)
                .await
                .map_err(|e| format!("submit: {e}"))?;
            let tx_hash = format!("0x{}", hex::encode(progress.extrinsic_hash().as_ref()));
            progress
                .wait_for_finalized_success()
                .await
                .map_err(|e| format!("finalize: {e}"))?;
            Ok(tx_hash)
        }
        ("TaskMarket", "allocate_task") => {
            let task_id = payload_val
                .get("task_id")
                .and_then(|v| v.as_u64())
                .ok_or("missing task_id")?;
            let tx = api::tx().task_market().allocate_task(task_id);
            let progress = client
                .tx()
                .sign_and_submit_then_watch_default(&tx, signer)
                .await
                .map_err(|e| format!("submit: {e}"))?;
            let tx_hash = format!("0x{}", hex::encode(progress.extrinsic_hash().as_ref()));
            progress
                .wait_for_finalized_success()
                .await
                .map_err(|e| format!("finalize: {e}"))?;
            Ok(tx_hash)
        }
        ("TaskMarket", "submit_result") => {
            let task_id = payload_val
                .get("task_id")
                .and_then(|v| v.as_u64())
                .ok_or("missing task_id")?;
            let agent_id = payload_val
                .get("agent_id")
                .and_then(|v| v.as_u64())
                .ok_or("missing agent_id")?;
            let result_hash = hex_to_32(payload_val.get("result_hash"))?;
            let proof_bytes = payload_val
                .get("proof")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .as_bytes()
                .to_vec();
            let tx = api::tx().task_market().submit_result(
                task_id,
                agent_id,
                result_hash,
                BoundedVec(proof_bytes),
            );
            let progress = client
                .tx()
                .sign_and_submit_then_watch_default(&tx, signer)
                .await
                .map_err(|e| format!("submit: {e}"))?;
            let tx_hash = format!("0x{}", hex::encode(progress.extrinsic_hash().as_ref()));
            progress
                .wait_for_finalized_success()
                .await
                .map_err(|e| format!("finalize: {e}"))?;
            Ok(tx_hash)
        }
        ("Balances", "transfer_allow_death") => {
            let dest = payload_val
                .get("address")
                .and_then(|v| v.as_str())
                .ok_or("missing address")?;
            let account =
                AccountId32::from_str(dest).map_err(|e| format!("invalid ss58 address: {e}"))?;
            let amount = payload_val
                .get("amount")
                .and_then(|v| v.as_u64())
                .ok_or("missing amount")? as u128;
            let tx = api::tx()
                .balances()
                .transfer_allow_death(MultiAddress::Id(account), amount);
            let progress = client
                .tx()
                .sign_and_submit_then_watch_default(&tx, signer)
                .await
                .map_err(|e| format!("submit: {e}"))?;
            let tx_hash = format!("0x{}", hex::encode(progress.extrinsic_hash().as_ref()));
            progress
                .wait_for_finalized_success()
                .await
                .map_err(|e| format!("finalize: {e}"))?;
            Ok(tx_hash)
        }
        _ => Err(format!("unsupported pallet/call: {pallet}::{call}")),
    }
}

fn decode_payload(pallet: &str, call: &str, payload: Option<&str>) -> Result<(), String> {
    let payload_val: serde_json::Value = if let Some(p) = payload {
        serde_json::from_str(p).map_err(|e| format!("payload json decode: {e}"))?
    } else {
        serde_json::json!({})
    };

    fn get_str(
        val: Option<&serde_json::Value>,
        key: &str,
        max_len: usize,
    ) -> Result<String, String> {
        let s = val
            .and_then(|v| v.as_str())
            .ok_or_else(|| format!("missing {key}"))?;
        if s.len() > max_len {
            return Err(format!("{key} exceeds {max_len} chars"));
        }
        Ok(s.to_string())
    }

    fn get_u64(val: Option<&serde_json::Value>, key: &str, max: u64) -> Result<u64, String> {
        let n = val
            .and_then(|v| v.as_u64())
            .ok_or_else(|| format!("missing {key}"))?;
        if n > max {
            return Err(format!("{key} exceeds max {max}"));
        }
        Ok(n)
    }

    match (pallet, call) {
        ("AgentRegistry", "register_agent") => {
            let _did = get_str(payload_val.get("did"), "did", 128)?;
            let caps = payload_val
                .get("capabilities")
                .and_then(|v| v.as_array())
                .ok_or("missing capabilities")?;
            for c in caps {
                if let Some(s) = c.as_str() {
                    if s.len() > 256 {
                        return Err("capability exceeds 256 chars".into());
                    }
                } else {
                    return Err("capabilities must be strings".into());
                }
            }
            if let Some(meta) = payload_val.get("metadata").and_then(|v| v.as_str()) {
                if meta.len() > 1024 {
                    return Err("metadata exceeds 1024 chars".into());
                }
            }
            let _ = parse_verification(payload_val.get("verification_level"))?;
            Ok(())
        }
        ("TaskMarket", "create_task") => {
            let _ = hex_to_32(payload_val.get("spec_hash"))?;
            let _ = get_u64(payload_val.get("budget"), "budget", u64::MAX);
            let _ = get_u64(payload_val.get("deadline"), "deadline", u32::MAX as u64);
            let _ = parse_verification(payload_val.get("verification_level"))?;
            Ok(())
        }
        ("TaskMarket", "submit_bid") => {
            let _ = get_u64(payload_val.get("task_id"), "task_id", u64::MAX);
            let _ = get_u64(payload_val.get("agent_id"), "agent_id", u64::MAX);
            let _ = hex_to_32(payload_val.get("commitment"))?;
            let _ = get_u64(
                payload_val.get("estimated_duration"),
                "estimated_duration",
                u32::MAX as u64,
            );
            Ok(())
        }
        ("TaskMarket", "reveal_bid") => {
            let _ = get_u64(payload_val.get("task_id"), "task_id", u64::MAX);
            let _ = get_u64(payload_val.get("agent_id"), "agent_id", u64::MAX);
            let _ = get_u64(payload_val.get("cost"), "cost", u64::MAX);
            let _ = hex_to_32(payload_val.get("nonce"))?;
            Ok(())
        }
        ("TaskMarket", "allocate_task") => {
            let _ = get_u64(payload_val.get("task_id"), "task_id", u64::MAX);
            Ok(())
        }
        ("TaskMarket", "submit_result") => {
            let _ = get_u64(payload_val.get("task_id"), "task_id", u64::MAX);
            let _ = get_u64(payload_val.get("agent_id"), "agent_id", u64::MAX);
            let _ = hex_to_32(payload_val.get("result_hash"))?;
            if let Some(proof) = payload_val.get("proof").and_then(|v| v.as_str()) {
                if proof.len() > 4096 {
                    return Err("proof exceeds 4096 chars".into());
                }
            }
            Ok(())
        }
        ("Balances", "transfer_allow_death") => {
            let _ = get_str(payload_val.get("address"), "address", 128)?;
            // allow up to u128::MAX but still ensure present
            let _ = payload_val
                .get("amount")
                .and_then(|v| v.as_u64())
                .ok_or_else(|| "missing amount".to_string())?;
            Ok(())
        }
        _ => Err(format!("unsupported pallet/call: {pallet}::{call}")),
    }
}

fn parse_verification(
    val: Option<&serde_json::Value>,
) -> Result<
    temporal_bindings::api::runtime_types::pallet_agent_registry::pallet::VerificationLevel,
    String,
> {
    use temporal_bindings::api::runtime_types::pallet_agent_registry::pallet::VerificationLevel;
    let s = val
        .and_then(|v| v.as_str())
        .unwrap_or("best_effort")
        .to_lowercase();
    match s.as_str() {
        "best_effort" => Ok(VerificationLevel::BestEffort),
        "optimistic" => Ok(VerificationLevel::Optimistic),
        "tee" => Ok(VerificationLevel::Tee),
        "zksnark" => Ok(VerificationLevel::ZkSnark),
        "redundant" => Ok(VerificationLevel::Redundant),
        _ => Err("invalid verification_level".into()),
    }
}

fn hex_to_32(val: Option<&serde_json::Value>) -> Result<[u8; 32], String> {
    let hex_str = val.and_then(|v| v.as_str()).ok_or("missing hex field")?;
    let bytes =
        hex::decode(hex_str.trim_start_matches("0x")).map_err(|e| format!("hex decode: {e}"))?;
    let arr: [u8; 32] = bytes
        .try_into()
        .map_err(|_| "expected 32-byte hex".to_string())?;
    Ok(arr)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn hex_to_32_parses() {
        let v =
            serde_json::json!("0x0000000000000000000000000000000000000000000000000000000000000001");
        let out = hex_to_32(Some(&v)).unwrap();
        assert_eq!(out[31], 1);
    }

    #[test]
    fn validate_outbox_payload_enforces_caps() {
        let payload = serde_json::json!({
            "spec_hash": "0x0000000000000000000000000000000000000000000000000000000000000000",
            "budget": 10,
            "deadline": 5,
            "verification_level": "best_effort"
        });
        assert!(validate_outbox_payload(
            "TaskMarket",
            "create_task",
            Some(payload.to_string().as_str())
        )
        .is_ok());

        let bad = serde_json::json!({
            "spec_hash": "0x01",
            "budget": 10,
            "deadline": 5
        });
        assert!(validate_outbox_payload(
            "TaskMarket",
            "create_task",
            Some(bad.to_string().as_str())
        )
        .is_err());
    }
}
