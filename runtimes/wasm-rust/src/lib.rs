//! Ainur Cognition WASM runtime (Rust + Wasmtime, v0)
//!
//! This crate provides a minimal execution engine capable of loading a single
//! WebAssembly module and invoking an exported `execute` function that follows
//! the `AinurAgent` contract at the ABI level:
//!   - input: pointer/length pair to a linear-memory byte slice
//!   - output: pointer/length pair for a newly-allocated byte slice
//!
//! For the initial MVP we avoid the full Component Model glue and WIT
//! integration; the host constructs a `TaskContext` and passes its `input`
//! bytes directly to the WASM guest. The guest is responsible for decoding
//! and encoding as needed. This can be upgraded to a full ARI v2 host once
//! the bindings are stabilized.

use std::path::Path;

use ainur_agent_sdk::{AgentError, Result as AgentResult, TaskContext};
use anyhow::Result;
use wasmtime::{Caller, Engine, Func, Instance, Linker, Module, Store};

/// Simple execution engine backed by a single WASM module on disk.
///
/// This is designed to be wrapped by the orchestrator's `ExecutionEngine`
/// abstraction. It is intentionally small and focused on the MVP use case:
/// running one guest agent for many tasks in a single process.
pub struct CognitionWasmEngine {
    engine: Engine,
    module: Module,
}

impl CognitionWasmEngine {
    /// Load a WASM module from the given path. The module must export a
    /// function `execute(ptr: i32, len: i32) -> i64` where the return value
    /// encodes a pointer/length pair in linear memory:
    ///
    ///   (len << 32) | ptr
    ///
    pub fn from_file<P: AsRef<Path>>(path: P) -> Result<Self> {
        let engine = Engine::default();
        let module = Module::from_file(&engine, path)?;
        Ok(Self { engine, module })
    }

    /// Execute the given task context by invoking the guest's `execute`
    /// function and returning the resulting output bytes.
    pub fn execute(&self, ctx: &TaskContext) -> AgentResult<Vec<u8>> {
        let mut store = Store::new(&self.engine, ());
        let mut linker = Linker::new(&self.engine);

        // In later iterations we will add host functions here for ARI imports.
        // For the MVP we provide no imports and expect the guest to be
        // self-contained (pure computation over the input buffer).

        let instance = linker
            .instantiate(&mut store, &self.module)
            .map_err(|e| AgentError::Runtime(e.to_string()))?;

        let memory = instance
            .get_memory(&mut store, "memory")
            .ok_or_else(|| AgentError::Runtime("guest module has no exported memory".into()))?;

        let execute = instance
            .get_typed_func::<(i32, i32), i64>(&mut store, "execute")
            .map_err(|e| AgentError::Runtime(format!("missing execute export: {e}")))?;

        let input = &ctx.input;
        let len = input.len() as i32;

        // Allocate guest memory by growing the linear memory if necessary.
        // For the MVP, we simply write at offset 0 assuming a fresh instance
        // and sufficient initial pages.
        let ptr = 0i32;
        memory
            .write(&mut store, ptr as usize, input)
            .map_err(|e| AgentError::Runtime(e.to_string()))?;

        let ret = execute
            .call(&mut store, (ptr, len))
            .map_err(|e| AgentError::Runtime(e.to_string()))?;

        let out_ptr = (ret & 0xffffffff) as i32;
        let out_len = (ret >> 32) as i32;

        if out_len < 0 || out_ptr < 0 {
            return Err(AgentError::Runtime(
                "guest returned negative pointer/length".into(),
            ));
        }

        let mut buf = vec![0u8; out_len as usize];
        memory
            .read(&mut store, out_ptr as usize, &mut buf)
            .map_err(|e| AgentError::Runtime(e.to_string()))?;

        Ok(buf)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn engine_can_be_constructed_without_panic() {
        // We cannot ship a real WASM module in this crate yet, but we can at
        // least ensure the engine can be created from a non-existent path and
        // that the error is propagated cleanly by callers.
        let path = "nonexistent.wasm";
        let res = CognitionWasmEngine::from_file(path);
        assert!(res.is_err());
    }
}
