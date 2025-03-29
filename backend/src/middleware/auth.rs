//! 认证中间件模块
//!
//! 提供JWT认证和权限验证功能
use axum::extract::Request;
use axum::middleware::Next;
use axum::response::{IntoResponse, Response};
use jsonwebtoken::{DecodingKey, EncodingKey, Header, Validation, decode, encode};
use serde::{Deserialize, Serialize};
use time::{Duration, OffsetDateTime};

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

/// 生成JWT令牌
pub fn generate_token(user: &User) -> Result<String, AppError> {
    let config = config::get_config();

    // 获取当前时间
    let now = OffsetDateTime::now_utc();
    let iat = now.unix_timestamp() as u64;

    // 计算过期时间
    let exp = (now + Duration::minutes(config.jwt.expiration as i64)).unix_timestamp() as u64;

    // 创建JWT声明
    let claims = Claims {
        sub: user.id.to_string(),
        username: user.username.clone(),
        role: user.role.clone(),
        exp,
        iat,
    };

    // 创建JWT令牌
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

    // 解码并验证JWT令牌
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
    // 从请求头中获取认证信息
    let auth_header = req
        .headers()
        .get("Authorization")
        .and_then(|value| value.to_str().ok());

    match auth_header {
        Some(auth_header) => {
            // 从认证头中提取令牌
            if let Some(token) = extract_token_from_header(auth_header) {
                // 验证令牌
                match verify_token(token) {
                    Ok(claims) => {
                        // 将用户信息添加到请求扩展中
                        let mut req = req;
                        req.extensions_mut().insert(claims);

                        // 继续处理请求
                        Ok(next.run(req).await)
                    }
                    Err(e) => {
                        // 令牌验证失败
                        Err(e.into_response())
                    }
                }
            } else {
                // 认证头格式错误
                Err(
                    AppError::new_message("无效的认证头格式", AppErrorType::Forbidden)
                        .into_response(),
                )
            }
        }
        None => {
            // 缺少认证头
            Err(AppError::new_message("需要认证", AppErrorType::Forbidden).into_response())
        }
    }
}

/// 管理员权限中间件
pub async fn admin_middleware(req: Request, next: Next) -> Result<Response, Response> {
    // 先进行基本的认证
    let auth_header = req
        .headers()
        .get("Authorization")
        .and_then(|value| value.to_str().ok());

    match auth_header {
        Some(auth_header) => {
            // 从认证头中提取令牌
            if let Some(token) = extract_token_from_header(auth_header) {
                // 验证令牌
                match verify_token(token) {
                    Ok(claims) => {
                        // 检查用户角色
                        if claims.role == "admin" {
                            // 将用户信息添加到请求扩展中
                            let mut req = req;
                            req.extensions_mut().insert(claims);

                            // 继续处理请求
                            Ok(next.run(req).await)
                        } else {
                            // 用户不具有管理员角色
                            Err(
                                AppError::new_message("需要管理员权限", AppErrorType::Forbidden)
                                    .into_response(),
                            )
                        }
                    }
                    Err(e) => {
                        // 令牌验证失败
                        Err(e.into_response())
                    }
                }
            } else {
                // 认证头格式错误
                Err(
                    AppError::new_message("无效的认证头格式", AppErrorType::Forbidden)
                        .into_response(),
                )
            }
        }
        None => {
            // 缺少认证头
            Err(AppError::new_message("需要认证", AppErrorType::Forbidden).into_response())
        }
    }
}
