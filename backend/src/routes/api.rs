//! API路由模块
//!
//! 包含所有API端点的路由定义

use axum::{Router, extract::State, routing::get};
use sqlx::{Pool, Postgres};
use std::sync::Arc;

/// 创建API路由
pub fn create_routes() -> Router<Arc<Pool<Postgres>>> {
    Router::new()
        .route("/test", get(test))
        .route("/1", get(|| async { "Hello, World!" }))
}

/// 测试API端点
async fn test(State(pool): State<Arc<Pool<Postgres>>>) -> &'static str {
    "Hello, Blog API!"
}
