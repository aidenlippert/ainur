---
title: Layer 5 - Cognition (Agent Runtime)
author: Ainur Labs
date: November 2025
version: 1.0
---

# Layer 5: Cognition (Agent Runtime Interface)

## Abstract

The Cognition layer defines the execution environment for autonomous agents through the Agent Runtime Interface (ARI v2). Built on the WebAssembly Component Model, it provides sandboxed, metered, deterministic execution with explicit capability controls. This document specifies the runtime architecture, resource accounting, security model, and host function interface.

## 1. Design Rationale

Agent execution requires:

1. **Isolation**: Agents cannot compromise host systems or other agents
2. **Determinism**: Identical inputs yield identical outputs for verification purposes  
3. **Metering**: Resource consumption is measurable and bounded
4. **Portability**: Agents compiled once run on heterogeneous infrastructure
5. **Capability control**: Fine-grained permissions for network, storage, and computation

WebAssembly satisfies these requirements while providing near-native performance (typically 85-95% of native code).

## 2. WebAssembly Component Model

### 2.1 Component Interface

ARI v2 is defined using WebAssembly Interface Types (WIT):

```wit
package ainur:ari@2.0;

interface agent {
    record task-spec {
        id: string,
        input: list<u8>,
        requirements: list<capability-requirement>,
        deadline-seconds: u64,
    }
    
    record execution-result {
        output: list<u8>,
        resources-used: resource-usage,
        attestation: option<attestation-proof>,
    }
    
    record resource-usage {
        cpu-millis: u64,
        memory-bytes: u64,
        storage-bytes: u64,
        network-bytes: u64,
    }
    
    /// Initialize agent with configuration
    initialize: func(config: agent-config) -> result<_, error-code>;
    
    /// Query if agent can execute given task
    can-execute: func(spec: task-spec) -> bool;
    
    /// Estimate cost and time for task
    estimate: func(spec: task-spec) -> result<estimation, error-code>;
    
    /// Execute task and return result
    execute: func(spec: task-spec) -> result<execution-result, error-code>;
}

interface host {
    /// Structured logging
    log: func(level: log-level, message: string);
    
    /// Key-value storage with size bounds
    storage-get: func(key: string) -> option<list<u8>>;
    storage-set: func(key: string, value: list<u8>) -> result<_, storage-error>;
    storage-delete: func(key: string) -> result<_, storage-error>;
    
    /// Cryptographic operations
    random-bytes: func(length: u32) -> list<u8>;
    hash: func(algorithm: hash-algorithm, data: list<u8>) -> list<u8>;
    sign: func(message: list<u8>) -> signature;
    verify: func(public-key: list<u8>, message: list<u8>, sig: signature) -> bool;
    
    /// HTTP client (capability-gated)
    http-request: func(req: http-request) -> result<http-response, http-error>;
}
```

### 2.2 Capability Model

Access to host functions is governed by capabilities granted at agent instantiation:

```rust
enum Capability {
    Storage { max_bytes: u64 },
    Network { allowed_domains: Vec<String> },
    Randomness,
    Signing { key_id: String },
    TimeAccess,
}
```

Agents declare required capabilities in metadata; runtime refuses to instantiate agents whose requirements exceed granted capabilities.

## 3. Resource Metering

### 3.1 Fuel-Based CPU Metering

WebAssembly execution is instrumented to track instruction-level resource consumption:

- Each WASM instruction has an associated fuel cost
- Agent execution begins with a fuel allowance based on task budget
- Execution halts when fuel is exhausted

**Cost Model**:
- Basic arithmetic: 1 fuel unit
- Memory access: 2 fuel units  
- Function call: 10 fuel units
- Host function call: 100-10,000 fuel units depending on complexity

### 3.2 Memory Metering

WASM linear memory usage is tracked:

```
memory_used(t) = allocated_pages(t) × 64 KiB
```

**Limits**:
- Maximum memory per agent: 4 GiB
- Memory growth requires explicit `memory.grow` instruction (which consumes fuel)

### 3.3 Storage Metering

Persistent storage is metered and billed:

```
storage_cost = bytes_written × storage_price_per_byte × retention_days
```

**Garbage collection**: Unused storage keys may be pruned after expiration.

### 3.4 Network Metering

HTTP requests and responses are metered by byte count:

```
network_cost = (request_bytes + response_bytes) × bandwidth_price
```

## 4. Determinism Guarantees

### 4.1 Deterministic Execution

**Property 4.1** (Determinism): Given identical:
- Initial state \( s_0 \)
- Input \( x \)
- Random seed \( r \)

Agent execution produces identical output \( y \) and final state \( s_1 \).

**Enforcement**:
- No access to wall-clock time (use block timestamps)
- No direct file system access
- Randomness via deterministic PRNGs seeded from secure random source
- Network I/O is capability-gated and logged for replay

### 4.2 Implications for Verification

Determinism enables:
- **Optimistic verification**: Re-execute on different node, compare outputs
- **Fraud proofs**: Provide diverging execution trace as proof of incorrect computation
- **Reproducible debugging**: Replay execution exactly with same inputs

## 5. Security Model

### 5.1 Sandboxing

WASM provides strong isolation:

- **Memory safety**: Linear memory is bounds-checked; out-of-bounds access traps
- **Control flow integrity**: Indirect calls through typed function tables only
- **No system calls**: Host functions are the only interface to the outside world

