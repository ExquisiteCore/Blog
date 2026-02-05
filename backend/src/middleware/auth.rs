//! 认证中间件模块
//!
//! 提供JWT认证和权限验证功能
use axum::extract::Request;
use axum::http::header::SET_COOKIE;
use axum::middleware::Next;
use axum::response::{IntoResponse, Response};
use chrono::{Duration, Utc};
use jsonwebtoken::{DecodingKey, EncodingKey, Header, Validation, decode, encode};
use serde::{Deserialize, Serialize};

use crate::config;
use crate::error::{AppError, AppErrorType};
use crate::model::models::user::User;

/// JWT声明结构（access token）
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    /// 用户ID
    pub sub: String,
    /// 用户名
    pub username: String,
    /// 用户角色
    pub role: String,
    /// 过期时间（Unix时间戳）
    pub exp: u64,
    /// 签发时间（Unix时间戳）
    pub iat: u64,
}

/// JWT声明结构（refresh token，只含必要信息）
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RefreshClaims {
    /// 用户ID
    pub sub: String,
    /// 用户名
    pub username: String,
    /// 用户角色
    pub role: String,
    /// 过期时间（Unix时间戳）
    pub exp: u64,
    /// 签发时间（Unix时间戳）
    pub iat: u64,
}

// ============ Access Token ============

/// 生成 access token（短期）
pub fn generate_token(user: &User) -> Result<String, AppError> {
    let config = config::get_config();

    let now = Utc::now();
    let iat = now.timestamp() as u64;
    let exp = (now + Duration::minutes(config.jwt.expiration as i64)).timestamp() as u64;

    let claims = Claims {
        sub: user.id.to_string(),
        username: user.username.clone(),
        role: user.role.clone(),
        exp,
        iat,
    };

    let token = encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(config.jwt.secret.as_bytes()),
    )
    .map_err(|e| AppError::new(e, AppErrorType::Crypt))?;

    Ok(token)
}

/// 验证 access token
pub fn verify_token(token: &str) -> Result<Claims, AppError> {
    let config = config::get_config();

    let token_data = decode::<Claims>(
        token,
        &DecodingKey::from_secret(config.jwt.secret.as_bytes()),
        &Validation::default(),
    )
    .map_err(|e| match e.kind() {
        jsonwebtoken::errors::ErrorKind::ExpiredSignature => {
            AppError::new_message("令牌已过期", AppErrorType::Forbidden)
        }
        jsonwebtoken::errors::ErrorKind::InvalidSignature => {
            AppError::new_message("无效的令牌签名", AppErrorType::Forbidden)
        }
        _ => AppError::new(e, AppErrorType::Crypt),
    })?;

    Ok(token_data.claims)
}

// ============ Refresh Token ============

/// 生成 refresh token（长期）
pub fn generate_refresh_token(user: &User) -> Result<String, AppError> {
    let config = config::get_config();

    let now = Utc::now();
    let iat = now.timestamp() as u64;
    let exp = (now + Duration::minutes(config.jwt.refresh_expiration as i64)).timestamp() as u64;

    let claims = RefreshClaims {
        sub: user.id.to_string(),
        username: user.username.clone(),
        role: user.role.clone(),
        exp,
        iat,
    };

    let token = encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(config.jwt.refresh_secret.as_bytes()),
    )
    .map_err(|e| AppError::new(e, AppErrorType::Crypt))?;

    Ok(token)
}

/// 验证 refresh token
pub fn verify_refresh_token(token: &str) -> Result<RefreshClaims, AppError> {
    let config = config::get_config();

    let token_data = decode::<RefreshClaims>(
        token,
        &DecodingKey::from_secret(config.jwt.refresh_secret.as_bytes()),
        &Validation::default(),
    )
    .map_err(|e| match e.kind() {
        jsonwebtoken::errors::ErrorKind::ExpiredSignature => {
            AppError::new_message("刷新令牌已过期，请重新登录", AppErrorType::Forbidden)
        }
        jsonwebtoken::errors::ErrorKind::InvalidSignature => {
            AppError::new_message("无效的刷新令牌", AppErrorType::Forbidden)
        }
        _ => AppError::new(e, AppErrorType::Crypt),
    })?;

    Ok(token_data.claims)
}

// ============ Cookie 工具 ============

