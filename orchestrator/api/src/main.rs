//! Ainur Orchestrator API
//!
//! HTTP/JSON entrypoint that exposes a small but realistic subset of the Ainur
//! coordination surface:
//! - register an agent
//! - submit a task
//! - query a task by identifier
//!
//! This binary is intentionally in‑memory for now. It exists to validate
//! end‑to‑end types and API ergonomics before wiring the Temporal chain and
//! networking layers underneath.

#[cfg(feature = "chain-bridge")]
use ainur_orchestrator_api::chain;
use ainur_orchestrator_api::config::AppConfig;
#[cfg(feature = "wasm-engine")]
use ainur_orchestrator_api::config::ExecutionEngineKind;
use ainur_orchestrator_api::error::ApiError;
use ainur_orchestrator_api::execution::{
    execute_and_build_result, ExecutionEngine, LocalEchoEngine,
};
use ainur_orchestrator_api::model::{
    AgentRegistrationRequest, BidSubmissionRequest, BidView, OutboundExtrinsicRequest,
    OutboxEnqueueResponse, OutboxQuery, OutboxStatusView, ResponseWithCorrelation,
    ResultSubmissionRequest, ResultView, StoredBid, StoredResult, StoredTask, TaskStatus,
    TaskSubmissionRequest, TaskView,
};
#[cfg(feature = "chain-bridge")]
use ainur_orchestrator_api::storage::ChainEventSink;
#[cfg(feature = "postgres")]
use ainur_orchestrator_api::storage::PostgresStorage;
use ainur_orchestrator_api::storage::{
    bid_to_view, result_to_view, task_to_view, InMemoryStorage, Storage,
};
use axum::{
    extract::{Path, Query, State},
    routing::{get, post},
    Json, Router,
};
use blake3;
use hex;
use metrics_exporter_prometheus::PrometheusBuilder;
#[cfg(feature = "postgres")]
use sqlx::{Pool, Postgres, Row};
use std::{net::SocketAddr, sync::Arc};
use tower_http::limit::RequestBodyLimitLayer;
use tracing::{error, info, warn};
use uuid::Uuid;

const REQ_BODY_LIMIT_BYTES: usize = 1_048_576; // 1 MiB

/// Shared in‑memory application state.
///
/// This is a stand‑in for proper storage and consensus. It allows us to
/// exercise `ainur-core` types without making assumptions about the eventual
/// persistence layer.
#[derive(Clone)]
struct AppState {
    storage: Arc<dyn Storage>,
    engine: Arc<dyn ExecutionEngine>,
    #[cfg(feature = "chain-bridge")]
    chain_sink: Arc<dyn ChainEventSink>,
    #[cfg(feature = "postgres")]
    pg_pool: Option<Pool<Postgres>>,
}

impl AppState {
    async fn from_config(config: &AppConfig) -> Self {
        #[cfg(feature = "chain-bridge")]
        let chain_sink: Arc<dyn ChainEventSink>;
        #[cfg(feature = "postgres")]
        let mut pg_pool: Option<Pool<Postgres>> = None;

        let storage: Arc<dyn Storage> = {
            #[cfg(feature = "postgres")]
            {
                if let Some(ref url) = config.database_url {
                    match PostgresStorage::connect_with_pool(
                        url,
                        config.db_max_connections,
                        config.db_connect_timeout_secs,
                    )
                    .await
                    {
                        Ok(pg) => {
                            pg_pool = Some(pg.pool());
                            #[cfg(feature = "chain-bridge")]
                            {
                                chain_sink = Arc::new(pg.clone());
                            }
                            Arc::new(pg)
                        }
                        Err(err) => {
                            error!(
                                "failed to init Postgres storage, falling back to memory: {err}"
                            );
                            let mem = Arc::new(InMemoryStorage::default());
                            #[cfg(feature = "chain-bridge")]
                            {
                                chain_sink = mem.clone();
                            }
                            mem
                        }
                    }
                } else {
                    let mem = Arc::new(InMemoryStorage::default());
                    #[cfg(feature = "chain-bridge")]
                    {
                        chain_sink = mem.clone();
                    }
                    mem
                }
            }
            #[cfg(not(feature = "postgres"))]
            {
                let _ = config;
                let mem = Arc::new(InMemoryStorage::default());
                #[cfg(feature = "chain-bridge")]
                {
                    chain_sink = mem.clone();
                }
                mem
            }
        };

        let engine: Arc<dyn ExecutionEngine> = match config.execution_engine {
            #[cfg(feature = "wasm-engine")]
            ExecutionEngineKind::Wasm => {
                if let Some(path) = &config.wasm_module_path {
                    match ainur_orchestrator_api::execution::WasmExecutionEngine::from_path(path) {
                        Ok(e) => Arc::new(e),
                        Err(err) => {
                            error!(
                                "failed to initialize WASM engine, falling back to local: {err}"
                            );
                            Arc::new(LocalEchoEngine::default())
                        }
                    }
                } else {
                    error!(
                        "WASM engine selected but WASM_MODULE_PATH not set; falling back to local"
                    );
                    Arc::new(LocalEchoEngine::default())
                }
            }
            _ => Arc::new(LocalEchoEngine::default()),
        };

        Self {
            storage,
            engine,
            #[cfg(feature = "chain-bridge")]
            chain_sink,
            #[cfg(feature = "postgres")]
            pg_pool,
        }
    }
}

