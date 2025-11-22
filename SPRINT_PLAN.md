# Ainur Network: Complete Sprint Plan to Testnet Launch

**Timeline**: 18 sprints (18 weeks / ~4.5 months)
**Goal**: Production-ready public testnet with real agents, real tasks, real settlements
**Team Size Assumption**: 2-3 engineers

---

## Sprint 0: Emergency Fixes (Week 1)
**Theme**: Make the demo actually work

### Objectives
- Fix the stub data problem
- Enable real data flow end-to-end
- Make testnet usable for early adopters

### Deliverables

#### 1. Orchestrator GET Endpoints
**File**: `orchestrator/api/src/main.rs`

```rust
// Add these handlers:
async fn list_agents(State(state): State<AppState>) -> Result<Json<Vec<AgentView>>, ApiError>
async fn list_tasks(State(state): State<AppState>) -> Result<Json<Vec<TaskView>>, ApiError>
async fn get_task(Path(id): Path<String>, State(state): State<AppState>) -> Result<Json<TaskView>, ApiError>
async fn get_dashboard(State(state): State<AppState>) -> Result<Json<DashboardView>, ApiError>
```

**Acceptance Criteria**:
- [ ] `GET /v1/agents` returns all registered agents
- [ ] `GET /v1/tasks` returns all submitted tasks
- [ ] `GET /v1/tasks/:id` returns task details
- [ ] `GET /v1/dashboard` returns aggregate stats
- [ ] Web UI shows real data (no stubs)
- [ ] Data persists across restarts

#### 2. Enable PostgreSQL Persistence
**File**: `orchestrator/api/.env`

```bash
DATABASE_URL=postgres://ainur:ainur@127.0.0.1:5432/ainur
CHAIN_WS_URL=ws://127.0.0.1:9944
BIND_ADDR=0.0.0.0:8080
RUST_LOG=info,ainur_orchestrator_api=debug
```

**Tasks**:
- [ ] Verify DATABASE_URL is set in systemd service
- [ ] Run migrations: `sqlx migrate run`
- [ ] Test data persistence
- [ ] Add health check for DB connection

#### 3. Update Web Config
**File**: `web/src/lib/config.ts`

```typescript
export const ORCH_URL = process.env.NEXT_PUBLIC_ORCH_URL || "http://152.42.207.188:8080";
export const CHAIN_WS = process.env.NEXT_PUBLIC_CHAIN_WS || "ws://152.42.207.188:9944";
```

**Tasks**:
- [ ] Point to real orchestrator IP
- [ ] Add environment detection (dev/prod)
- [ ] Show connection status in UI
- [ ] Display error when API is down

#### 4. Fix Staking Flow
**File**: `orchestrator/api/src/main.rs`

```rust
async fn stake_agent(
    State(state): State<AppState>,
    Json(req): Json<StakeRequest>,
) -> Result<Json<ResponseWithCorrelation>, ApiError> {
    // Submit actual extrinsic to chain
    let tx_hash = state.chain_sink.submit_stake(req.did, req.amount).await?;
    Ok(Json(ResponseWithCorrelation { correlation_id: tx_hash }))
}
```

**Acceptance Criteria**:
- [ ] Staking submits real extrinsic
- [ ] Balance is deducted on-chain
- [ ] UI shows confirmation
- [ ] Stake appears in agent record

### Success Metrics
- ✅ Can register agent and see it in `/console/agents`
- ✅ Can create task and see it in `/console/tasks`
- ✅ Data survives orchestrator restart
- ✅ No stub data in production

---

## Sprint 1: Chain Bridge & Storage (Week 2)
**Theme**: Connect orchestrator to blockchain

### Objectives
- Enable full Subxt integration
- Stream chain events to orchestrator
- Sync on-chain state with database

### Deliverables

#### 1. Subxt Event Streaming
**File**: `orchestrator/api/src/chain/mod.rs`

```rust
pub async fn subscribe_events(
    api: OnlineClient<SubstrateConfig>,
    storage: Arc<dyn Storage>,
) -> Result<()> {
    let mut blocks = api.blocks().subscribe_finalized().await?;

    while let Some(block) = blocks.next().await {
        let block = block?;
        let events = block.events().await?;

        for event in events.iter() {
            match event {
                AgentRegistered { did, owner, .. } => {
                    storage.on_agent_registered(did, owner).await?;
                }
                TaskCreated { id, submitter, .. } => {
                    storage.on_task_created(id, submitter).await?;
                }
                TaskMatched { id, agent, .. } => {
                    storage.on_task_matched(id, agent).await?;
                }
                _ => {}
            }
        }
    }
}
```

**Acceptance Criteria**:
- [ ] Orchestrator subscribes to finalized blocks
- [ ] Parses AgentRegistered events
- [ ] Parses TaskCreated events
- [ ] Parses TaskMatched events
- [ ] Updates database on chain events
- [ ] Handles reconnection on websocket drop

#### 2. Bidirectional Sync
**Tasks**:
- [ ] Orchestrator state matches chain state
- [ ] Handle reorgs gracefully
- [ ] Backfill historical events on startup
- [ ] Add sync status endpoint: `GET /v1/sync/status`

#### 3. Extrinsic Submission
**File**: `orchestrator/api/src/chain/extrinsics.rs`

```rust
pub async fn submit_agent_registration(
    api: &OnlineClient<SubstrateConfig>,
    signer: &PairSigner<SubstrateConfig, Pair>,
    manifest: AgentManifest,
) -> Result<Hash> {
    let tx = ainur::tx()
        .agent_registry()
        .register(manifest);

    let hash = api
        .tx()
        .sign_and_submit_default(&tx, signer)
        .await?;

    Ok(hash)
}
```

**Acceptance Criteria**:
- [ ] POST /v1/agents submits extrinsic
- [ ] POST /v1/tasks submits extrinsic
- [ ] Returns transaction hash
- [ ] Waits for inclusion in block
- [ ] Handles nonce management

#### 4. Database Schema
**File**: `orchestrator/api/migrations/001_initial.sql`

```sql
CREATE TABLE agents (
    did TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    owner TEXT NOT NULL,
    endpoint TEXT,
    capabilities JSONB,
    pricing JSONB,
    reputation INTEGER DEFAULT 0,
    stake BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    submitter TEXT NOT NULL,
    status TEXT NOT NULL,
    capabilities_required JSONB,
    budget BIGINT,
    timeout INTEGER,
    min_reputation INTEGER,
    input_cid TEXT,
    output_cid TEXT,
    matched_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE bids (
    id UUID PRIMARY KEY,
    task_id TEXT REFERENCES tasks(id),
    agent_did TEXT REFERENCES agents(did),
    price BIGINT,
    estimated_duration INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE results (
    id UUID PRIMARY KEY,
    task_id TEXT REFERENCES tasks(id),
    agent_did TEXT,
    output_cid TEXT,
    exit_code INTEGER,
    verification_hash TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Acceptance Criteria**:
- [ ] Tables created via sqlx migrations
- [ ] Foreign keys enforced
- [ ] Indexes on common queries
- [ ] Triggers for updated_at timestamps

### Success Metrics
- ✅ Agent registration appears on-chain
- ✅ Task creation locks escrow on-chain
- ✅ Orchestrator syncs with chain state
- ✅ Can query historical data

---

## Sprint 2: Wallet Integration (Week 3)
**Theme**: Real crypto transactions in web UI

### Objectives
- Integrate Polkadot.js extension
- Enable real wallet connections
- Show actual balances
- Submit signed transactions

### Deliverables

#### 1. Polkadot.js Integration
**File**: `web/src/lib/wallet-context.tsx`

```typescript
// Already started, needs completion:
- [ ] Connect to extension on mount
- [ ] List available accounts
- [ ] Switch accounts
- [ ] Sign transactions
- [ ] Handle extension not installed
- [ ] Show connection status
```

#### 2. Transaction Signing
**File**: `web/src/lib/use-sign-and-submit.ts`

```typescript
export function useSignAndSubmit() {
  const { api, selected } = useWallet();

  return async (extrinsic: SubmittableExtrinsic) => {
    const injector = await web3FromAddress(selected);

    return new Promise((resolve, reject) => {
      extrinsic
        .signAndSend(selected, { signer: injector.signer }, ({ status, events }) => {
          if (status.isInBlock) {
            resolve({ blockHash: status.asInBlock, events });
          }
        })
        .catch(reject);
    });
  };
}
```

**Acceptance Criteria**:
- [ ] Can connect Polkadot.js extension
- [ ] Shows available accounts
- [ ] Displays real AINU balance
- [ ] Signs agent registration transaction
- [ ] Signs task creation transaction
- [ ] Signs staking transaction
- [ ] Shows transaction status (pending/confirmed/error)

#### 3. Faucet Implementation
**File**: `web/src/app/console/faucet/page.tsx`

```typescript
async function requestFaucet(address: string) {
  // Call faucet service
  const res = await fetch(`${ORCH_URL}/v1/faucet`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ address, amount: 1000 })
  });

  return res.json();
}
```

**Backend**: `orchestrator/api/src/faucet.rs`

```rust
// Drip testnet tokens
async fn faucet_drip(
    State(state): State<AppState>,
    Json(req): Json<FaucetRequest>,
) -> Result<Json<FaucetResponse>, ApiError> {
    // Rate limit: 1 request per address per hour
    state.rate_limiter.check(&req.address)?;

    // Transfer from faucet account
    let tx = ainur::tx()
        .balances()
        .transfer(req.address, FAUCET_AMOUNT);

    let hash = api.tx().sign_and_submit_default(&tx, &FAUCET_SIGNER).await?;

    Ok(Json(FaucetResponse { tx_hash: hash }))
}
```

**Acceptance Criteria**:
- [ ] Faucet drips 1000 AINU per request
- [ ] Rate limited: 1 request/hour per address
- [ ] Shows pending transaction
- [ ] Updates balance after confirmation
- [ ] Handles errors gracefully

### Success Metrics
- ✅ Can connect real wallet
- ✅ See actual on-chain balance
- ✅ Request testnet tokens
- ✅ Submit real transactions

---

## Sprint 3: Task Lifecycle (Week 4)
**Theme**: Complete task flow from creation to settlement

### Objectives
- Implement full task state machine
- Handle task matching
- Execute tasks in sandbox
- Submit results
- Settle payments

### Deliverables

#### 1. Task State Machine
**File**: `orchestrator/api/src/model.rs`

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TaskStatus {
    Created,      // Task submitted, escrow locked
    Bidding,      // Accepting bids from agents
    Matched,      // Agent selected, execution pending
    Running,      // Agent executing task
    Verifying,    // Validating execution proof
    Finalized,    // Payment released, task complete
    Disputed,     // Verification failed, arbitration needed
    Cancelled,    // Timed out or cancelled by submitter
}
```

