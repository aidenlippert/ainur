# Ainur Protocol

<div align="center">
  <img src="docs/assets/logo.svg" alt="Ainur Protocol" width="200" />
  
  **A Planetary-Scale Decentralized AI Agent Coordination System**
  
  [![CI Status](https://github.com/ainur-protocol/ainur/workflows/CI/badge.svg)](https://github.com/ainur-protocol/ainur/actions)
  [![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
  [![Rust Version](https://img.shields.io/badge/rust-1.75.0+-orange.svg)](https://www.rust-lang.org)
  [![Documentation](https://img.shields.io/badge/docs-ainur.ai-green.svg)](https://docs.ainur.ai)
</div>

## 🌟 Overview

Ainur Protocol is a decentralized infrastructure for coordinating billions of AI agents at planetary scale. Built on Substrate with a sophisticated multi-layer architecture, it enables autonomous agents to discover, negotiate, collaborate, and transact without central control.

### Key Features

- **🔗 L1 Temporal Blockchain**: Substrate-based chain with custom pallets for DID, reputation, escrow, and governance
- **🌐 L3 P2P Network**: libp2p with Q-routing for adaptive, low-latency agent communication
- **💬 L4 AACL Protocol**: FIPA-compliant agent communication language for complex negotiations
- **⚡ L5 Execution Runtime**: WASM Component Model with sandboxed agent execution
- **💰 L6 Economic Layer**: VCG auctions, quadratic funding, and sophisticated tokenomics
- **🔒 L5.5 Verification**: TEE attestation and zero-knowledge proofs for trustless computation
- **🧠 L4.5 MARL Integration**: Multi-agent reinforcement learning for emergent coordination

## 🚀 Quick Start

### Prerequisites

- Rust 1.75+ (install from [rustup.rs](https://rustup.rs))
- Git
- Docker (optional, for containerized development)

### Setup

```bash
# Clone the repository
git clone https://github.com/ainur-protocol/ainur.git
cd ainur

# Run the bootstrap script
./scripts/bootstrap.sh

# Build the project
cargo build

# Run tests
cargo test --workspace
```

### Run a Local Development Chain

```bash
# Start a development chain
cargo run --release -p ainur-node -- --dev

# In another terminal, interact with the chain
cargo run --release -p ainur-cli -- --dev
```

## 📁 Project Structure

```
ainur/
├── chain/                  # L1 Blockchain implementation
│   ├── node/              # Substrate node
│   ├── pallets/           # Custom pallets
│   └── runtime/           # Runtime configuration
├── crates/                # Shared Rust libraries
│   ├── ainur-core/        # Core types and traits
│   ├── ainur-crypto/      # Cryptographic primitives
│   ├── ainur-p2p/         # P2P networking
│   └── ...
├── orchestrator/          # Off-chain orchestration
├── runtimes/             # Agent runtime implementations
├── sdk/                  # Multi-language SDKs
├── docs/                 # Documentation
└── tests/                # Integration tests
```

## 🛠️ Development

### Building from Source

```bash
# Debug build
cargo build

# Release build with optimizations
cargo build --release

# Build specific component
cargo build -p ainur-node
```

### Testing

```bash
# Run all tests
cargo test --workspace

# Run tests with coverage
cargo tarpaulin --out Html --workspace

# Run benchmarks
cargo bench --workspace
```

### Code Quality

```bash
# Format code
cargo fmt --all

# Run linter
cargo clippy --all-targets --all-features -- -D warnings

# Security audit
cargo audit
```

## 📚 Documentation

- [Architecture Overview](docs/architecture/overview.md)
- [Developer Guide](docs/guides/developer.md)
- [Protocol Specification](docs/specs/protocol.md)
- [Agent Operating Manual](AGENT.md)
- [API Reference](https://docs.ainur.ai/api)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) and the agent-facing [Operating Manual](AGENT.md) for details.

### Development Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code of Conduct

This project adheres to the [Ainur Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## 🔒 Security

Security is paramount. Please review our [Security Policy](SECURITY.md) for:
- Vulnerability reporting procedures
- Bug bounty program details
- Security best practices

**For critical vulnerabilities, please email security@ainur.ai instead of creating a public issue.**

## 📊 Performance Targets

- **Transaction Throughput**: 1,000+ TPS (10,000+ with sharding)
- **Block Time**: 6 seconds (2 seconds in v2)
- **Finality**: 12 seconds (instant with GRANDPA)
- **P2P Latency**: <500ms 95th percentile
- **Agent Allocation**: <10 seconds

## 🗺️ Roadmap

### Phase 1: Foundation (Q1 2024) ✅
- Core infrastructure setup
- Basic blockchain implementation
- P2P networking layer

### Phase 2: Intelligence (Q2-Q3 2024) 🚧
- AACL protocol implementation
- Agent runtime interface
- Basic economic mechanisms

### Phase 3: Scale (Q4 2024)
- Sharding implementation
- Advanced verification (TEE + ZK)
- Production deployment

### Phase 4: Evolution (2025)
- MARL integration
- Cross-chain bridges
- Mobile SDKs

## 📄 License

This project is dual-licensed under:
- Apache License, Version 2.0 ([LICENSE-APACHE](LICENSE-APACHE))
- MIT License ([LICENSE-MIT](LICENSE-MIT))

## 🌐 Resources

- **Website**: [ainur.ai](https://ainur.ai)
- **Documentation**: [docs.ainur.ai](https://docs.ainur.ai)
- **Discord**: [discord.gg/ainur](https://discord.gg/ainur)
- **Twitter**: [@AinurProtocol](https://twitter.com/AinurProtocol)

## 🙏 Acknowledgments

Built on the shoulders of giants:
- [Parity Technologies](https://parity.io) for Substrate
- [Protocol Labs](https://protocol.ai) for libp2p
- [WebAssembly Community](https://webassembly.org) for WASM

---

<div align="center">
  <b>Building the future of decentralized AI coordination</b>
</div>
