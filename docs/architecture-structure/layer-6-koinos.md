---
title: Layer 6 - Koinos (Economic Layer)
author: Ainur Labs
date: November 2025
version: 1.0
---

# Layer 6: Koinos (Economic Mechanisms)

## Abstract

The Koinos layer implements the economic mechanisms that govern value flows, incentive structures, and strategic behavior in the Ainur Protocol. It encompasses the AINU token design, Vickrey-Clarke-Groves auction implementation for task allocation, multi-dimensional reputation systems, staking and slashing conditions, and treasury governance. This document provides formal specifications for each mechanism and analyzes their game-theoretic properties.

## 1. Token Design

### 1.1 AINU Token Specification

**Token Standard**: Native Substrate token with ERC-20 bridge for Ethereum compatibility

**Properties**:
- **Symbol**: AINU
- **Decimals**: 18
- **Initial supply**: 100,000,000 AINU
- **Max supply**: Unbounded (controlled inflation)

### 1.2 Supply Dynamics

**Inflation Schedule**:

```
I(t) = I_0 · (1 - δ)^t  where t is years since genesis
```

Parameters:
- \( I_0 = 0.05 \) (5% initial annual inflation)
- \( \delta = 0.005 \) (0.5% annual reduction in inflation rate)
- Floor: 1% minimum inflation rate

**Distribution of Newly Minted Tokens**:
- 70% to validators (block rewards)
- 20% to treasury
- 10% to agent incentive pool

### 1.3 Burn Mechanisms

Deflationary pressure through:
- **Transaction fees**: Base fee component is burned (EIP-1559 style)
- **Slashing**: Slashed stake is burned rather than redistributed
- **Failed escrows**: Unclaimed escrowed funds after timeout period

## 2. Vickrey-Clarke-Groves Auctions

### 2.1 Mechanism Definition

For task allocation among strategic agents, Ainur employs VCG auctions.

**Input**: 
- Tasks \( T = \{t_1, ..., t_m\} \)
- Agents \( A = \{a_1, ..., a_n\} \)
- Bids \( b_{ij} \): Agent \( i \)'s cost for task \( j \)

**Output**:
- Allocation \( x: T \to A \cup \{\perp\} \)
- Payments \( p_i \) for each agent \( i \)

**Allocation Rule**:

```
x^* = argmax_{x} \sum_{j} (V_j - b_{x(j),j})
```

Where \( V_j \) is the task budget.

**Payment Rule**:

For agent \( i \) assigned task \( j \):

```
p_i = [W_{-i} - (W - b_{ij})]
```

Where:
- \( W \): Total welfare under optimal allocation with all agents
- \( W_{-i} \): Total welfare under optimal allocation without agent \( i \)

### 2.2 Incentive Compatibility

**Theorem 2.1**: Truth-telling is a dominant strategy in the VCG mechanism.

**Proof**: Agent \( i \)'s utility given true cost \( c_i \) and reported cost \( b_i \):

```
u_i(b_i, b_{-i}) = {
    p_i - c_i  if agent i wins
    0          otherwise
}
```

Substituting VCG payment:

```
u_i(b_i, b_{-i}) = W_{-i} - (W - c_i)  if i wins
```

This expression is independent of \( b_i \), hence truthful bidding \( b_i = c_i \) is weakly dominant. ∎

### 2.3 Computational Complexity

Optimal VCG allocation is NP-hard for general task graphs. Ainur uses:

- **Hungarian algorithm**: O(n³) for bipartite matching (single-task-per-agent)
- **Greedy approximation**: O(n log n) for large auctions with bounded approximation ratio
- **Auction time limits**: Auctions close after fixed duration; late bids excluded

## 3. Reputation System

### 3.1 Multi-Dimensional Scoring

Agent reputation \( R_i \) is a vector:

```
R_i = (R_quality, R_reliability, R_speed, R_cost_efficiency, R_stake)
```

Each dimension scored 0-100.

### 3.2 Update Dynamics

After task completion, reputation updates according to:

```
R_i(t+1) = (1-β)R_i(t) + α·P_i(t) + γ·S_i(t)
```

Where:
- \( \beta = 0.01 \): Daily decay rate
- \( \alpha = 0.1 \): Performance update weight
- \( P_i(t) \): Normalized performance feedback (0-100)
- \( \gamma = 0.05 \): Stake amplification
- \( S_i(t) = \min(100, \text{stake}_i / 1000) \): Stake-derived bonus

**Performance Feedback**:

```
P_quality = verifier_score (if verified)
P_reliability = 100 if completed, 0 if failed
P_speed = 100 · (1 - actual_time/deadline)
P_cost = 100 · (bid_cost / budget)
```

### 3.3 Reputation Decay

Reputation decays to prevent indefinite benefit from historical performance:

```
R_i(t + Δt) = R_i(t) · (1 - β)^{Δt}
```

where \( \Delta t \) is in days.

**Equilibrium**: An agent maintaining constant performance level \( P \) converges to equilibrium reputation:

```
R_∞ = αP / β ≈ 10P
```

## 4. Staking and Slashing

### 4.1 Staking Requirements

**Validators**:
- Minimum stake: 10,000 AINU
- Stake locked for bonding period (28 days unbonding)

**Agents**:
- Minimum stake: 100 AINU
- Proportional to maximum concurrent task value

### 4.2 Slashing Conditions

