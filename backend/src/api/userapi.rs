//! 用户API模块
//!
//! 提供用户相关的API端点

use axum::http::header::SET_COOKIE;
use axum::response::{IntoResponse, Response};
use axum::{Json, extract::{Path, State}};
use bcrypt::{DEFAULT_COST, hash};
use uuid::Uuid;

use crate::error::{AppError, AppErrorType};
use crate::middleware::auth;
use crate::model::models::user::{CreateUserRequest, LoginRequest, UpdateUserRequest, User};

/// 验证用户名格式
fn validate_username(username: &str) -> Result<(), AppError> {
    if username.len() < 3 {
        return Err(AppError::new_message("用户名至少需要3个字符", AppErrorType::Internal));
    }
    if username.len() > 50 {
        return Err(AppError::new_message("用户名不能超过50个字符", AppErrorType::Internal));
    }
    if !username.chars().all(|c| c.is_alphanumeric() || c == '_' || c == '-') {
        return Err(AppError::new_message(
            "用户名只能包含字母、数字、下划线和连字符",
            AppErrorType::Internal,
        ));
    }
    Ok(())
}

/// 验证邮箱格式
fn validate_email(email: &str) -> Result<(), AppError> {
    if email.len() > 100 {
        return Err(AppError::new_message("邮箱不能超过100个字符", AppErrorType::Internal));
    }
    // 简单的邮箱格式验证
    if !email.contains('@') || !email.contains('.') {
        return Err(AppError::new_message("邮箱格式不正确", AppErrorType::Internal));
    }
    Ok(())
}

/// 验证密码强度
fn validate_password(password: &str) -> Result<(), AppError> {
    if password.len() < 6 {
        return Err(AppError::new_message("密码至少需要6个字符", AppErrorType::Internal));
    }
    if password.len() > 100 {
        return Err(AppError::new_message("密码不能超过100个字符", AppErrorType::Internal));
    }
    Ok(())
}

/// 用户注册API
///
/// 接收用户注册信息，验证数据有效性，然后创建新用户
pub async fn register_user(
    State(state): State<crate::state::AppState>,
    Json(req): Json<CreateUserRequest>,
) -> Result<Json<User>, AppError> {
    // 验证输入
    validate_username(&req.username)?;
    validate_email(&req.email)?;
    validate_password(&req.password)?;

    // 验证用户名是否已存在
    if let Ok(Some(_)) = User::find_by_username(&state.pool, &req.username).await {
        return Err(AppError::new_message(
            "用户名已被使用",
            AppErrorType::Duplicate,
        ));
    }

    // 验证邮箱是否已存在
    if let Ok(Some(_)) = User::find_by_email(&state.pool, &req.email).await {
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
    match User::create(&state.pool, req_with_hashed_password).await {
        Ok(user) => Ok(Json(user)),
        Err(e) => Err(AppError::new(e, AppErrorType::Db)),
    }
}

/// 用户登录API
///
/// 验证用户凭据并生成JWT令牌
/// 返回 access token 在 JSON body，refresh token 在 Set-Cookie
pub async fn login_user(
    State(state): State<crate::state::AppState>,
    Json(req): Json<LoginRequest>,
) -> Result<Response, AppError> {
    // 尝试登录用户
    match User::login(&state.pool, req).await {
        Ok(Some(user)) => {
            // 生成 access token（短期）
            let access_token = auth::generate_token(&user)?;
            // 生成 refresh token（长期）
            let refresh_token = auth::generate_refresh_token(&user)?;

            // 构建响应 body
            let body = serde_json::json!({
                "user": user,
                "token": access_token
            });

            // 构建响应，设置 refresh token 到 cookie
            let mut response = Json(body).into_response();
            response.headers_mut().insert(
                SET_COOKIE,
                auth::build_refresh_cookie(&refresh_token).parse().unwrap(),
            );

            Ok(response)
        }
        Ok(None) => Err(AppError::new_message(
            "用户名/邮箱或密码错误",
            AppErrorType::IncorrectLogin,
        )),
        Err(e) => Err(AppError::new(e, AppErrorType::Db)),
    }
}

/// 获取所有用户（管理员）
///
/// 返回系统中的所有用户列表
pub async fn get_users(
    State(state): State<crate::state::AppState>,
) -> Result<Json<Vec<User>>, AppError> {
    let users = User::find_all(&state.pool)
        .await
        .map_err(|e| AppError::new(e, AppErrorType::Db))?;

    Ok(Json(users))
}

/// 更新用户（管理员）
///
/// 根据ID更新用户信息
pub async fn update_user(
    State(state): State<crate::state::AppState>,
    Path(id): Path<Uuid>,
    Json(req): Json<UpdateUserRequest>,
) -> Result<Json<User>, AppError> {
    let updated = User::update(&state.pool, id, req)
        .await
        .map_err(|e| AppError::new(e, AppErrorType::Db))?;

    Ok(Json(updated))
}

/// 删除用户（管理员）
///
/// 根据ID删除用户
pub async fn delete_user(
    State(state): State<crate::state::AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    let deleted = User::delete(&state.pool, id)
        .await
        .map_err(|e| AppError::new(e, AppErrorType::Db))?;

    if deleted {
        Ok(Json(serde_json::json!({ "success": true })))
    } else {
        Err(AppError::new_message(
            &format!("未找到ID为{}的用户", id),
            AppErrorType::Notfound,
        ))
    }
}
