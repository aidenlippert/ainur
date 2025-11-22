use std::collections::HashMap;

use async_trait::async_trait;
use tokio::sync::RwLock;

use crate::error::ApiError;
use crate::model::{
    AgentRegistrationRequest, BidView, ResultView, StoredBid, StoredResult, StoredTask, TaskView,
};
use base64::{engine::general_purpose, Engine as _};

#[cfg(feature = "postgres")]
use {
    sqlx::{postgres::PgPoolOptions, Pool, Postgres, Row},
    tracing::info,
    uuid::Uuid,
};

#[async_trait]
pub trait Storage: Send + Sync {
    async fn register_agent(&self, agent: AgentRegistrationRequest) -> Result<(), ApiError>;
    async fn get_agent(&self, id: &str) -> Result<AgentRegistrationRequest, ApiError>;
    async fn list_agents(&self) -> Result<Vec<AgentRegistrationRequest>, ApiError>;

    async fn insert_task(&self, task: StoredTask) -> Result<(), ApiError>;
    async fn upsert_task(&self, task: StoredTask) -> Result<(), ApiError>;
    async fn get_task(&self, id: &str) -> Result<StoredTask, ApiError>;
    async fn list_tasks(&self) -> Result<Vec<StoredTask>, ApiError>;

    async fn insert_bid(&self, bid: StoredBid) -> Result<(), ApiError>;
    async fn get_bids_for_task(&self, task_id: &str) -> Result<Vec<StoredBid>, ApiError>;

    async fn insert_result(&self, result: StoredResult) -> Result<(), ApiError>;
    async fn get_result_for_task(&self, task_id: &str) -> Result<StoredResult, ApiError>;

    async fn dashboard_counts(&self) -> Result<(usize, usize, usize, usize), ApiError>;
}

/// In-memory storage used for development and tests.
#[derive(Default)]
pub struct InMemoryStorage {
    agents: RwLock<HashMap<String, AgentRegistrationRequest>>,
    tasks: RwLock<HashMap<String, StoredTask>>,
    bids: RwLock<HashMap<String, StoredBid>>,
    results: RwLock<HashMap<String, StoredResult>>,
    cursor: RwLock<Option<(u64, u32)>>,
}

#[async_trait]
impl Storage for InMemoryStorage {
    async fn register_agent(&self, agent: AgentRegistrationRequest) -> Result<(), ApiError> {
        let mut agents = self.agents.write().await;
        agents.insert(agent.id.clone(), agent);
        Ok(())
    }

    async fn get_agent(&self, id: &str) -> Result<AgentRegistrationRequest, ApiError> {
        let agents = self.agents.read().await;
        agents
            .get(id)
            .cloned()
            .ok_or_else(|| ApiError::NotFound(format!("agent {id} not found")))
    }

    async fn list_agents(&self) -> Result<Vec<AgentRegistrationRequest>, ApiError> {
        let agents = self.agents.read().await;
        Ok(agents.values().cloned().collect())
    }

    async fn insert_task(&self, task: StoredTask) -> Result<(), ApiError> {
        let mut tasks = self.tasks.write().await;
        tasks.insert(task.id.clone(), task);
        Ok(())
    }

    async fn upsert_task(&self, task: StoredTask) -> Result<(), ApiError> {
        let mut tasks = self.tasks.write().await;
        tasks.insert(task.id.clone(), task);
        Ok(())
    }

    async fn get_task(&self, id: &str) -> Result<StoredTask, ApiError> {
        let tasks = self.tasks.read().await;
        tasks
            .get(id)
            .cloned()
            .ok_or_else(|| ApiError::NotFound(format!("task {id} not found")))
    }

    async fn list_tasks(&self) -> Result<Vec<StoredTask>, ApiError> {
        let tasks = self.tasks.read().await;
        Ok(tasks.values().cloned().collect())
    }

    async fn insert_bid(&self, bid: StoredBid) -> Result<(), ApiError> {
        let mut bids = self.bids.write().await;
        bids.insert(bid.id.clone(), bid);
        Ok(())
    }

    async fn get_bids_for_task(&self, task_id: &str) -> Result<Vec<StoredBid>, ApiError> {
        let bids = self.bids.read().await;
        Ok(bids
            .values()
            .filter(|b| b.task_id == task_id)
            .cloned()
            .collect())
    }

