use std::sync::Arc;

use ainur_agent_sdk::{AinurAgent, EchoAgent, TaskContext};
use ainur_core::Task;

use crate::error::ApiError;
use crate::model::{ResultSubmissionRequest, ResultView, StoredResult, StoredTask};

/// Trait abstracting over task execution backends.
///
/// This will later gain a WASM-based implementation (Cognition) that executes
/// untrusted agent code inside a sandbox. For the initial MVP we provide a
/// local in-process implementation backed by `EchoAgent` from the Rust SDK
/// to validate the end-to-end flow.
pub trait ExecutionEngine: Send + Sync {
    fn execute(&self, task: &StoredTask) -> Result<Vec<u8>, ApiError>;
}

/// Simple in-process execution engine that delegates to `EchoAgent`.
///
/// This is **not** a stub: it runs real agent logic in-process, and will be
/// used until the WASM runtime is wired in.
#[derive(Debug, Default)]
pub struct LocalEchoEngine;

impl ExecutionEngine for LocalEchoEngine {
    fn execute(&self, task: &StoredTask) -> Result<Vec<u8>, ApiError> {
        let ctx = TaskContext {
            task_id: task.id.clone(),
            input: task.task.specification.input.clone(),
        };
        EchoAgent::execute(&ctx).map_err(|e| ApiError::Internal.with_msg(e.to_string()))
    }
}

/// Helper used by HTTP handlers to execute a task and materialize a `StoredResult`
/// using the provided engine and agent identifier.
pub fn execute_and_build_result(
    engine: &Arc<dyn ExecutionEngine>,
    task: &mut StoredTask,
    agent_id: String,
) -> Result<StoredResult, ApiError> {
    let output_bytes = engine.execute(task)?;
    let output_base64 = base64::encode(&output_bytes);

    let submission = ResultSubmissionRequest {
        task_id: task.id.clone(),
        agent_id,
        output_base64,
    };

    StoredResult::from_submission(submission, task)
}


