//! 认证中间件模块
//!
//! 提供 JWT 认证、匿名身份追踪和权限验证功能。
//!

use axum::extract::Request;
use axum::http::header::SET_COOKIE;
use axum::middleware::Next;
use axum::response::{IntoResponse, Response};
use chrono::{Duration, Utc};
use jsonwebtoken::{DecodingKey, EncodingKey, Header, Validation, decode, encode};
use sea_orm::*;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::config;
use crate::entity::{identity, user};
use crate::wrapper::{ApiError, ApiResponse};

// ========== JWT Claims ==========

/// JWT 声明结构（access token）
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    /// 用户 ID
    pub sub: String,
    /// 用户名
    pub username: String,
    /// 用户角色
    pub role: String,
    /// 过期时间（Unix 时间戳）
    pub exp: u64,
    /// 签发时间（Unix 时间戳）
    pub iat: u64,
}

/// JWT 声明结构（refresh token）
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RefreshClaims {
    /// 用户 ID
    pub sub: String,
    /// 用户名
    pub username: String,
    /// 用户角色
    pub role: String,
    /// 过期时间
    pub exp: u64,
    /// 签发时间
    pub iat: u64,
}

// ========== Identity 系统 ==========

/// 统一身份枚举
///
/// 中间件将请求者的身份注入到 request extensions 中，
/// 各 handler 根据 Identity 变体决定授权。
#[derive(Clone, Debug)]
pub enum Identity {
    /// 管理员（已认证 + role == "admin"）
    Admin {
        user: user::Model,
        identity: Option<identity::Model>,
    },
    /// 已认证用户
    Authenticated {
        user: user::Model,
        identity: Option<identity::Model>,
    },
    /// 匿名用户（通过 Cookie 中的 UUID 追踪）
    Anonymous {
        uuid: Uuid,
        identity: Option<identity::Model>,
    },
    /// 无身份
    None,
}

impl Identity {
    /// 确保 identity 记录存在，不存在则懒创建。
    /// 用于点赞、评论等需要追踪身份的操作。
    /// 返回 identity 的 UUID（id 字段）。
    pub async fn ensure_identity(&mut self, db: &DatabaseConnection) -> Result<Uuid, ApiError> {
        match self {
            Identity::Anonymous { uuid, identity } => match identity {
                Some(id) => Ok(id.id),
                None => {
                    let now = Utc::now().fixed_offset();
                    let new_identity = identity::ActiveModel {
                        id: Set(Uuid::new_v4()),
                        uuid: Set(Some(*uuid)),
                        user_id: Set(None),
                        created_at: Set(now),
                        updated_at: Set(now),
                    };
                    let model = new_identity.insert(db).await.map_err(|e| {
                        ApiError::internal_server_error(format!("创建身份失败: {e}"))
                    })?;
                    let id = model.id;
                    *identity = Some(model);
                    Ok(id)
                }
            },
            Identity::Authenticated { identity, user } | Identity::Admin { identity, user } => {
                match identity {
                    Some(id) => Ok(id.id),
                    None => {
                        let user_id = user.id;
                        let now = Utc::now().fixed_offset();
                        let new_identity = identity::ActiveModel {
                            id: Set(Uuid::new_v4()),
                            uuid: Set(None),
                            user_id: Set(Some(user_id)),
                            created_at: Set(now),
                            updated_at: Set(now),
                        };
                        let model = new_identity.insert(db).await.map_err(|e| {
                            ApiError::internal_server_error(format!("创建身份失败: {e}"))
                        })?;
                        let id = model.id;
                        *identity = Some(model);
                        Ok(id)
                    }
                }
            }
            Identity::None => Err(ApiError::unauthorized("需要身份信息才能执行此操作")),
        }
    }

    /// 获取 identity_id（如果存在）
    pub fn identity_id(&self) -> Option<Uuid> {
        match self {
            Identity::Admin { identity, .. }
            | Identity::Authenticated { identity, .. }
            | Identity::Anonymous { identity, .. } => identity.as_ref().map(|i| i.id),
            Identity::None => None,
        }
    }

    /// 是否为管理员
    pub fn is_admin(&self) -> bool {
        matches!(self, Identity::Admin { .. })
    }

    /// 要求管理员权限，否则返回错误
    pub fn require_admin(&self) -> Result<&user::Model, ApiError> {
        match self {
            Identity::Admin { user, .. } => Ok(user),
            _ => Err(ApiError::forbidden("需要管理员权限")),
        }
    }

    /// 要求已认证，否则返回错误
    pub fn require_authenticated(&self) -> Result<&user::Model, ApiError> {
        match self {
            Identity::Admin { user, .. } | Identity::Authenticated { user, .. } => Ok(user),
            _ => Err(ApiError::unauthorized("需要登录")),
        }
    }
}

// ========== Access Token ==========

/// 生成 access token
pub fn generate_token(user: &user::Model) -> Result<String, ApiError> {
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

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(config.jwt.secret.as_bytes()),
    )
    .map_err(|e| ApiError::internal_server_error(format!("生成令牌失败: {e}")))
}

