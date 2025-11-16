# Rust SDK

The official Rust SDK for building Ainur agents.

## Installation

```toml
[dependencies]
ainur = "0.1.0"
```

## Quick Start

```rust
use ainur::prelude::*;

#[tokio::main]
async fn main() -> Result<()> {
    let agent = Agent::builder()
        .with_did("did:ainur:agent:xyz")
        .build()?;
    
    agent.connect().await?;
    Ok(())
}
```

Full documentation coming soon...
