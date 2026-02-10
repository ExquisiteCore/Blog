//! 标签 API 模块
//!
//! 提供标签 CRUD 和按标签查询文章接口。

use axum::{
    Extension, Json,
    extract::{Path, Query, State},
    response::IntoResponse,
};
use chrono::Utc;
use sea_orm::*;
use serde::Deserialize;
use uuid::Uuid;

use crate::entity::{content, content_label, content_metadata, label};
use crate::middleware::auth::Identity;
use crate::wrapper::{ApiError, ApiResponse};

use super::postapi::{PostQuery, PostSummaryResponse};

// ========== 请求结构 ==========

#[derive(Debug, Deserialize)]
pub struct CreateLabelRequest {
    pub name: String,
    pub slug: String,
    pub description: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateLabelRequest {
    pub name: Option<String>,
    pub slug: Option<String>,
    pub description: Option<String>,
}

// ========== API 处理函数 ==========

/// 创建标签（管理员）
pub async fn create_label(
    State(state): State<crate::state::AppState>,
    Extension(identity): Extension<Identity>,
    Json(req): Json<CreateLabelRequest>,
) -> Result<impl IntoResponse, ApiError> {
    identity.require_admin()?;

    let now = Utc::now().fixed_offset();
    let new_label = label::ActiveModel {
        id: Set(Uuid::new_v4()),
        name: Set(req.name),
        slug: Set(req.slug),
        description: Set(req.description),
        created_at: Set(now),
        updated_at: Set(now),
    };

    let created = new_label.insert(&state.conn).await?;
    Ok(ApiResponse::created(created))
}

/// 获取所有标签（公开）
pub async fn get_labels(
    State(state): State<crate::state::AppState>,
) -> Result<impl IntoResponse, ApiError> {
    let labels = label::Entity::find()
        .order_by_asc(label::Column::Name)
        .all(&state.conn)
        .await?;

    Ok(ApiResponse::ok(labels))
}

/// 获取标签下的文章（公开）
pub async fn get_posts_by_label(
    State(state): State<crate::state::AppState>,
    Path(label_id): Path<Uuid>,
    Query(query): Query<PostQuery>,
) -> Result<impl IntoResponse, ApiError> {
    let lang = query.lang.unwrap_or_else(|| "zh-CN".to_string());

    // 检查标签是否存在
    label::Entity::find_by_id(label_id)
        .one(&state.conn)
        .await?
        .ok_or_else(|| ApiError::not_found(format!("未找到 ID 为 {label_id} 的标签")))?;

    // 查询关联的 content_metadata
    let relations = content_label::Entity::find()
        .filter(content_label::Column::LabelId.eq(label_id))
        .all(&state.conn)
        .await?;

    let mut results = Vec::new();
    for rel in relations {
        let meta = content_metadata::Entity::find_by_id(rel.content_metadata_id)
            .one(&state.conn)
            .await?;

        if let Some(meta) = meta {
            if !meta.published {
                continue;
            }

            let content_record = content::Entity::find()
                .filter(content::Column::ContentMetadataId.eq(meta.id))
                .filter(content::Column::LangCode.eq(&lang))
                .one(&state.conn)
                .await?;

            // 获取所有标签名
            let label_relations = content_label::Entity::find()
                .filter(content_label::Column::ContentMetadataId.eq(meta.id))
                .all(&state.conn)
                .await?;
            let mut label_names = Vec::new();
            for lr in label_relations {
                if let Some(l) = label::Entity::find_by_id(lr.label_id)
                    .one(&state.conn)
                    .await?
                {
                    label_names.push(l.name);
                }
            }

            if let Some(c) = content_record {
                results.push(PostSummaryResponse {
                    id: meta.id,
                    slug: meta.slug,
                    title: c.title,
                    summary: c.summary,
                    cover_images: meta.cover_images,
                    published: meta.published,
                    view_count: meta.view_count,
                    comment_count: meta.comment_count,
                    like_count: meta.like_count,
                    author_id: meta.author_id,
                    labels: label_names,
                    published_at: meta.published_at,
                    created_at: meta.created_at,
                    updated_at: meta.updated_at,
                });
            }
        }
    }

    Ok(ApiResponse::ok(results))
}

/// 更新标签（管理员）
pub async fn update_label(
    State(state): State<crate::state::AppState>,
    Extension(identity): Extension<Identity>,
    Path(id): Path<Uuid>,
    Json(req): Json<UpdateLabelRequest>,
) -> Result<impl IntoResponse, ApiError> {
    identity.require_admin()?;

    let existing = label::Entity::find_by_id(id)
        .one(&state.conn)
        .await?
        .ok_or_else(|| ApiError::not_found(format!("未找到 ID 为 {id} 的标签")))?;

    let mut update: label::ActiveModel = existing.into();
    if let Some(name) = req.name {
        update.name = Set(name);
    }
    if let Some(slug) = req.slug {
        update.slug = Set(slug);
    }
    if let Some(description) = req.description {
        update.description = Set(Some(description));
    }
    update.updated_at = Set(Utc::now().fixed_offset());

    let updated = update.update(&state.conn).await?;
    Ok(ApiResponse::ok(updated))
}

/// 删除标签（管理员）
pub async fn delete_label(
    State(state): State<crate::state::AppState>,
    Extension(identity): Extension<Identity>,
    Path(id): Path<Uuid>,
) -> Result<impl IntoResponse, ApiError> {
    identity.require_admin()?;

    let result = label::Entity::delete_by_id(id).exec(&state.conn).await?;

    if result.rows_affected == 0 {
        return Err(ApiError::not_found(format!("未找到 ID 为 {id} 的标签")));
    }

    Ok(ApiResponse::ok(serde_json::json!({ "success": true })))
}