/// 验证 access token
pub fn verify_token(token: &str) -> Result<Claims, ApiError> {
    let config = config::get_config();

    let token_data = decode::<Claims>(
        token,
        &DecodingKey::from_secret(config.jwt.secret.as_bytes()),
        &Validation::default(),
    )
    .map_err(|e| match e.kind() {
        jsonwebtoken::errors::ErrorKind::ExpiredSignature => ApiError::unauthorized("令牌已过期"),
        jsonwebtoken::errors::ErrorKind::InvalidSignature => {
            ApiError::unauthorized("无效的令牌签名")
        }
        _ => ApiError::internal_server_error(format!("令牌验证失败: {e}")),
    })?;

    Ok(token_data.claims)
}

// ========== Refresh Token ==========

/// 生成 refresh token
pub fn generate_refresh_token(user: &user::Model) -> Result<String, ApiError> {
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

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(config.jwt.refresh_secret.as_bytes()),
    )
    .map_err(|e| ApiError::internal_server_error(format!("生成刷新令牌失败: {e}")))
}

/// 验证 refresh token
pub fn verify_refresh_token(token: &str) -> Result<RefreshClaims, ApiError> {
    let config = config::get_config();

    let token_data = decode::<RefreshClaims>(
        token,
        &DecodingKey::from_secret(config.jwt.refresh_secret.as_bytes()),
        &Validation::default(),
    )
    .map_err(|e| match e.kind() {
        jsonwebtoken::errors::ErrorKind::ExpiredSignature => {
            ApiError::unauthorized("刷新令牌已过期，请重新登录")
        }
        jsonwebtoken::errors::ErrorKind::InvalidSignature => {
            ApiError::unauthorized("无效的刷新令牌")
        }
        _ => ApiError::internal_server_error(format!("刷新令牌验证失败: {e}")),
    })?;

    Ok(token_data.claims)
}

// ========== Cookie 工具 ==========

/// 构建 refresh token 的 Set-Cookie header 值
pub fn build_refresh_cookie(token: &str) -> String {
    let config = config::get_config();
    let max_age = config.jwt.refresh_expiration * 60;

    let is_dev = config
        .cors
        .allowed_origins
        .iter()
        .all(|o| o.contains("localhost"));

    if is_dev {
        format!("refresh_token={token}; HttpOnly; SameSite=Lax; Path=/; Max-Age={max_age}")
    } else {
        format!(
            "refresh_token={token}; HttpOnly; Secure; SameSite=None; Domain=.exquisitecore.xyz; Path=/; Max-Age={max_age}"
        )
    }
}

/// 构建清除 refresh token 的 Set-Cookie header 值
pub fn build_clear_refresh_cookie() -> String {
    let config = config::get_config();
    let is_dev = config
        .cors
        .allowed_origins
        .iter()
        .all(|o| o.contains("localhost"));

    if is_dev {
        "refresh_token=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0".to_string()
    } else {
        "refresh_token=; HttpOnly; Secure; SameSite=None; Domain=.exquisitecore.xyz; Path=/; Max-Age=0".to_string()
    }
}

/// 构建匿名 UUID 的 Set-Cookie header 值
pub fn build_anonymous_cookie(uuid: &Uuid) -> String {
    let config = config::get_config();
    let is_dev = config
        .cors
        .allowed_origins
        .iter()
        .all(|o| o.contains("localhost"));

    let max_age = 365 * 24 * 60 * 60; // 1 年
    if is_dev {
        format!("anonymous={uuid}; HttpOnly; SameSite=Lax; Path=/; Max-Age={max_age}")
    } else {
        format!(
            "anonymous={uuid}; HttpOnly; Secure; SameSite=None; Domain=.exquisitecore.xyz; Path=/; Max-Age={max_age}"
        )
    }
}

/// 从 Cookie header 中提取指定 cookie 值
fn extract_cookie(cookie_header: &str, name: &str) -> Option<String> {
    let prefix = format!("{name}=");
    for cookie in cookie_header.split(';') {
        let cookie = cookie.trim();
        if let Some(value) = cookie.strip_prefix(&prefix) {
            let value = value.trim();
            if !value.is_empty() {
                return Some(value.to_string());
            }
        }
    }
    None
}

// ========== 身份认证中间件 ==========