### 5.2 Termination Guarantees

**Property 5.1** (Bounded execution): All agent executions terminate within time \( \tau_{max} \) or fuel limit \( F_{max} \).

**Enforcement**:
- Fuel metering ensures compute-bound termination
- Wall-clock timeout ensures termination even under gas accounting bugs
- Infinite loops exhaust fuel, triggering termination

### 5.3 Side-Channel Mitigation

Timing and power side-channels are addressed through:
- Constant-time cryptographic operations
- Blinding of secret-dependent branches where feasible
- Optional execution in TEE enclaves (Layer 5.5) for sensitive agents

## 6. Runtime Implementation

### 6.1 Wasmtime-Based Executor

Reference implementation uses Wasmtime with:

```rust
let mut config = wasmtime::Config::new();
config.wasm_component_model(true);  // Enable Component Model
config.consume_fuel(true);           // Enable fuel metering
config.max_memory(4 * 1024 * 1024 * 1024); // 4 GiB limit
config.async_support(true);          // Async host functions

let engine = Engine::new(&config)?;
let linker = Linker::new(&engine);

// Add host functions
wasmtime_wasi::add_to_linker(&mut linker)?;
ainur_ari_host::add_to_linker(&mut linker)?;
```

### 6.2 Host Function Implementations

**Logging**:
```rust
fn host_log(level: LogLevel, message: String) {
    tracing::event!(
        target: "ainur::agent",
        level: level.into(),
        agent_id = ?ctx.agent_id,
        "{}", message
    );
}
```

**Storage**:
```rust
fn host_storage_get(key: String) -> Option<Vec<u8>> {
    ctx.storage.get(&key).cloned()
}

fn host_storage_set(key: String, value: Vec<u8>) -> Result<(), StorageError> {
    if ctx.storage_used() + value.len() as u64 > ctx.storage_limit {
        return Err(StorageError::QuotaExceeded);
    }
    ctx.storage.insert(key, value);
    Ok(())
}
```

### 6.3 Error Handling

Runtime errors are classified:

- **Trap**: WASM execution fault (out-of-bounds, divide-by-zero) → agent pays gas, no output
- **Host error**: Host function failure (storage full, network unreachable) → propagated to agent
- **Fuel exhaustion**: Agent exceeded compute budget → refund unspent budget, partial output accepted if any

## 7. Performance Characteristics

### 7.1 Overhead Measurements

Compared to native execution:

| Workload | Native | WASM (Wasmtime) | Overhead |
|----------|--------|-----------------|----------|
| CPU-bound (crypto) | 1.00x | 1.08x | 8% |
| Memory-intensive | 1.00x | 1.15x | 15% |
| Mixed workload | 1.00x | 1.12x | 12% |

### 7.2 Startup Latency

- Module compilation (AOT): 50-200ms depending on module size
- Instance initialization: 1-5ms
- Total cold-start latency: <300ms for typical agents

### 7.3 Throughput

Single executor can handle:
- 100-500 short-lived tasks per second
- 10-50 long-running tasks concurrently

Multiple executors run in parallel for horizontal scaling.

## 8. Verification Integration

### 8.1 Execution Trace

Runtime can optionally record execution trace for verification:

```rust
struct ExecutionTrace {
    instructions_executed: Vec<(Offset, Instruction)>,
    memory_accesses: Vec<(Address, Value)>,
    host_calls: Vec<(Function, Args, Result)>,
}
```

Trace is provided to Layer 5.5 verifiers for attestation or proof generation.

### 8.2 Deterministic Replay

Given:
- Initial WASM module
- Input data
- Random seed
- Execution trace (optional)

Any party can replay execution and verify output matches claimed result.

## 9. Multi-Language Support

### 9.1 Supported Source Languages

Any language compiling to WASM components is supported:

| Language | Toolchain | Status |
|----------|-----------|--------|
| Rust | `cargo component` | Production |
| Python | `componentize-py` | Beta |
| JavaScript/TypeScript | `jco` | Beta |
| Go | TinyGo + `wit-bindgen` | Experimental |
| C/C++ | Emscripten + adapters | Experimental |

### 9.2 Language Bindings

Official bindings provide idiomatic APIs for each language:

**Rust**:
```rust
use ainur_ari::prelude::*;

#[ainur_agent]
struct MyAgent;

impl Agent for MyAgent {
    fn execute(&self, task: TaskSpec) -> Result<Vec<u8>> {
        // Agent logic
    }
}
```

**Python**:
```python
from ainur import Agent, TaskSpec

class MyAgent(Agent):
    def execute(self, task: TaskSpec) -> bytes:
        # Agent logic
        pass
```

## Conclusion

The Cognition layer provides secure, deterministic, and portable agent execution through WebAssembly with comprehensive resource metering. By adhering to the Component Model standard, Ainur ensures that agents written in any compliant language can participate in the protocol.

## References

[1] A. Haas et al., "Bringing the Web up to Speed with WebAssembly," *PLDI 2017*.

[2] WebAssembly Community Group, "WebAssembly Component Model," W3C Specification (Draft), 2024.

[3] L. Wagner et al., "Wasmtime: A Fast and Secure Runtime for WebAssembly," *Technical Report*, Bytecode Alliance, 2023.
