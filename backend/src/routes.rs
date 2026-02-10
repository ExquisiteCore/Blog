//! 路由模块
//!
//! Rust 网关：API 路由 + 反向代理到 Next.js + 响应压缩

use crate::api;
use crate::middleware;
use crate::state::AppState;
use axum::Router;
use axum_reverse_proxy::ReverseProxy;
use tower::ServiceBuilder;
use tower_http::compression::CompressionLayer;

/// 创建应用的所有路由
pub fn create_routes(state: AppState) -> Router {
    let conn = state.conn.clone();

    // 前端地址（Next.js）
    let frontend_origin =
        std::env::var("FRONTEND_ORIGIN").unwrap_or_else(|_| "http://localhost:3000".to_string());

    Router::new()
        // API 路由
        .nest("/api", api::create_routes().with_state(state))
        // 反向代理：所有非 /api 请求转发到 Next.js
        .merge(ReverseProxy::new("/", &frontend_origin))
        // 注入数据库连接（供 identity_middleware 使用）
        .layer(axum::Extension(conn))
        // 中间件
        .layer(
            ServiceBuilder::new()
                .layer(CompressionLayer::new())
                .layer(middleware::trace_layer::create_layer())
                .layer(middleware::cors::create_layer()),
        )
}