**State Transitions**:
```
Created → Bidding → Matched → Running → Verifying → Finalized
            ↓                              ↓
        Cancelled                      Disputed
```

**Acceptance Criteria**:
- [ ] Tasks follow state machine
- [ ] Invalid transitions rejected
- [ ] State persisted to database
- [ ] Events emitted on transitions
- [ ] Timeouts enforced

#### 2. Bidding Protocol
**File**: `orchestrator/api/src/handlers/bids.rs`

```rust
async fn submit_bid(
    State(state): State<AppState>,
    Json(bid): Json<BidSubmissionRequest>,
) -> Result<Json<ResponseWithCorrelation>, ApiError> {
    // Validate agent is registered
    let agent = state.storage.get_agent(&bid.agent_did).await?
        .ok_or(ApiError::AgentNotFound)?;

    // Validate task is in Bidding state
    let task = state.storage.get_task(&bid.task_id).await?
        .ok_or(ApiError::TaskNotFound)?;

    if task.status != TaskStatus::Bidding {
        return Err(ApiError::InvalidTaskState);
    }

    // Validate agent meets requirements
    if agent.reputation < task.min_reputation {
        return Err(ApiError::InsufficientReputation);
    }

    // Store bid
    let bid_id = state.storage.store_bid(bid).await?;

    Ok(Json(ResponseWithCorrelation { correlation_id: bid_id.to_string() }))
}
```

**Acceptance Criteria**:
- [ ] Agents can submit bids
- [ ] Bids validated against requirements
- [ ] Stored in database
- [ ] Can list bids for a task: `GET /v1/tasks/:id/bids`
- [ ] Bidding closes after timeout

#### 3. Task Matching
**File**: `orchestrator/api/src/matching.rs`

```rust
pub async fn match_task(
    storage: &dyn Storage,
    task_id: &str,
) -> Result<Option<String>> {
    let task = storage.get_task(task_id).await?;
    let bids = storage.get_bids_for_task(task_id).await?;

    // Score bids: reputation * 0.5 + (1 / price) * 0.5
    let mut scored: Vec<_> = bids.iter()
        .map(|bid| {
            let agent = storage.get_agent(&bid.agent_did).await?;
            let score = (agent.reputation as f64 * 0.5) +
                       (1.0 / bid.price as f64 * 0.5);
            Ok((bid, score))
        })
        .collect::<Result<_>>()?;

    scored.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap());

    Ok(scored.first().map(|(bid, _)| bid.agent_did.clone()))
}
```

**Acceptance Criteria**:
- [ ] Selects best bid after timeout
- [ ] Uses scoring function
- [ ] Updates task status to Matched
- [ ] Emits TaskMatched event
- [ ] Notifies winning agent

#### 4. Task Execution
**File**: `orchestrator/api/src/execution/runner.rs`

```rust
pub async fn execute_task(
    engine: &dyn ExecutionEngine,
    task: &StoredTask,
    agent: &AgentView,
) -> Result<ExecutionResult> {
    // Download input from IPFS
    let input = ipfs::fetch(&task.input_cid).await?;

    // Execute in sandbox
    let result = match agent.mode {
        AgentMode::Wasm => {
            engine.execute_wasm(&agent.endpoint, &input, task.timeout).await?
        }
        AgentMode::Hosted => {
            engine.execute_http(&agent.endpoint, &input, task.timeout).await?
        }
    };

    // Upload output to IPFS
    let output_cid = ipfs::store(&result.output).await?;

    Ok(ExecutionResult {
        output_cid,
        exit_code: result.exit_code,
        duration_ms: result.duration_ms,
        verification_hash: blake3::hash(&result.output).to_hex(),
    })
}
```

**Acceptance Criteria**:
- [ ] Downloads task input from IPFS
- [ ] Executes WASM agents
- [ ] Executes HTTP agents
- [ ] Enforces timeout
- [ ] Uploads output to IPFS
- [ ] Computes verification hash
- [ ] Stores result in database

#### 5. Result Verification & Settlement
**File**: `orchestrator/api/src/verification.rs`

```rust
pub async fn verify_and_settle(
    api: &OnlineClient<SubstrateConfig>,
    task: &StoredTask,
    result: &ExecutionResult,
) -> Result<()> {
    // Submit result to chain
    let tx = ainur::tx()
        .task_market()
        .submit_result(
            task.id.clone(),
            result.output_cid.clone(),
            result.verification_hash.clone(),
        );

    let hash = api.tx().sign_and_submit_default(&tx, &OPERATOR_SIGNER).await?;

    // Wait for verification period
    tokio::time::sleep(Duration::from_secs(task.verification_period)).await;

    // If no disputes, finalize
    let tx = ainur::tx()
        .task_market()
        .finalize_task(task.id.clone());

    api.tx().sign_and_submit_default(&tx, &OPERATOR_SIGNER).await?;

    Ok(())
}
```

**Acceptance Criteria**:
- [ ] Submits result to chain
- [ ] Waits for dispute period
- [ ] Releases escrow to agent
- [ ] Updates agent reputation
- [ ] Updates task status to Finalized
- [ ] Emits settlement event

### Success Metrics
- ✅ End-to-end task flow works
- ✅ Agent receives payment
- ✅ Reputation updated
- ✅ All states visible in UI

---

## Sprint 4: P2P Foundation (Week 5)
**Theme**: Decentralized agent discovery

### Objectives
- Deploy libp2p network
- Enable agent-to-agent communication
- Implement DHT for discovery
- GossipSub for task broadcasts

### Deliverables

#### 1. Libp2p Network Setup
**File**: `orchestrator/p2p/src/network.rs`

