//! 用户 API 模块
//!
//! 提供用户注册、登录、管理等接口。

use axum::http::header::SET_COOKIE;
use axum::response::{IntoResponse, Response};
use axum::{Extension, Json, extract::{Path, State}};
use bcrypt::{DEFAULT_COST, hash, verify};
use chrono::Utc;
use sea_orm::*;
use serde::Deserialize;
use uuid::Uuid;

use crate::entity::user;
use crate::middleware::auth::{self, Identity};
use crate::wrapper::{ApiError, ApiResponse};

// ========== 请求结构 ==========

#[derive(Debug, Deserialize)]
pub struct RegisterRequest {
    pub username: String,
    pub email: String,
    pub password: String,
    pub display_name: Option<String>,
    pub avatar_url: Option<String>,
    pub bio: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub username_or_email: String,
    pub password: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateUserRequest {
    pub username: Option<String>,
    pub email: Option<String>,
    pub password: Option<String>,
    pub display_name: Option<String>,
    pub avatar_url: Option<String>,
    pub bio: Option<String>,
    pub role: Option<String>,
}

// ========== 验证函数 ==========

fn validate_username(username: &str) -> Result<(), ApiError> {
    if username.len() < 3 {
        return Err(ApiError::bad_request("用户名至少需要3个字符"));
    }
    if username.len() > 50 {
        return Err(ApiError::bad_request("用户名不能超过50个字符"));
    }
    if !username
        .chars()
        .all(|c| c.is_alphanumeric() || c == '_' || c == '-')
    {
        return Err(ApiError::bad_request(
            "用户名只能包含字母、数字、下划线和连字符",
        ));
    }
    Ok(())
}

fn validate_email(email: &str) -> Result<(), ApiError> {
    if email.len() > 100 {
        return Err(ApiError::bad_request("邮箱不能超过100个字符"));
    }
    if !email.contains('@') || !email.contains('.') {
        return Err(ApiError::bad_request("邮箱格式不正确"));
    }
    Ok(())
}

fn validate_password(password: &str) -> Result<(), ApiError> {
    if password.len() < 6 {
        return Err(ApiError::bad_request("密码至少需要6个字符"));
    }
    if password.len() > 100 {
        return Err(ApiError::bad_request("密码不能超过100个字符"));
    }
    Ok(())
}

// ========== API 处理函数 ==========

/// 用户注册
pub async fn register_user(
    State(state): State<crate::state::AppState>,
    Json(req): Json<RegisterRequest>,
) -> Result<impl IntoResponse, ApiError> {
    validate_username(&req.username)?;
    validate_email(&req.email)?;
    validate_password(&req.password)?;

    // 检查用户名是否已存在
    let existing = user::Entity::find()
        .filter(user::Column::Username.eq(&req.username))
        .one(&state.conn)
        .await?;
    if existing.is_some() {
        return Err(ApiError::conflict("用户名已被使用"));
    }

    // 检查邮箱是否已存在
    let existing = user::Entity::find()
        .filter(user::Column::Email.eq(&req.email))
        .one(&state.conn)
        .await?;
    if existing.is_some() {
        return Err(ApiError::conflict("邮箱已被注册"));
    }

    let password_hash =
        hash(&req.password, DEFAULT_COST).map_err(|_| ApiError::internal_server_error("密码加密失败"))?;

    let now = Utc::now().fixed_offset();
    let new_user = user::ActiveModel {
        id: Set(Uuid::new_v4()),
        username: Set(req.username),
        email: Set(req.email),
        password_hash: Set(password_hash),
        display_name: Set(req.display_name),
        avatar_url: Set(req.avatar_url),
        bio: Set(req.bio),
        role: Set("user".to_string()),
        created_at: Set(now),
        updated_at: Set(now),
    };

    let user = new_user.insert(&state.conn).await?;

    Ok(ApiResponse::created(user))
}

/// 用户登录
pub async fn login_user(
    State(state): State<crate::state::AppState>,
    Json(req): Json<LoginRequest>,
) -> Result<Response, ApiError> {
    // 按用户名或邮箱查找
    let user = user::Entity::find()
        .filter(
            Condition::any()
                .add(user::Column::Username.eq(&req.username_or_email))
                .add(user::Column::Email.eq(&req.username_or_email)),
        )
        .one(&state.conn)
        .await?
        .ok_or_else(|| ApiError::unauthorized("用户名/邮箱或密码错误"))?;

    // 验证密码
    let valid = verify(&req.password, &user.password_hash)
        .map_err(|_| ApiError::internal_server_error("密码验证失败"))?;

    if !valid {
        return Err(ApiError::unauthorized("用户名/邮箱或密码错误"));
    }

    // 生成 token
    let access_token = auth::generate_token(&user)?;
    let refresh_token = auth::generate_refresh_token(&user)?;

    let body = ApiResponse::ok(serde_json::json!({
        "user": user,
        "token": access_token,
    }));

    let mut response = body.into_response();
    response.headers_mut().insert(
        SET_COOKIE,
        auth::build_refresh_cookie(&refresh_token).parse().unwrap(),
    );

    Ok(response)
}

/// 获取所有用户（管理员）
pub async fn get_users(
    State(state): State<crate::state::AppState>,
    Extension(identity): Extension<Identity>,
) -> Result<impl IntoResponse, ApiError> {
    identity.require_admin()?;

    let users = user::Entity::find()
        .order_by_asc(user::Column::Username)
        .all(&state.conn)
        .await?;

    Ok(ApiResponse::ok(users))
}

/// 更新用户（管理员）
pub async fn update_user(
    State(state): State<crate::state::AppState>,
    Extension(identity): Extension<Identity>,
    Path(id): Path<Uuid>,
    Json(req): Json<UpdateUserRequest>,
) -> Result<impl IntoResponse, ApiError> {
    identity.require_admin()?;

    let existing = user::Entity::find_by_id(id)
        .one(&state.conn)
        .await?
        .ok_or_else(|| ApiError::not_found(format!("未找到 ID 为 {id} 的用户")))?;

    let mut update: user::ActiveModel = existing.into();
    if let Some(username) = req.username {
        update.username = Set(username);
    }
    if let Some(email) = req.email {
        update.email = Set(email);
    }
    if let Some(password) = req.password {
        let hashed = hash(&password, DEFAULT_COST)
            .map_err(|_| ApiError::internal_server_error("密码加密失败"))?;
        update.password_hash = Set(hashed);
    }
    if let Some(display_name) = req.display_name {
        update.display_name = Set(Some(display_name));
    }
    if let Some(avatar_url) = req.avatar_url {
        update.avatar_url = Set(Some(avatar_url));
    }
    if let Some(bio) = req.bio {
        update.bio = Set(Some(bio));
    }
    if let Some(role) = req.role {
        update.role = Set(role);
    }
    update.updated_at = Set(Utc::now().fixed_offset());

    let updated = update.update(&state.conn).await?;
    Ok(ApiResponse::ok(updated))
}

/// 删除用户（管理员）
pub async fn delete_user(
    State(state): State<crate::state::AppState>,
    Extension(identity): Extension<Identity>,
    Path(id): Path<Uuid>,
) -> Result<impl IntoResponse, ApiError> {
    identity.require_admin()?;

    let result = user::Entity::delete_by_id(id)
        .exec(&state.conn)
        .await?;

    if result.rows_affected == 0 {
        return Err(ApiError::not_found(format!("未找到 ID 为 {id} 的用户")));
    }

    Ok(ApiResponse::ok(serde_json::json!({ "success": true })))
}
