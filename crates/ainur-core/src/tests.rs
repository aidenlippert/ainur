//! Tests for core functionality

#[cfg(test)]
mod tests {
    use crate::*;
    use proptest::prelude::*;

    proptest! {
        #[test]
        fn test_reputation_bounds(
            quality in 0u32..=100,
            reliability in 0u32..=100,
            speed in 0u32..=100,
            cost_efficiency in 0u32..=100,
            stake in 0u128..=1_000_000_000_000_000_000u128
        ) {
            let reputation = Reputation {
                quality,
                reliability,
                speed,
                cost_efficiency,
                specializations: vec![],
                stake,
            };

            assert!(reputation.quality <= constants::reputation::MAX_SCORE);
            assert!(reputation.reliability <= constants::reputation::MAX_SCORE);
            assert!(reputation.speed <= constants::reputation::MAX_SCORE);
            assert!(reputation.cost_efficiency <= constants::reputation::MAX_SCORE);
        }
    }

    #[test]
    fn test_agent_id_equality() {
        let id1 = AgentId::new([1u8; 32]);
        let id2 = AgentId::new([1u8; 32]);
        let id3 = AgentId::new([2u8; 32]);

        assert_eq!(id1, id2);
        assert_ne!(id1, id3);
    }

    #[test]
    fn test_task_creation() {
        let task = Task {
            id: TaskId::new([1u8; 32]),
            requester: AgentId::new([2u8; 32]),
            specification: TaskSpec {
                description: "Test task".to_string(),
                task_type: TaskType::Compute,
                input: vec![1, 2, 3],
                output_format: OutputFormat::Json,
                metadata: vec![],
            },
            requirements: Requirements {
                min_memory: Some(1024 * 1024),
                min_cpu_cores: Some(2),
                gpu_required: false,
                min_bandwidth: None,
                capabilities: vec![],
            },
            budget: Budget {
                max_cost: 1000,
                payment_schedule: PaymentSchedule::OnCompletion,
                escrow_required: true,
            },
            deadline: 1234567890,
            verification_level: VerificationLevel::BestEffort,
        };

        assert_eq!(task.specification.description, "Test task");
        assert_eq!(task.budget.max_cost, 1000);
    }

    #[test]
    fn test_verification_levels() {
        let levels = vec![
            VerificationLevel::None,
            VerificationLevel::BestEffort,
            VerificationLevel::Consensus(3),
            VerificationLevel::TEEAttested,
            VerificationLevel::ZKProof,
            VerificationLevel::TEEWithZK,
        ];

        // Ensure all variants can be created
        assert_eq!(levels.len(), 6);
    }

    #[test]
    fn test_payment_schedule_variants() {
        let upfront = PaymentSchedule::Upfront;
        let on_completion = PaymentSchedule::OnCompletion;
        let streaming = PaymentSchedule::Streaming(100);

        let milestone = PaymentSchedule::Milestone(vec![
            (
                Milestone {
                    id: [1u8; 16],
                    description: "Phase 1".to_string(),
                    criteria: "Complete analysis".to_string(),
                },
                500,
            ),
            (
                Milestone {
                    id: [2u8; 16],
                    description: "Phase 2".to_string(),
                    criteria: "Deliver results".to_string(),
                },
                500,
            ),
        ]);

        match milestone {
            PaymentSchedule::Milestone(milestones) => {
                assert_eq!(milestones.len(), 2);
                assert_eq!(milestones[0].1 + milestones[1].1, 1000);
            }
            _ => panic!("Expected milestone schedule"),
        }
    }

    #[test]
    fn test_resource_usage() {
        let usage = ResourceUsage {
            cpu_time_ms: 1000,
            memory_bytes: 1024 * 1024 * 512,   // 512 MB
            storage_bytes: 1024 * 1024 * 100,  // 100 MB
            bandwidth_bytes: 1024 * 1024 * 10, // 10 MB
            gpu_time_ms: Some(500),
        };

        assert_eq!(usage.cpu_time_ms, 1000);
        assert_eq!(usage.gpu_time_ms, Some(500));
    }

    #[test]
    fn test_capability_types() {
        let capabilities = vec![
            Capability::TEE(TEEType::SGX),
            Capability::ZKProof(ZKSystem::Groth16),
            Capability::Model("gpt-4".to_string()),
            Capability::Hardware(HardwareType::NvidiaGPU("A100".to_string())),
            Capability::Location("us-west-2".to_string()),
            Capability::Custom("custom".to_string(), "value".to_string()),
        ];

        assert_eq!(capabilities.len(), 6);
    }

    #[test]
    fn test_error_creation() {
        let err1 = CoreError::InvalidLength {
            expected: 32,
            actual: 16,
        };
        let err2 = ReputationError::InvalidScore(150);
        let err3 = TaskError::NotFound(TaskId::new([1u8; 32]));

        assert!(err1.to_string().contains("Invalid length"));
        assert!(err2.to_string().contains("must be 0-100"));
        assert!(err3.to_string().contains("Task not found"));
    }

    #[test]
    fn test_bid_creation() {
        let bid = Bid {
            agent_id: AgentId::new([1u8; 32]),
            task_id: TaskId::new([2u8; 32]),
            value: 800,
            quality_score: 95,
            completion_time: 3600,
            guarantees: vec![
                Guarantee::CompletionTime(3600),
                Guarantee::QualityScore(90),
                Guarantee::RefundPolicy(RefundPolicy::Full),
            ],
        };

        assert_eq!(bid.value, 800);
        assert_eq!(bid.guarantees.len(), 3);
    }

    #[test]
    fn test_execution_proof_variants() {
        let proofs = vec![
            ExecutionProof::None,
            ExecutionProof::TEEAttestation(vec![1, 2, 3, 4]),
            ExecutionProof::ZKProof(vec![5, 6, 7, 8]),
            ExecutionProof::Combined {
                tee: vec![1, 2, 3, 4],
                zk: vec![5, 6, 7, 8],
            },
        ];

        for proof in proofs {
            match proof {
                ExecutionProof::None => {}
                ExecutionProof::TEEAttestation(data) => assert!(!data.is_empty()),
                ExecutionProof::ZKProof(data) => assert!(!data.is_empty()),
                ExecutionProof::Combined { tee, zk } => {
                    assert!(!tee.is_empty());
                    assert!(!zk.is_empty());
                }
            }
        }
    }
}