    async fn insert_result(&self, result: StoredResult) -> Result<(), ApiError> {
        let mut results = self.results.write().await;
        results.insert(result.id.clone(), result);
        Ok(())
    }

    async fn get_result_for_task(&self, task_id: &str) -> Result<StoredResult, ApiError> {
        let results = self.results.read().await;
        results
            .values()
            .find(|r| r.task_id == task_id)
            .cloned()
            .ok_or_else(|| ApiError::NotFound(format!("no result for task {task_id}")))
    }

    async fn dashboard_counts(&self) -> Result<(usize, usize, usize, usize), ApiError> {
        let agents = self.agents.read().await;
        let tasks = self.tasks.read().await;
        let total_tasks = tasks.len();
        let completed = tasks
            .values()
            .filter(|t| matches!(t.status, crate::model::TaskStatus::Completed))
            .count();
        let pending = total_tasks.saturating_sub(completed);
        Ok((agents.len(), total_tasks, completed, pending))
    }
}

#[async_trait]
pub trait ChainEventSink: Send + Sync {
    async fn record_chain_event(
        &self,
        block_number: u64,
        event_index: u32,
        pallet: &str,
        variant: &str,
        payload: &str,
        correlation_id: Option<&str>,
    ) -> Result<(), ApiError>;

    async fn update_chain_cursor(
        &self,
        block_number: u64,
        event_index: u32,
    ) -> Result<(), ApiError>;
    async fn last_chain_cursor(&self) -> Result<Option<(u64, u32)>, ApiError>;

    async fn record_outbound_extrinsic(
        &self,
        correlation_id: &str,
        pallet: &str,
        call: &str,
        payload: Option<&str>,
        status: &str,
    ) -> Result<(), ApiError>;
}

#[async_trait]
impl ChainEventSink for InMemoryStorage {
    async fn record_chain_event(
        &self,
        _block_number: u64,
        _event_index: u32,
        _pallet: &str,
        _variant: &str,
        _payload: &str,
        _correlation_id: Option<&str>,
    ) -> Result<(), ApiError> {
        Ok(())
    }

    async fn update_chain_cursor(
        &self,
        block_number: u64,
        event_index: u32,
    ) -> Result<(), ApiError> {
        let mut cursor = self.cursor.write().await;
        *cursor = Some((block_number, event_index));
        Ok(())
    }

    async fn last_chain_cursor(&self) -> Result<Option<(u64, u32)>, ApiError> {
        let cursor = self.cursor.read().await;
        Ok(*cursor)
    }

    async fn record_outbound_extrinsic(
        &self,
        _correlation_id: &str,
        _pallet: &str,
        _call: &str,
        _payload: Option<&str>,
        _status: &str,
    ) -> Result<(), ApiError> {
        Ok(())
    }
}

#[cfg(feature = "postgres")]
pub struct PostgresStorage {
    pool: Pool<Postgres>,
}

#[cfg(feature = "postgres")]
impl Clone for PostgresStorage {
    fn clone(&self) -> Self {
        Self {
            pool: self.pool.clone(),
        }
    }
}

#[cfg(feature = "postgres")]
impl PostgresStorage {
    /// Expose the underlying connection pool for auxiliary workers (e.g., chain outbox).
    pub fn pool(&self) -> Pool<Postgres> {
        self.pool.clone()
    }

    fn parse_uuid(id: &str, field: &'static str) -> Result<Uuid, ApiError> {
        Uuid::parse_str(id)
            .map_err(|_| ApiError::BadRequest(format!("{field} is not a valid UUID")))
    }

    pub async fn connect_with_pool(
        database_url: &str,
        max_connections: u32,
        connect_timeout_secs: u64,
    ) -> Result<Self, ApiError> {
        let pool = PgPoolOptions::new()
            .max_connections(max_connections)
            .acquire_timeout(std::time::Duration::from_secs(connect_timeout_secs))
            .connect(database_url)
            .await
            .map_err(|e| ApiError::Internal(format!("failed to connect to postgres: {e}")))?;

        // Run migrations if present.
        if let Err(err) = sqlx::migrate!("./migrations").run(&pool).await {
            return Err(ApiError::Internal(format!(
                "failed to run migrations: {err}"
            )));
        }

        info!("connected to Postgres and applied migrations");
        Ok(Self { pool })
    }

