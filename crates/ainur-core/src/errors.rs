//! Error types for the Ainur Protocol

use thiserror::Error;

/// Core error types used throughout the protocol
#[derive(Error, Debug)]
pub enum CoreError {
    /// Invalid length for a fixed-size type
    #[error("Invalid length: expected {expected}, got {actual}")]
    InvalidLength { expected: usize, actual: usize },

    /// Invalid format or encoding
    #[error("Invalid format: {0}")]
    InvalidFormat(String),

    /// Value out of allowed range
    #[error("Value out of range: {value} not in [{min}, {max}]")]
    OutOfRange { value: u128, min: u128, max: u128 },

    /// Required capability not available
    #[error("Missing capability: {0}")]
    MissingCapability(String),

    /// Invalid state transition
    #[error("Invalid state transition: {from} -> {to}")]
    InvalidStateTransition { from: String, to: String },

    /// Deadline exceeded
    #[error("Deadline exceeded: {deadline}")]
    DeadlineExceeded { deadline: u64 },

    /// Insufficient resources
    #[error("Insufficient resources: {resource}")]
    InsufficientResources { resource: String },

    /// Verification failed
    #[error("Verification failed: {reason}")]
    VerificationFailed { reason: String },

    /// Economic constraint violation
    #[error("Economic constraint violation: {constraint}")]
    EconomicConstraintViolation { constraint: String },

    /// Serialization error
    #[error("Serialization error: {0}")]
    SerializationError(String),

    /// Cryptographic error
    #[error("Cryptographic error: {0}")]
    CryptoError(String),

    /// Network error
    #[error("Network error: {0}")]
    NetworkError(String),

    /// Storage error
    #[error("Storage error: {0}")]
    StorageError(String),

    /// Generic error with custom message
    #[error("{0}")]
    Custom(String),
}

/// Result type alias using CoreError
pub type Result<T> = core::result::Result<T, CoreError>;

/// Reputation-related errors
#[derive(Error, Debug)]
pub enum ReputationError {
    /// Invalid score value
    #[error("Invalid reputation score: {0} (must be 0-100)")]
    InvalidScore(u32),

    /// Insufficient stake
    #[error("Insufficient stake: required {required}, available {available}")]
    InsufficientStake { required: u128, available: u128 },

    /// Slashing conditions met
    #[error("Slashing condition triggered: {reason}")]
    SlashingTriggered { reason: String },
}

/// Task-related errors
#[derive(Error, Debug)]
pub enum TaskError {
    /// Task not found
    #[error("Task not found: {0:?}")]
    NotFound(crate::types::TaskId),

    /// Task already exists
    #[error("Task already exists: {0:?}")]
    AlreadyExists(crate::types::TaskId),

    /// Invalid task specification
    #[error("Invalid task specification: {0}")]
    InvalidSpecification(String),

    /// Task already assigned
    #[error("Task already assigned to agent {0:?}")]
    AlreadyAssigned(crate::types::AgentId),

    /// Task execution failed
    #[error("Task execution failed: {0}")]
    ExecutionFailed(String),
}

/// Auction-related errors
#[derive(Error, Debug)]
pub enum AuctionError {
    /// Insufficient bids for allocation
    #[error("Insufficient bids: {available} bids for {required} tasks")]
    InsufficientBids { available: usize, required: usize },

    /// Invalid bid
    #[error("Invalid bid: {0}")]
    InvalidBid(String),

    /// Auction already finalized
    #[error("Auction already finalized")]
    AlreadyFinalized,

    /// Bidding period expired
    #[error("Bidding period expired")]
    BiddingExpired,
}

/// Verification-related errors
#[derive(Error, Debug)]
pub enum VerificationError {
    /// Invalid proof format
    #[error("Invalid proof format: {0}")]
    InvalidProof(String),

    /// Proof verification failed
    #[error("Proof verification failed: {0}")]
    VerificationFailed(String),

    /// Untrusted attestation
    #[error("Untrusted attestation: {0}")]
    UntrustedAttestation(String),

    /// Missing verifier
    #[error("Missing verifier for type: {0}")]
    MissingVerifier(String),
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_core_error_display() {
        let err = CoreError::InvalidLength {
            expected: 32,
            actual: 16,
        };
        assert_eq!(err.to_string(), "Invalid length: expected 32, got 16");
    }

    #[test]
    fn test_reputation_error() {
        let err = ReputationError::InvalidScore(150);
        assert_eq!(
            err.to_string(),
            "Invalid reputation score: 150 (must be 0-100)"
        );
    }
}
