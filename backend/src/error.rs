use anyhow;
use axum::{
    Json,
    http::StatusCode,
    response::{IntoResponse, Response},
};
use serde::{Deserialize, Serialize};
use serde_json::json;

#[derive(Debug, Serialize, Deserialize)]
pub enum AppErrorType {
    Db,
    Notfound,
    Duplicate,
    Crypt,
    IncorrectLogin,
    Forbidden,
    Time,
    Internal,
}

#[derive(Debug)]
pub struct AppError {
    pub cause: Option<Box<dyn std::error::Error + Send + Sync>>,
    pub types: AppErrorType,
}

impl AppError {
    pub fn new<E: std::error::Error + Send + Sync + 'static>(
        cause: E,
        types: AppErrorType,
    ) -> Self {
        Self {
            cause: Some(Box::new(cause)),
            types,
        }
    }

    pub fn new_message(msg: &str, types: AppErrorType) -> Self {
        Self {
            cause: Some(Box::new(std::io::Error::new(
                std::io::ErrorKind::Other,
                msg.to_string(),
            ))),
            types,
        }
    }

    pub fn notfound() -> Self {
        Self::new_message("没有找到符合条件的数据", AppErrorType::Notfound)
    }
}

impl std::fmt::Display for AppError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{:?}", self)
    }
}

impl std::error::Error for AppError {}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let status = match self.types {
            AppErrorType::Notfound => StatusCode::NOT_FOUND,
            AppErrorType::Duplicate => StatusCode::CONFLICT,
            AppErrorType::IncorrectLogin => StatusCode::UNAUTHORIZED,
            AppErrorType::Forbidden => StatusCode::FORBIDDEN,
            _ => StatusCode::INTERNAL_SERVER_ERROR,
        };

        let msg = self
            .cause
            .as_ref()
            .map_or("有错误发生".to_string(), |e| e.to_string());

        let body = json!({
            "code": format!("{:?}", self.types), // 例如 "Notfound"
            "error": self.types.to_string(),    // 例如 "资源未找到"
            "message": msg
        });

        (status, Json(body)).into_response()
    }
}

impl std::fmt::Display for AppErrorType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let msg = match self {
            AppErrorType::Db => "数据库错误",
            AppErrorType::Notfound => "资源未找到",
            AppErrorType::Duplicate => "数据重复",
            AppErrorType::Crypt => "加密/解密错误",
            AppErrorType::IncorrectLogin => "登录信息错误",
            AppErrorType::Forbidden => "权限不足",
            AppErrorType::Time => "时间解析错误",
            AppErrorType::Internal => "内部错误",
        };
        write!(f, "{}", msg)
    }
}

impl From<sqlx::Error> for AppError {
    fn from(err: sqlx::Error) -> Self {
        match err {
            sqlx::Error::RowNotFound => {
                AppError::new_message("查询的数据不存在", AppErrorType::Notfound)
            }
            sqlx::Error::Database(db_err) if db_err.is_unique_violation() => {
                AppError::new_message("数据已存在", AppErrorType::Duplicate)
            }
            _ => AppError::new(err, AppErrorType::Db),
        }
    }
}

impl From<anyhow::Error> for AppError {
    fn from(err: anyhow::Error) -> Self {
        AppError::new_message(&err.to_string(), AppErrorType::Db)
    }
}