    fn status_to_str(status: crate::model::TaskStatus) -> &'static str {
        match status {
            crate::model::TaskStatus::Pending => "pending",
            crate::model::TaskStatus::Completed => "completed",
        }
    }

    fn str_to_status(s: &str) -> Result<crate::model::TaskStatus, ApiError> {
        match s {
            "pending" => Ok(crate::model::TaskStatus::Pending),
            "completed" => Ok(crate::model::TaskStatus::Completed),
            other => Err(ApiError::Internal(format!("unknown task status {other}"))),
        }
    }

    fn serialize<T: serde::Serialize>(value: &T) -> Result<serde_json::Value, ApiError> {
        serde_json::to_value(value).map_err(|e| ApiError::Internal(e.to_string()))
    }
}

#[cfg(feature = "postgres")]
#[async_trait]
impl Storage for PostgresStorage {
    async fn register_agent(&self, agent: AgentRegistrationRequest) -> Result<(), ApiError> {
        sqlx::query(
            r#"
            INSERT INTO agents (id, label)
            VALUES ($1, $2)
            ON CONFLICT (id) DO UPDATE SET label = EXCLUDED.label
            "#,
        )
        .bind(&agent.id)
        .bind(&agent.label)
        .execute(&self.pool)
        .await
        .map_err(|e| ApiError::Internal(format!("failed to upsert agent: {e}")))?;
        Ok(())
    }

    async fn get_agent(&self, id: &str) -> Result<AgentRegistrationRequest, ApiError> {
        let row = sqlx::query("SELECT id, label FROM agents WHERE id = $1")
            .bind(id)
            .fetch_optional(&self.pool)
            .await
            .map_err(|e| ApiError::Internal(format!("failed to fetch agent: {e}")))?;

        let row = row.ok_or_else(|| ApiError::NotFound(format!("agent {id} not found")))?;
        Ok(AgentRegistrationRequest {
            id: row.get::<String, _>("id"),
            label: row.get::<String, _>("label"),
        })
    }

    async fn list_agents(&self) -> Result<Vec<AgentRegistrationRequest>, ApiError> {
        let rows = sqlx::query("SELECT id, label FROM agents ORDER BY created_at DESC")
            .fetch_all(&self.pool)
            .await
            .map_err(|e| ApiError::Internal(format!("failed to list agents: {e}")))?;

        Ok(rows
            .into_iter()
            .map(|row| AgentRegistrationRequest {
                id: row.get::<String, _>("id"),
                label: row.get::<String, _>("label"),
            })
            .collect())
    }

    async fn insert_task(&self, task: StoredTask) -> Result<(), ApiError> {
        let task_uuid = Self::parse_uuid(&task.id, "task id")?;
        let stored_json = Self::serialize(&task)?;
        let task_type_str: String = match &task.task.specification.task_type {
            ainur_core::TaskType::Custom(s) => s.clone(),
            other => serde_json::to_string(other).unwrap_or_else(|_| "unknown".into()),
        };
        let budget: i64 = task
            .task
            .budget
            .max_cost
            .try_into()
            .map_err(|_| ApiError::BadRequest("max_cost exceeds i64".into()))?;
        sqlx::query(
            r#"
            INSERT INTO tasks (id, client_task_id, requester_id, description, task_type, input_base64, max_budget, deadline, status, created_at, updated_at, stored_json)
            VALUES ($1, $2, $3, $4, $5, $6, $7, to_timestamp($8), $9, to_timestamp($10), to_timestamp($11), $12)
            ON CONFLICT (id) DO NOTHING
            "#,
        )
        .bind(task_uuid)
        .bind(&task.client_task_id)
        .bind(task.task.requester.as_bytes().as_slice())
        .bind(&task.task.specification.description)
        .bind(task_type_str)
        .bind(general_purpose::STANDARD.encode(&task.task.specification.input))
        .bind(budget)
        .bind(task.task.deadline as i64)
        .bind(Self::status_to_str(task.status))
        .bind(task.created_at as i64)
        .bind(task.created_at as i64)
        .bind(stored_json)
        .execute(&self.pool)
        .await
        .map_err(|e| ApiError::Internal(format!("failed to insert task: {e}")))?;
        Ok(())
    }

