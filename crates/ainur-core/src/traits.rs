//! Core traits for the Ainur Protocol

use crate::{errors::*, types::*};
use alloc::vec::Vec;

/// Trait for entities that can execute tasks
pub trait TaskExecutor {
    /// Check if this executor can handle the given task
    fn can_execute(&self, task: &Task) -> bool;

    /// Estimate resources and time needed for execution
    fn estimate(&self, task: &Task) -> Result<ExecutionEstimate>;

    /// Execute the task and return the result
    async fn execute(&mut self, task: Task) -> Result<TaskResult>;
}

/// Execution estimate
pub struct ExecutionEstimate {
    /// Estimated completion time in seconds
    pub completion_time: u64,
    /// Estimated resource usage
    pub resource_estimate: ResourceUsage,
    /// Confidence level (0-100)
    pub confidence: u32,
}

/// Trait for reputation systems
pub trait ReputationSystem {
    /// Calculate reputation score for an agent
    fn calculate_reputation(&self, agent_id: &AgentId, window: u64) -> Result<Reputation>;

    /// Update reputation based on task result
    fn update_reputation(&mut self, agent_id: &AgentId, result: &TaskResult) -> Result<()>;

    /// Apply decay to reputation scores
    fn apply_decay(&mut self, decay_rate: f64) -> Result<()>;

    /// Get top agents by reputation in a domain
    fn get_top_agents(&self, domain: &Domain, count: usize) -> Result<Vec<(AgentId, Reputation)>>;
}

/// Trait for verification systems
pub trait Verifier {
    /// Verify the execution of a task
    fn verify(&self, task: &Task, result: &TaskResult) -> Result<VerificationResult>;

    /// Get the verification level this verifier supports
    fn verification_level(&self) -> VerificationLevel;
}

/// Verification result
pub struct VerificationResult {
    /// Whether verification passed
    pub is_valid: bool,
    /// Confidence in the result (0-100)
    pub confidence: u32,
    /// Detailed verification report
    pub report: VerificationReport,
}

/// Detailed verification report
pub enum VerificationReport {
    /// Simple pass/fail
    Simple(bool),
    /// Detailed report with evidence
    Detailed {
        checks_performed: Vec<String>,
        evidence: Vec<u8>,
        notes: String,
    },
}

/// Trait for auction mechanisms
pub trait AuctionMechanism {
    /// Add a bid to the auction
    fn add_bid(&mut self, bid: Bid) -> Result<()>;

    /// Run the auction and determine allocations
    fn run_auction(&self) -> Result<AuctionResult>;

    /// Calculate payments based on the mechanism
    fn calculate_payments(&self, allocation: &Allocation) -> Result<PaymentSchedule>;
}

/// Auction result
pub struct AuctionResult {
    /// Task allocations
    pub allocations: Vec<Allocation>,
    /// Payments for each agent
    pub payments: Vec<(AgentId, u128)>,
    /// Social welfare achieved
    pub social_welfare: u128,
}

/// Task allocation
pub struct Allocation {
    /// Task being allocated
    pub task_id: TaskId,
    /// Agent assigned to the task
    pub agent_id: AgentId,
    /// Winning bid
    pub bid: Bid,
}

/// Trait for economic mechanisms
pub trait EconomicMechanism {
    /// Calculate incentive rewards
    fn calculate_rewards(&self, performance: &Performance) -> Result<u128>;

    /// Apply penalties for violations
    fn calculate_penalty(&self, violation: &Violation) -> Result<u128>;

    /// Determine fee structure
    fn calculate_fees(&self, transaction_type: TransactionType) -> Result<u128>;
}

/// Performance metrics
pub struct Performance {
    /// Tasks completed successfully
    pub tasks_completed: u64,
    /// Average quality score
    pub avg_quality: f64,
    /// On-time completion rate
    pub on_time_rate: f64,
}

/// Protocol violations
pub enum Violation {
    /// Failed to complete task
    TaskFailure(TaskId),
    /// Provided false information
    FalseInformation(String),
    /// Violated SLA
    SLAViolation(String),
    /// Other violation
    Other(String),
}

/// Transaction types in the protocol
pub enum TransactionType {
    /// Task submission
    TaskSubmission,
    /// Bid placement
    BidPlacement,
    /// Result submission
    ResultSubmission,
    /// Dispute filing
    DisputeFiling,
    /// Reputation update
    ReputationUpdate,
}

/// Trait for P2P message routing
pub trait MessageRouter {
    /// Route a message to its destination
    async fn route_message(&mut self, message: Message) -> Result<()>;

    /// Update routing tables based on network conditions
    fn update_routing(&mut self, metrics: NetworkMetrics) -> Result<()>;

    /// Get next hop for a destination
    fn get_next_hop(&self, destination: &AgentId) -> Option<PeerId>;
}

/// P2P message
pub struct Message {
    /// Sender ID
    pub from: AgentId,
    /// Recipient ID
    pub to: AgentId,
    /// Message payload
    pub payload: Vec<u8>,
    /// Time to live (hops)
    pub ttl: u8,
}

/// Network metrics
pub struct NetworkMetrics {
    /// Latency measurements
    pub latencies: Vec<(PeerId, u64)>,
    /// Bandwidth measurements
    pub bandwidth: Vec<(PeerId, u64)>,
    /// Peer reliability scores
    pub reliability: Vec<(PeerId, f64)>,
}

/// Peer identifier
#[derive(Clone, PartialEq, Eq, Hash)]
pub struct PeerId(pub Vec<u8>);

/// Trait for consensus participation
pub trait ConsensusParticipant {
    /// Propose a new block
    fn propose_block(&self, transactions: Vec<Transaction>) -> Result<Block>;

    /// Validate a proposed block
    fn validate_block(&self, block: &Block) -> Result<bool>;

    /// Finalize a block
    fn finalize_block(&mut self, block: Block) -> Result<()>;
}

/// Transaction type (placeholder)
pub struct Transaction(pub Vec<u8>);

/// Block type (placeholder)
pub struct Block {
    /// Block number
    pub number: u64,
    /// Parent hash
    pub parent_hash: [u8; 32],
    /// Transactions
    pub transactions: Vec<Transaction>,
    /// State root
    pub state_root: [u8; 32],
}

#[cfg(test)]
mod tests {
    use super::*;

    // Mock implementation for testing
    struct MockReputationSystem;

    impl ReputationSystem for MockReputationSystem {
        fn calculate_reputation(&self, _agent_id: &AgentId, _window: u64) -> Result<Reputation> {
            Ok(Reputation {
                quality: 80,
                reliability: 90,
                speed: 75,
                cost_efficiency: 85,
                specializations: vec![],
                stake: 1000,
            })
        }

        fn update_reputation(&mut self, _agent_id: &AgentId, _result: &TaskResult) -> Result<()> {
            Ok(())
        }

        fn apply_decay(&mut self, _decay_rate: f64) -> Result<()> {
            Ok(())
        }

        fn get_top_agents(
            &self,
            _domain: &Domain,
            _count: usize,
        ) -> Result<Vec<(AgentId, Reputation)>> {
            Ok(vec![])
        }
    }

    #[test]
    fn test_reputation_trait() {
        let mut system = MockReputationSystem;
        let agent_id = AgentId::new([1u8; 32]);

        let reputation = system.calculate_reputation(&agent_id, 86400).unwrap();
        assert_eq!(reputation.quality, 80);
        assert_eq!(reputation.reliability, 90);
    }
}
