use axum::http;
use http::Method;
use http::header::{AUTHORIZATION, CONTENT_TYPE};
use tower_http::cors::CorsLayer;

/// 创建跨域中间件
pub fn create_layer() -> CorsLayer {
    // 定义允许的源
    let origins = [
        "http://localhost:4321".parse().unwrap(),
        "https://blog.exquisitecore.xyz".parse().unwrap(),
    ];

    // 定义允许的方法
    let methods = [
        Method::GET,
        Method::POST,
        Method::PUT,
        Method::DELETE,
        Method::OPTIONS,
    ];

    // 定义允许的头部
    let headers = [AUTHORIZATION, CONTENT_TYPE];

    CorsLayer::new()
        .allow_methods(methods)
        .allow_headers(headers)
        .allow_origin(origins)
        .allow_credentials(true)
}
