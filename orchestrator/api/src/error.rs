use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde::Serialize;
use thiserror::Error;

use ainur_core::CoreError;

/// Canonical API error type for the orchestrator surface.
///
/// This is intentionally small and maps protocol/domain errors into the HTTP
/// status space without leaking internal implementation details.
#[derive(Debug, Error)]
pub enum ApiError {
    /// The client sent a malformed or semantically invalid request.
    #[error("bad request: {0}")]
    BadRequest(String),

    /// A requested resource does not exist.
    #[error("not found: {0}")]
    NotFound(String),

    /// An unexpected error occurred inside the orchestrator.
    #[error("internal server error")]
    Internal,
}

#[derive(Debug, Serialize)]
struct ErrorBody {
    /// High‑level error category.
    error: &'static str,
    /// Human‑readable message safe to expose to clients.
    message: String,
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let (status, error, message) = match self {
            ApiError::BadRequest(msg) => (StatusCode::BAD_REQUEST, "bad_request", msg),
            ApiError::NotFound(msg) => (StatusCode::NOT_FOUND, "not_found", msg),
            ApiError::Internal => (
                StatusCode::INTERNAL_SERVER_ERROR,
                "internal_error",
                "internal server error".to_string(),
            ),
        };

        let body = Json(ErrorBody { error, message });
        (status, body).into_response()
    }
}

impl From<CoreError> for ApiError {
    fn from(err: CoreError) -> Self {
        // At the HTTP boundary we do not differentiate all CoreError variants.
        // Anything coming from deep in the protocol stack is treated as a bad
        // request unless it clearly indicates an internal failure.
        match err {
            CoreError::InvalidLength { .. }
            | CoreError::InvalidFormat(_)
            | CoreError::OutOfRange { .. }
            | CoreError::MissingCapability(_)
            | CoreError::InvalidStateTransition { .. }
            | CoreError::DeadlineExceeded { .. }
            | CoreError::InsufficientResources { .. }
            | CoreError::EconomicConstraintViolation { .. } => {
                ApiError::BadRequest(err.to_string())
            }
            CoreError::SerializationError(_)
            | CoreError::CryptoError(_)
            | CoreError::NetworkError(_)
            | CoreError::StorageError(_)
            | CoreError::Custom(_) => ApiError::Internal,
        }
    }
}