/// 统一认证中间件 — 永远成功
///
/// 从请求中识别身份（JWT / anonymous UUID / None），
/// 注入 Identity 到 request extensions。各 handler 根据需要检查。
pub async fn identity_middleware(mut req: Request, next: Next) -> Response {
    let cookie_header = req
        .headers()
        .get("Cookie")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("");

    let auth_header = req
        .headers()
        .get("Authorization")
        .and_then(|v| v.to_str().ok());

    let db = req.extensions().get::<DatabaseConnection>().cloned();

    let identity = if let Some(auth) = auth_header {
        // 尝试从 Authorization header 验证 JWT
        if let Some(token) = auth.strip_prefix("Bearer ").map(str::trim) {
            match verify_token(token) {
                Ok(claims) => resolve_authenticated_identity(&db, &claims).await,
                Err(_) => Identity::None,
            }
        } else {
            Identity::None
        }
    } else if let Some(refresh) = extract_cookie(cookie_header, "refresh_token") {
        // 尝试从 refresh token Cookie 解析身份（备用）
        match verify_refresh_token(&refresh) {
            Ok(claims) => {
                let fake_claims = Claims {
                    sub: claims.sub,
                    username: claims.username,
                    role: claims.role,
                    exp: claims.exp,
                    iat: claims.iat,
                };
                resolve_authenticated_identity(&db, &fake_claims).await
            }
            Err(_) => resolve_anonymous_identity(cookie_header, &db).await,
        }
    } else {
        resolve_anonymous_identity(cookie_header, &db).await
    };

    req.extensions_mut().insert(identity);
    next.run(req).await
}

/// 从 JWT Claims 解析已认证的 Identity
async fn resolve_authenticated_identity(
    db: &Option<DatabaseConnection>,
    claims: &Claims,
) -> Identity {
    let user_id = match Uuid::parse_str(&claims.sub) {
        Ok(id) => id,
        Err(_) => return Identity::None,
    };

    if let Some(db) = db {
        match user::Entity::find_by_id(user_id).one(db).await {
            Ok(Some(user)) => {
                // 查找关联的 identity 记录
                let identity_model = identity::Entity::find()
                    .filter(identity::Column::UserId.eq(user_id))
                    .one(db)
                    .await
                    .ok()
                    .flatten();

                if user.role == "admin" {
                    Identity::Admin {
                        user,
                        identity: identity_model,
                    }
                } else {
                    Identity::Authenticated {
                        user,
                        identity: identity_model,
                    }
                }
            }
            _ => Identity::None,
        }
    } else {
        Identity::None
    }
}

/// 解析匿名 Identity
async fn resolve_anonymous_identity(
    cookie_header: &str,
    db: &Option<DatabaseConnection>,
) -> Identity {
    if let Some(anonymous_str) = extract_cookie(cookie_header, "anonymous") {
        if let Ok(uuid) = Uuid::parse_str(&anonymous_str) {
            let identity_model = if let Some(db) = db {
                identity::Entity::find()
                    .filter(identity::Column::Uuid.eq(uuid))
                    .one(db)
                    .await
                    .ok()
                    .flatten()
            } else {
                None
            };

            return Identity::Anonymous {
                uuid,
                identity: identity_model,
            };
        }
    }
    Identity::None
}

// ========== 处理函数 ==========

/// 刷新令牌处理函数
pub async fn refresh_token_handler(req: Request) -> Result<Response, ApiError> {
    let cookie_header = req
        .headers()
        .get("Cookie")
        .and_then(|v| v.to_str().ok())
        .ok_or_else(|| ApiError::unauthorized("缺少 Cookie"))?;

    let refresh_token = extract_cookie(cookie_header, "refresh_token")
        .ok_or_else(|| ApiError::unauthorized("缺少 refresh_token"))?;

    let claims = verify_refresh_token(&refresh_token)?;

    // 构造临时 user Model 用于生成 access token
    let now = Utc::now().fixed_offset();
    let temp_user = user::Model {
        id: Uuid::parse_str(&claims.sub).map_err(|_| ApiError::unauthorized("无效的用户 ID"))?,
        username: claims.username,
        email: String::new(),
        password_hash: String::new(),
        display_name: None,
        avatar_url: None,
        bio: None,
        role: claims.role,
        created_at: now,
        updated_at: now,
    };

    let access_token = generate_token(&temp_user)?;

    Ok(ApiResponse::ok(serde_json::json!({ "token": access_token })).into_response())
}

/// 退出登录处理函数
pub async fn logout_handler() -> Response {
    let mut response = ApiResponse::ok(serde_json::json!({ "success": true })).into_response();
    response
        .headers_mut()
        .insert(SET_COOKIE, build_clear_refresh_cookie().parse().unwrap());
    response
}

/// 获取当前身份信息
pub async fn me_handler(identity: axum::Extension<Identity>) -> Result<Response, ApiError> {
    match &*identity {
        Identity::Admin { user, .. } | Identity::Authenticated { user, .. } => {
            Ok(ApiResponse::ok(serde_json::json!({
                "authenticated": true,
                "id": user.id,
                "username": user.username,
                "role": user.role,
                "display_name": user.display_name,
                "avatar_url": user.avatar_url,
            }))
            .into_response())
        }
        Identity::Anonymous { uuid, .. } => Ok(ApiResponse::ok(serde_json::json!({
            "authenticated": false,
            "anonymous_id": uuid,
        }))
        .into_response()),
        Identity::None => Ok(ApiResponse::ok(serde_json::json!({
            "authenticated": false,
        }))
        .into_response()),
    }
}