    async fn upsert_task(&self, task: StoredTask) -> Result<(), ApiError> {
        let task_uuid = Self::parse_uuid(&task.id, "task id")?;
        let stored_json = Self::serialize(&task)?;
        let task_type_str: String = match &task.task.specification.task_type {
            ainur_core::TaskType::Custom(s) => s.clone(),
            other => serde_json::to_string(other).unwrap_or_else(|_| "unknown".into()),
        };
        let budget: i64 = task
            .task
            .budget
            .max_cost
            .try_into()
            .map_err(|_| ApiError::BadRequest("max_cost exceeds i64".into()))?;
        sqlx::query(
            r#"
            INSERT INTO tasks (id, client_task_id, requester_id, description, task_type, input_base64, max_budget, deadline, status, created_at, updated_at, stored_json)
            VALUES ($1, $2, $3, $4, $5, $6, $7, to_timestamp($8), $9, to_timestamp($10), to_timestamp($11), $12)
            ON CONFLICT (id) DO UPDATE SET
                client_task_id = EXCLUDED.client_task_id,
                requester_id = EXCLUDED.requester_id,
                description = EXCLUDED.description,
                task_type = EXCLUDED.task_type,
                input_base64 = EXCLUDED.input_base64,
                max_budget = EXCLUDED.max_budget,
                deadline = EXCLUDED.deadline,
                status = EXCLUDED.status,
                updated_at = now(),
                stored_json = EXCLUDED.stored_json
            "#,
        )
        .bind(task_uuid)
        .bind(&task.client_task_id)
        .bind(task.task.requester.as_bytes().as_slice())
        .bind(&task.task.specification.description)
        .bind(task_type_str)
        .bind(general_purpose::STANDARD.encode(&task.task.specification.input))
        .bind(budget)
        .bind(task.task.deadline as i64)
        .bind(Self::status_to_str(task.status))
        .bind(task.created_at as i64)
        .bind(task.created_at as i64)
        .bind(stored_json)
        .execute(&self.pool)
        .await
        .map_err(|e| ApiError::Internal(format!("failed to upsert task: {e}")))?;
        Ok(())
    }

    async fn get_task(&self, id: &str) -> Result<StoredTask, ApiError> {
        let task_uuid = Self::parse_uuid(id, "task id")?;
        let row = sqlx::query("SELECT stored_json, status FROM tasks WHERE id = $1")
            .bind(task_uuid)
            .fetch_optional(&self.pool)
            .await
            .map_err(|e| ApiError::Internal(format!("failed to fetch task: {e}")))?;

        let row = row.ok_or_else(|| ApiError::NotFound(format!("task {id} not found")))?;
        let mut task: StoredTask = serde_json::from_value(row.get("stored_json"))
            .map_err(|e| ApiError::Internal(format!("failed to decode task: {e}")))?;

        // Ensure status matches authoritative column.
        let status_str: String = row.get("status");
        task.status = Self::str_to_status(&status_str)?;
        Ok(task)
    }

    async fn list_tasks(&self) -> Result<Vec<StoredTask>, ApiError> {
        let rows = sqlx::query("SELECT stored_json, status FROM tasks ORDER BY created_at DESC")
            .fetch_all(&self.pool)
            .await
            .map_err(|e| ApiError::Internal(format!("failed to list tasks: {e}")))?;

        let mut out = Vec::with_capacity(rows.len());
        for row in rows {
            let mut task: StoredTask = serde_json::from_value(row.get("stored_json"))
                .map_err(|e| ApiError::Internal(format!("failed to decode task: {e}")))?;
            let status_str: String = row.get("status");
            task.status = Self::str_to_status(&status_str)?;
            out.push(task);
        }
        Ok(out)
    }

    async fn insert_bid(&self, bid: StoredBid) -> Result<(), ApiError> {
        let bid_uuid = Self::parse_uuid(&bid.id, "bid id")?;
        let task_uuid = Self::parse_uuid(&bid.task_id, "bid task_id")?;
        let stored_json = Self::serialize(&bid)?;
        let bid_value: i64 = bid
            .bid
            .value
            .try_into()
            .map_err(|_| ApiError::BadRequest("bid value exceeds i64".into()))?;
        sqlx::query(
            r#"
            INSERT INTO bids (id, task_id, agent_id, value, quality_score, completion_time, created_at, stored_json)
            VALUES ($1, $2, $3, $4, $5, $6, to_timestamp($7), $8)
            ON CONFLICT (id) DO NOTHING
            "#,
        )
        .bind(bid_uuid)
        .bind(task_uuid)
        .bind(bid.bid.agent_id.as_bytes().as_slice())
        .bind(bid_value)
        .bind(bid.bid.quality_score as i32)
        .bind(bid.bid.completion_time as i64)
        .bind(bid.created_at as i64)
        .bind(stored_json)
        .execute(&self.pool)
        .await
        .map_err(|e| ApiError::Internal(format!("failed to insert bid: {e}")))?;
        Ok(())
    }