| Offense | Slash Amount | Description |
|---------|--------------|-------------|
| Task failure | 10% of task value | Agent failed to deliver within deadline |
| Invalid result | 50% of stake | Output failed verification |
| Double-bidding | 25% of stake | Submitted bids for same task to multiple auctions |
| Equivocation | 100% of stake | Validator signed conflicting blocks |
| Long-term unavailability | 1% per day | Validator offline >24 hours |

**Slashing Execution**:
1. Evidence submitted on-chain
2. Challenge period (24 hours) for dispute
3. If unchallenged or dispute fails, slash is executed
4. Slashed tokens are burned

### 4.3 Slashing Game Theory

**Proposition 4.1**: Under rational agent model, expected slashing cost exceeds expected gain from deviation for all common attack strategies given current parameter settings.

## 5. Fee Structure

### 5.1 Transaction Fees

```
F_total = F_base + F_priority + F_tip
```

**Base Fee**: Adjusts dynamically based on block utilization (EIP-1559 mechanism)

```
F_base(t+1) = F_base(t) · (1 + δ·(U - U_target))
```

Where:
- \( U \): Block utilization (0-1)
- \( U_{target} = 0.5 \): Target utilization
- \( \delta = 0.125 \): Adjustment factor

**Priority Fee**: Minimum fee to include transaction in current block

**Tip**: Optional additional payment to block producer for expedited inclusion

### 5.2 Verification Fees

Verification costs are borne by task requester and set per verification level:

| Level | Fee | Payee |
|-------|-----|-------|
| None | 0 | - |
| Optimistic | 0.1% task value | Challenger if fraud proven |
| Consensus (n=3) | 0.5% task value | n verifiers |
| TEE | 1% task value | TEE operator |
| ZK | 2-5% task value | Proof generator |

## 6. Treasury and Governance

### 6.1 Treasury Funding

Treasury receives:
- 20% of inflation
- Protocol fees (domain registrations, on-chain storage)
- Donations and grants

### 6.2 Treasury Expenditure

**Spending Proposals**:
- Submitted by community with deposit
- Referendum required for approval (early stage: technical committee)
- Disbursement in milestones with verification

**Categories**:
- Protocol development and audits
- Community grants and hackathons
- Public goods funding (via quadratic funding)
- Marketing and ecosystem growth

### 6.3 Quadratic Funding

For public goods, treasury matches community contributions using quadratic formula:

```
M_j = C · [ (Σ_i sqrt(c_ij))² - Σ_i c_ij ] / Σ_j [ (Σ_i sqrt(c_ij))² - Σ_i c_ij ]
```

Where:
- \( c_{ij} \): Contribution from individual \( i \) to project \( j \)
- \( C \): Total matching pool
- \( M_j \): Matching funds for project \( j \)

**Anti-Collusion**: Pairwise bounded coordination subsidy to detect and penalize coordinated contributions.

## 7. Incentive Analysis

### 7.1 Validator Incentives

**Revenue streams**:
- Block rewards: \( R_{block} \approx 0.5 \) AINU per block
- Transaction fees: Variable, depends on network activity
- Slashing of misbehaving validators (distributed to whistleblowers)

**Costs**:
- Infrastructure (compute, bandwidth, storage)
- Risk of slashing due to operational failures

**Break-even analysis**: At current token price and network activity, validators require ~500 AINU revenue per day to cover infrastructure costs.

### 7.2 Agent Incentives

**Revenue**:
- Task payments from successful executions
- Reputation-weighted probability of winning future auctions

**Costs**:
- Compute and bandwidth for task execution
- Risk of slashing for failures or incorrect outputs
- Opportunity cost of staked capital

**Optimal strategy**: Bid true cost in VCG auction (dominant strategy) and maintain high reputation through quality work.

### 7.3 Attack Cost Analysis

**Sybil Attack**:
- Cost: 100 AINU stake per identity
- Benefit: Negligible (reputation starts at 50, takes time to build)
- Conclusion: Not profitable unless attacker can pass verifications and build reputation across many identities faster than honest agents

**Reputation Manipulation**:
- Cost: Must consistently outperform in tasks to inflate reputation
- Benefit: Higher probability of winning auctions
- Conclusion: Aligned with protocol objectives; if agent performs well, high reputation is deserved

## 8. Parameter Governance

Economic parameters are adjustable via on-chain governance:

- Inflation rate and distribution
- Fee multipliers and burn rate
- Slashing percentages
- Minimum stake requirements
- Auction duration and bidding rules

**Change Process**:
1. Parameter change proposal with rationale
2. Economic modeling and simulation
3. Community discussion period (≥7 days)
4. On-chain referendum
5. If approved, enact at next era boundary

## Conclusion

The Koinos economic layer provides the incentive structure that aligns individual agent behavior with collective protocol objectives. Through incentive-compatible auction mechanisms, reputation-weighted selection, and carefully calibrated staking and slashing, the protocol achieves robust coordination among rational agents operating in adversarial conditions.

## References

[1] W. Vickrey, "Counterspeculation, Auctions, and Competitive Sealed Tenders," *Journal of Finance*, vol. 16, no. 1, pp. 8–37, 1961.

[2] E. H. Clarke, "Multipart Pricing of Public Goods," *Public Choice*, vol. 11, pp. 17–33, 1971.

[3] T. Groves, "Incentives in Teams," *Econometrica*, vol. 41, no. 4, pp. 617–631, 1973.

[4] V. Buterin, "On Radical Markets," *Vitalik.ca*, 2018.

[5] V. Buterin, H. Hitzig, and E. Glen Weyl, "A Flexible Design for Funding Public Goods," *Management Science*, 2019.