#[tokio::main]
async fn main() {
    init_tracing();

    let config = AppConfig::from_env();
    let state = AppState::from_config(&config).await;

    #[cfg(feature = "chain-bridge")]
    {
        if let Some(ws) = config.chain_ws_url.clone() {
            let storage = state.storage.clone();
            let sink = state.chain_sink.clone();
            let metadata_path = config.chain_metadata_path.clone();
            #[cfg(feature = "postgres")]
            let pg_pool = state.pg_pool.clone();
            #[cfg(feature = "postgres")]
            let pg_pool_for_outbox = pg_pool.clone();
            tokio::spawn(async move {
                if let Err(err) =
                    chain::run_chain_replay(ws, metadata_path, storage, sink, pg_pool).await
                {
                    warn!("chain replay worker exited: {err}");
                }
            });
            #[cfg(feature = "postgres")]
            if let Some(pool) = pg_pool_for_outbox {
                let ws = config.chain_ws_url.clone().expect("ws url exists");
                let poll_ms = config.outbox_poll_ms;
                let metadata_path = config.chain_metadata_path.clone();
                let pool_for_outbox = pool.clone();
                tokio::spawn(async move {
                    if let Err(err) =
                        chain::run_outbox(ws, metadata_path, pool_for_outbox, poll_ms).await
                    {
                        warn!("chain outbox worker exited: {err}");
                    }
                });
                let backfill_pool = pool.clone();
                let backfill_interval = config.backfill_interval_ms;
                tokio::spawn(async move {
                    if let Err(err) =
                        chain::run_outbox_backfill(backfill_pool, backfill_interval).await
                    {
                        warn!("outbox backfill worker exited: {err}");
                    }
                });
            } else {
                warn!("outbox worker requires Postgres; pg_pool not available");
            }
        } else {
            warn!("CHAIN_WS_URL not set; chain replay worker disabled");
        }
    }

    // Metrics endpoint (Prometheus text format) if configured.
    if let Some(bind) = config.metrics_bind.clone() {
        let builder = PrometheusBuilder::new();
        let handle = builder
            .install_recorder()
            .expect("failed to install metrics recorder");
        let bind_clone = bind.clone();
        tokio::spawn(async move {
            let app = Router::new().route(
                "/metrics",
                get(move || {
                    let body = handle.render();
                    async move { body }
                }),
            );
            match tokio::net::TcpListener::bind(&bind_clone).await {
                Ok(listener) => {
                    if let Err(err) = axum::serve(listener, app).await {
                        warn!("metrics server exited: {err}");
                    }
                }
                Err(err) => warn!("failed to bind metrics server on {}: {}", bind_clone, err),
            }
        });
        info!("metrics exporter listening on {}", bind);
    }

    let app = Router::new()
        .route("/health", get(health))
        .route("/v1/agents", post(register_agent))
        .route("/v1/agents/:id", get(get_agent))
        .route("/v1/tasks", post(submit_task))
        .route("/v1/tasks/:id", get(get_task))
        .route("/v1/bids", post(submit_bid))
        .route("/v1/tasks/:id/bids", get(get_bids_for_task))
        .route("/v1/results", post(submit_result))
        .route("/v1/tasks/:id/result", get(get_task_result))
        .route("/v1/tasks/:id/execute-local", post(execute_task_local));

    #[cfg(feature = "chain-bridge")]
    let app = app
        .route("/v1/outbox", post(enqueue_outbox))
        .route("/v1/outbox", get(list_outbox))
        .route("/v1/outbox/:id", get(get_outbox_status));

    let app = app
        .with_state(state)
        .layer(RequestBodyLimitLayer::new(REQ_BODY_LIMIT_BYTES));

    let addr: SocketAddr = std::env::var("BIND_ADDR")
        .unwrap_or_else(|_| "127.0.0.1:8080".into())
        .parse()
        .unwrap_or_else(|err| {
            eprintln!("invalid listen address: {err}");
            std::process::exit(1);
        });

    info!("starting orchestrator API on {}", addr);

    let listener = match tokio::net::TcpListener::bind(addr).await {
        Ok(l) => l,
        Err(err) => {
            error!("failed to bind TCP listener: {err}");
            return;
        }
    };

    if let Err(err) = axum::serve(listener, app).await {
        error!("server exited with error: {err}");
    }
}

