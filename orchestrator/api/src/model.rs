use ainur_core::{
    AgentId, Bid, Budget, Requirements, Task, TaskResult, TaskSpec, VerificationLevel,
};
use base64::{engine::general_purpose, Engine as _};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::error::ApiError;

/// Client‑facing payload for registering an agent with the orchestrator.
///
/// For now this contains only an opaque identifier and a human‑readable label.
/// Additional capability and reputation fields will be introduced once we
/// connect this surface to the Temporal chain and reputation subsystem.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentRegistrationRequest {
    /// Stable agent identifier (client‑defined).
    pub id: String,
    /// Human‑readable label for observability.
    pub label: String,
}

/// Minimal status enum for tasks managed by the orchestrator.
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum TaskStatus {
    Pending,
    Completed,
}

/// Payload for submitting a task into the coordination layer.
///
/// This is intentionally close to `ainur-core::Task` but uses strings and
/// encodings that are convenient for JSON/HTTP clients.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskSubmissionRequest {
    /// Client‑side correlation identifier (optional).
    pub client_task_id: Option<String>,
    /// Requesting agent identifier (string representation).
    pub requester_id: String,
    /// Human‑readable description of the task.
    pub description: String,
    /// Task type label.
    pub task_type: String,
    /// Raw input bytes encoded as base64.
    pub input_base64: String,
    /// Maximum budget in protocol units.
    pub max_budget: u128,
    /// Deadline as a Unix timestamp (seconds).
    pub deadline: u64,
}

/// Internal representation of a task stored by the orchestrator.
///
/// This wraps the `ainur-core::Task` with additional metadata needed for API
/// responses and orchestration logic.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StoredTask {
    pub id: String,
    pub client_task_id: Option<String>,
    pub task: Task,
    pub status: TaskStatus,
    pub created_at: u64,
}

/// Internal representation of a bid stored by the orchestrator.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StoredBid {
    pub id: String,
    pub task_id: String,
    pub agent_id: String,
    pub bid: Bid,
    pub created_at: u64,
}

/// Internal representation of a task result stored by the orchestrator.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StoredResult {
    pub id: String,
    pub task_id: String,
    pub agent_id: String,
    pub result: TaskResult,
    pub created_at: u64,
}

/// Public view of a task returned by the API.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskView {
    pub id: String,
    pub requester_id: String,
    pub description: String,
    pub status: TaskStatus,
    pub deadline: u64,
    pub max_budget: u128,
}

/// Public view of a bid.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BidView {
    pub id: String,
    pub task_id: String,
    pub agent_id: String,
    pub value: u128,
    pub quality_score: u32,
    pub completion_time: u64,
}

/// Public view of a task result.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResultView {
    pub id: String,
    pub task_id: String,
    pub agent_id: String,
    pub output_base64: String,
    pub completed_at: u64,
}

/// Request payload to enqueue an outbound extrinsic into the chain outbox.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OutboundExtrinsicRequest {
    pub pallet: String,
    pub call: String,
    /// Arbitrary JSON payload; persisted as a string for later submission.
    #[serde(default)]
    pub payload: serde_json::Value,
}

/// Response containing the correlation identifier for an enqueued extrinsic.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OutboxEnqueueResponse {
    pub correlation_id: String,
    pub status: &'static str,
}

/// View of an outbound extrinsic status.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OutboxStatusView {
    pub correlation_id: String,
    pub pallet: String,
    pub call: String,
    pub status: String,
    pub retry_count: i32,
    pub last_error: Option<String>,
    pub created_at: Option<String>,
    pub processed_at: Option<String>,
}

/// Query parameters for listing outbox entries.
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct OutboxQuery {
    pub status: Option<String>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

/// Generic response wrapper that can carry a correlation id plus payload.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResponseWithCorrelation<T> {
    pub correlation_id: Option<String>,
    pub data: T,
}

/// Aggregate counts for the dashboard surface.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DashboardView {
    pub total_agents: usize,
    pub total_tasks: usize,
    pub completed_tasks: usize,
    pub pending_tasks: usize,
}

/// Observability payload for chain sync/outbox state.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncStatusView {
    pub chain_cursor: Option<ChainCursorView>,
    pub outbox_pending: Option<i64>,
    pub outbox_failed: Option<i64>,
    pub outbox_dead: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChainCursorView {
    pub block: u64,
    pub event_index: u32,
}

impl TaskView {
    pub fn from_stored(stored: &StoredTask) -> Self {
        Self {
            id: stored.id.clone(),
            requester_id: requester_hex(&stored.task),
            description: stored.task.specification.description.clone(),
            status: stored.status,
            deadline: stored.task.deadline,
            max_budget: stored.task.budget.max_cost,
        }
    }
}

impl BidView {
    pub fn from_stored(stored: &StoredBid) -> Self {
        Self {
            id: stored.id.clone(),
            task_id: stored.task_id.clone(),
            agent_id: stored.agent_id.clone(),
            value: stored.bid.value,
            quality_score: stored.bid.quality_score,
            completion_time: stored.bid.completion_time,
        }
    }
}

impl ResultView {
    pub fn from_stored(stored: &StoredResult) -> Self {
        Self {
            id: stored.id.clone(),
            task_id: stored.task_id.clone(),
            agent_id: stored.agent_id.clone(),
            output_base64: general_purpose::STANDARD.encode(&stored.result.output),
            completed_at: stored.result.completed_at,
        }
    }
}

