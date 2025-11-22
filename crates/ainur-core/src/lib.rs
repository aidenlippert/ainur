//! Core types and traits for the Ainur Protocol
//!
//! This crate provides the foundational types used throughout the Ainur ecosystem,
//! including agent identifiers, task specifications, reputation scores, and more.

#![cfg_attr(not(feature = "std"), no_std)]

extern crate alloc;

pub mod constants;
pub mod errors;
pub mod traits;
pub mod types;

pub use constants::*;
pub use errors::*;
pub use traits::*;
pub use types::*;

#[cfg(test)]
mod tests;
