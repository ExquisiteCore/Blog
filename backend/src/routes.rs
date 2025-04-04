//! 路由模块
//!
//! 这个模块包含所有API路由的定义

use crate::api;
use crate::middleware;
use axum::Router;
use sqlx::{Pool, Postgres};
use std::sync::Arc;
use tower::ServiceBuilder;

/// 创建应用的所有路由
pub fn create_routes(pool: Arc<Pool<Postgres>>) -> Router {
    Router::new()
        .nest("/api", api::create_routes().with_state(pool))
        //中间件
        .layer(
            ServiceBuilder::new()
                .layer(middleware::trace_layer::create_layer())
                .layer(middleware::cors::create_layer()),
        )
}