impl StoredTask {
    /// Create a new stored task from a submission payload, performing all
    /// necessary decoding and validation.
    pub fn from_submission(submission: TaskSubmissionRequest) -> Result<Self, ApiError> {
        if submission.description.trim().is_empty() {
            return Err(ApiError::BadRequest(
                "task description must not be empty".to_string(),
            ));
        }

        let raw_input = general_purpose::STANDARD
            .decode(&submission.input_base64)
            .map_err(|_| ApiError::BadRequest("input_base64 must be valid base64".to_string()))?;

        let task = build_core_task(&submission, raw_input);

        let id = Uuid::new_v4().to_string();
        let created_at = current_unix_timestamp();

        Ok(Self {
            id,
            client_task_id: submission.client_task_id,
            task,
            status: TaskStatus::Pending,
            created_at,
        })
    }
}

/// Payload for submitting a bid for a task.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BidSubmissionRequest {
    pub task_id: String,
    pub agent_id: String,
    pub value: u128,
    pub quality_score: u32,
    pub completion_time: u64,
}

impl StoredBid {
    pub fn from_submission(
        submission: BidSubmissionRequest,
        task: &StoredTask,
    ) -> Result<Self, ApiError> {
        if submission.agent_id.trim().is_empty() {
            return Err(ApiError::BadRequest(
                "agent_id must not be empty".to_string(),
            ));
        }

        let bid = build_core_bid(&submission, &task.task);

        let id = Uuid::new_v4().to_string();
        let created_at = current_unix_timestamp();

        Ok(Self {
            id,
            task_id: task.id.clone(),
            agent_id: submission.agent_id,
            bid,
            created_at,
        })
    }
}

/// Payload for submitting a task result.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResultSubmissionRequest {
    pub task_id: String,
    pub agent_id: String,
    pub output_base64: String,
}

impl StoredResult {
    pub fn from_submission(
        submission: ResultSubmissionRequest,
        task: &StoredTask,
    ) -> Result<Self, ApiError> {
        if submission.agent_id.trim().is_empty() {
            return Err(ApiError::BadRequest(
                "agent_id must not be empty".to_string(),
            ));
        }

        let output = general_purpose::STANDARD
            .decode(&submission.output_base64)
            .map_err(|_| ApiError::BadRequest("output_base64 must be valid base64".to_string()))?;

        let result = build_core_result(&submission, &task.task, output);

        let id = Uuid::new_v4().to_string();
        let created_at = result.completed_at;

        Ok(Self {
            id,
            task_id: task.id.clone(),
            agent_id: submission.agent_id,
            result,
            created_at,
        })
    }
}

fn build_core_task(submission: &TaskSubmissionRequest, input: Vec<u8>) -> Task {
    let requester_hash = blake3::hash(submission.requester_id.as_bytes());
    let mut requester_bytes = [0u8; 32];
    requester_bytes.copy_from_slice(&requester_hash.as_bytes()[..32]);
    let requester = AgentId::new(requester_bytes);

    let specification = TaskSpec {
        description: submission.description.clone(),
        task_type: ainur_core::TaskType::Custom(submission.task_type.clone()),
        input,
        output_format: ainur_core::OutputFormat::Binary,
        metadata: Vec::new(),
    };

    let requirements = Requirements {
        min_memory: None,
        min_cpu_cores: None,
        gpu_required: false,
        min_bandwidth: None,
        capabilities: Vec::new(),
    };

    let budget = Budget {
        max_cost: submission.max_budget,
        payment_schedule: ainur_core::PaymentSchedule::OnCompletion,
        escrow_required: true,
    };

    // TaskId is opaque at this layer. We derive it from a fresh UUID.
    let mut task_bytes = [0u8; 32];
    task_bytes[..16].copy_from_slice(Uuid::new_v4().as_bytes());
    let task_id = ainur_core::TaskId::new(task_bytes);

    Task {
        id: task_id,
        requester,
        specification,
        requirements,
        budget,
        deadline: submission.deadline,
        verification_level: VerificationLevel::BestEffort,
    }
}

fn build_core_bid(submission: &BidSubmissionRequest, task: &Task) -> Bid {
    let executor_hash = blake3::hash(submission.agent_id.as_bytes());
    let mut executor_bytes = [0u8; 32];
    executor_bytes.copy_from_slice(&executor_hash.as_bytes()[..32]);
    let agent_id = AgentId::new(executor_bytes);

    Bid {
        agent_id,
        task_id: task.id,
        value: submission.value,
        quality_score: submission.quality_score,
        completion_time: submission.completion_time,
        guarantees: Vec::new(),
    }
}

fn build_core_result(
    submission: &ResultSubmissionRequest,
    task: &Task,
    output: Vec<u8>,
) -> TaskResult {
    let executor_hash = blake3::hash(submission.agent_id.as_bytes());
    let mut executor_bytes = [0u8; 32];
    executor_bytes.copy_from_slice(&executor_hash.as_bytes()[..32]);
    let executor = AgentId::new(executor_bytes);

    TaskResult {
        task_id: task.id,
        executor,
        output,
        proof: None,
        resources_used: ainur_core::ResourceUsage {
            cpu_time_ms: 0,
            memory_bytes: 0,
            storage_bytes: 0,
            bandwidth_bytes: 0,
            gpu_time_ms: None,
        },
        completed_at: current_unix_timestamp(),
    }
}

fn current_unix_timestamp() -> u64 {
    use std::time::{SystemTime, UNIX_EPOCH};

    match SystemTime::now().duration_since(UNIX_EPOCH) {
        Ok(duration) => duration.as_secs(),
        Err(_) => 0,
    }
}

/// Convenience helper to obtain a hex‑encoded representation of the requester
/// id for observability in API responses.
fn requester_hex(task: &Task) -> String {
    let bytes = task.requester.as_bytes();
    let mut out = String::with_capacity(bytes.len() * 2);
    for b in bytes {
        use core::fmt::Write as _;
        let _ = write!(&mut out, "{:02x}", b);
    }
    out
}
