use axum::{
    Json,
    extract::{Path, State},
};
use uuid::Uuid;

use crate::{
    error::{AppError, AppErrorType},
    model::models::{label, post},
};

/// 获取所有文章
///
/// 返回所有已发布的文章列表，包含标签信息
pub async fn get_posts(
    State(state): State<crate::state::AppState>,
) -> Result<Json<Vec<post::PostSummaryWithLabels>>, AppError> {
    // 获取所有已发布的文章（包含标签）
    let posts = post::Post::find_all_with_labels(state.pool.as_ref(), true).await?;

    // 返回文章列表
    Ok(Json(posts))
}

/// 创建文章
///
/// 接收文章信息并创建新文章
pub async fn create_post(
    State(state): State<crate::state::AppState>,
    Json(req): Json<post::CreatePostRequest>,
) -> Result<Json<post::Post>, AppError> {
    // 创建新文章
    let post = post::Post::create(state.pool.as_ref(), req).await?;

    // 返回创建的文章
    Ok(Json(post))
}

/// 根据ID获取文章
///
/// 返回指定ID的文章详情，包含完整内容
pub async fn get_post_by_id(
    State(state): State<crate::state::AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<post::PostWithLabels>, AppError> {
    // 根据ID查找文章
    match post::Post::find_by_id_with_labels(state.pool.as_ref(), id).await? {
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
    State(state): State<crate::state::AppState>,
    Path(post_id): Path<Uuid>,
) -> Result<Json<Vec<label::Label>>, AppError> {
    // 首先检查文章是否存在
    let post = post::Post::find_by_id(state.pool.as_ref(), post_id).await?;
    if post.is_none() {
        return Err(AppError::new_message(
            &format!("未找到ID为{}的文章", post_id),
            AppErrorType::Notfound,
        ));
    }

    // 获取文章的所有标签
    let labels = label::Label::find_by_post_id(state.pool.as_ref(), post_id)
        .await
        .map_err(|e| {
            AppError::new_message(&format!("获取文章标签失败: {}", e), AppErrorType::Internal)
        })?;

    // 返回标签列表
    Ok(Json(labels))
}

/// 更新文章
///
/// 根据ID更新文章信息
pub async fn update_post(
    State(state): State<crate::state::AppState>,
    Path(id): Path<Uuid>,
    Json(req): Json<post::UpdatePostRequest>,
) -> Result<Json<post::Post>, AppError> {
    // 更新文章
    let updated = post::Post::update(state.pool.as_ref(), id, req).await?;

    // 返回更新后的文章
    Ok(Json(updated))
}

/// 删除文章
///
/// 根据ID删除文章
pub async fn delete_post(
    State(state): State<crate::state::AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    // 直接删除文章（标签关联通过数据库 CASCADE 自动删除）
    let deleted = post::Post::delete(state.pool.as_ref(), id).await?;

    if deleted {
        Ok(Json(serde_json::json!({ "success": true })))
    } else {
        Err(AppError::new_message(
            &format!("未找到ID为{}的文章", id),
            AppErrorType::Notfound,
        ))
    }
}

/// 获取所有文章（包括未发布）
///
/// 管理员接口，返回所有文章
pub async fn get_all_posts(
    State(state): State<crate::state::AppState>,
) -> Result<Json<Vec<post::PostSummaryWithLabels>>, AppError> {
    // 获取所有文章（包含标签）
    let posts = post::Post::find_all_with_labels(state.pool.as_ref(), false).await?;

    Ok(Json(posts))
}
