//! API路由模块
//!
//! 包含所有API端点的路由定义

use axum::{Router, routing::get};

/// 创建API路由
pub fn create_routes() -> Router {
    Router::new().route("/test", get(test))
}

/// 创建根路由
pub fn create_root_routes() -> Router {
    Router::new().route("/", get(root))
}

/// 测试API端点
async fn test() -> &'static str {
    "Hello, Blog API!"
}

/// 根路由处理函数
async fn root() -> &'static str {
    "Hello, Blog API!"
}
