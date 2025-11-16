use ainur_core::{AgentId, Budget, Requirements, Task, TaskSpec, VerificationLevel};
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
#[derive(Debug, Clone)]
pub struct StoredTask {
    pub id: String,
    pub client_task_id: Option<String>,
    pub task: Task,
    pub status: TaskStatus,
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

impl StoredTask {
    /// Create a new stored task from a submission payload, performing all
    /// necessary decoding and validation.
    pub fn from_submission(submission: TaskSubmissionRequest) -> Result<Self, ApiError> {
        if submission.description.trim().is_empty() {
            return Err(ApiError::BadRequest(
                "task description must not be empty".to_string(),
            ));
        }

        let raw_input = base64::decode(&submission.input_base64).map_err(|_| {
            ApiError::BadRequest("input_base64 must be valid base64".to_string())
        })?;

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


