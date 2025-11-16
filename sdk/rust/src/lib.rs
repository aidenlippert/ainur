//! Ainur Agent SDK (Rust)
//!
//! This crate provides a small, opinionated façade over the ARI v2 interface
//! for building Ainur agents in Rust. It is intentionally host‑agnostic:
//! the concrete bindings to the WIT world defined in `specs/ari-v2.wit` will
//! be provided by the Cognition WASM runtime and generated code; this crate
//! focuses on ergonomics and types.

use serde::{Deserialize, Serialize};
use thiserror::Error;

/// High‑level error type exposed to agent authors.
#[derive(Debug, Error)]
pub enum AgentError {
    #[error("serialization error: {0}")]
    Serialization(String),
    #[error("runtime error: {0}")]
    Runtime(String),
}

pub type Result<T> = core::result::Result<T, AgentError>;

/// Basic task context available to an agent when executing work.
///
/// In a WASM setting this will be constructed by the host by calling the ARI
/// `task-input` and `task-metadata` functions and deserializing the payload.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskContext {
    pub task_id: String,
    /// Raw input bytes. Helper methods allow treating this as JSON.
    pub input: Vec<u8>,
}

impl TaskContext {
    /// Interpret the input as UTF‑8 JSON and deserialize into the requested
    /// type.
    pub fn input_as_json<T: for<'de> Deserialize<'de>>(&self) -> Result<T> {
        let s = std::str::from_utf8(&self.input)
            .map_err(|e| AgentError::Serialization(e.to_string()))?;
        serde_json::from_str::<T>(s).map_err(|e| AgentError::Serialization(e.to_string()))
    }

    /// Serialize a value as JSON into a binary payload suitable for return
    /// from `execute`.
    pub fn to_output_json<T: Serialize>(value: &T) -> Result<Vec<u8>> {
        serde_json::to_vec(value).map_err(|e| AgentError::Serialization(e.to_string()))
    }
}

/// Core trait implemented by Ainur agents.
///
/// The Cognition runtime will adapt between this trait and the ARI v2 exports
/// defined in the WIT world.
pub trait AinurAgent {
    /// Execute the task and return an opaque binary payload (often JSON).
    fn execute(ctx: &TaskContext) -> Result<Vec<u8>>;

    /// Estimate the cost of executing a task from its raw specification bytes.
    ///
    /// For the initial MVP this can be a simple function of input size; more
    /// sophisticated agents may inspect the specification structure.
    fn estimate_cost(_spec_bytes: &[u8]) -> Result<CostEstimate> {
        let bytes = _spec_bytes.len() as u64;
        Ok(CostEstimate {
            estimated_cost: bytes as u64,
            confidence: 0.5,
            estimated_duration_secs: bytes / 1024,
        })
    }

    /// Whether this agent is capable of executing a given task.
    fn can_execute(_spec_bytes: &[u8]) -> bool {
        true
    }
}

/// Simple cost estimate structure mirroring the ARI v2 `cost-estimate` record.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CostEstimate {
    pub estimated_cost: u64,
    pub confidence: f32,
    pub estimated_duration_secs: u64,
}

/// A trivial reference agent that simply echoes its JSON input with a small
/// annotation. This acts as the first end‑to‑end example and can be compiled
/// to WASM once the WIT bindings are generated.
pub struct EchoAgent;

impl AinurAgent for EchoAgent {
    fn execute(ctx: &TaskContext) -> Result<Vec<u8>> {
        // Try to parse input as JSON; if that fails, just return it unchanged.
        let mut value: serde_json::Value = match ctx.input_as_json() {
            Ok(v) => v,
            Err(_) => {
                return Ok(ctx.input.clone());
            }
        };

        // Attach a minimal annotation so we can see that the agent ran.
        if let serde_json::Value::Object(ref mut map) = value {
            map.insert(
                "ainur_echo_metadata".into(),
                serde_json::json!({
                    "version": "0.1.0",
                    "note": "processed by EchoAgent"
                }),
            );
        }

        TaskContext::to_output_json(&value)
    }
}


