//! Core types for the Ainur Protocol

use parity_scale_codec::{Encode, Decode};
use scale_info::TypeInfo;
use serde::{Serialize, Deserialize};
use alloc::vec::Vec;
use alloc::string::String;

/// Unique identifier for an agent in the network
#[derive(Clone, Copy, PartialEq, Eq, Hash, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct AgentId([u8; 32]);

impl AgentId {
    /// Create a new agent ID from bytes
    pub fn new(bytes: [u8; 32]) -> Self {
        Self(bytes)
    }

    /// Get the underlying bytes
    pub fn as_bytes(&self) -> &[u8; 32] {
        &self.0
    }

    /// Create from a slice (must be exactly 32 bytes)
    pub fn from_slice(slice: &[u8]) -> Result<Self, crate::errors::CoreError> {
        if slice.len() != 32 {
            return Err(crate::errors::CoreError::InvalidLength {
                expected: 32,
                actual: slice.len(),
            });
        }
        let mut bytes = [0u8; 32];
        bytes.copy_from_slice(slice);
        Ok(Self(bytes))
    }
}

/// Unique identifier for a task
#[derive(Clone, Copy, PartialEq, Eq, Hash, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct TaskId([u8; 32]);

impl TaskId {
    /// Create a new task ID from bytes
    pub fn new(bytes: [u8; 32]) -> Self {
        Self(bytes)
    }

    /// Get the underlying bytes
    pub fn as_bytes(&self) -> &[u8; 32] {
        &self.0
    }
}

/// Multi-dimensional reputation score
#[derive(Clone, PartialEq, Eq, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct Reputation {
    /// Quality of work (0-100)
    pub quality: u32,
    /// Reliability score (0-100)
    pub reliability: u32,
    /// Speed of completion (0-100)
    pub speed: u32,
    /// Cost efficiency (0-100)
    pub cost_efficiency: u32,
    /// Domain-specific specializations
    pub specializations: Vec<(Domain, u32)>,
    /// Amount staked by the agent
    pub stake: u128,
}

/// Domain of expertise
#[derive(Clone, PartialEq, Eq, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub enum Domain {
    /// Natural Language Processing
    NLP,
    /// Computer Vision
    Vision,
    /// Data Analysis
    DataAnalysis,
    /// Code Generation
    CodeGen,
    /// Scientific Computing
    Scientific,
    /// Creative Content
    Creative,
    /// Other domain (with description)
    Other(String),
}

/// Task specification
#[derive(Clone, PartialEq, Eq, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct Task {
    /// Unique task identifier
    pub id: TaskId,
    /// Agent requesting the task
    pub requester: AgentId,
    /// Task specification details
    pub specification: TaskSpec,
    /// Requirements for execution
    pub requirements: Requirements,
    /// Budget constraints
    pub budget: Budget,
    /// Deadline for completion (Unix timestamp)
    pub deadline: u64,
    /// Required verification level
    pub verification_level: VerificationLevel,
}

/// Detailed task specification
#[derive(Clone, PartialEq, Eq, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct TaskSpec {
    /// Human-readable description
    pub description: String,
    /// Task type identifier
    pub task_type: TaskType,
    /// Input data or references
    pub input: Vec<u8>,
    /// Expected output format
    pub output_format: OutputFormat,
    /// Additional metadata
    pub metadata: Vec<(String, String)>,
}

/// Type of task
#[derive(Clone, PartialEq, Eq, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub enum TaskType {
    /// Computation task
    Compute,
    /// Data processing
    DataProcessing,
    /// Model inference
    Inference,
    /// Model training
    Training,
    /// Data storage
    Storage,
    /// Network relay
    Relay,
    /// Custom task type
    Custom(String),
}

/// Expected output format
#[derive(Clone, PartialEq, Eq, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub enum OutputFormat {
    /// Raw bytes
    Binary,
    /// JSON-encoded data
    Json,
    /// Plain text
    Text,
    /// Structured data with schema
    Structured(String),
}

/// Requirements for task execution
#[derive(Clone, PartialEq, Eq, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct Requirements {
    /// Minimum memory in bytes
    pub min_memory: Option<u64>,
    /// Minimum CPU cores
    pub min_cpu_cores: Option<u32>,
    /// Required GPU
    pub gpu_required: bool,
    /// Minimum bandwidth in bytes/second
    pub min_bandwidth: Option<u64>,
    /// Required capabilities
    pub capabilities: Vec<Capability>,
}

/// Agent capability
#[derive(Clone, PartialEq, Eq, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub enum Capability {
    /// Trusted Execution Environment
    TEE(TEEType),
    /// Zero-knowledge proof generation
    ZKProof(ZKSystem),
    /// Specific model availability
    Model(String),
    /// Hardware acceleration
    Hardware(HardwareType),
    /// Geographic location
    Location(String),
    /// Custom capability
    Custom(String, String),
}

/// TEE types
#[derive(Clone, PartialEq, Eq, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub enum TEEType {
    /// Intel SGX
    SGX,
    /// AMD SEV
    SEV,
    /// ARM TrustZone
    TrustZone,
    /// Other TEE
    Other(String),
}