fn init_tracing() {
    let subscriber = tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "ainur_orchestrator_api=info,axum::rejection=trace".into()),
        )
        .finish();
    if let Err(err) = tracing::subscriber::set_global_default(subscriber) {
        eprintln!("failed to install tracing subscriber: {err}");
    }
}

async fn health() -> &'static str {
    "ok"
}

async fn register_agent(
    State(state): State<AppState>,
    Json(payload): Json<AgentRegistrationRequest>,
) -> Result<Json<ResponseWithCorrelation<AgentRegistrationRequest>>, ApiError> {
    if payload.id.trim().is_empty() {
        return Err(ApiError::BadRequest("agent id must not be empty".into()));
    }
    if payload.label.trim().is_empty() {
        return Err(ApiError::BadRequest("agent label must not be empty".into()));
    }

    state.storage.register_agent(payload.clone()).await?;
    let correlation: Option<String> = {
        #[cfg(feature = "chain-bridge")]
        {
            let correlation_id = Uuid::new_v4().to_string();
            let payload_json = serde_json::json!({
                "did": payload.id,
                "capabilities": [],
                "metadata": payload.label,
                "verification_level": "best_effort"
            });
            if let Err(err) = chain::validate_outbox_payload(
                "AgentRegistry",
                "register_agent",
                Some(payload_json.to_string().as_str()),
            ) {
                warn!("skipping outbox enqueue for agent: {err}");
                None
            } else if let Err(err) = chain::record_outbound_extrinsic(
                state.chain_sink.clone(),
                &correlation_id,
                "AgentRegistry",
                "register_agent",
                Some(&payload_json.to_string()),
            )
            .await
            {
                warn!("failed to enqueue agent registration: {err}");
                None
            } else {
                Some(correlation_id)
            }
        }
        #[cfg(not(feature = "chain-bridge"))]
        {
            None
        }
    };

    Ok(Json(ResponseWithCorrelation {
        correlation_id: correlation,
        data: AgentRegistrationRequest {
            id: payload.id,
            label: payload.label,
        },
    }))
}

