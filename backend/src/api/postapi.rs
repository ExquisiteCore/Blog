use axum::{Json, extract::State};
use sqlx::{Pool, Postgres};
use std::sync::Arc;

use crate::{error::AppError, model::models::post};

/// 获取所有文章
///
/// 返回所有已发布的文章列表
pub async fn get_posts(
    State(pool): State<Arc<Pool<Postgres>>>,
) -> Result<Json<Vec<post::Post>>, AppError> {
    // 获取所有已发布的文章
    let posts = post::Post::find_all(pool.as_ref(), true).await?;

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
