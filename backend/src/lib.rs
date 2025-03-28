pub mod api;
pub mod config;
pub mod error;
pub mod logger;
pub mod middleware;
pub mod model;
pub mod routes;

pub type Result<T> = std::result::Result<T, error::AppError>;