/// ZK proof systems
#[derive(Clone, PartialEq, Eq, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub enum ZKSystem {
    /// Groth16
    Groth16,
    /// PLONK
    PLONK,
    /// STARKs
    STARK,
    /// Bulletproofs
    Bulletproofs,
    /// Other system
    Other(String),
}

/// Hardware acceleration types
#[derive(Clone, PartialEq, Eq, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub enum HardwareType {
    /// NVIDIA GPU
    NvidiaGPU(String),
    /// AMD GPU
    AmdGPU(String),
    /// Google TPU
    TPU(String),
    /// FPGA
    FPGA(String),
    /// ASIC
    ASIC(String),
    /// Other hardware
    Other(String),
}

/// Verification levels for task execution
#[derive(Clone, PartialEq, Eq, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub enum VerificationLevel {
    /// No verification required
    None,
    /// Best effort verification
    BestEffort,
    /// Consensus among N validators
    Consensus(u8),
    /// TEE attestation required
    TEEAttested,
    /// Zero-knowledge proof required
    ZKProof,
    /// Both TEE and ZK verification
    TEEWithZK,
}

/// Budget constraints for a task
#[derive(Clone, PartialEq, Eq, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct Budget {
    /// Maximum cost in protocol tokens
    pub max_cost: u128,
    /// Payment schedule
    pub payment_schedule: PaymentSchedule,
    /// Whether escrow is required
    pub escrow_required: bool,
}

/// Payment scheduling options
#[derive(Clone, PartialEq, Eq, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub enum PaymentSchedule {
    /// Full payment upfront
    Upfront,
    /// Payment on completion
    OnCompletion,
    /// Milestone-based payments
    Milestone(Vec<(Milestone, u128)>),
    /// Streaming payments (amount per time unit)
    Streaming(u128),
}

/// Task milestone
#[derive(Clone, PartialEq, Eq, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct Milestone {
    /// Milestone identifier
    pub id: [u8; 16],
    /// Description
    pub description: String,
    /// Completion criteria
    pub criteria: String,
}

/// Bid from an agent for a task
#[derive(Clone, PartialEq, Eq, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct Bid {
    /// Agent making the bid
    pub agent_id: AgentId,
    /// Task being bid on
    pub task_id: TaskId,
    /// Bid value (cost to complete)
    pub value: u128,
    /// Expected quality score (0.0 - 1.0 scaled to u32)
    pub quality_score: u32,
    /// Expected completion time in seconds
    pub completion_time: u64,
    /// Guarantees offered
    pub guarantees: Vec<Guarantee>,
}

/// Guarantees offered by an agent
#[derive(Clone, PartialEq, Eq, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub enum Guarantee {
    /// Completion by deadline
    CompletionTime(u64),
    /// Minimum quality score
    QualityScore(u32),
    /// Service level agreement
    SLA(String),
    /// Refund policy
    RefundPolicy(RefundPolicy),
}

/// Refund policy options
#[derive(Clone, PartialEq, Eq, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub enum RefundPolicy {
    /// No refund
    None,
    /// Full refund if criteria not met
    Full,
    /// Partial refund based on completion
    Partial(u32), // Percentage
    /// Time-based refund
    TimeBased(Vec<(u64, u32)>), // (time_threshold, refund_percentage)
}

/// Result of task execution
#[derive(Clone, PartialEq, Eq, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct TaskResult {
    /// Task identifier
    pub task_id: TaskId,
    /// Executor agent
    pub executor: AgentId,
    /// Output data
    pub output: Vec<u8>,
    /// Execution proof
    pub proof: Option<ExecutionProof>,
    /// Resources consumed
    pub resources_used: ResourceUsage,
    /// Completion timestamp
    pub completed_at: u64,
}

/// Proof of execution
#[derive(Clone, PartialEq, Eq, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub enum ExecutionProof {
    /// No proof
    None,
    /// TEE attestation
    TEEAttestation(Vec<u8>),
    /// Zero-knowledge proof
    ZKProof(Vec<u8>),
    /// Combined proof
    Combined {
        tee: Vec<u8>,
        zk: Vec<u8>,
    },
}

/// Resources used during execution
#[derive(Clone, PartialEq, Eq, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct ResourceUsage {
    /// CPU time in milliseconds
    pub cpu_time_ms: u64,
    /// Memory used in bytes
    pub memory_bytes: u64,
    /// Storage used in bytes
    pub storage_bytes: u64,
    /// Network bandwidth in bytes
    pub bandwidth_bytes: u64,
    /// GPU time in milliseconds (if applicable)
    pub gpu_time_ms: Option<u64>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_agent_id_creation() {
        let bytes = [1u8; 32];
        let agent_id = AgentId::new(bytes);
        assert_eq!(agent_id.as_bytes(), &bytes);
    }

    #[test]
    fn test_agent_id_from_slice() {
        let bytes = vec![2u8; 32];
        let agent_id = AgentId::from_slice(&bytes).unwrap();
        assert_eq!(agent_id.as_bytes(), &[2u8; 32]);

        // Test invalid length
        let invalid = vec![3u8; 31];
        assert!(AgentId::from_slice(&invalid).is_err());
    }
}