/// 构建 refresh token 的 Set-Cookie header 值
pub fn build_refresh_cookie(token: &str) -> String {
    let config = config::get_config();
    let max_age = config.jwt.refresh_expiration * 60; // 分钟转秒

    // 检查是否为纯开发环境（只有 localhost，没有其他域名）
    let is_dev = config.cors.allowed_origins.iter().all(|o| o.contains("localhost"));

    if is_dev {
        // 开发环境：不设置 Secure，使用 SameSite=Lax
        format!(
            "refresh_token={}; HttpOnly; SameSite=Lax; Path=/api/auth; Max-Age={}",
            token, max_age
        )
    } else {
        // 生产环境：设置 Domain 使 Cookie 在主域下共享，避免被浏览器当作第三方 Cookie 拦截
        format!(
            "refresh_token={}; HttpOnly; Secure; SameSite=None; Domain=.exquisitecore.xyz; Path=/api/auth; Max-Age={}",
            token, max_age
        )
    }
}

/// 构建清除 refresh token 的 Set-Cookie header 值
pub fn build_clear_refresh_cookie() -> String {
    let config = config::get_config();
    let is_dev = config.cors.allowed_origins.iter().all(|o| o.contains("localhost"));

    if is_dev {
        "refresh_token=; HttpOnly; SameSite=Lax; Path=/api/auth; Max-Age=0".to_string()
    } else {
        "refresh_token=; HttpOnly; Secure; SameSite=None; Domain=.exquisitecore.xyz; Path=/api/auth; Max-Age=0".to_string()
    }
}

/// 从 Cookie header 中提取 refresh_token
fn extract_refresh_token_from_cookies(cookie_header: &str) -> Option<String> {
    for cookie in cookie_header.split(';') {
        let cookie = cookie.trim();
        if let Some(value) = cookie.strip_prefix("refresh_token=") {
            let value = value.trim();
            if !value.is_empty() {
                return Some(value.to_string());
            }
        }
    }
    None
}

// ============ 中间件 ============

/// 从认证头中提取令牌
pub fn extract_token_from_header(auth_header: &str) -> Option<&str> {
    if auth_header.starts_with("Bearer ") {
        Some(auth_header.trim_start_matches("Bearer ").trim())
    } else {
        None
    }
}

/// 从请求中提取并验证 token，返回 Claims
fn extract_and_verify_token(req: &Request) -> Result<Claims, Response> {
    let auth_header = req
        .headers()
        .get("Authorization")
        .and_then(|value| value.to_str().ok());

    match auth_header {
        Some(auth_header) => {
            if let Some(token) = extract_token_from_header(auth_header) {
                verify_token(token).map_err(|e| e.into_response())
            } else {
                Err(AppError::new_message("无效的认证头格式", AppErrorType::Forbidden).into_response())
            }
        }
        None => Err(AppError::new_message("需要认证", AppErrorType::Forbidden).into_response()),
    }
}

/// 认证中间件
pub async fn auth_middleware(req: Request, next: Next) -> Result<Response, Response> {
    let claims = extract_and_verify_token(&req)?;
    let mut req = req;
    req.extensions_mut().insert(claims);
    Ok(next.run(req).await)
}

/// 管理员权限中间件
pub async fn admin_middleware(req: Request, next: Next) -> Result<Response, Response> {
    let claims = extract_and_verify_token(&req)?;

    if claims.role != "admin" {
        return Err(
            AppError::new_message("需要管理员权限", AppErrorType::Forbidden).into_response()
        );
    }

    let mut req = req;
    req.extensions_mut().insert(claims);
    Ok(next.run(req).await)
}

// ============ 处理函数 ============

/// 刷新令牌处理函数
///
/// 从 Cookie 中读取 refresh_token，验证后生成新的 access token
pub async fn refresh_token_handler(req: Request) -> Result<Response, AppError> {
    // 从 Cookie 中提取 refresh_token
    let cookie_header = req
        .headers()
        .get("Cookie")
        .and_then(|v| v.to_str().ok())
        .ok_or_else(|| AppError::new_message("缺少 Cookie", AppErrorType::Forbidden))?;

    let refresh_token = extract_refresh_token_from_cookies(cookie_header)
        .ok_or_else(|| AppError::new_message("缺少 refresh_token", AppErrorType::Forbidden))?;

    // 验证 refresh token
    let claims = verify_refresh_token(&refresh_token)?;

    // 构造临时 User 用于生成 access token
    let user = User::from_claims(&claims.sub, &claims.username, &claims.role);

    // 生成新的 access token
    let access_token = generate_token(&user)?;

    let body = serde_json::json!({ "token": access_token });

    Ok(axum::Json(body).into_response())
}

/// 退出登录处理函数
///
/// 清除 refresh_token cookie
pub async fn logout_handler() -> Response {
    let mut response = axum::Json(serde_json::json!({ "success": true })).into_response();
    response.headers_mut().insert(
        SET_COOKIE,
        build_clear_refresh_cookie().parse().unwrap(),
    );
    response
}
