use crate::config::get_config;
use axum::http;
use http::HeaderName;
use http::Method;
use tower_http::cors::{Any, CorsLayer};

/// 创建跨域中间件
pub fn create_layer() -> CorsLayer {
    let config = get_config();
    let cors_config = &config.cors;

    // 从配置中获取允许的源
    let origins = cors_config
        .allowed_origins
        .iter()
        .filter_map(|origin| origin.parse().ok())
        .collect::<Vec<_>>();

    // 从配置中获取允许的方法
    let methods = cors_config
        .allowed_methods
        .iter()
        .filter_map(|method| method.parse::<Method>().ok())
        .collect::<Vec<_>>();

    // 从配置中获取允许的头部
    let headers = cors_config
        .allowed_headers
        .iter()
        .filter_map(|header| header.parse::<HeaderName>().ok())
        .collect::<Vec<_>>();

    let mut layer = CorsLayer::new();

    // 检查是否使用 Any origin（与 credentials 冲突）
    let use_any_origin = origins.is_empty();

    // 如果有配置的源，则使用它们，否则允许任何源
    if !origins.is_empty() {
        layer = layer.allow_origin(origins);
    } else {
        layer = layer.allow_origin(Any);
    }

    // 如果有配置的方法，则使用它们，否则允许任何方法
    if !methods.is_empty() {
        layer = layer.allow_methods(methods);
    } else {
        layer = layer.allow_methods(Any);
    }

    // 如果有配置的头部，则使用它们，否则允许任何头部
    if !headers.is_empty() {
        layer = layer.allow_headers(headers);
    } else {
        layer = layer.allow_headers(Any);
    }

    // 设置是否允许凭证（注意：Any origin 与 credentials 不兼容）
    // 当使用 Any origin 时，忽略 allow_credentials 设置
    if !use_any_origin && cors_config.allow_credentials {
        layer = layer.allow_credentials(true);
    }

    layer
}
