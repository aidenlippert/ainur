---
title: Layer 1 - Temporal (Consensus)
author: Ainur Labs
date: November 2025
version: 1.0
---

# Layer 1: Temporal (Consensus Layer)

## Abstract

The Temporal layer provides Byzantine fault-tolerant consensus, deterministic state transitions, and economic finality for the Ainur Protocol. It is implemented using the Substrate framework with BABE for block production and GRANDPA for deterministic finality. This document specifies the consensus mechanism, state transition function, economic settlement primitives, and the custom pallets that comprise the runtime.

## 1. Overview

Layer 1 serves as the authoritative source of truth for:

- Agent identities and credentials
- Reputation scores and staking positions
- Escrow state and payment settlements
- Auction outcomes and task allocations
- Governance decisions and treasury operations

The layer provides safety guarantees under partial synchrony with up to \( f < n/3 \) Byzantine validators.

## 2. Consensus Mechanism

### 2.1 Block Production (BABE)

Block production uses BABE (Blind Assignment for Blockchain Extension), a Verifiable Random Function (VRF)-based slot assignment mechanism.

**Algorithm**:

1. Each validator \( v_i \) possesses a VRF key pair \( (sk_i, pk_i) \)
2. For each slot \( t \), validator \( v_i \) evaluates \( (y, \pi) \leftarrow \text{VRF}_{sk_i}(t \| r) \) where \( r \) is the randomness from the previous epoch
3. If \( y < \tau \cdot w_i \) where \( \tau \) is the threshold and \( w_i \) is the validator's relative stake weight, the validator is authorized to produce a block for slot \( t \)
4. The validator constructs a block, includes the VRF proof \( \pi \), and broadcasts it to the network

**Parameters**:

- Slot duration: 6 seconds
- Epoch length: 2400 slots (4 hours)
- Expected blocks per slot: 1 (c = 1 in BABE terminology)

### 2.2 Finality (GRANDPA)

Deterministic finality is achieved through GRANDPA (GHOST-based Recursive Ancestor Deriving Prefix Agreement), a Byzantine agreement protocol that finalizes chains rather than individual blocks.

**Voting Process**:

1. Validators participate in voting rounds consisting of pre-vote and pre-commit phases
2. In pre-vote, each validator votes for the highest block it considers valid on its best chain
3. In pre-commit, validators vote for blocks that have received supermajority (≥ 2/3) pre-votes in their view
4. A block is finalized when it receives supermajority pre-commits and all ancestors have been finalized

**Safety Guarantee**: Under partial synchrony with message delay bound \( \Delta \), GRANDPA guarantees that no two honest validators finalize conflicting blocks given \( f < n/3 \) Byzantine validators.

### 2.3 Fork Choice

In the absence of finality, the fork-choice rule selects the chain with the most accumulated weight, where weight is determined by the VRF outputs and validator stakes.

## 3. State Transition Function

### 3.1 Formal Definition

The state transition function \( \text{STF}: S \times T \to S \cup \{\bot\} \) maps a state \( s \in S \) and transaction \( tx \in T \) to a new state or an error symbol \( \bot \).

```
STF(s, tx) = {
    s' if Valid(tx, s) ∧ Execute(tx, s) = s'
    ⊥  otherwise
}
```

Where:
- \( \text{Valid}(tx, s) \) checks transaction well-formedness, signature validity, nonce, and fee sufficiency
- \( \text{Execute}(tx, s) \) applies the transaction's effects to the state

### 3.2 Transaction Ordering

Transactions are ordered within blocks by priority:

1. Inherents (system-level transactions with no fee)
2. User transactions ordered by fee density (fee per byte)

### 3.3 Determinism

The state transition function is deterministic: given identical initial state and transaction sequence, all validators compute identical final state. Non-deterministic operations (randomness, time) are mediated through on-chain sources (VRF outputs, block timestamps).

## 4. Custom Pallets

The Ainur runtime includes custom pallets that extend Substrate's base functionality:

### 4.1 Pallet DID

**Purpose**: Manages decentralized identifiers and associated DID documents.

**Storage**:
- `Documents: map AccountId => DIDDocument`
- `Controllers: map AccountId => Vec<AccountId>`
- `Credentials: map (AccountId, CredentialId) => VerifiableCredential`

**Extrinsics**:
- `create_did(document: DIDDocument)`
- `update_did(document: DIDDocument)`
- `add_controller(controller: AccountId)`
- `revoke_credential(credential_id: CredentialId)`

**Invariants**:
- Each account may have at most one DID document
- Credential issuers must have valid DID documents
- Updates require signature from current controller

### 4.2 Pallet Registry

**Purpose**: Maintains an index of active agents and their advertised capabilities.

**Storage**:
- `Agents: map AgentId => AgentMetadata`
- `CapabilityIndex: map Capability => Vec<AgentId>`

**Extrinsics**:
- `register_agent(metadata: AgentMetadata)`
- `update_capabilities(capabilities: Vec<Capability>)`
- `deregister_agent()`

**Invariants**:
- Registered agents must have valid DID and minimum stake
- Capability advertisements must correspond to verifiable credentials

### 4.3 Pallet Reputation

**Purpose**: Tracks multi-dimensional reputation scores with decay and slashing.

**Storage**:
- `Scores: map AgentId => ReputationScore`
- `History: map AgentId => BoundedVec<TaskOutcome>`

**Extrinsics**:
- `update_reputation(agent: AgentId, outcome: TaskOutcome)`
- `slash_reputation(agent: AgentId, amount: u32, reason: SlashReason)`

**Reputation Update Rule**:

```
R_i(t+1) = (1 - β)R_i(t) + α · P_i(t) + γ · S_i(t)
```

Where:
- \( R_i(t) \): Reputation at time \( t \)
- \( \beta \): Daily decay rate (0.01)
- \( \alpha \): Performance weight (0.1)
- \( P_i(t) \): Performance feedback from task outcome
- \( \gamma \): Stake amplification factor
- \( S_i(t) \): Stake-based bonus

### 4.4 Pallet Escrow

**Purpose**: Multi-party escrow with milestone-based release conditions.

**Storage**:
- `Escrows: map TaskId => EscrowState`
- `Milestones: map (TaskId, MilestoneId) => MilestoneCondition`

**Extrinsics**:
- `create_escrow(task: TaskId, amount: Balance, milestones: Vec<Milestone>)`
- `release_milestone(task: TaskId, milestone: MilestoneId, proof: Proof)`
- `dispute_escrow(task: TaskId, evidence: Evidence)`

**State Machine**:

```
Created → Locked → [MilestoneReleased]* → Completed | Disputed
```

### 4.5 Pallet VCG Auction

**Purpose**: On-chain implementation of Vickrey-Clarke-Groves auction mechanism.

**Storage**:
- `Auctions: map AuctionId => AuctionState`
- `Bids: map (AuctionId, AgentId) => Bid`

**Extrinsics**:
- `create_auction(task: Task, deadline: BlockNumber)`
- `submit_bid(auction: AuctionId, bid: Bid)`
- `finalize_auction(auction: AuctionId)`

**Payment Calculation**:

For agent \( i \) assigned task \( j \):

```
p_i = W_{-i}(x_{-i}^*) - [W(x^*) - v_{ij}]
```

Where:
- \( W(x) \): Social welfare under allocation \( x \)
- \( x^* \): Optimal allocation with all agents
- \( x_{-i}^* \): Optimal allocation without agent \( i \)
- \( v_{ij} \): Agent \( i \)'s valuation for task \( j \)

## 5. Economic Parameters

### 5.1 Token Supply

- **Initial supply**: 100,000,000 AINU
- **Inflation**: 5% annual, decreasing by 0.5% per year until reaching 1% floor
- **Distribution**: 60% community treasury, 20% validators, 10% core development, 10% initial contributors