```rust
use libp2p::{
    kad::{Kademlia, KademliaConfig, KademliaEvent},
    gossipsub::{Gossipsub, GossipsubEvent, Topic},
    identify::{Identify, IdentifyEvent},
    swarm::{Swarm, SwarmBuilder, SwarmEvent},
    PeerId, Multiaddr,
};

pub struct P2PNetwork {
    swarm: Swarm<NetworkBehaviour>,
    peer_id: PeerId,
    agent_topic: Topic,
    task_topic: Topic,
}

impl P2PNetwork {
    pub async fn new(keypair: Keypair, listen_addr: Multiaddr) -> Result<Self> {
        let peer_id = PeerId::from(keypair.public());

        let transport = libp2p::tcp::tokio::Transport::default()
            .upgrade(upgrade::Version::V1)
            .authenticate(noise::Config::new(&keypair)?)
            .multiplex(yamux::Config::default())
            .boxed();

        let behaviour = NetworkBehaviour {
            kademlia: Kademlia::new(peer_id, MemoryStore::new(peer_id)),
            gossipsub: Gossipsub::new(MessageAuthenticity::Signed(keypair.clone()), config)?,
            identify: Identify::new(IdentifyConfig::new("ainur/1.0.0".to_string(), keypair.public())),
        };

        let mut swarm = SwarmBuilder::with_tokio_executor(transport, behaviour, peer_id).build();
        swarm.listen_on(listen_addr)?;

        Ok(Self {
            swarm,
            peer_id,
            agent_topic: Topic::new("ainur/agents"),
            task_topic: Topic::new("ainur/tasks"),
        })
    }
}
```

**Acceptance Criteria**:
- [ ] Libp2p swarm initializes
- [ ] Listens on TCP port
- [ ] Kademlia DHT enabled
- [ ] GossipSub enabled
- [ ] Identify protocol enabled
- [ ] Can dial bootstrap nodes

#### 2. Bootstrap Nodes
**File**: `scripts/deploy-bootstrap.sh`

```bash
# Deploy bootstrap node on alice
ssh root@152.42.207.188 << 'EOF'
cat > /etc/systemd/system/ainur-bootstrap.service << 'SERVICE'
[Unit]
Description=Ainur P2P Bootstrap Node
After=network-online.target

[Service]
User=root
Type=simple
Environment="RUST_LOG=info"
ExecStart=/usr/local/bin/ainur-bootstrap \
  --listen /ip4/0.0.0.0/tcp/30444 \
  --external-addr /ip4/152.42.207.188/tcp/30444
Restart=on-failure

[Install]
WantedBy=multi-user.target
SERVICE

systemctl daemon-reload
systemctl enable ainur-bootstrap
systemctl start ainur-bootstrap
EOF
```

**Acceptance Criteria**:
- [ ] Bootstrap node running on alice
- [ ] Publicly reachable
- [ ] Handles peer connections
- [ ] Maintains DHT routing table

#### 3. Agent Registration on DHT
**File**: `orchestrator/p2p/src/discovery.rs`

```rust
pub async fn register_agent_on_dht(
    network: &mut P2PNetwork,
    agent: &AgentView,
) -> Result<()> {
    // Create DHT key from DID
    let key = Key::new(&agent.did);

    // Serialize agent manifest
    let manifest = serde_json::to_vec(&agent)?;

    // Store in DHT with TTL
    network.swarm
        .behaviour_mut()
        .kademlia
        .put_record(Record::new(key, manifest), Quorum::One)?;

    // Tag capabilities for search
    for cap in &agent.capabilities {
        let cap_key = Key::new(&format!("cap:{}", cap));
        let mut peers = network.get_record(&cap_key).await
            .unwrap_or_default();
        peers.push(agent.did.clone());

        network.swarm
            .behaviour_mut()
            .kademlia
            .put_record(Record::new(cap_key, serde_json::to_vec(&peers)?), Quorum::One)?;
    }

    Ok(())
}
```

**Acceptance Criteria**:
- [ ] Agents published to DHT
- [ ] Indexed by capabilities
- [ ] TTL refreshed periodically
- [ ] Can query by DID
- [ ] Can search by capability

#### 4. Task Broadcasting
**File**: `orchestrator/p2p/src/broadcast.rs`

```rust
pub async fn broadcast_task(
    network: &mut P2PNetwork,
    task: &TaskView,
) -> Result<()> {
    let message = serde_json::to_vec(&task)?;

    network.swarm
        .behaviour_mut()
        .gossipsub
        .publish(network.task_topic.clone(), message)?;

    Ok(())
}

pub async fn subscribe_to_tasks(
    network: &mut P2PNetwork,
    handler: impl Fn(TaskView) + Send + 'static,
) -> Result<()> {
    network.swarm
        .behaviour_mut()
        .gossipsub
        .subscribe(&network.task_topic)?;

    loop {
        match network.swarm.select_next_some().await {
            SwarmEvent::Behaviour(NetworkBehaviourEvent::Gossipsub(
                GossipsubEvent::Message { message, .. }
            )) => {
                if message.topic == network.task_topic.hash() {
                    let task: TaskView = serde_json::from_slice(&message.data)?;
                    handler(task);
                }
            }
            _ => {}
        }
    }
}
```

**Acceptance Criteria**:
- [ ] Tasks broadcast to all peers
- [ ] Agents receive task notifications
- [ ] Deduplicated messages
- [ ] Message validation
- [ ] Rate limiting

### Success Metrics
- ✅ Agents can discover each other via DHT
- ✅ Tasks broadcast to network
- ✅ Agents receive relevant tasks
- ✅ Decentralized (no single point of failure)

---

## Sprint 5: Semantic Discovery (Week 6)
**Theme**: AI-powered agent matching

### Objectives
- Generate embeddings for agent capabilities
- Vector search for semantic matching
- Improved task-agent matching

### Deliverables

#### 1. Embedding Generation
**File**: `orchestrator/api/src/embeddings.rs`

```rust
use fastembed::{TextEmbedding, InitOptions};

pub struct EmbeddingEngine {
    model: TextEmbedding,
}

impl EmbeddingEngine {
    pub async fn new() -> Result<Self> {
        let model = TextEmbedding::try_new(InitOptions {
            model_name: "BAAI/bge-small-en-v1.5",
            ..Default::default()
        })?;

        Ok(Self { model })
    }

    pub fn embed(&self, text: &str) -> Result<Vec<f32>> {
        let embeddings = self.model.embed(vec![text], None)?;
        Ok(embeddings[0].clone())
    }
}
```

**Acceptance Criteria**:
- [ ] Embeddings generated for agent capabilities
- [ ] Embeddings stored in database (pgvector)
- [ ] Task descriptions embedded
- [ ] Fast similarity search

#### 2. Vector Database
**File**: `orchestrator/api/migrations/002_embeddings.sql`

```sql
CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE agents ADD COLUMN embedding vector(384);
ALTER TABLE tasks ADD COLUMN embedding vector(384);

CREATE INDEX ON agents USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX ON tasks USING ivfflat (embedding vector_cosine_ops);
```

**Acceptance Criteria**:
- [ ] pgvector extension installed
- [ ] Embedding columns added
- [ ] Indexes created for fast search
- [ ] Can query by similarity

#### 3. Semantic Matching
**File**: `orchestrator/api/src/matching.rs`

```rust
pub async fn semantic_match(
    pool: &Pool<Postgres>,
    task: &TaskView,
    top_k: usize,
) -> Result<Vec<AgentView>> {
    let query = sqlx::query_as::<_, AgentView>(
        r#"
        SELECT * FROM agents
        WHERE reputation >= $1
        ORDER BY embedding <-> $2
        LIMIT $3
        "#
    )
    .bind(task.min_reputation)
    .bind(&task.embedding)
    .bind(top_k as i64)
    .fetch_all(pool)
    .await?;

    Ok(query)
}
```

**Acceptance Criteria**:
- [ ] Returns top-k similar agents
- [ ] Filters by reputation
- [ ] Fast (<100ms for 10k agents)
- [ ] Considers capability overlap

### Success Metrics
- ✅ Better agent-task matching
- ✅ Can find agents by semantic query
- ✅ Handles synonyms and related concepts

---

## Sprint 6: WASM Execution (Week 7)
**Theme**: Sandboxed, verifiable agent execution

### Objectives
- Load and execute WASM modules
- Enforce resource limits
- Generate execution proofs
- Support multiple WASM agents

### Deliverables

#### 1. WASM Runtime
**File**: `orchestrator/api/src/execution/wasm.rs`

