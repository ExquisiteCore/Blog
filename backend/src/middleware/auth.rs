//! 认证中间件模块
//!
//! 提供JWT认证和权限验证功能
use axum::extract::{Json, Request};
use axum::middleware::Next;
use axum::response::{IntoResponse, Response};
use chrono::{Duration, Utc};
use jsonwebtoken::{DecodingKey, EncodingKey, Header, Validation, decode, encode};
use serde::{Deserialize, Serialize};

use crate::config;
use crate::error::{AppError, AppErrorType};
use crate::model::models::user::User;

/// JWT声明结构
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

/// 刷新令牌请求结构
#[derive(Debug, Serialize, Deserialize)]
pub struct RefreshTokenRequest {
    /// 旧令牌
    pub token: String,
}

/// 刷新令牌响应结构
#[derive(Debug, Serialize, Deserialize)]
pub struct RefreshTokenResponse {
    /// 新令牌
    pub token: String,
}

/// 生成JWT令牌
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

/// 验证JWT令牌
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

/// 验证JWT令牌（用于刷新，允许已过期但在刷新窗口内的令牌）
pub fn verify_token_for_refresh(token: &str) -> Result<Claims, AppError> {
    let config = config::get_config();

    let mut validation = Validation::default();
    validation.validate_exp = false;

    let token_data = decode::<Claims>(
        token,
        &DecodingKey::from_secret(config.jwt.secret.as_bytes()),
        &validation,
    )
    .map_err(|e| match e.kind() {
        jsonwebtoken::errors::ErrorKind::InvalidSignature => {
            AppError::new_message("无效的令牌签名", AppErrorType::Forbidden)
        }
        _ => AppError::new(e, AppErrorType::Crypt),
    })?;

    let claims = token_data.claims;
    let now = Utc::now().timestamp() as u64;

    if claims.exp < now && now - claims.exp > 30 * 60 {
        return Err(AppError::new_message(
            "令牌已过期且超出刷新窗口",
            AppErrorType::Forbidden,
        ));
    }

    Ok(claims)
}

/// 刷新JWT令牌
pub fn refresh_token(old_token: &str) -> Result<String, AppError> {
    let claims = verify_token_for_refresh(old_token)?;
    let config = config::get_config();

    let now = Utc::now();
    let iat = now.timestamp() as u64;
    let exp = (now + Duration::minutes(config.jwt.expiration as i64)).timestamp() as u64;

    let new_claims = Claims {
        sub: claims.sub,
        username: claims.username,
        role: claims.role,
        exp,
        iat,
    };

    let token = encode(
        &Header::default(),
        &new_claims,
        &EncodingKey::from_secret(config.jwt.secret.as_bytes()),
    )
    .map_err(|e| AppError::new(e, AppErrorType::Crypt))?;

    Ok(token)
}

/// 从认证头中提取令牌
pub fn extract_token_from_header(auth_header: &str) -> Option<&str> {
    if auth_header.starts_with("Bearer ") {
        Some(auth_header.trim_start_matches("Bearer ").trim())
    } else {
        None
    }
}

/// 认证中间件
pub async fn auth_middleware(req: Request, next: Next) -> Result<Response, Response> {
    let auth_header = req
        .headers()
        .get("Authorization")
        .and_then(|value| value.to_str().ok());

    match auth_header {
        Some(auth_header) => {
            if let Some(token) = extract_token_from_header(auth_header) {
                match verify_token(token) {
                    Ok(claims) => {
                        let mut req = req;
                        req.extensions_mut().insert(claims);
                        Ok(next.run(req).await)
                    }
                    Err(e) => Err(e.into_response()),
                }
            } else {
                Err(
                    AppError::new_message("无效的认证头格式", AppErrorType::Forbidden)
                        .into_response(),
                )
            }
        }
        None => Err(AppError::new_message("需要认证", AppErrorType::Forbidden).into_response()),
    }
}

/// 刷新令牌处理函数
pub async fn refresh_token_handler(
    Json(req): Json<RefreshTokenRequest>,
) -> Result<Json<RefreshTokenResponse>, AppError> {
    let new_token = refresh_token(&req.token)?;
    Ok(Json(RefreshTokenResponse { token: new_token }))
}

/// 管理员权限中间件
pub async fn admin_middleware(req: Request, next: Next) -> Result<Response, Response> {
    let auth_header = req
        .headers()
        .get("Authorization")
        .and_then(|value| value.to_str().ok());

    match auth_header {
        Some(auth_header) => {
            if let Some(token) = extract_token_from_header(auth_header) {
                match verify_token(token) {
                    Ok(claims) => {
                        if claims.role == "admin" {
                            let mut req = req;
                            req.extensions_mut().insert(claims);
                            Ok(next.run(req).await)
                        } else {
                            Err(
                                AppError::new_message("需要管理员权限", AppErrorType::Forbidden)
                                    .into_response(),
                            )
                        }
                    }
                    Err(e) => Err(e.into_response()),
                }
            } else {
                Err(
                    AppError::new_message("无效的认证头格式", AppErrorType::Forbidden)
                        .into_response(),
                )
            }
        }
        None => Err(AppError::new_message("需要认证", AppErrorType::Forbidden).into_response()),
    }
}
