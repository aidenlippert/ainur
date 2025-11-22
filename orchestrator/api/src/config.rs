use std::env;

/// Minimal runtime configuration for the orchestrator.
#[derive(Debug, Clone)]
pub struct AppConfig {
    /// Postgres connection string; if absent, the orchestrator falls back to in-memory storage.
    pub database_url: Option<String>,
    /// Maximum DB connections (Postgres).
    pub db_max_connections: u32,
    /// Connect timeout for Postgres (seconds).
    pub db_connect_timeout_secs: u64,
    /// WebSocket endpoint for the Temporal chain (Subxt client).
    pub chain_ws_url: Option<String>,
    /// Optional path to a SCALE metadata blob for offline decoding.
    pub chain_metadata_path: Option<String>,
    /// Poll interval (ms) for the chain outbox submitter.
    pub outbox_poll_ms: u64,
    /// Execution engine selection: "local" (default) or "wasm".
    pub execution_engine: ExecutionEngineKind,
    /// WASM module path when execution_engine = wasm.
    pub wasm_module_path: Option<String>,
    /// Optional bind address for Prometheus metrics (e.g., 0.0.0.0:9000).
    pub metrics_bind: Option<String>,
    /// Optional backfill interval (ms) for correlation patching.
    pub backfill_interval_ms: u64,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ExecutionEngineKind {
    Local,
    #[cfg(feature = "wasm-engine")]
    Wasm,
}

impl AppConfig {
    pub fn from_env() -> Self {
        let db_max_connections = env::var("DB_MAX_CONNECTIONS")
            .ok()
            .and_then(|v| v.parse::<u32>().ok())
            .unwrap_or(10);
        let db_connect_timeout_secs = env::var("DB_CONNECT_TIMEOUT_SECS")
            .ok()
            .and_then(|v| v.parse::<u64>().ok())
            .unwrap_or(5);
        let outbox_poll_ms = env::var("OUTBOX_POLL_MS")
            .ok()
            .and_then(|v| v.parse::<u64>().ok())
            .unwrap_or(500);

        let execution_engine = match env::var("EXECUTION_ENGINE")
            .unwrap_or_else(|_| "local".into())
            .to_lowercase()
            .as_str()
        {
            #[cfg(feature = "wasm-engine")]
            "wasm" => ExecutionEngineKind::Wasm,
            _ => ExecutionEngineKind::Local,
        };

        Self {
            database_url: env::var("DATABASE_URL").ok(),
            db_max_connections,
            db_connect_timeout_secs,
            chain_ws_url: env::var("CHAIN_WS_URL").ok(),
            chain_metadata_path: env::var("CHAIN_METADATA_PATH").ok(),
            outbox_poll_ms,
            execution_engine,
            wasm_module_path: env::var("WASM_MODULE_PATH").ok(),
            metrics_bind: env::var("METRICS_BIND").ok(),
            backfill_interval_ms: env::var("BACKFILL_INTERVAL_MS")
                .ok()
                .and_then(|v| v.parse::<u64>().ok())
                .unwrap_or(10_000),
        }
    }
}