```rust
use wasmtime::{Engine, Linker, Module, Store, StoreLimits};

pub struct WasmEngine {
    engine: Engine,
}

impl WasmEngine {
    pub fn new() -> Result<Self> {
        let mut config = wasmtime::Config::new();
        config.async_support(true);
        config.consume_fuel(true);

        let engine = Engine::new(&config)?;
        Ok(Self { engine })
    }

    pub async fn execute(
        &self,
        wasm_bytes: &[u8],
        input: &[u8],
        limits: ResourceLimits,
    ) -> Result<ExecutionResult> {
        let module = Module::from_binary(&self.engine, wasm_bytes)?;

        let mut store = Store::new(
            &self.engine,
            StoreLimits::new()
                .memory_size(limits.max_memory)
                .table_elements(limits.max_tables)
                .instances(1)
        );

        store.set_fuel(limits.max_fuel)?;

        let mut linker = Linker::new(&self.engine);
        // Import host functions
        linker.func_wrap("env", "log", |msg: i32| {
            println!("WASM log: {}", msg);
        })?;

        let instance = linker.instantiate_async(&mut store, &module).await?;

        // Call main function
        let main = instance.get_typed_func::<(i32, i32), i32>(&mut store, "execute")?;
        let output_ptr = main.call_async(&mut store, (input.as_ptr() as i32, input.len() as i32)).await?;

        // Read output from memory
        let memory = instance.get_memory(&mut store, "memory")
            .ok_or(anyhow!("memory not found"))?;
        let output = memory.data(&store)[output_ptr as usize..].to_vec();

        Ok(ExecutionResult {
            output,
            fuel_consumed: limits.max_fuel - store.get_fuel()?,
            exit_code: 0,
        })
    }
}
```

**Acceptance Criteria**:
- [ ] Loads WASM modules
- [ ] Enforces memory limits
- [ ] Enforces CPU limits (fuel)
- [ ] Captures stdout/stderr
- [ ] Returns execution result
- [ ] Handles errors gracefully

#### 2. Reference Agents
**File**: `agents/rust-echo/src/lib.rs`

```rust
#[no_mangle]
pub extern "C" fn execute(input_ptr: *const u8, input_len: usize) -> *const u8 {
    let input = unsafe {
        std::slice::from_raw_parts(input_ptr, input_len)
    };

    let input_str = std::str::from_utf8(input).unwrap();
    let output = format!("Echo: {}", input_str);

    Box::into_raw(Box::new(output.as_bytes())) as *const u8
}
```

**Build**: `cargo build --target wasm32-wasi --release`

**Examples**:
- [ ] EchoAgent (rust) - echoes input
- [ ] SummarizerAgent (rust) - text summarization
- [ ] CodeAuditorAgent (rust) - basic code analysis
- [ ] ImageCaptionAgent (python) - image description

**Acceptance Criteria**:
- [ ] All agents compile to WASM
- [ ] Upload to IPFS
- [ ] Execute in orchestrator
- [ ] Return valid results

#### 3. IPFS Integration
**File**: `orchestrator/api/src/ipfs.rs`

```rust
use ipfs_api::{IpfsClient, IpfsApi};

pub struct IpfsStore {
    client: IpfsClient,
}

impl IpfsStore {
    pub fn new(addr: &str) -> Self {
        Self {
            client: IpfsClient::from_str(addr).unwrap()
        }
    }

    pub async fn store(&self, data: &[u8]) -> Result<String> {
        let cursor = Cursor::new(data);
        let response = self.client.add(cursor).await?;
        Ok(response.hash)
    }

    pub async fn fetch(&self, cid: &str) -> Result<Vec<u8>> {
        let bytes = self.client.cat(cid)
            .map_ok(|chunk| chunk.to_vec())
            .try_concat()
            .await?;
        Ok(bytes)
    }
}
```

**Acceptance Criteria**:
- [ ] Upload files to IPFS
- [ ] Download files from IPFS
- [ ] Pin important files
- [ ] Handle IPFS gateway timeouts

### Success Metrics
- ✅ Can deploy WASM agents
- ✅ Tasks execute in sandbox
- ✅ Resource limits enforced
- ✅ Results are deterministic

---

## Sprint 7: Multi-Agent Workflows (Week 8)
**Theme**: Agents collaborate on complex tasks

### Objectives
- Support task dependencies
- Enable agent-to-agent calls
- Implement workflow orchestration
- Handle failures gracefully

### Deliverables

#### 1. Workflow Definition
**File**: `orchestrator/api/src/model.rs`

```rust
#[derive(Serialize, Deserialize)]
pub struct Workflow {
    pub id: String,
    pub tasks: Vec<WorkflowTask>,
    pub dependencies: HashMap<String, Vec<String>>,
}

#[derive(Serialize, Deserialize)]
pub struct WorkflowTask {
    pub id: String,
    pub agent_capabilities: Vec<String>,
    pub input_source: InputSource,
    pub timeout: u64,
}

pub enum InputSource {
    Literal(String),
    FromTask(String), // task_id
    Combined(Vec<String>),
}
```

**Acceptance Criteria**:
- [ ] Define multi-step workflows
- [ ] Express task dependencies (DAG)
- [ ] Pass outputs between tasks
- [ ] Handle parallel execution

#### 2. Workflow Execution Engine
**File**: `orchestrator/api/src/workflow.rs`

```rust
pub async fn execute_workflow(
    storage: &dyn Storage,
    engine: &dyn ExecutionEngine,
    workflow: &Workflow,
) -> Result<WorkflowResult> {
    // Topological sort to get execution order
    let order = topological_sort(&workflow.dependencies)?;

    let mut results = HashMap::new();

    for task_id in order {
        let task = workflow.tasks.iter()
            .find(|t| t.id == task_id)
            .ok_or(anyhow!("task not found"))?;

        // Resolve input from dependencies
        let input = match &task.input_source {
            InputSource::Literal(s) => s.clone(),
            InputSource::FromTask(dep_id) => {
                results.get(dep_id)
                    .ok_or(anyhow!("dependency not ready"))?
                    .clone()
            }
            InputSource::Combined(dep_ids) => {
                dep_ids.iter()
                    .map(|id| results.get(id).unwrap())
                    .collect::<Vec<_>>()
                    .join("\n")
            }
        };

        // Find and execute agent
        let agents = semantic_match(storage, task, 5).await?;
        let result = execute_task(engine, task, &agents[0]).await?;

        results.insert(task_id.clone(), result.output);
    }

    Ok(WorkflowResult { results })
}
```

**Acceptance Criteria**:
- [ ] Executes tasks in dependency order
- [ ] Passes data between tasks
- [ ] Handles failures with retries
- [ ] Supports parallel branches
- [ ] Stores intermediate results

### Success Metrics
- ✅ Can define multi-step workflows
- ✅ Agents collaborate automatically
- ✅ Failures don't break entire workflow

---

## Sprint 8: Monitoring & Observability (Week 9)
**Theme**: Production-ready monitoring

### Objectives
- Prometheus metrics
- Grafana dashboards
- Distributed tracing
- Health checks

### Deliverables

#### 1. Prometheus Metrics
**File**: `orchestrator/api/src/metrics.rs`

```rust
use prometheus::{Counter, Histogram, Registry, Encoder};

lazy_static! {
    static ref REGISTRY: Registry = Registry::new();

    static ref TASKS_CREATED: Counter = Counter::new(
        "ainur_tasks_created_total",
        "Total tasks created"
    ).unwrap();

    static ref TASKS_COMPLETED: Counter = Counter::new(
        "ainur_tasks_completed_total",
        "Total tasks completed"
    ).unwrap();

    static ref TASK_DURATION: Histogram = Histogram::with_opts(
        histogram_opts!(
            "ainur_task_duration_seconds",
            "Task execution duration"
        )
    ).unwrap();

    static ref AGENTS_REGISTERED: Counter = Counter::new(
        "ainur_agents_registered_total",
        "Total agents registered"
    ).unwrap();
}

pub fn init() {
    REGISTRY.register(Box::new(TASKS_CREATED.clone())).unwrap();
    REGISTRY.register(Box::new(TASKS_COMPLETED.clone())).unwrap();
    REGISTRY.register(Box::new(TASK_DURATION.clone())).unwrap();
    REGISTRY.register(Box::new(AGENTS_REGISTERED.clone())).unwrap();
}

pub async fn metrics_handler() -> String {
    let encoder = TextEncoder::new();
    let metric_families = REGISTRY.gather();
    encoder.encode_to_string(&metric_families).unwrap()
}
```

**Endpoint**: `GET /metrics`

**Acceptance Criteria**:
- [ ] Expose /metrics endpoint
- [ ] Track task lifecycle metrics
- [ ] Track agent metrics
- [ ] Track P2P metrics
- [ ] Track system metrics (CPU, memory)

#### 2. Grafana Dashboards
**File**: `monitoring/grafana/dashboards/ainur-overview.json`

**Panels**:
- [ ] Tasks created/completed (rate)
- [ ] Task success rate
- [ ] Average task duration
- [ ] Active agents
- [ ] P2P peer count
- [ ] RPC latency
- [ ] Database query performance

**Acceptance Criteria**:
- [ ] Grafana deployed
- [ ] Connected to Prometheus
- [ ] Dashboards imported
- [ ] Auto-refresh enabled
- [ ] Alerts configured

