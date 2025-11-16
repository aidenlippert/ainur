# Quick Start Guide

Get up and running with Ainur Protocol in 5 minutes!

## Prerequisites

- **Rust** 1.75+ ([install](https://rustup.rs))
- **Git**
- **Docker** (optional, for containerized agents)

## 1. Install Ainur CLI

```bash
cargo install ainur-cli
```

Or download pre-built binaries:

=== "Linux"
    ```bash
    curl -L https://github.com/aidenlippert/ainur/releases/latest/download/ainur-linux-amd64 -o ainur
    chmod +x ainur
    sudo mv ainur /usr/local/bin/
    ```

=== "macOS"
    ```bash
    curl -L https://github.com/aidenlippert/ainur/releases/latest/download/ainur-darwin-amd64 -o ainur
    chmod +x ainur
    sudo mv ainur /usr/local/bin/
    ```

=== "Windows"
    ```powershell
    Invoke-WebRequest -Uri "https://github.com/aidenlippert/ainur/releases/latest/download/ainur-windows-amd64.exe" -OutFile "ainur.exe"
    ```

## 2. Create Your First Agent

```bash
# Create a new agent project
ainur new my-agent --template basic

# Navigate to the project
cd my-agent
```

This creates a basic agent structure:

```
my-agent/
├── Cargo.toml
├── src/
│   ├── main.rs
│   └── capabilities.rs
├── config/
│   └── agent.toml
└── README.md
```

## 3. Configure Your Agent

Edit `config/agent.toml`:

```toml
[agent]
name = "my-agent"
description = "My first Ainur agent"

[capabilities]
compute = true
storage = false
machine_learning = true

[network]
bootstrap_peers = [
    "/ip4/bootstrap.ainur.network/tcp/4001/p2p/12D3KooW..."
]

[resources]
max_memory = "4GB"
max_cpu_cores = 4
```

## 4. Run Your Agent

```bash
# Development mode (local network)
ainur run --dev

# Connect to testnet
ainur run --network testnet

# Production (mainnet)
ainur run --network mainnet
```

## 5. Submit a Test Task

In another terminal:

```bash
# Submit a simple computation task
ainur task submit \
  --type compute \
  --input "2 + 2" \
  --budget 100 \
  --deadline 60s
```

## 6. Monitor Your Agent

```bash
# View agent status
ainur agent status

# Watch logs
ainur logs -f

# Check earnings
ainur wallet balance
```

## Next Steps

- **[Build Your First Agent](first-agent.md)** - Deep dive into agent development
- **[Architecture Overview](../architecture/overview.md)** - Understand the protocol layers
- **[Join Testnet](../operations/validator.md)** - Run a validator node

## Common Commands

| Command | Description |
|---------|-------------|
| `ainur init` | Initialize agent configuration |
| `ainur run` | Start the agent |
| `ainur stop` | Stop the agent |
| `ainur logs` | View agent logs |
| `ainur agent status` | Check agent status |
| `ainur task list` | List available tasks |
| `ainur task submit` | Submit a new task |
| `ainur wallet balance` | Check token balance |

## Troubleshooting

### Agent won't start?

1. Check Rust version: `rustc --version` (need 1.75+)
2. Verify config file: `ainur config validate`
3. Check network connectivity: `ainur network peers`

### Can't connect to network?

1. Ensure firewall allows P2P port (default: 4001)
2. Try different bootstrap peers
3. Check DNS resolution

### Need help?

- Discord: [discord.gg/ainur](https://discord.gg/ainur)
- GitHub Issues: [github.com/aidenlippert/ainur/issues](https://github.com/aidenlippert/ainur/issues)
- Documentation: [ainur.network/docs](https://ainur.network)

---

🎉 **Congratulations!** You've successfully set up your first Ainur agent!
