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
use model::{AgentRegistrationRequest, StoredTask, TaskSubmissionRequest, TaskView};
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
}

#[tokio::main]
async fn main() {
    init_tracing();

    let state = AppState::default();

    let app = Router::new()
        .route("/health", get(health))
        .route("/v1/agents", post(register_agent))
        .route("/v1/tasks", post(submit_task))
        .route("/v1/tasks/:id", get(get_task))
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