#### 3. Distributed Tracing
**File**: `orchestrator/api/src/tracing.rs`

```rust
use tracing_subscriber::{layer::SubscriberExt, Registry};
use tracing_opentelemetry::OpenTelemetryLayer;

pub fn init_tracing() {
    let tracer = opentelemetry_jaeger::new_pipeline()
        .with_service_name("ainur-orchestrator")
        .install_batch(opentelemetry::runtime::Tokio)
        .unwrap();

    let opentelemetry = OpenTelemetryLayer::new(tracer);

    let subscriber = Registry::default()
        .with(opentelemetry)
        .with(tracing_subscriber::fmt::layer());

    tracing::subscriber::set_global_default(subscriber).unwrap();
}
```

**Acceptance Criteria**:
- [ ] Jaeger deployed
- [ ] Traces exported
- [ ] Spans for each request
- [ ] Trace task execution end-to-end

### Success Metrics
- ✅ Can visualize system health
- ✅ Can debug performance issues
- ✅ Alerts on failures

---

## Sprint 9: Security Hardening (Week 10)
**Theme**: Production security

### Objectives
- Input validation
- Rate limiting
- DDoS protection
- Secure key management

### Deliverables

#### 1. Input Validation
**File**: `orchestrator/api/src/validation.rs`

```rust
use validator::{Validate, ValidationError};

#[derive(Debug, Validate, Deserialize)]
pub struct TaskSubmissionRequest {
    #[validate(length(min = 1, max = 200))]
    pub title: String,

    #[validate(range(min = 1, max = 1_000_000))]
    pub budget: u64,

    #[validate(range(min = 60, max = 86400))]
    pub timeout: u64,

    #[validate(custom = "validate_did")]
    pub submitter: String,
}

fn validate_did(did: &str) -> Result<(), ValidationError> {
    if !did.starts_with("did:ainur:") {
        return Err(ValidationError::new("invalid_did"));
    }
    Ok(())
}
```

**Acceptance Criteria**:
- [ ] All inputs validated
- [ ] Schema enforcement
- [ ] SQL injection prevented
- [ ] XSS prevention
- [ ] CSRF tokens

#### 2. Rate Limiting
**File**: `orchestrator/api/src/middleware/rate_limit.rs`

```rust
use tower_governor::{GovernorLayer, GovernorConfigBuilder};

pub fn rate_limiter() -> GovernorLayer {
    let config = GovernorConfigBuilder::default()
        .per_second(10)
        .burst_size(20)
        .finish()
        .unwrap();

    GovernorLayer { config }
}
```

**Limits**:
- [ ] 10 requests/second per IP
- [ ] 1 agent registration per hour per IP
- [ ] 100 task submissions per day per account
- [ ] 1000 API calls per day per account

**Acceptance Criteria**:
- [ ] Rate limits enforced
- [ ] Returns 429 when exceeded
- [ ] Configurable per endpoint
- [ ] Persistent across restarts

#### 3. Key Management
**File**: `orchestrator/api/src/keystore.rs`

```rust
use sp_core::{Pair, sr25519};
use secrecy::{Secret, ExposeSecret};

pub struct Keystore {
    operator_key: Secret<sr25519::Pair>,
    faucet_key: Secret<sr25519::Pair>,
}

impl Keystore {
    pub fn from_env() -> Result<Self> {
        let operator_seed = env::var("OPERATOR_SEED")
            .expect("OPERATOR_SEED not set");
        let faucet_seed = env::var("FAUCET_SEED")
            .expect("FAUCET_SEED not set");

        Ok(Self {
            operator_key: Secret::new(sr25519::Pair::from_string(&operator_seed, None)?),
            faucet_key: Secret::new(sr25519::Pair::from_string(&faucet_seed, None)?),
        })
    }

    pub fn operator(&self) -> &sr25519::Pair {
        self.operator_key.expose_secret()
    }
}
```

**Acceptance Criteria**:
- [ ] Keys loaded from environment
- [ ] Never logged or exposed
- [ ] Rotatable
- [ ] Backed up securely

### Success Metrics
- ✅ No security vulnerabilities
- ✅ Can withstand attacks
- ✅ Keys are safe

---

## Sprint 10: Agent SDK v1.0 (Week 11)
**Theme**: Developer-friendly agent creation

### Objectives
- Polished Python SDK
- Polished Rust SDK
- TypeScript SDK
- Documentation and examples

### Deliverables

#### 1. Python SDK
**File**: `sdk/python/ainur/agent.py`

```python
from ainur import Agent, Policy, task
from ainur.types import TaskInput, TaskOutput

@Agent.register(
    did="did:ainur:my-summarizer",
    capabilities=["nlp", "summarization"],
    pricing={"min": 10, "unit": "AINU"},
    policy=Policy(min_reputation=0, max_concurrency=5)
)
class SummarizerAgent:

    @task
    async def summarize(self, input: TaskInput) -> TaskOutput:
        """Summarize text using local model"""
        text = input.data.decode('utf-8')

        # Your logic here
        summary = await self.model.summarize(text)

        return TaskOutput(
            data=summary.encode('utf-8'),
            metadata={"confidence": 0.95}
        )

if __name__ == "__main__":
    agent = SummarizerAgent()
    agent.run()
```

**Features**:
- [ ] Decorators for easy setup
- [ ] Automatic registration
- [ ] Bidding logic built-in
- [ ] Result submission handled
- [ ] Error handling
- [ ] Logging integration

**Acceptance Criteria**:
- [ ] `pip install ainur-sdk`
- [ ] Works with Python 3.9+
- [ ] Full type hints
- [ ] 100% test coverage
- [ ] Documentation

#### 2. Rust SDK
**File**: `sdk/rust/src/lib.rs`

```rust
use ainur_sdk::{Agent, AgentConfig, Task, TaskResult};

#[derive(Agent)]
#[agent(
    did = "did:ainur:my-auditor",
    capabilities = ["code-audit", "security"],
    pricing(min = 20, unit = "AINU")
)]
struct CodeAuditor {
    config: AgentConfig,
}

impl CodeAuditor {
    #[task]
    async fn audit(&self, input: Task) -> TaskResult {
        let code = String::from_utf8(input.data)?;

        // Run static analysis
        let issues = analyze_code(&code)?;

        TaskResult::success(serde_json::to_vec(&issues)?)
    }
}

#[tokio::main]
async fn main() {
    let agent = CodeAuditor::new();
    agent.run().await;
}
```

**Features**:
- [ ] Proc macros for codegen
- [ ] Async/await support
- [ ] WASM compilation
- [ ] No_std support
- [ ] Performance optimized

**Acceptance Criteria**:
- [ ] `cargo add ainur-sdk`
- [ ] Works with Rust 1.70+
- [ ] Compiles to WASM
- [ ] 100% test coverage
- [ ] Documentation

#### 3. TypeScript SDK
**File**: `sdk/typescript/src/agent.ts`

```typescript
import { Agent, task, Policy } from '@ainur/sdk';

@Agent({
  did: 'did:ainur:my-translator',
  capabilities: ['translation', 'nlp'],
  pricing: { min: 15, unit: 'AINU' },
  policy: new Policy({ minReputation: 0 })
})
class TranslatorAgent {

  @task
  async translate(input: TaskInput): Promise<TaskOutput> {
    const text = input.data.toString();

    // Your logic
    const translated = await this.translateService.translate(text);

    return {
      data: Buffer.from(translated),
      metadata: { sourceLanguage: 'en', targetLanguage: 'es' }
    };
  }
}

const agent = new TranslatorAgent();
agent.run();
```

**Features**:
- [ ] TypeScript decorators
- [ ] Promise-based API
- [ ] Browser support (via Polkadot.js)
- [ ] React hooks
- [ ] Next.js integration

**Acceptance Criteria**:
- [ ] `npm install @ainur/sdk`
- [ ] Works with Node 18+
- [ ] Works in browser
- [ ] 100% test coverage
- [ ] Documentation

### Success Metrics
- ✅ Developers can build agents in <1 hour
- ✅ 10+ example agents
- ✅ SDK docs published

---

## Sprint 11: Testing & QA (Week 12)
**Theme**: Quality assurance

### Objectives
- Integration tests
- Load testing
- Chaos engineering
- Bug fixes

### Deliverables

#### 1. Integration Tests
**File**: `tests/integration/test_task_lifecycle.rs`

