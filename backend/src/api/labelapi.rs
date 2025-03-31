use axum::{
    Json,
    extract::{Path, State},
};
use sqlx::{Pool, Postgres};
use std::sync::Arc;
use uuid::Uuid;

use crate::{
    error::{AppError, AppErrorType},
    model::models::{
        label,
        post::{self, PostSummary},
    },
};

/// 创建标签
///
/// 接收标签信息并创建新标签
pub async fn create_label(
    State(pool): State<Arc<Pool<Postgres>>>,
    Json(req): Json<label::CreateLabelRequest>,
) -> Result<Json<label::Label>, AppError> {
    // 创建新标签
    let label = label::Label::create(pool.as_ref(), req)
        .await
        .map_err(|e| {
            AppError::new_message(&format!("创建标签失败: {}", e), AppErrorType::Internal)
        })?;

    // 返回创建的标签
    Ok(Json(label))
}

/// 获取所有标签
///
/// 返回所有标签列表
pub async fn get_labels(
    State(pool): State<Arc<Pool<Postgres>>>,
) -> Result<Json<Vec<label::Label>>, AppError> {
    // 获取所有标签
    let labels = label::Label::find_all(pool.as_ref()).await.map_err(|e| {
        AppError::new_message(&format!("获取标签列表失败: {}", e), AppErrorType::Internal)
    })?;

    // 返回标签列表
    Ok(Json(labels))
}

/// 获取标签下的文章
///
/// 根据标签ID返回该标签下的所有文章
pub async fn get_posts_by_label(
    State(pool): State<Arc<Pool<Postgres>>>,
    Path(label_id): Path<Uuid>,
) -> Result<Json<Vec<PostSummary>>, AppError> {
    // 检查标签是否存在
    let label = label::Label::find_by_id(pool.as_ref(), label_id)
        .await
        .map_err(|e| {
            AppError::new_message(&format!("查询标签失败: {}", e), AppErrorType::Internal)
        })?;

    if label.is_none() {
        return Err(AppError::new_message(
            &format!("未找到ID为{}的标签", label_id),
            AppErrorType::Notfound,
        ));
    }

    // 获取标签下的文章
    let posts = post::Post::find_by_label_id(pool.as_ref(), label_id, true)
        .await
        .map_err(|e| {
            AppError::new_message(
                &format!("获取标签下文章失败: {}", e),
                AppErrorType::Internal,
            )
        })?;

    // 返回文章列表
    Ok(Json(posts))
}
