//! Core types and traits for the Ainur Protocol
//! 
//! This crate provides the foundational types used throughout the Ainur ecosystem,
//! including agent identifiers, task specifications, reputation scores, and more.

#![cfg_attr(not(feature = "std"), no_std)]

extern crate alloc;

pub mod types;
pub mod errors;
pub mod traits;
pub mod constants;

pub use types::*;
pub use errors::*;
pub use traits::*;
pub use constants::*;

#[cfg(test)]
mod tests;
