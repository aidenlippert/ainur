# Contributing to Ainur Protocol

Thank you for your interest in contributing to Ainur Protocol! This document provides guidelines and instructions for contributing.

## 🌟 Ways to Contribute

- **Code**: Fix bugs, implement features, improve performance
- **Documentation**: Improve docs, write tutorials, create examples
- **Testing**: Write tests, perform QA, report bugs
- **Design**: Protocol design, economic modeling, security analysis
- **Community**: Help others, organize events, spread the word

## 🚀 Getting Started

1. **Fork the repository** and clone your fork
2. **Set up development environment** using `./scripts/bootstrap.sh`
3. **Create a branch** for your feature or fix
4. **Make your changes** following our guidelines
5. **Test thoroughly** and ensure CI passes
6. **Submit a Pull Request** with a clear description

## 📋 Development Process

### 1. Before You Start

- Check existing issues and PRs to avoid duplicate work
- For major changes, open an issue first to discuss
- Join our Discord to coordinate with other contributors

### 2. Code Style

#### Rust Guidelines

```rust
// Good: Clear, documented, error-handled
/// Calculate the reputation score for an agent
/// 
/// # Arguments
/// * `agent_id` - The unique identifier of the agent
/// * `window` - Time window for reputation calculation
/// 
/// # Returns
/// * `Result<ReputationScore, ReputationError>` - Score or error
pub fn calculate_reputation(
    agent_id: &AgentId,
    window: Duration,
) -> Result<ReputationScore, ReputationError> {
    // Implementation with proper error handling
    todo!()
}

// Bad: Unclear, undocumented, unwraps
pub fn calc_rep(id: &str, w: u64) -> f64 {
    let agent = get_agent(id).unwrap();
    agent.score.unwrap()
}
```

#### General Rules

- Use descriptive variable names
- Document all public APIs
- Write tests for new functionality
- Keep functions focused and small
- Handle errors explicitly

### 3. Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): subject

body (optional)

footer (optional)
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Test additions/changes
- `chore`: Build process/auxiliary tool changes

Examples:
```bash
feat(p2p): implement Q-routing algorithm
fix(chain): resolve consensus stall under high load
docs(sdk): add Python SDK examples
perf(runtime): optimize WASM execution by 20%
```

### 4. Pull Request Process

1. **Update documentation** for any changed functionality
2. **Add tests** that prove your fix/feature works
3. **Update CHANGELOG.md** with notable changes
4. **Ensure CI passes** all checks
5. **Request review** from maintainers
6. **Address feedback** promptly and professionally

#### PR Title Format
```
[Component] Brief description

Examples:
[Chain] Add VCG auction pallet
[P2P] Fix message routing under partition
[Docs] Improve agent development guide
```

#### PR Description Template
```markdown
## Description
Brief description of changes

## Motivation
Why are these changes needed?

## Changes
- Change 1
- Change 2

## Testing
How has this been tested?

## Checklist
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] No breaking changes OR migration guide provided
```

## 🧪 Testing Requirements

### Unit Tests
- Test individual functions and modules
- Aim for 80%+ coverage on new code
- Use property-based testing where applicable

### Integration Tests
- Test component interactions
- Cover critical user journeys
- Test error scenarios

### Example Test
```rust
#[cfg(test)]
mod tests {
    use super::*;
    use proptest::prelude::*;

    #[test]
    fn test_reputation_calculation() {
        let agent_id = AgentId::new();
        let score = calculate_reputation(&agent_id, Duration::from_days(30))
            .expect("Failed to calculate reputation");
        
        assert!(score.quality >= 0.0 && score.quality <= 100.0);
    }

    proptest! {
        #[test]
        fn test_reputation_bounds(quality in 0.0..=100.0) {
            let score = ReputationScore::new(quality);
            prop_assert!(score.is_valid());
        }
    }
}
```

## 🏗️ Architecture Decisions

For significant architectural changes:

1. Create an ADR (Architecture Decision Record) in `docs/adr/`
2. Use template: `docs/adr/template.md`
3. Discuss in issue before implementing
4. Get consensus from core team

## 🔒 Security Considerations

- Always consider security implications
- Get security review for consensus/crypto changes
- Follow secure coding practices
- Report vulnerabilities privately to security@ainur.ai

## 📊 Performance Guidelines

- Profile before optimizing
- Document performance characteristics
- Add benchmarks for critical paths
- Consider resource constraints (CPU, memory, network)

## 🌍 Internationalization

- Use string constants for user-facing text
- Support UTF-8 throughout
- Consider global users in UX decisions

## 📝 Documentation Standards

- Document all public APIs
- Include examples in rustdoc
- Keep README files updated
- Write clear commit messages

### Documentation Example
```rust
/// Performs a Vickrey-Clarke-Groves auction for task allocation.
/// 
/// This implements a truthful auction mechanism where agents are incentivized
/// to bid their true valuations. The winning agents pay the externality they
/// impose on other participants.
/// 
/// # Arguments
/// 
/// * `tasks` - List of tasks to be auctioned
/// * `bids` - Map of (agent_id, task_id) to bid values
/// * `constraints` - Additional constraints on allocation
/// 
/// # Returns
/// 
/// Returns `AuctionResult` containing allocations and payments, or an error
/// if the auction cannot be completed.
/// 
/// # Example
/// 
/// ```rust
/// let tasks = vec![task1, task2];
/// let mut bids = HashMap::new();
/// bids.insert((agent1, task1.id), Bid::new(100));
/// 
/// let result = run_vcg_auction(tasks, bids, Default::default())?;
/// assert_eq!(result.allocations[&task1.id], agent1);
/// ```
/// 
/// # Errors
/// 
/// - `AuctionError::InsufficientBids` - Not enough bids for allocation
/// - `AuctionError::InvalidBid` - Bid violates constraints
pub fn run_vcg_auction(
    tasks: Vec<Task>,
    bids: HashMap<(AgentId, TaskId), Bid>,
    constraints: AuctionConstraints,
) -> Result<AuctionResult, AuctionError> {
    // Implementation
    todo!()
}
```

## 🤝 Code of Conduct

All contributors must follow our [Code of Conduct](CODE_OF_CONDUCT.md). Be respectful, inclusive, and professional.

## ❓ Getting Help

- **Discord**: Join our [Discord server](https://discord.gg/ainur)
- **Issues**: Check existing issues or create new ones
- **Docs**: Read the [developer documentation](https://docs.ainur.ai)
- **Office Hours**: Weekly community calls (see Discord for schedule)

## 🎖️ Recognition

Contributors are recognized in:
- CONTRIBUTORS.md file
- Release notes
- Project website
- Annual contributor report

## 📄 License

By contributing, you agree that your contributions will be licensed under the same license as the project (Apache 2.0 / MIT dual license).

---

Thank you for contributing to the future of decentralized AI coordination! 🚀
