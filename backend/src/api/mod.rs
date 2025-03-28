//! API路由模块
//!
//! 包含所有API端点的路由定义

mod postapi;
mod userapi;

use axum::{
    Json, Router,
    routing::{get, post},
};
use serde::Serialize;
use sqlx::{Pool, Postgres};
use std::sync::Arc;

/// 创建API路由
pub fn create_routes() -> Router<Arc<Pool<Postgres>>> {
    Router::new()
        .route("/test", get(test))
        .route("/posts", get(postapi::get_posts))
        .route("/posts", post(postapi::create_post))
        .route("/users/register", post(userapi::register_user))
}

#[derive(Serialize)]
struct Response {
    message: String,
}
/// 测试API端点
async fn test() -> Json<Response> {
    Json(Response {
        message: "Hello, Axum!".to_string(),
    })
}