    async fn get_bids_for_task(&self, task_id: &str) -> Result<Vec<StoredBid>, ApiError> {
        let task_uuid = Self::parse_uuid(task_id, "task id")?;
        let rows = sqlx::query("SELECT stored_json FROM bids WHERE task_id = $1")
            .bind(task_uuid)
            .fetch_all(&self.pool)
            .await
            .map_err(|e| ApiError::Internal(format!("failed to fetch bids: {e}")))?;

        let mut out = Vec::with_capacity(rows.len());
        for row in rows {
            let bid: StoredBid = serde_json::from_value(row.get("stored_json"))
                .map_err(|e| ApiError::Internal(format!("failed to decode bid: {e}")))?;
            out.push(bid);
        }
        Ok(out)
    }

    async fn insert_result(&self, result: StoredResult) -> Result<(), ApiError> {
        let result_uuid = Self::parse_uuid(&result.id, "result id")?;
        let task_uuid = Self::parse_uuid(&result.task_id, "result task_id")?;
        let stored_json = Self::serialize(&result)?;
        let proof_bytes: Option<Vec<u8>> = match &result.result.proof {
            Some(ainur_core::ExecutionProof::TEEAttestation(bytes))
            | Some(ainur_core::ExecutionProof::ZKProof(bytes)) => Some(bytes.clone()),
            Some(ainur_core::ExecutionProof::Combined { tee, zk }) => {
                let mut combined = Vec::with_capacity(tee.len() + zk.len());
                combined.extend_from_slice(tee);
                combined.extend_from_slice(zk);
                Some(combined)
            }
            Some(ainur_core::ExecutionProof::None) => None,
            None => None,
        };
        sqlx::query(
            r#"
            INSERT INTO results (id, task_id, agent_id, output_base64, completed_at, proof, stored_json)
            VALUES ($1, $2, $3, $4, to_timestamp($5), $6, $7)
            ON CONFLICT (task_id) DO UPDATE SET
                id = EXCLUDED.id,
                agent_id = EXCLUDED.agent_id,
                output_base64 = EXCLUDED.output_base64,
                completed_at = EXCLUDED.completed_at,
                proof = EXCLUDED.proof,
                stored_json = EXCLUDED.stored_json,
                created_at = now()
            "#,
        )
        .bind(result_uuid)
        .bind(task_uuid)
        .bind(result.result.executor.as_bytes().as_slice())
        .bind(general_purpose::STANDARD.encode(&result.result.output))
        .bind(result.result.completed_at as i64)
        .bind(proof_bytes.as_deref())
        .bind(stored_json)
        .execute(&self.pool)
        .await
        .map_err(|e| ApiError::Internal(format!("failed to insert result: {e}")))?;
        Ok(())
    }

    async fn get_result_for_task(&self, task_id: &str) -> Result<StoredResult, ApiError> {
        let task_uuid = Self::parse_uuid(task_id, "task id")?;
        let row = sqlx::query("SELECT stored_json FROM results WHERE task_id = $1")
            .bind(task_uuid)
            .fetch_optional(&self.pool)
            .await
            .map_err(|e| ApiError::Internal(format!("failed to fetch result: {e}")))?;

        let row = row.ok_or_else(|| ApiError::NotFound(format!("no result for task {task_id}")))?;
        let result: StoredResult = serde_json::from_value(row.get("stored_json"))
            .map_err(|e| ApiError::Internal(format!("failed to decode result: {e}")))?;
        Ok(result)
    }

