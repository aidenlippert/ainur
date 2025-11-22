#![no_mangle]
#![allow(clippy::missing_safety_doc)]

//! Reference EchoAgent compiled to WASM.
//!
//! The host (CognitionWasmEngine) writes the input bytes into linear memory
//! starting at offset 0 and then calls:
//!
//!     execute(ptr: i32, len: i32) -> i64
//!
//! The return value encodes the pointer/length of the output buffer in the
//! lower and upper 32 bits respectively.

use ainur_agent_sdk::{AinurAgent, EchoAgent, TaskContext};

/// Entry point expected by the host.
#[no_mangle]
pub unsafe extern "C" fn execute(ptr: i32, len: i32) -> i64 {
    let mem = memory_as_slice_mut();

    let start = ptr as usize;
    let end = start.saturating_add(len as usize);
    if end > mem.len() {
        return -1;
    }

    let input = &mem[start..end];

    let ctx = TaskContext {
        task_id: String::new(),
        input: input.to_vec(),
    };

    let output = match EchoAgent::execute(&ctx) {
        Ok(bytes) => bytes,
        Err(_) => return -1,
    };

    // Write output back into memory directly after the input region.
    let out_ptr = end;
    let out_len = output.len();
    if out_ptr + out_len > mem.len() {
        return -1;
    }

    mem[out_ptr..out_ptr + out_len].copy_from_slice(&output);

    // Pack (ptr,len) into 64 bits: (len << 32) | ptr.
    ((out_len as i64) << 32) | (out_ptr as i64)
}

/// Obtain a mutable view of the entire linear memory.
fn memory_as_slice_mut() -> &'static mut [u8] {
    extern "C" {
        static mut __heap_base: u8;
    }

    // For the MVP we assume a single 64KiB page is enough.
    unsafe {
        let ptr = &mut __heap_base as *mut u8;
        core::slice::from_raw_parts_mut(ptr, 64 * 1024)
    }
}
