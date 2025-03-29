//! 用户API模块
//!
//! 提供用户相关的API端点

use axum::{Json, extract::State};
use bcrypt::{DEFAULT_COST, hash};
use sqlx::{Pool, Postgres};
use std::sync::Arc;

use crate::error::{AppError, AppErrorType};
use crate::middleware::auth;
use crate::model::models::user::{CreateUserRequest, LoginRequest, User};

/// 用户注册API
///
/// 接收用户注册信息，验证数据有效性，然后创建新用户
pub async fn register_user(
    State(pool): State<Arc<Pool<Postgres>>>,
    Json(req): Json<CreateUserRequest>,
) -> Result<Json<User>, AppError> {
    // 验证用户名是否已存在
    if let Ok(Some(_)) = User::find_by_username(&pool, &req.username).await {
        return Err(AppError::new_message(
            "用户名已被使用",
            AppErrorType::Duplicate,
        ));
    }

    // 验证邮箱是否已存在
    if let Ok(Some(_)) = User::find_by_email(&pool, &req.email).await {
        return Err(AppError::new_message(
            "邮箱已被注册",
            AppErrorType::Duplicate,
        ));
    }

    // 对密码进行哈希处理
    let hashed_password = match hash(&req.password, DEFAULT_COST) {
        Ok(hashed) => hashed,
        Err(_) => {
            return Err(AppError::new_message(
                "密码加密失败",
                AppErrorType::Internal,
            ));
        }
    };

    // 创建包含哈希密码的请求
    let req_with_hashed_password = CreateUserRequest {
        password: hashed_password,
        ..req
    };

    // 创建新用户
    match User::create(&pool, req_with_hashed_password).await {
        Ok(user) => Ok(Json(user)),
        Err(e) => Err(AppError::new(e, AppErrorType::Db)),
    }
}

/// 用户登录API
///
/// 验证用户凭据并生成JWT令牌
pub async fn login_user(
    State(pool): State<Arc<Pool<Postgres>>>,
    Json(req): Json<LoginRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    // 尝试登录用户
    match User::login(&pool, req).await {
        Ok(Some(user)) => {
            // 生成JWT令牌
            let token = auth::generate_token(&user)?;

            // 返回用户信息和令牌
            Ok(Json(serde_json::json!({
                "user": user,
                "token": token
            })))
        }
        Ok(None) => Err(AppError::new_message(
            "用户名/邮箱或密码错误",
            AppErrorType::IncorrectLogin,
        )),
        Err(e) => Err(AppError::new(e, AppErrorType::Db)),
    }
}