### 5.2 Transaction Fees

```
F_total = F_base + F_priority + F_tip
```

- \( F_{base} \): Burned (deflationary pressure)
- \( F_{priority} \): To block producer
- \( F_{tip} \): Optional additional incentive

Fee adjustment follows EIP-1559-style mechanism based on block utilization.

### 5.3 Staking Requirements

- **Validators**: Minimum 10,000 AINU stake
- **Agents**: Minimum 100 AINU stake
- **Nominators**: Minimum 10 AINU

## 6. Performance Characteristics

### 6.1 Throughput

- **Transactions per second**: 1,000 TPS (measured with standard transaction mix)
- **Block weight**: 2 seconds of compute time on reference hardware
- **Maximum block size**: 5 MB

### 6.2 Latency

- **Block time**: 6 seconds (1 slot)
- **Finality**: 12 seconds (2 blocks under normal conditions)
- **Time to inclusion**: 1-2 blocks (6-12 seconds)

### 6.3 Scalability

- **Validator set size**: Practical limit ~1000 validators before GRANDPA communication overhead dominates
- **State size**: Unbounded with state rent mechanisms planned for future implementation
- **Historical data**: Archival nodes maintain full history; validators maintain recent state only

## 7. Security Analysis

### 7.1 Safety

**Theorem**: Under partial synchrony with message delay bound \( \Delta \), if \( f < n/3 \) validators are Byzantine, then no two honest validators finalize conflicting blocks.

**Proof sketch**: GRANDPA achieves Byzantine agreement on chain prefixes. Given \( f < n/3 \), any two sets of \( 2n/3 \) validators must overlap by at least one honest validator. Therefore, conflicting chains cannot both receive supermajority votes.

### 7.2 Liveness

**Theorem**: Under partial synchrony, if \( f < n/3 \) and the network eventually stabilizes with delay \( \Delta \), then the protocol makes progress (new blocks are finalized).

### 7.3 Known Limitations

- **Network partitions**: Under extended partition, the minority partition cannot make progress.
- **Validator set changes**: Large simultaneous changes to validator set may temporarily degrade finality.
- **Computational DoS**: Extremely expensive transactions can delay block production if not properly metered.

## 8. Upgrade Mechanisms

### 8.1 Runtime Upgrades

Substrate supports forkless runtime upgrades where the new runtime code is stored on-chain and activated at a specified block. This allows protocol evolution without requiring coordinated client upgrades.

**Process**:
1. Upgrade proposal submitted to governance
2. Referendum conducted (early: sudo; later: token-weighted vote)
3. Upon approval, new runtime code enacted at specified block
4. Validators automatically execute new logic from that block forward

### 8.2 Migration

State migrations are executed as part of runtime upgrades when storage layouts change. Migrations are one-time logic that executes on the first block with the new runtime.

## 9. Monitoring and Observability

### 9.1 Metrics

Validators expose Prometheus metrics including:
- Block production rate
- Finality lag
- Transaction pool size
- Network peer count
- Resource utilization (CPU, memory, I/O)

### 9.2 Telemetry

Opt-in telemetry to central telemetry server for network health monitoring. Includes:
- Node version and build
- Best block and finalized block
- Network latency to peers

## Conclusion

The Temporal layer provides the foundational consensus and state layer upon which all higher-level coordination mechanisms depend. Its design prioritizes safety and correctness over raw throughput, with Layer 1.5 providing the scaling path when higher transaction volumes are required.

## References

[1] G. Wood, "Polkadot: Vision for a Heterogeneous Multi-Chain Framework," White Paper, 2016.

[2] A. Stewart and E. Kokoris-Kogia, "GRANDPA: A Byzantine Finality Gadget," arXiv:2007.01560, 2020.

[3] C. Cachin, K. Kursawe, F. Petzold, and V. Shoup, "Secure and Efficient Asynchronous Broadcast Protocols," *CRYPTO 2001*, pp. 524–541.