async fn get_agent(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<AgentRegistrationRequest>, ApiError> {
    let agent = state.storage.get_agent(&id).await?;
    Ok(Json(agent))
}

async fn submit_task(
    State(state): State<AppState>,
    Json(payload): Json<TaskSubmissionRequest>,
) -> Result<Json<ResponseWithCorrelation<TaskView>>, ApiError> {
    let stored = StoredTask::from_submission(payload)?;
    let spec_hash = blake3::hash(&stored.task.specification.input);
    let view = task_to_view(&stored);

    state.storage.insert_task(stored).await?;

    let mut correlation: Option<String> = None;
    #[cfg(feature = "chain-bridge")]
    {
        // Derive a spec hash from the input bytes for a deterministic link to the chain task.
        let spec_hex = format!("0x{}", hex::encode(spec_hash.as_bytes()));
        let correlation_id = Uuid::new_v4().to_string();
        let payload_json = serde_json::json!({
            "spec_hash": spec_hex,
            "budget": view.max_budget,
            "deadline": view.deadline,
            "verification_level": "best_effort"
        });
        if let Err(err) = chain::validate_outbox_payload(
            "TaskMarket",
            "create_task",
            Some(payload_json.to_string().as_str()),
        ) {
            warn!("skipping outbox enqueue for task: {err}");
        } else if let Err(err) = chain::record_outbound_extrinsic(
            state.chain_sink.clone(),
            &correlation_id,
            "TaskMarket",
            "create_task",
            Some(&payload_json.to_string()),
        )
        .await
        {
            warn!("failed to enqueue task create: {err}");
        } else {
            correlation = Some(correlation_id);
        }
    }

    Ok(Json(ResponseWithCorrelation {
        correlation_id: correlation,
        data: view,
    }))
}

async fn get_task(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<TaskView>, ApiError> {
    let stored = state.storage.get_task(&id).await?;
    Ok(Json(task_to_view(&stored)))
}

async fn submit_bid(
    State(state): State<AppState>,
    Json(payload): Json<BidSubmissionRequest>,
) -> Result<Json<ResponseWithCorrelation<BidView>>, ApiError> {
    let task = state.storage.get_task(&payload.task_id).await?;
    let stored_bid = StoredBid::from_submission(payload, &task)?;
    let view = bid_to_view(&stored_bid);

    state.storage.insert_bid(stored_bid).await?;

    let mut correlation: Option<String> = None;
    #[cfg(feature = "chain-bridge")]
    {
        let correlation_id = Uuid::new_v4().to_string();
        let commitment_hash =
            blake3::hash(format!("{}:{}", view.task_id, view.agent_id).as_bytes());
        let commitment_hex = format!("0x{}", hex::encode(commitment_hash.as_bytes()));
        // Try to pick up chain ids if already known.
        let (task_chain_id, agent_chain_id) = if let Some(pool) = state.pg_pool.clone() {
            let t_id: i64 = sqlx::query_scalar("SELECT chain_task_id FROM tasks WHERE id = $1")
                .bind(&view.task_id)
                .fetch_optional(&pool)
                .await
                .ok()
                .flatten()
                .unwrap_or(0);
            let a_id: i64 = sqlx::query_scalar("SELECT chain_agent_id FROM agents WHERE id = $1")
                .bind(&view.agent_id)
                .fetch_optional(&pool)
                .await
                .ok()
                .flatten()
                .unwrap_or(0);
            (t_id, a_id)
        } else {
            (0, 0)
        };
        let payload_json = serde_json::json!({
            "task_id": task_chain_id,
            "agent_id": agent_chain_id,
            "commitment": commitment_hex,
            "estimated_duration": view.completion_time,
        });
        if let Err(err) = chain::validate_outbox_payload(
            "TaskMarket",
            "submit_bid",
            Some(payload_json.to_string().as_str()),
        ) {
            warn!("skipping outbox enqueue for bid: {err}");
        } else if let Err(err) = chain::record_outbound_extrinsic(
            state.chain_sink.clone(),
            &correlation_id,
            "TaskMarket",
            "submit_bid",
            Some(&payload_json.to_string()),
        )
        .await
        {
            warn!("failed to enqueue bid submit: {err}");
        } else {
            correlation = Some(correlation_id);
        }
    }

    Ok(Json(ResponseWithCorrelation {
        correlation_id: correlation,
        data: view,
    }))
}

async fn get_bids_for_task(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<Vec<BidView>>, ApiError> {
    // Ensure the task exists; otherwise, return 404.
    let _ = state.storage.get_task(&id).await?;

    let bids = state.storage.get_bids_for_task(&id).await?;
    Ok(Json(bids.iter().map(bid_to_view).collect()))
}

async fn submit_result(
    State(state): State<AppState>,
    Json(payload): Json<ResultSubmissionRequest>,
) -> Result<Json<ResponseWithCorrelation<ResultView>>, ApiError> {
    let mut task = state.storage.get_task(&payload.task_id).await?;

    let stored_result = StoredResult::from_submission(payload, &task)?;
    // Mark the task as completed and persist the updated record.
    task.status = TaskStatus::Completed;
    state.storage.upsert_task(task).await?;

    let view = result_to_view(&stored_result);

    state.storage.insert_result(stored_result).await?;

    let mut correlation: Option<String> = None;
    #[cfg(feature = "chain-bridge")]
    {
        let correlation_id = Uuid::new_v4().to_string();
        let result_hash = blake3::hash(&view.output_base64.as_bytes());
        let result_hex = format!("0x{}", hex::encode(result_hash.as_bytes()));
        let (task_chain_id, agent_chain_id) = if let Some(pool) = state.pg_pool.clone() {
            let t_id: i64 = sqlx::query_scalar("SELECT chain_task_id FROM tasks WHERE id = $1")
                .bind(&view.task_id)
                .fetch_optional(&pool)
                .await
                .ok()
                .flatten()
                .unwrap_or(0);
            let a_id: i64 = sqlx::query_scalar("SELECT chain_agent_id FROM agents WHERE id = $1")
                .bind(&view.agent_id)
                .fetch_optional(&pool)
                .await
                .ok()
                .flatten()
                .unwrap_or(0);
            (t_id, a_id)
        } else {
            (0, 0)
        };
        let payload_json = serde_json::json!({
            "task_id": task_chain_id,
            "agent_id": agent_chain_id,
            "result_hash": result_hex,
            "proof": ""
        });
        if let Err(err) = chain::validate_outbox_payload(
            "TaskMarket",
            "submit_result",
            Some(payload_json.to_string().as_str()),
        ) {
            warn!("skipping outbox enqueue for result: {err}");
        } else if let Err(err) = chain::record_outbound_extrinsic(
            state.chain_sink.clone(),
            &correlation_id,
            "TaskMarket",
            "submit_result",
            Some(&payload_json.to_string()),
        )
        .await
        {
            warn!("failed to enqueue result submit: {err}");
        } else {
            correlation = Some(correlation_id);
        }
    }

    Ok(Json(ResponseWithCorrelation {
        correlation_id: correlation,
        data: view,
    }))
}

async fn get_task_result(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<ResultView>, ApiError> {
    // Ensure the task exists.
    let _ = state.storage.get_task(&id).await?;

    let stored = state.storage.get_result_for_task(&id).await?;
    Ok(Json(result_to_view(&stored)))
}

/// Convenience endpoint used during early development to exercise the complete
/// execution path using the local in-process execution engine. In later
/// iterations this will be replaced by automatic execution when bids are
/// accepted and wired to the Cognition WASM runtime.
async fn execute_task_local(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<ResultView>, ApiError> {
    let mut task = state.storage.get_task(&id).await?;

    let stored_result = execute_and_build_result(&state.engine, &mut task, "local-echo".into())?;

    // Mark task as completed; `execute_and_build_result` already updated it via
    // `StoredResult::from_submission`.
    task.status = TaskStatus::Completed;
    state.storage.upsert_task(task).await?;

    let view = result_to_view(&stored_result);

    state.storage.insert_result(stored_result).await?;

    Ok(Json(view))
}

#[cfg(feature = "chain-bridge")]
async fn enqueue_outbox(
    State(state): State<AppState>,
    Json(req): Json<OutboundExtrinsicRequest>,
) -> Result<Json<OutboxEnqueueResponse>, ApiError> {
    const MAX_PAYLOAD_BYTES: usize = 4096;
    let payload_str =
        if req.payload.is_null() || req.payload == serde_json::Value::Object(Default::default()) {
            None
        } else {
            Some(req.payload.to_string())
        };
    if let Some(ref p) = payload_str {
        if p.as_bytes().len() > MAX_PAYLOAD_BYTES {
            return Err(ApiError::BadRequest(format!(
                "payload exceeds {} bytes",
                MAX_PAYLOAD_BYTES
            )));
        }
    }
    chain::validate_outbox_payload(&req.pallet, &req.call, payload_str.as_deref())
        .map_err(|e| ApiError::BadRequest(format!("invalid payload: {e}")))?;

    let correlation_id = Uuid::new_v4().to_string();
    // Persist the intent for the outbox worker.
    chain::record_outbound_extrinsic(
        state.chain_sink.clone(),
        &correlation_id,
        &req.pallet,
        &req.call,
        payload_str.as_deref(),
    )
    .await?;

    Ok(Json(OutboxEnqueueResponse {
        correlation_id,
        status: "queued",
    }))
}

#[cfg(feature = "chain-bridge")]
async fn get_outbox_status(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<OutboxStatusView>, ApiError> {
    #[cfg(not(feature = "postgres"))]
    {
        let _ = state;
        return Err(ApiError::BadRequest(
            "outbox status requires postgres feature".into(),
        ));
    }

    #[cfg(feature = "postgres")]
    {
        let pool = state.pg_pool.clone().ok_or_else(|| {
            ApiError::BadRequest("outbox status requires Postgres backend".into())
        })?;

        let row = sqlx::query(
            r#"
            SELECT correlation_id, pallet, call, status, COALESCE(retry_count,0) AS retry_count, last_error,
                   created_at, processed_at
            FROM outbound_extrinsics
            WHERE correlation_id = $1
            "#,
        )
        .bind(&id)
        .fetch_optional(&pool)
        .await
        .map_err(|e| ApiError::Internal(format!("failed to fetch outbox row: {e}")))?;

        let row = row.ok_or_else(|| ApiError::NotFound(format!("outbox id {id} not found")))?;

        let created_at: Option<chrono::DateTime<chrono::Utc>> = row.get("created_at");
        let processed_at: Option<chrono::DateTime<chrono::Utc>> = row.get("processed_at");

        let view = OutboxStatusView {
            correlation_id: row.get::<String, _>("correlation_id"),
            pallet: row.get::<String, _>("pallet"),
            call: row.get::<String, _>("call"),
            status: row.get::<String, _>("status"),
            retry_count: row.get::<i32, _>("retry_count"),
            last_error: row.get::<Option<String>, _>("last_error"),
            created_at: created_at.map(|ts| ts.to_rfc3339()),
            processed_at: processed_at.map(|ts| ts.to_rfc3339()),
        };

        Ok(Json(view))
    }
}

#[cfg(feature = "chain-bridge")]
async fn list_outbox(
    State(state): State<AppState>,
    Query(query): Query<OutboxQuery>,
) -> Result<Json<Vec<OutboxStatusView>>, ApiError> {
    #[cfg(not(feature = "postgres"))]
    {
        let _ = state;
        return Err(ApiError::BadRequest(
            "outbox listing requires postgres feature".into(),
        ));
    }

    #[cfg(feature = "postgres")]
    {
        let pool = state.pg_pool.clone().ok_or_else(|| {
            ApiError::BadRequest("outbox listing requires Postgres backend".into())
        })?;

        let status_filter = query
            .status
            .map(|s| s.to_lowercase())
            .filter(|s| matches!(s.as_str(), "pending" | "failed" | "finalized" | "dead"));
        let limit = query.limit.unwrap_or(50).clamp(1, 200);
        let offset = query.offset.unwrap_or(0).max(0);

        let rows = sqlx::query(
            r#"
            SELECT correlation_id, pallet, call, status, COALESCE(retry_count,0) AS retry_count, last_error,
                   created_at, processed_at
            FROM outbound_extrinsics
            WHERE ($1 IS NULL OR status = $1)
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
            "#,
        )
        .bind(status_filter)
        .bind(limit)
        .bind(offset)
        .fetch_all(&pool)
        .await
        .map_err(|e| ApiError::Internal(format!("failed to list outbox rows: {e}")))?;

        let views = rows
            .into_iter()
            .map(|row| {
                let created_at: Option<chrono::DateTime<chrono::Utc>> = row.get("created_at");
                let processed_at: Option<chrono::DateTime<chrono::Utc>> = row.get("processed_at");
                OutboxStatusView {
                    correlation_id: row.get::<String, _>("correlation_id"),
                    pallet: row.get::<String, _>("pallet"),
                    call: row.get::<String, _>("call"),
                    status: row.get::<String, _>("status"),
                    retry_count: row.get::<i32, _>("retry_count"),
                    last_error: row.get::<Option<String>, _>("last_error"),
                    created_at: created_at.map(|ts| ts.to_rfc3339()),
                    processed_at: processed_at.map(|ts| ts.to_rfc3339()),
                }
            })
            .collect();

        Ok(Json(views))
    }
}
