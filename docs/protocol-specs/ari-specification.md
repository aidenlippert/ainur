---
title: Agent Runtime Interface (ARI v2) Specification
author: Ainur Labs
date: November 2025
version: 2.0
status: Draft
---

# Agent Runtime Interface (ARI v2) Specification

## 1. Introduction

The Agent Runtime Interface (ARI) defines the contract between agent code and the host runtime environment. ARI v2 is specified using WebAssembly Interface Types (WIT) to ensure language-agnostic compatibility and formal interface definitions. This document provides the normative specification for ARI v2.

## 2. Scope and Conformance

### 2.1 Scope

This specification defines:

- The `agent` interface that agent components must implement
- The `host` interface that runtimes must provide
- Resource accounting and limits
- Error handling semantics
- Security and capability model

### 2.2 Conformance

An implementation conforms to ARI v2 if:

1. It accepts all well-formed WASM components implementing the `agent` interface
2. It provides all host functions specified in the `host` interface with documented semantics
3. It enforces resource limits as specified
4. It maintains determinism guarantees

### 2.3 Normative References

- WebAssembly Core Specification 2.0
- WebAssembly Component Model (Draft)
- RFC 3986 (URI Generic Syntax)
- RFC 8259 (JSON)

## 3. Interface Definitions

### 3.1 Agent Interface (WIT)

```wit
package ainur:ari@2.0;

interface agent {
    /// Core types
    record agent-config {
        agent-id: string,
        capabilities: list<capability>,
        resource-limits: resource-limits,
    }
    
    record task-spec {
        task-id: string,
        input: list<u8>,
        requirements: list<capability-requirement>,
        budget: u64,
        deadline-seconds: u64,
    }
    
    record execution-result {
        output: list<u8>,
        resources-used: resource-usage,
        attestation: option<attestation-proof>,
        metadata: list<tuple<string, string>>,
    }
    
    record resource-usage {
        cpu-millis: u64,
        memory-bytes: u64,
        storage-bytes: u64,
        network-bytes: u64,
    }
    
    record resource-limits {
        max-cpu-millis: u64,
        max-memory-bytes: u64,
        max-storage-bytes: u64,
        max-network-bytes: u64,
    }
    
    record estimation {
        estimated-cpu-millis: u64,
        estimated-completion-seconds: u64,
        estimated-cost: u64,
        confidence: u8, // 0-100
    }
    
    enum error-code {
        invalid-config,
        invalid-task-spec,
        insufficient-resources,
        execution-failed,
        timeout,
        verification-failed,
    }
    
    variant attestation-proof {
        none,
        tee-attestation(list<u8>),
        zk-proof(list<u8>),
        combined(tuple<list<u8>, list<u8>>),
    }
    
    /// Lifecycle management
    initialize: func(config: agent-config) -> result<_, error-code>;
    shutdown: func() -> result<_, error-code>;
    
    /// Task evaluation
    can-execute: func(spec: task-spec) -> bool;
    estimate: func(spec: task-spec) -> result<estimation, error-code>;
    
    /// Task execution
    execute: func(spec: task-spec) -> result<execution-result, error-code>;
    
    /// Capability introspection
    get-capabilities: func() -> list<capability>;
}
```

### 3.2 Host Interface (WIT)

```wit
interface host {
    /// Logging
    enum log-level {
        debug,
        info,
        warn,
        error,
    }
    
    log: func(level: log-level, message: string);
    
    /// Storage operations
    enum storage-error {
        key-not-found,
        quota-exceeded,
        invalid-key,
    }
    
    storage-get: func(key: string) -> result<list<u8>, storage-error>;
    storage-set: func(key: string, value: list<u8>) -> result<_, storage-error>;
    storage-delete: func(key: string) -> result<_, storage-error>;
    storage-keys: func(prefix: option<string>) -> list<string>;
    
    /// Cryptographic operations
    enum hash-algorithm {
        sha-256,
        sha-512,
        blake2b,
        keccak-256,
    }
    
    record signature {
        algorithm: string,
        bytes: list<u8>,
    }
    
    random-bytes: func(length: u32) -> list<u8>;
    hash: func(algorithm: hash-algorithm, data: list<u8>) -> list<u8>;
    sign: func(message: list<u8>) -> result<signature, string>;
    verify: func(public-key: list<u8>, message: list<u8>, sig: signature) -> bool;
    
    /// HTTP client (capability-gated)
    record http-request {
        method: string,
        url: string,
        headers: list<tuple<string, string>>,
        body: option<list<u8>>,
        timeout-seconds: u32,
    }
    
    record http-response {
        status: u16,
        headers: list<tuple<string, string>>,
        body: list<u8>,
    }
    
    enum http-error {
        invalid-url,
        timeout,
        network-error,
        permission-denied,
    }
    
    http-request: func(req: http-request) -> result<http-response, http-error>;
    
    /// Time (deterministic)
    current-time-seconds: func() -> u64;  // Block timestamp
    
    /// Agent identity
    get-agent-id: func() -> string;
}
```

## 4. Capability Model

### 4.1 Capability Types

