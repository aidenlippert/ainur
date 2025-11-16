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

mod error;
mod model;

use axum::{
    extract::{Path, State},
    routing::{get, post},
    Json, Router,
};
use error::ApiError;
use model::{
    AgentRegistrationRequest, BidSubmissionRequest, BidView, ResultSubmissionRequest, ResultView,
    StoredBid, StoredResult, StoredTask, TaskSubmissionRequest, TaskView,
};
use std::{collections::HashMap, net::SocketAddr, sync::Arc};
use tokio::sync::RwLock;
use tracing::{error, info};

/// Shared in‑memory application state.
///
/// This is a stand‑in for proper storage and consensus. It allows us to
/// exercise `ainur-core` types without making assumptions about the eventual
/// persistence layer.
#[derive(Clone, Default)]
struct AppState {
    agents: Arc<RwLock<HashMap<String, AgentRegistrationRequest>>>,
    tasks: Arc<RwLock<HashMap<String, StoredTask>>>,
    bids: Arc<RwLock<HashMap<String, StoredBid>>>,
    results: Arc<RwLock<HashMap<String, StoredResult>>>,
}

#[tokio::main]
async fn main() {
    init_tracing();

    let state = AppState::default();

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
        .with_state(state);

    let addr: SocketAddr = match "0.0.0.0:8080".parse() {
        Ok(addr) => addr,
        Err(err) => {
            eprintln!("invalid listen address: {err}");
            return;
        }
    };

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
) -> Result<Json<AgentRegistrationRequest>, ApiError> {
    if payload.id.trim().is_empty() {
        return Err(ApiError::BadRequest("agent id must not be empty".into()));
    }
    if payload.label.trim().is_empty() {
        return Err(ApiError::BadRequest("agent label must not be empty".into()));
    }

    let mut agents = state.agents.write().await;
    agents.insert(payload.id.clone(), payload.clone());
    Ok(Json(payload))
}

async fn get_agent(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<AgentRegistrationRequest>, ApiError> {
    let agents = state.agents.read().await;
    let agent = agents
        .get(&id)
        .cloned()
        .ok_or_else(|| ApiError::NotFound(format!("agent {id} not found")))?;
    Ok(Json(agent))
}

async fn submit_task(
    State(state): State<AppState>,
    Json(payload): Json<TaskSubmissionRequest>,
) -> Result<Json<TaskView>, ApiError> {
    let stored = StoredTask::from_submission(payload)?;
    let view = TaskView::from_stored(&stored);

    let mut tasks = state.tasks.write().await;
    tasks.insert(stored.id.clone(), stored);

    Ok(Json(view))
}

async fn get_task(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<TaskView>, ApiError> {
    let tasks = state.tasks.read().await;
    let stored = tasks
        .get(&id)
        .ok_or_else(|| ApiError::NotFound(format!("task {id} not found")))?;

    Ok(Json(TaskView::from_stored(stored)))
}

async fn submit_bid(
    State(state): State<AppState>,
    Json(payload): Json<BidSubmissionRequest>,
) -> Result<Json<BidView>, ApiError> {
    let task = {
        let tasks = state.tasks.read().await;
        tasks
            .get(&payload.task_id)
            .cloned()
            .ok_or_else(|| ApiError::NotFound(format!("task {} not found", payload.task_id)))?
    };

    let stored_bid = StoredBid::from_submission(payload, &task)?;
    let view = BidView::from_stored(&stored_bid);

    let mut bids = state.bids.write().await;
    bids.insert(stored_bid.id.clone(), stored_bid);

    Ok(Json(view))
}

async fn get_bids_for_task(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<Vec<BidView>>, ApiError> {
    {
        // Ensure the task exists; otherwise, return 404.
        let tasks = state.tasks.read().await;
        if !tasks.contains_key(&id) {
            return Err(ApiError::NotFound(format!("task {id} not found")));
        }
    }

    let bids = state.bids.read().await;
    let views: Vec<BidView> = bids
        .values()
        .filter(|b| b.task_id == id)
        .map(BidView::from_stored)
        .collect();

    Ok(Json(views))
}

async fn submit_result(
    State(state): State<AppState>,
    Json(payload): Json<ResultSubmissionRequest>,
) -> Result<Json<ResultView>, ApiError> {
    // Obtain mutable access to tasks so we can update status when a result arrives.
    let mut tasks = state.tasks.write().await;
    let task = tasks
        .get_mut(&payload.task_id)
        .ok_or_else(|| ApiError::NotFound(format!("task {} not found", payload.task_id)))?;

    let stored_result = StoredResult::from_submission(payload, task)?;
    // Mark the task as completed.
    task.status = model::TaskStatus::Completed;

    let view = ResultView::from_stored(&stored_result);

    let mut results = state.results.write().await;
    results.insert(stored_result.id.clone(), stored_result);

    Ok(Json(view))
}

async fn get_task_result(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<ResultView>, ApiError> {
    {
        // Ensure the task exists.
        let tasks = state.tasks.read().await;
        if !tasks.contains_key(&id) {
            return Err(ApiError::NotFound(format!("task {id} not found")));
        }
    }

    let results = state.results.read().await;
    let stored = results
        .values()
        .find(|r| r.task_id == id)
        .ok_or_else(|| ApiError::NotFound(format!("no result for task {id}")))?;

    Ok(Json(ResultView::from_stored(stored)))
}


