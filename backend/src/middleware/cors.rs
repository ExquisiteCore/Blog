use tower_http::cors::{Any, CorsLayer};

/// 创建跨域中间件
pub fn create_layer() -> CorsLayer {
    CorsLayer::new()
        .allow_methods(Any)
        .allow_headers(Any)
        .allow_origin(Any)
}
