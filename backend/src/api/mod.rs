//! API路由模块
//!
//! 包含所有API端点的路由定义

mod postapi;

use axum::{Json, Router, extract::State, routing::get};
use serde::Serialize;
use sqlx::{Pool, Postgres};
use std::sync::Arc;

/// 创建API路由
pub fn create_routes() -> Router<Arc<Pool<Postgres>>> {
    Router::new().route("/test", get(test))
}

#[derive(Serialize)]
struct Response {
    message: String,
}
/// 测试API端点
async fn test(State(pool): State<Arc<Pool<Postgres>>>) -> Json<Response> {
    Json(Response {
        message: "Hello, Axum!".to_string(),
    })
}