```rust
#[tokio::test]
async fn test_full_task_lifecycle() {
    // Setup
    let testnet = Testnet::spawn().await?;
    let orchestrator = testnet.orchestrator();
    let agent = testnet.deploy_agent("echo").await?;

    // Register agent
    let register_tx = agent.register().await?;
    assert!(register_tx.is_successful());

    // Create task
    let task_id = orchestrator.create_task(CreateTaskRequest {
        title: "Test task",
        capabilities_required: vec!["echo"],
        budget: 100,
        timeout: 300,
        input_cid: "QmTest",
    }).await?;

    // Wait for matching
    let matched = orchestrator.wait_for_match(&task_id, Duration::from_secs(30)).await?;
    assert_eq!(matched.agent_did, agent.did());

    // Execute task
    let result = agent.execute_next_task().await?;
    assert_eq!(result.exit_code, 0);

    // Wait for settlement
    let settled = orchestrator.wait_for_settlement(&task_id, Duration::from_secs(60)).await?;
    assert_eq!(settled.status, TaskStatus::Finalized);

    // Verify agent received payment
    let balance = agent.balance().await?;
    assert_eq!(balance, 100);

    // Verify reputation updated
    let agent_info = orchestrator.get_agent(&agent.did()).await?;
    assert_eq!(agent_info.reputation, 1);
}
```

**Test Coverage**:
- [ ] Agent registration
- [ ] Task creation
- [ ] Bidding
- [ ] Matching
- [ ] Execution
- [ ] Settlement
- [ ] Error handling
- [ ] Edge cases

**Acceptance Criteria**:
- [ ] 100+ integration tests
- [ ] 90%+ code coverage
- [ ] All tests pass
- [ ] CI/CD pipeline

#### 2. Load Testing
**File**: `tests/load/scenarios/high_throughput.js`

```javascript
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 },  // Ramp up
    { duration: '5m', target: 100 },  // Stay at 100 RPS
    { duration: '2m', target: 200 },  // Spike
    { duration: '5m', target: 200 },  // Stay at 200 RPS
    { duration: '2m', target: 0 },    // Ramp down
  ],
};

export default function() {
  // Create task
  let res = http.post('http://152.42.207.188:8080/v1/tasks', JSON.stringify({
    title: 'Load test task',
    capabilities_required: ['test'],
    budget: 10,
    timeout: 60,
  }));

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
```

**Scenarios**:
- [ ] 100 tasks/second sustained
- [ ] 1000 concurrent agents
- [ ] Spike to 500 tasks/second
- [ ] Database failover
- [ ] Network partition

**Acceptance Criteria**:
- [ ] Handles 100 TPS
- [ ] P95 latency < 500ms
- [ ] No data loss
- [ ] Graceful degradation

#### 3. Chaos Engineering
**File**: `tests/chaos/kill-orchestrator.yml`

```yaml
apiVersion: chaos-mesh.org/v1alpha1
kind: PodChaos
metadata:
  name: kill-orchestrator
spec:
  action: pod-kill
  mode: one
  selector:
    namespaces:
      - ainur
    labelSelectors:
      app: orchestrator
  scheduler:
    cron: "@every 10m"
```

**Scenarios**:
- [ ] Kill orchestrator pod
- [ ] Network delay (100ms)
- [ ] Database connection loss
- [ ] IPFS gateway timeout
- [ ] High CPU load

**Acceptance Criteria**:
- [ ] System recovers automatically
- [ ] No permanent failures
- [ ] Alerts fire correctly

### Success Metrics
- ✅ All tests pass
- ✅ Can handle production load
- ✅ Recovers from failures

---

## Sprint 12: Documentation & Examples (Week 13)
**Theme**: Developer onboarding

### Objectives
- Complete API documentation
- Tutorial videos
- Example projects
- Migration guides

### Deliverables

#### 1. Documentation Site
**Structure**:
```
docs/
├── getting-started/
│   ├── installation.md
│   ├── quickstart.md
│   └── first-agent.md
├── guides/
│   ├── agent-development.md
│   ├── task-submission.md
│   ├── running-validators.md
│   └── troubleshooting.md
├── api-reference/
│   ├── rest-api.md
│   ├── websocket-api.md
│   └── rpc-api.md
├── sdk/
│   ├── python.md
│   ├── rust.md
│   └── typescript.md
└── architecture/
    ├── overview.md
    ├── consensus.md
    ├── execution.md
    └── settlement.md
```

**Acceptance Criteria**:
- [ ] Hosted on docs.ainur.network
- [ ] Search enabled
- [ ] Code syntax highlighting
- [ ] Interactive examples
- [ ] Version selector

#### 2. Example Projects
**File**: `examples/`

```
examples/
├── hello-world/           # Minimal agent
├── nlp-summarizer/        # Text summarization
├── code-auditor/          # Static analysis
├── image-classifier/      # Computer vision
├── data-pipeline/         # Multi-step workflow
├── price-oracle/          # DeFi oracle
└── game-ai/              # Reinforcement learning
```

**Each Example Includes**:
- [ ] README with setup instructions
- [ ] Source code with comments
- [ ] Dockerfile
- [ ] Test suite
- [ ] CI/CD pipeline
- [ ] Deployment guide

**Acceptance Criteria**:
- [ ] 10+ working examples
- [ ] One-command deployment
- [ ] Video walkthrough
- [ ] Blog post

#### 3. Tutorial Series
**Videos**:
1. "Build Your First Agent in 10 Minutes"
2. "Advanced Agent Features: Pricing & Policies"
3. "Multi-Agent Workflows"
4. "Running a Validator Node"
5. "Deploying to Production"

**Acceptance Criteria**:
- [ ] 5+ videos published
- [ ] Hosted on YouTube
- [ ] Embedded in docs
- [ ] Subtitles available

### Success Metrics
- ✅ Developers can onboard without help
- ✅ 50+ agents deployed
- ✅ Active community

---

## Sprint 13: Reputation System (Week 14)
**Theme**: Trust and quality

### Objectives
- Implement reputation scoring
- Slash for bad behavior
- Rewards for good behavior
- Dispute resolution

### Deliverables

#### 1. Reputation Pallet
**File**: `chain/pallets/reputation/src/lib.rs`

```rust
#[pallet::storage]
pub type AgentReputation<T: Config> = StorageMap<
    _,
    Blake2_128Concat,
    T::AccountId,
    ReputationScore,
    ValueQuery,
>;

#[derive(Encode, Decode, TypeInfo)]
pub struct ReputationScore {
    pub score: u32,
    pub completed_tasks: u32,
    pub failed_tasks: u32,
    pub disputed_tasks: u32,
    pub total_value_delivered: Balance,
}

impl<T: Config> Pallet<T> {
    pub fn update_reputation(
        agent: &T::AccountId,
        task_result: TaskResult,
    ) -> DispatchResult {
        AgentReputation::<T>::mutate(agent, |rep| {
            match task_result {
                TaskResult::Success => {
                    rep.completed_tasks += 1;
                    rep.score += 10;
                }
                TaskResult::Failed => {
                    rep.failed_tasks += 1;
                    rep.score = rep.score.saturating_sub(20);
                }
                TaskResult::Disputed => {
                    rep.disputed_tasks += 1;
                    // Reputation adjusted after dispute resolution
                }
            }
        });

        Ok(())
    }
}
```

**Reputation Formula**:
```
score = (completed_tasks * 10)
      - (failed_tasks * 20)
      - (disputed_tasks * 30)
      + (total_value_delivered / 1000)
```

**Acceptance Criteria**:
- [ ] Reputation tracked on-chain
- [ ] Updated after each task
- [ ] Can query by agent
- [ ] Historical data preserved

#### 2. Slashing
**File**: `chain/pallets/task-market/src/lib.rs`

```rust
pub fn slash_agent(
    agent: &T::AccountId,
    amount: Balance,
    reason: SlashReason,
) -> DispatchResult {
    let stake = AgentStake::<T>::get(agent);
    ensure!(stake >= amount, Error::<T>::InsufficientStake);

    // Burn slashed amount
    T::Currency::slash(agent, amount);

    // Update stake
    AgentStake::<T>::insert(agent, stake - amount);

    // Emit event
    Self::deposit_event(Event::AgentSlashed {
        agent: agent.clone(),
        amount,
        reason,
    });

    Ok(())
}
```

**Slash Conditions**:
- [ ] Task timeout exceeded
- [ ] Invalid result submitted
- [ ] Dispute lost
- [ ] Malicious behavior detected

**Acceptance Criteria**:
- [ ] Stake slashed on violation
- [ ] Proportional to severity
- [ ] Appeals process
- [ ] Transparent on-chain

#### 3. Rewards
**File**: `chain/pallets/incentives/src/lib.rs`

