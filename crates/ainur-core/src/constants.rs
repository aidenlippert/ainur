//! Protocol-wide constants

/// Network constants
pub mod network {
    /// Default P2P port
    pub const DEFAULT_P2P_PORT: u16 = 30333;
    
    /// Default RPC port
    pub const DEFAULT_RPC_PORT: u16 = 9933;
    
    /// Default WebSocket port
    pub const DEFAULT_WS_PORT: u16 = 9944;
    
    /// Maximum message size (1 MB)
    pub const MAX_MESSAGE_SIZE: usize = 1024 * 1024;
    
    /// Default message TTL (hops)
    pub const DEFAULT_MESSAGE_TTL: u8 = 64;
    
    /// Peer connection timeout (seconds)
    pub const PEER_CONNECTION_TIMEOUT: u64 = 30;
}

/// Blockchain constants
pub mod chain {
    /// Target block time (seconds)
    pub const TARGET_BLOCK_TIME: u64 = 6;
    
    /// Blocks per era
    pub const BLOCKS_PER_ERA: u64 = 14400; // ~24 hours at 6s blocks
    
    /// Maximum block size (5 MB)
    pub const MAX_BLOCK_SIZE: usize = 5 * 1024 * 1024;
    
    /// Maximum extrinsic size (1 MB)
    pub const MAX_EXTRINSIC_SIZE: usize = 1024 * 1024;
}

/// Economic constants
pub mod economics {
    /// Base token decimals
    pub const TOKEN_DECIMALS: u32 = 18;
    
    /// Minimum stake for validators
    pub const MIN_VALIDATOR_STAKE: u128 = 10_000 * 10_u128.pow(TOKEN_DECIMALS);
    
    /// Minimum stake for agents
    pub const MIN_AGENT_STAKE: u128 = 100 * 10_u128.pow(TOKEN_DECIMALS);
    
    /// Maximum inflation rate (5% per year)
    pub const MAX_INFLATION_RATE: f64 = 0.05;
    
    /// Transaction fee percentage (0.1%)
    pub const TRANSACTION_FEE_PERCENT: f64 = 0.001;
    
    /// Slashing percentage for violations (10%)
    pub const SLASHING_PERCENT: f64 = 0.10;
}

/// Reputation constants
pub mod reputation {
    /// Initial reputation score
    pub const INITIAL_SCORE: u32 = 50;
    
    /// Maximum reputation score
    pub const MAX_SCORE: u32 = 100;
    
    /// Minimum reputation score
    pub const MIN_SCORE: u32 = 0;
    
    /// Daily decay rate (1%)
    pub const DAILY_DECAY_RATE: f64 = 0.01;
    
    /// Reputation update weight for new tasks
    pub const UPDATE_WEIGHT: f64 = 0.1;
}

/// Task constants
pub mod task {
    /// Maximum task description length (10 KB)
    pub const MAX_DESCRIPTION_LENGTH: usize = 10 * 1024;
    
    /// Maximum task input size (100 MB)
    pub const MAX_INPUT_SIZE: usize = 100 * 1024 * 1024;
    
    /// Maximum task output size (100 MB)
    pub const MAX_OUTPUT_SIZE: usize = 100 * 1024 * 1024;
    
    /// Default task timeout (1 hour)
    pub const DEFAULT_TIMEOUT: u64 = 3600;
    
    /// Maximum task timeout (24 hours)
    pub const MAX_TIMEOUT: u64 = 86400;
}

/// Auction constants
pub mod auction {
    /// Minimum bid duration (5 minutes)
    pub const MIN_BID_DURATION: u64 = 300;
    
    /// Default bid duration (30 minutes)
    pub const DEFAULT_BID_DURATION: u64 = 1800;
    
    /// Maximum concurrent bids per agent
    pub const MAX_CONCURRENT_BIDS: usize = 100;
    
    /// Bid deposit percentage (1%)
    pub const BID_DEPOSIT_PERCENT: f64 = 0.01;
}

/// Verification constants
pub mod verification {
    /// Consensus threshold (2/3 + 1)
    pub const CONSENSUS_THRESHOLD_NUMERATOR: u32 = 2;
    pub const CONSENSUS_THRESHOLD_DENOMINATOR: u32 = 3;
    
    /// Maximum proof size (10 MB)
    pub const MAX_PROOF_SIZE: usize = 10 * 1024 * 1024;
    
    /// Verification timeout (5 minutes)
    pub const VERIFICATION_TIMEOUT: u64 = 300;
    
    /// Minimum verifiers for consensus
    pub const MIN_VERIFIERS: u8 = 3;
}

/// Resource limits
pub mod resources {
    /// Maximum CPU time per task (1 hour)
    pub const MAX_CPU_TIME_MS: u64 = 3_600_000;
    
    /// Maximum memory per task (16 GB)
    pub const MAX_MEMORY_BYTES: u64 = 16 * 1024 * 1024 * 1024;
    
    /// Maximum storage per task (100 GB)
    pub const MAX_STORAGE_BYTES: u64 = 100 * 1024 * 1024 * 1024;
    
    /// Maximum bandwidth per task (1 TB)
    pub const MAX_BANDWIDTH_BYTES: u64 = 1024 * 1024 * 1024 * 1024;
}

/// Protocol versioning
pub mod version {
    /// Current protocol version
    pub const PROTOCOL_VERSION: u32 = 1;
    
    /// Minimum supported protocol version
    pub const MIN_SUPPORTED_VERSION: u32 = 1;
    
    /// Protocol name
    pub const PROTOCOL_NAME: &str = "ainur";
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_constants_consistency() {
        // Ensure reputation scores are consistent
        assert!(reputation::MIN_SCORE < reputation::INITIAL_SCORE);
        assert!(reputation::INITIAL_SCORE < reputation::MAX_SCORE);
        
        // Ensure timeout constraints
        assert!(task::DEFAULT_TIMEOUT < task::MAX_TIMEOUT);
        
        // Ensure economic constraints
        assert!(economics::MIN_AGENT_STAKE < economics::MIN_VALIDATOR_STAKE);
    }
}
