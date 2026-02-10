//! API 响应包装器
//!
//!

use axum::Json;
use axum::http::StatusCode;
use axum::response::IntoResponse;
use serde::Serialize;
use std::borrow::Cow;

/// 统一 API 响应结构
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ApiResponse<T: Serialize> {
    pub status_code: u16,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<T>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub message: Option<Cow<'static, str>>,
}

impl<T: Serialize> ApiResponse<T> {
    pub fn ok(data: T) -> Self {
        Self {
            status_code: 200,
            data: Some(data),
            message: None,
        }
    }

    pub fn created(data: T) -> Self {
        Self {
            status_code: 201,
            data: Some(data),
            message: None,
        }
    }
}

impl<T: Serialize> IntoResponse for ApiResponse<T> {
    fn into_response(self) -> axum::response::Response {
        let status =
            StatusCode::from_u16(self.status_code).unwrap_or(StatusCode::INTERNAL_SERVER_ERROR);
        (status, Json(self)).into_response()
    }
}

/// API 错误类型（无 data 的 ApiResponse）
pub type ApiError = ApiResponse<()>;

impl ApiError {
    pub fn bad_request(message: impl Into<Cow<'static, str>>) -> Self {
        Self {
            status_code: 400,
            data: None,
            message: Some(message.into()),
        }
    }

    pub fn unauthorized(message: impl Into<Cow<'static, str>>) -> Self {
        Self {
            status_code: 401,
            data: None,
            message: Some(message.into()),
        }
    }

    pub fn forbidden(message: impl Into<Cow<'static, str>>) -> Self {
        Self {
            status_code: 403,
            data: None,
            message: Some(message.into()),
        }
    }

    pub fn not_found(message: impl Into<Cow<'static, str>>) -> Self {
        Self {
            status_code: 404,
            data: None,
            message: Some(message.into()),
        }
    }

    pub fn conflict(message: impl Into<Cow<'static, str>>) -> Self {
        Self {
            status_code: 409,
            data: None,
            message: Some(message.into()),
        }
    }

    pub fn internal_server_error(message: impl Into<Cow<'static, str>>) -> Self {
        Self {
            status_code: 500,
            data: None,
            message: Some(message.into()),
        }
    }
}

/// 从 sea_orm::DbErr 自动转换
impl From<sea_orm::DbErr> for ApiError {
    fn from(err: sea_orm::DbErr) -> Self {
        tracing::error!("数据库错误: {err}");
        Self::internal_server_error(format!("数据库错误: {err}"))
    }
}

/// 从 anyhow::Error 自动转换
impl From<anyhow::Error> for ApiError {
    fn from(err: anyhow::Error) -> Self {
        tracing::error!("内部错误: {err}");
        Self::internal_server_error(format!("内部错误: {err}"))
    }
}
