# Contributing to Ainur Protocol

Thank you for your interest in contributing to Ainur Protocol. This document provides guidelines and instructions for contributing to the project.

## Ways to Contribute

Contributions to Ainur Protocol may take several forms:

- **Code contributions**: Bug fixes, feature implementations, performance optimizations
- **Documentation**: Improvements to technical documentation, tutorials, and examples
- **Testing**: Unit tests, integration tests, quality assurance, and bug reports
- **Design**: Protocol design proposals, economic modeling, and security analysis
- **Community**: Helping other contributors, organizing events, and improving accessibility

## Getting Started

### Prerequisites

Before contributing, ensure you have:

1. Reviewed the project documentation and architecture
2. Set up the development environment using `./scripts/bootstrap.sh`
3. Familiarized yourself with the coding standards and guidelines below

### Contribution Workflow

1. Fork the repository and clone your fork locally
2. Create a feature branch from `main` for your work
3. Implement your changes following the guidelines in this document
4. Add appropriate tests and documentation
5. Ensure all continuous integration checks pass
6. Submit a pull request with a clear description of the changes

For significant changes, open an issue first to discuss the proposed approach with maintainers.

## Development Standards

### Rust Code Guidelines

All Rust code must adhere to the following standards:

**Error Handling**: Use `Result<T, E>` for all fallible operations. The use of `.unwrap()` is prohibited in production code paths unless accompanied by documented safety invariants.

**Documentation**: All public functions, types, and modules require comprehensive rustdoc comments including:

- Purpose and behavior description
- Parameter descriptions with types
- Return value description
- Error conditions
- Usage examples where appropriate

**Example**:

```rust
/// Calculate the reputation score for an agent over a specified time window.
/// 
/// # Arguments
/// 
/// * `agent_id` - The unique identifier of the agent
/// * `window` - Time window in seconds for reputation calculation
/// 
/// # Returns
/// 
/// Returns `Ok(ReputationScore)` on success, or a `ReputationError` if the agent
/// is not found or the window parameter is invalid.
/// 
/// # Errors
/// 
/// - `ReputationError::AgentNotFound` if the agent_id does not exist
/// - `ReputationError::InvalidWindow` if window is zero or exceeds maximum
pub fn calculate_reputation(
    agent_id: &AgentId,
    window: Duration,
) -> Result<ReputationScore, ReputationError> {
    // Implementation
}
```

**Testing**: Minimum 80% code coverage for new code. Critical paths require property-based tests using `proptest`.

**Performance**: Document algorithmic complexity for non-trivial operations. Profile before optimizing.

**Safety**: Minimize use of `unsafe` code. When necessary, provide detailed safety comments explaining the invariants that justify its use.

### Commit Message Format

Commit messages must follow the Conventional Commits specification:

```
type(scope): subject

body (optional)

footer (optional)
```

**Types**:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes without functional impact
- `refactor`: Code restructuring without behavior change
- `perf`: Performance improvements
- `test`: Test additions or modifications
- `chore`: Build process or tooling changes

**Examples**:

```
feat(p2p): implement Q-routing algorithm for adaptive message routing
fix(consensus): resolve finality stall under high validator churn
docs(architecture): add formal verification section to technical specs
perf(runtime): optimize WASM execution by eliminating redundant checks
```

### Pull Request Process

All pull requests must:

1. Include a clear description of the problem being solved and the approach taken
2. Reference any related issues using GitHub's linking syntax
3. Add or update tests that verify the correctness of the changes
4. Update relevant documentation
5. Pass all continuous integration checks including:
   - Compilation without warnings
   - All tests passing
   - Code formatting (`cargo fmt --all -- --check`)
   - Linting (`cargo clippy --all-targets --all-features -- -D warnings`)

Pull requests should be scoped to a single logical change. Large changes should be broken into a sequence of smaller, reviewable pull requests.

## Code Review Standards

All contributions undergo review by project maintainers. Reviewers will evaluate:

- **Correctness**: Does the code correctly implement the intended behavior?
- **Safety**: Are error conditions handled appropriately?
- **Performance**: Are there obvious performance issues or scalability concerns?
- **Maintainability**: Is the code clear and well-documented?
- **Consistency**: Does the code adhere to project conventions?

Feedback should be addressed by updating the pull request. Once approved by at least one maintainer, changes will be merged.

## Architecture Decision Records

Significant architectural changes require an Architecture Decision Record (ADR) documented in `docs/adr/`. The ADR should include:

1. Context and motivation for the decision
2. Alternatives considered with trade-offs
3. Decision rationale
4. Consequences and implications
5. References to relevant literature or prior art

ADRs are numbered sequentially and follow the template in `docs/adr/template.md`.

## Security Considerations

Contributors working on security-sensitive components should:

- Review the threat model documented in `docs/security/threat-model.md`
- Follow secure coding practices as outlined in the security guidelines
- Consider adversarial scenarios and failure modes
- Document security assumptions explicitly

Critical vulnerabilities should be reported privately to security@ainur.ai rather than via public issues.

## Testing Requirements

### Unit Tests

- Test individual functions and modules in isolation
- Cover both expected behavior and error conditions
- Use property-based testing for mathematical properties

### Integration Tests

- Verify interactions between components
- Test realistic scenarios involving multiple layers
- Include tests for failure injection and recovery

### Performance Tests

- Benchmark critical paths to detect performance regressions
- Document baseline performance expectations
- Run benchmarks as part of continuous integration

## License

By contributing to Ainur Protocol, you agree that your contributions will be licensed under the same terms as the project: Apache License 2.0 and MIT License (dual license).

## Questions

For questions about contributing, contact the maintainers via:

- GitHub Issues for technical questions
- Discord for real-time discussion
- Email conduct@ainur.ai for process or conduct questions

---

**Last Updated**: November 2025  
**Document Version**: 1.0