use axum::{
    Json,
    extract::{Path, State},
};
use sqlx::{Pool, Postgres};
use std::sync::Arc;
use uuid::Uuid;

use crate::{
    error::{AppError, AppErrorType},
    model::models::{label, post},
};

/// 获取所有文章
///
/// 返回所有已发布的文章列表，包含标签信息
pub async fn get_posts(
    State(pool): State<Arc<Pool<Postgres>>>,
) -> Result<Json<Vec<post::PostSummaryWithLabels>>, AppError> {
    // 获取所有已发布的文章（包含标签）
    let posts = post::Post::find_all_with_labels(pool.as_ref(), true).await?;

    // 返回文章列表
    Ok(Json(posts))
}

/// 创建文章
///
/// 接收文章信息并创建新文章
pub async fn create_post(
    State(pool): State<Arc<Pool<Postgres>>>,
    Json(req): Json<post::CreatePostRequest>,
) -> Result<Json<post::Post>, AppError> {
    // 创建新文章
    let post = post::Post::create(pool.as_ref(), req).await?;

    // 返回创建的文章
    Ok(Json(post))
}

/// 根据ID获取文章
///
/// 返回指定ID的文章详情，包含完整内容
pub async fn get_post_by_id(
    State(pool): State<Arc<Pool<Postgres>>>,
    Path(id): Path<Uuid>,
) -> Result<Json<post::Post>, AppError> {
    // 根据ID查找文章
    match post::Post::find_by_id(pool.as_ref(), id).await? {
        Some(post) => Ok(Json(post)),
        None => Err(AppError::new_message(
            &format!("未找到ID为{}的文章", id),
            AppErrorType::Notfound,
        )),
    }
}

/// 获取文章的标签
///
/// 返回指定文章ID的所有标签
pub async fn get_post_labels(
    State(pool): State<Arc<Pool<Postgres>>>,
    Path(post_id): Path<Uuid>,
) -> Result<Json<Vec<label::Label>>, AppError> {
    // 首先检查文章是否存在
    let post = post::Post::find_by_id(pool.as_ref(), post_id).await?;
    if post.is_none() {
        return Err(AppError::new_message(
            &format!("未找到ID为{}的文章", post_id),
            AppErrorType::Notfound,
        ));
    }

    // 获取文章的所有标签
    let labels = label::Label::find_by_post_id(pool.as_ref(), post_id)
        .await
        .map_err(|e| {
            AppError::new_message(&format!("获取文章标签失败: {}", e), AppErrorType::Internal)
        })?;

    // 返回标签列表
    Ok(Json(labels))
}