    async fn dashboard_counts(&self) -> Result<(usize, usize, usize, usize), ApiError> {
        let row = sqlx::query(
            r#"
            SELECT
                COUNT(*)                           AS total_tasks,
                COUNT(*) FILTER (WHERE status = 'completed') AS completed_tasks,
                COUNT(*) FILTER (WHERE status = 'pending')   AS pending_tasks
            FROM tasks
            "#,
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|e| ApiError::Internal(format!("failed to aggregate tasks: {e}")))?;

        let row_agents = sqlx::query("SELECT COUNT(*) AS total_agents FROM agents")
            .fetch_one(&self.pool)
            .await
            .map_err(|e| ApiError::Internal(format!("failed to count agents: {e}")))?;

        let total_agents: i64 = row_agents.get("total_agents");
        let total_tasks: i64 = row.get("total_tasks");
        let completed_tasks: i64 = row.get("completed_tasks");
        let pending_tasks: i64 = row.get("pending_tasks");

        Ok((
            total_agents as usize,
            total_tasks as usize,
            completed_tasks as usize,
            pending_tasks as usize,
        ))
    }
}

#[cfg(feature = "postgres")]
#[async_trait]
impl ChainEventSink for PostgresStorage {
    async fn record_chain_event(
        &self,
        block_number: u64,
        event_index: u32,
        pallet: &str,
        variant: &str,
        payload: &str,
        correlation_id: Option<&str>,
    ) -> Result<(), ApiError> {
        sqlx::query(
            r#"
            INSERT INTO chain_events (block_number, event_index, pallet, variant, payload, correlation_id)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (block_number, event_index) DO NOTHING
            "#,
        )
        .bind(block_number as i64)
        .bind(event_index as i32)
        .bind(pallet)
        .bind(variant)
        .bind(payload)
        .bind(correlation_id)
        .execute(&self.pool)
        .await
        .map_err(|e| ApiError::Internal(format!("failed to record chain event: {e}")))?;
        Ok(())
    }

    async fn update_chain_cursor(
        &self,
        block_number: u64,
        event_index: u32,
    ) -> Result<(), ApiError> {
        sqlx::query(
            r#"
            INSERT INTO chain_cursors (id, block_number, event_index, updated_at)
            VALUES (1, $1, $2, now())
            ON CONFLICT (id) DO UPDATE SET block_number = EXCLUDED.block_number, event_index = EXCLUDED.event_index, updated_at = now()
            "#,
        )
        .bind(block_number as i64)
        .bind(event_index as i32)
        .execute(&self.pool)
        .await
        .map_err(|e| ApiError::Internal(format!("failed to update chain cursor: {e}")))?;
        Ok(())
    }

    async fn last_chain_cursor(&self) -> Result<Option<(u64, u32)>, ApiError> {
        let row = sqlx::query("SELECT block_number, event_index FROM chain_cursors WHERE id = 1")
            .fetch_optional(&self.pool)
            .await
            .map_err(|e| ApiError::Internal(format!("failed to read chain cursor: {e}")))?;

        Ok(row.map(|r| {
            let bn: i64 = r.get("block_number");
            let idx: i32 = r.get("event_index");
            (bn as u64, idx as u32)
        }))
    }

    async fn record_outbound_extrinsic(
        &self,
        correlation_id: &str,
        pallet: &str,
        call: &str,
        payload: Option<&str>,
        status: &str,
    ) -> Result<(), ApiError> {
        sqlx::query(
            r#"
            INSERT INTO outbound_extrinsics (correlation_id, pallet, call, payload, status)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (correlation_id) DO UPDATE SET
                payload = COALESCE(EXCLUDED.payload, outbound_extrinsics.payload),
                status = EXCLUDED.status,
                updated_at = now()
            "#,
        )
        .bind(correlation_id)
        .bind(pallet)
        .bind(call)
        .bind(payload)
        .bind(status)
        .execute(&self.pool)
        .await
        .map_err(|e| ApiError::Internal(format!("failed to record outbound extrinsic: {e}")))?;
        Ok(())
    }
}

/// Placeholder for the forthcoming Postgres-backed implementation. This keeps
/// the API surface stable while the database layer is wired in.
#[cfg(not(feature = "postgres"))]
pub struct PostgresStorage;

/// Lightweight helper to convert task storage into views; keeps handler code
/// focused on validation and orchestration logic.
pub fn task_to_view(task: &StoredTask) -> TaskView {
    TaskView::from_stored(task)
}

pub fn bid_to_view(bid: &StoredBid) -> BidView {
    BidView::from_stored(bid)
}

pub fn result_to_view(result: &StoredResult) -> ResultView {
    ResultView::from_stored(result)
}