```rust
pub fn distribute_rewards(
    era: EraIndex,
) -> DispatchResult {
    let total_rewards = REWARD_PER_ERA;

    // Distribute to top performers
    let top_agents = Self::get_top_agents_by_reputation(100);

    for (rank, agent) in top_agents.iter().enumerate() {
        let reward = Self::calculate_reward(rank, total_rewards);
        T::Currency::deposit_creating(agent, reward);

        Self::deposit_event(Event::RewardDistributed {
            agent: agent.clone(),
            amount: reward,
            era,
        });
    }

    Ok(())
}
```

**Acceptance Criteria**:
- [ ] Rewards distributed weekly
- [ ] Proportional to performance
- [ ] Top 100 agents rewarded
- [ ] Vesting schedule

### Success Metrics
- ✅ High-quality agents rise to top
- ✅ Bad actors penalized
- ✅ Fair and transparent

---

## Sprint 14: Governance (Week 15)
**Theme**: Decentralized decision-making

### Objectives
- On-chain governance
- Parameter updates
- Pallet upgrades
- Treasury management

### Deliverables

#### 1. Governance Pallet
**File**: `chain/pallets/governance/src/lib.rs`

```rust
#[pallet::call]
impl<T: Config> Pallet<T> {
    #[pallet::weight(10_000)]
    pub fn propose(
        origin: OriginFor<T>,
        proposal: Box<T::Proposal>,
        #[pallet::compact] value: BalanceOf<T>,
    ) -> DispatchResult {
        let who = ensure_signed(origin)?;

        // Lock deposit
        T::Currency::reserve(&who, value)?;

        let proposal_id = NextProposalId::<T>::get();

        Proposals::<T>::insert(proposal_id, ProposalInfo {
            proposer: who.clone(),
            proposal: *proposal,
            deposit: value,
            created: <frame_system::Pallet<T>>::block_number(),
            status: ProposalStatus::Voting,
            votes_for: 0,
            votes_against: 0,
        });

        NextProposalId::<T>::put(proposal_id + 1);

        Self::deposit_event(Event::Proposed {
            proposal_id,
            proposer: who,
        });

        Ok(())
    }

    #[pallet::weight(10_000)]
    pub fn vote(
        origin: OriginFor<T>,
        proposal_id: ProposalId,
        aye: bool,
        #[pallet::compact] vote_weight: BalanceOf<T>,
    ) -> DispatchResult {
        let who = ensure_signed(origin)?;

        Proposals::<T>::mutate(proposal_id, |prop| {
            if aye {
                prop.votes_for += vote_weight;
            } else {
                prop.votes_against += vote_weight;
            }
        });

        Ok(())
    }
}
```

**Proposal Types**:
- [ ] Runtime upgrades
- [ ] Parameter changes
- [ ] Treasury spending
- [ ] Emergency actions

**Acceptance Criteria**:
- [ ] Token holders can vote
- [ ] Voting power = stake
- [ ] Quorum required
- [ ] Timelock before execution

#### 2. Treasury
**File**: `chain/pallets/treasury/src/lib.rs`

```rust
#[pallet::call]
impl<T: Config> Pallet<T> {
    pub fn propose_spend(
        origin: OriginFor<T>,
        value: BalanceOf<T>,
        beneficiary: T::AccountId,
    ) -> DispatchResult {
        let proposer = ensure_signed(origin)?;

        let proposal_id = Self::proposal_count();

        <Proposals<T>>::insert(proposal_id, SpendProposal {
            proposer,
            value,
            beneficiary,
            bond: value / 20, // 5% bond
        });

        Ok(())
    }
}
```

**Treasury Income**:
- [ ] Transaction fees
- [ ] Slashed stakes
- [ ] Inflation rewards
- [ ] Donations

**Acceptance Criteria**:
- [ ] Proposals require bond
- [ ] Council approval needed
- [ ] Transparent spending
- [ ] Quarterly reports

### Success Metrics
- ✅ Community controls protocol
- ✅ Smooth upgrades
- ✅ Sustainable treasury

---

## Sprint 15: Performance Optimization (Week 16)
**Theme**: Scale to production

### Objectives
- Database optimization
- Caching layer
- CDN for IPFS
- Horizontal scaling

### Deliverables

#### 1. Database Optimization
**File**: `orchestrator/api/migrations/003_indexes.sql`

```sql
-- Indexes for common queries
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_submitter ON tasks(submitter);
CREATE INDEX idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX idx_agents_reputation ON agents(reputation DESC);
CREATE INDEX idx_agents_capabilities ON agents USING GIN(capabilities);

-- Materialized view for dashboard
CREATE MATERIALIZED VIEW dashboard_stats AS
SELECT
    COUNT(*) FILTER (WHERE status = 'Finalized') as completed_tasks,
    COUNT(*) FILTER (WHERE status = 'Running') as active_tasks,
    COUNT(DISTINCT matched_agent) as active_agents,
    SUM(budget) FILTER (WHERE status = 'Created') as total_escrow
FROM tasks;

CREATE UNIQUE INDEX ON dashboard_stats(completed_tasks);

-- Refresh every minute
CREATE OR REPLACE FUNCTION refresh_dashboard_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_stats;
END;
$$ LANGUAGE plpgsql;
```

**Acceptance Criteria**:
- [ ] Query performance < 50ms
- [ ] Indexes on all foreign keys
- [ ] Materialized views for aggregates
- [ ] Partitioning for large tables

#### 2. Redis Cache
**File**: `orchestrator/api/src/cache.rs`

```rust
use redis::{Client, Commands};

pub struct Cache {
    client: Client,
}

impl Cache {
    pub async fn get_agent(&self, did: &str) -> Result<Option<AgentView>> {
        let mut con = self.client.get_connection()?;
        let cached: Option<String> = con.get(format!("agent:{}", did))?;

        match cached {
            Some(json) => Ok(Some(serde_json::from_str(&json)?)),
            None => Ok(None),
        }
    }

    pub async fn set_agent(&self, agent: &AgentView, ttl: usize) -> Result<()> {
        let mut con = self.client.get_connection()?;
        let json = serde_json::to_string(agent)?;
        con.set_ex(format!("agent:{}", agent.did), json, ttl)?;
        Ok(())
    }
}
```

**Cached Data**:
- [ ] Agent profiles (TTL: 5 min)
- [ ] Task details (TTL: 1 min)
- [ ] Dashboard stats (TTL: 30 sec)
- [ ] Reputation scores (TTL: 10 min)

**Acceptance Criteria**:
- [ ] Redis cluster deployed
- [ ] Cache hit ratio > 80%
- [ ] Automatic invalidation
- [ ] Graceful fallback to DB

#### 3. IPFS CDN
**File**: `infrastructure/ipfs-cdn.tf`

```hcl
resource "cloudflare_worker" "ipfs_gateway" {
  name    = "ainur-ipfs-cdn"
  content = file("workers/ipfs-gateway.js")
}

resource "cloudflare_worker_route" "ipfs" {
  zone_id     = var.cloudflare_zone_id
  pattern     = "ipfs.ainur.network/*"
  script_name = cloudflare_worker.ipfs_gateway.name
}
```

**Features**:
- [ ] Global CDN for IPFS content
- [ ] Aggressive caching
- [ ] Hot/warm/cold tiers
- [ ] Automatic pinning

**Acceptance Criteria**:
- [ ] P50 latency < 100ms globally
- [ ] 99.9% uptime
- [ ] Cost effective

#### 4. Load Balancing
**File**: `infrastructure/load-balancer.tf`

```hcl
resource "digitalocean_loadbalancer" "orchestrator" {
  name   = "ainur-orchestrator-lb"
  region = "nyc3"

  forwarding_rule {
    entry_port     = 80
    entry_protocol = "http"
    target_port     = 8080
    target_protocol = "http"
  }

  healthcheck {
    port     = 8080
    protocol = "http"
    path     = "/health"
  }

  droplet_ids = [
    digitalocean_droplet.orchestrator_1.id,
    digitalocean_droplet.orchestrator_2.id,
    digitalocean_droplet.orchestrator_3.id,
  ]
}
```

**Acceptance Criteria**:
- [ ] 3+ orchestrator instances
- [ ] Round-robin load balancing
- [ ] Health checks enabled
- [ ] Auto-scaling configured

### Success Metrics
- ✅ Handles 1000 TPS
- ✅ P99 latency < 1s
- ✅ 99.95% uptime

---

## Sprint 16: Public Testnet Prep (Week 17)
**Theme**: Final polishing

### Objectives
- Security audit
- Bug bounty program
- Testnet launch plan
- Marketing materials

### Deliverables

