//! 路由模块
//! 
//! 这个模块包含所有API路由的定义

mod api;

use axum::Router;

/// 创建应用的所有路由
pub fn create_routes() -> Router {
    Router::new()
        .nest("/api", api::create_routes())
        .merge(api::create_root_routes())
}