```wit
variant capability {
    storage(storage-capability),
    network(network-capability),
    cryptographic(crypto-capability),
    time-access,
    http-client(http-capability),
}

record storage-capability {
    max-bytes: u64,
    allowed-prefixes: list<string>,
}

record network-capability {
    allowed-domains: list<string>,
    max-requests-per-second: u32,
}

record crypto-capability {
    algorithms: list<string>,
    key-access: list<string>,
}

record http-capability {
    allowed-domains: list<string>,
    max-body-bytes: u64,
}
```

### 4.2 Capability Enforcement

Host functions check capabilities before execution:

```rust
fn host_http_request(req: HttpRequest) -> Result<HttpResponse, HttpError> {
    // Check HTTP capability
    let cap = ctx.capabilities.iter()
        .find_map(|c| match c {
            Capability::HttpClient(http) => Some(http),
            _ => None,
        })
        .ok_or(HttpError::PermissionDenied)?;
    
    // Verify domain is allowed
    let domain = extract_domain(&req.url)?;
    if !cap.allowed_domains.contains(&domain) {
        return Err(HttpError::PermissionDenied);
    }
    
    // Execute request with size limits
    execute_http(req, cap.max_body_bytes)
}
```

## 5. Resource Accounting

### 5.1 CPU Metering

Fuel costs per instruction category:

| Category | Cost (fuel units) |
|----------|-------------------|
| Basic arithmetic | 1 |
| Memory load/store | 2 |
| Control flow | 1 |
| Function call | 10 |
| Host function call | 100-10,000 |

### 5.2 Memory Accounting

Linear memory pages (64 KiB each) are tracked:

```
memory_used = allocated_pages × 64 KiB
memory_cost = memory_used × duration × price_per_byte_second
```

### 5.3 Storage Accounting

Persistent storage is metered by key-value pairs:

```
storage_cost = Σ_keys (key_size + value_size) × retention_days × price
```

### 5.4 Network Accounting

HTTP requests metered by total bytes:

```
network_cost = (request_bytes + response_bytes) × price_per_byte
```

## 6. Error Handling

### 6.1 Error Propagation

Errors propagate according to:

- **Trap**: WASM execution fault → agent terminated, no output, gas consumed
- **Explicit error return**: Agent returns `Err(error-code)` → graceful failure, partial gas refund
- **Host error**: Host function fails → propagated to agent as error result

### 6.2 Recovery

Agents can implement retry logic for transient host errors (network timeout, temporary storage unavailability). Persistent errors (permission denied, invalid parameter) should not be retried.

## 7. Determinism Requirements

### 7.1 Deterministic Sources

Agents must use deterministic sources for:

- **Time**: `host::current-time-seconds()` returns block timestamp
- **Randomness**: `host::random-bytes()` uses deterministic PRNG seeded from VRF output
- **I/O**: HTTP responses are not deterministic; agents must handle idempotently

### 7.2 Non-Determinism Handling

For inherently non-deterministic operations (HTTP to external APIs):

- **Consensus verification**: Multiple validators execute, compare outputs, accept if ≥2/3 agree
- **Optimistic verification**: Single execution, challenge period, re-execution on dispute
- **Deterministic replay**: Log HTTP responses, replay from log for verification

## 8. Security Considerations

### 8.1 Threat Model

ARI assumes agents may be adversarial:

- Attempt to escape sandbox
- Consume excessive resources
- Produce incorrect outputs
- Exploit host function vulnerabilities

**Defense**: Memory safety of WASM, explicit capability model, resource metering, and verification at Layer 5.5.

### 8.2 Side-Channel Resistance

Timing channels are addressed by:

- Constant-time implementations of cryptographic operations
- Optional blinding of secret-dependent branches
- TEE execution (Layer 5.5) for high-security requirements

## 9. Versioning and Evolution

### 9.1 Interface Versioning

ARI follows semantic versioning:

- Major version: Breaking changes to interface
- Minor version: Backward-compatible additions
- Patch version: Bug fixes and clarifications

Current: ARI v2.0.0

### 9.2 Backward Compatibility

Runtimes must support all minor versions within the same major version. Agents declare minimum required version in metadata; runtime refuses to load agents requiring newer versions than supported.

## 10. Implementation Guidance

### 10.1 Reference Implementation

Rust-based reference implementation using Wasmtime: `ainur-ari-host` crate.

### 10.2 Compliance Testing

Conformance test suite available at `tests/ari-conformance/` verifies:

- All host functions behave per specification
- Resource limits are enforced correctly
- Capability model prevents unauthorized access
- Error conditions are handled appropriately

## Conclusion

ARI v2 provides a robust, secure, and performant interface for agent execution in the Ainur Protocol. By leveraging WebAssembly and the Component Model, it achieves language-agnostic portability while maintaining strong security and determinism guarantees.

## References

[1] WebAssembly Community Group, "WebAssembly Core Specification," W3C Recommendation, 2019.

[2] WebAssembly Component Model Proposal, https://github.com/WebAssembly/component-model

[3] A. Haas et al., "Bringing the Web up to Speed with WebAssembly," *PLDI 2017*.