#### 1. Security Audit
**Scope**:
- [ ] Smart contract security (pallets)
- [ ] API security
- [ ] Infrastructure security
- [ ] Cryptographic primitives

**Auditor**: Trail of Bits / Quarkslab / NCC Group

**Acceptance Criteria**:
- [ ] No critical vulnerabilities
- [ ] All high/medium issues fixed
- [ ] Audit report published

#### 2. Bug Bounty
**File**: `docs/security/bug-bounty.md`

**Rewards**:
- Critical: $10,000
- High: $5,000
- Medium: $1,000
- Low: $250

**Scope**:
- [ ] Smart contracts
- [ ] Orchestrator API
- [ ] Web UI
- [ ] SDKs

**Acceptance Criteria**:
- [ ] Program live on Immunefi
- [ ] Clear submission process
- [ ] Fast response time

#### 3. Testnet Launch Plan
**File**: `docs/testnet/launch-plan.md`

**Phases**:
1. **Private Alpha** (Week 17)
   - [ ] 10 invited validators
   - [ ] 20 whitelisted agents
   - [ ] Stress testing
   - [ ] Bug fixes

2. **Public Beta** (Week 18)
   - [ ] Open validator registration
   - [ ] Open agent registration
   - [ ] Faucet live
   - [ ] Incentivized testnet

3. **Mainnet Prep** (Month 5+)
   - [ ] Security hardening
   - [ ] Economic audits
   - [ ] Legal review
   - [ ] Marketing campaign

**Acceptance Criteria**:
- [ ] Runbook documented
- [ ] Rollback plan ready
- [ ] Monitoring configured
- [ ] Support team trained

#### 4. Marketing Materials
**Deliverables**:
- [ ] Landing page refresh
- [ ] Explainer video (3 min)
- [ ] Technical whitepaper v2
- [ ] Press kit
- [ ] Blog posts
- [ ] Twitter/Discord campaigns

**Acceptance Criteria**:
- [ ] 1000+ Discord members
- [ ] 500+ Twitter followers
- [ ] 10+ press mentions
- [ ] Influencer partnerships

### Success Metrics
- ✅ Security audit passed
- ✅ 50+ validators ready
- ✅ 100+ agents ready

---

## Sprint 17: Private Alpha Launch (Week 18)
**Theme**: Launch testnet to invited users

### Objectives
- Deploy to production infrastructure
- Onboard alpha testers
- Monitor and fix issues
- Gather feedback

### Deliverables

#### 1. Production Deployment
**Infrastructure**:
```
Production:
- 3 validator nodes (alice, bob, charlie)
- 3 orchestrator instances (behind load balancer)
- PostgreSQL cluster (primary + 2 replicas)
- Redis cluster (3 nodes)
- IPFS cluster (3 nodes)
- Monitoring (Prometheus + Grafana)
- Logging (Loki + LogQL)
- CDN (Cloudflare)
```

**Acceptance Criteria**:
- [ ] All services deployed
- [ ] Health checks green
- [ ] Monitoring active
- [ ] Alerts configured
- [ ] Backups automated

#### 2. Alpha Onboarding
**Invites**:
- [ ] 10 validator operators
- [ ] 20 agent developers
- [ ] 5 task submitters

**Onboarding Flow**:
1. Invitation email with credentials
2. Guided setup (video call)
3. Faucet tokens distributed
4. First task walkthrough
5. Feedback survey

**Acceptance Criteria**:
- [ ] 100% onboarding completion
- [ ] All users submit ≥1 task
- [ ] All agents execute ≥1 task

#### 3. Monitoring & Support
**Channels**:
- [ ] Discord #alpha-support
- [ ] Email support@ainur.network
- [ ] Weekly office hours
- [ ] Real-time monitoring dashboard

**Acceptance Criteria**:
- [ ] Response time < 2 hours
- [ ] All issues tracked
- [ ] Daily status updates

### Success Metrics
- ✅ 95% uptime during alpha
- ✅ 100+ tasks executed
- ✅ Zero critical bugs

---

## Sprint 18: Public Beta Launch (Week 19)
**Theme**: Open testnet to the world

### Objectives
- Public launch announcement
- Incentivized testnet program
- Community growth
- Continuous improvement

### Deliverables

#### 1. Launch Event
**Activities**:
- [ ] Launch announcement blog post
- [ ] Twitter Spaces AMA
- [ ] Developer workshop
- [ ] Bounty program kickoff

**Timing**:
- Monday: Announcement
- Tuesday: AMA
- Wednesday: Workshop
- Thursday: First bounties

**Acceptance Criteria**:
- [ ] 500+ registrations Day 1
- [ ] 1000+ Discord members Week 1
- [ ] 50+ agents deployed Week 1

#### 2. Incentivized Testnet
**Rewards**:
- [ ] Top 10 validators: 10,000 AINU each
- [ ] Top 20 agents: 5,000 AINU each
- [ ] Top 10 task submitters: 2,000 AINU each
- [ ] Bug reporters: up to 10,000 AINU

**Criteria**:
- Validators: uptime + performance
- Agents: tasks completed + reputation
- Submitters: unique tasks + value

**Duration**: 4 weeks

**Acceptance Criteria**:
- [ ] Clear leaderboard
- [ ] Automated tracking
- [ ] Fraud prevention
- [ ] Transparent distribution

#### 3. Community Programs
**Initiatives**:
- [ ] Ambassador program
- [ ] Developer grants
- [ ] Hackathon
- [ ] Educational content

**Acceptance Criteria**:
- [ ] 20+ ambassadors
- [ ] 10+ grants awarded
- [ ] Hackathon with 100+ participants
- [ ] 50+ tutorials/articles

### Success Metrics
- ✅ 100+ validators
- ✅ 500+ agents
- ✅ 10,000+ tasks executed
- ✅ 5,000+ active users

---

## Post-Launch: Continuous Iteration

### Month 5: Mainnet Prep
- [ ] Token economics audit
- [ ] Legal compliance review
- [ ] Mainnet parameter tuning
- [ ] Migration plan from testnet

### Month 6: Mainnet Launch
- [ ] Genesis ceremony
- [ ] Initial validator set
- [ ] Token distribution
- [ ] Exchange listings

### Month 7+: Roadmap Execution
- Phase 2: SGX/ZK attestations
- Phase 3: Sharding and cross-chain
- Ecosystem growth
- Enterprise adoption

---

## Resource Requirements

### Team
- 2 Backend Engineers (Rust)
- 1 Frontend Engineer (React/Next.js)
- 1 DevOps Engineer
- 1 QA Engineer (part-time)
- 1 Technical Writer (part-time)
- 1 Community Manager (part-time)

### Infrastructure Costs
- DigitalOcean: $500/month
- Monitoring: $100/month
- CDN: $200/month
- IPFS: $300/month
- **Total: ~$1,100/month**

### Third-Party Services
- Security audit: $50,000 (one-time)
- Bug bounty: $25,000 (reserve)
- Marketing: $10,000
- **Total: ~$85,000**

---

## Risk Management

### Technical Risks
| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Database scaling issues | High | Medium | Sharding, caching, read replicas |
| P2P network attacks | High | Medium | Rate limiting, reputation, bans |
| Smart contract bugs | Critical | Low | Audits, formal verification, bug bounty |
| IPFS reliability | Medium | High | Multiple gateways, CDN, pinning |

### Business Risks
| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Low adoption | High | Medium | Marketing, partnerships, grants |
| Competitor launches first | Medium | Low | Move fast, differentiate |
| Regulatory issues | High | Low | Legal counsel, compliance |

### Execution Risks
| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Team bandwidth | High | High | Prioritize ruthlessly, hire |
| Scope creep | Medium | High | Stick to plan, defer nice-to-haves |
| Technical debt | Medium | Medium | Reserve 20% time for refactoring |

---

## Success Criteria

### Sprint 0-6 (Months 1-2): Core Functionality
- ✅ Real data flow (no stubs)
- ✅ Agents execute tasks
- ✅ Payments settle on-chain
- ✅ P2P network functional

### Sprint 7-12 (Months 3): Production Ready
- ✅ 100+ integration tests passing
- ✅ Handles 100 TPS
- ✅ 99.9% uptime
- ✅ Documentation complete

### Sprint 13-18 (Months 4-5): Public Testnet
- ✅ 100+ validators
- ✅ 500+ agents
- ✅ 10,000+ tasks
- ✅ Active community

### Month 6+: Mainnet Launch
- ✅ Security audit passed
- ✅ Token launch
- ✅ Exchange listings
- ✅ Enterprise pilots

---

**This is the complete path from today to a production-ready public testnet. Let's start with Sprint 0!**
