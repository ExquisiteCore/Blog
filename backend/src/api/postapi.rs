//! 文章 API 模块
//!
//! 提供文章相关的 CRUD、点赞、评论、浏览量等接口。
//! 使用 content_metadata + content 双表结构。

use axum::{
    Extension, Json,
    extract::{Path, Query, State},
    response::IntoResponse,
};
use chrono::Utc;
use sea_orm::*;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::entity::{comment, content, content_label, content_metadata, label, like};
use crate::middleware::auth::Identity;
use crate::wrapper::{ApiError, ApiResponse};

// ========== 请求/响应结构 ==========

#[derive(Debug, Deserialize)]
pub struct PostQuery {
    pub lang: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreatePostRequest {
    pub title: String,
    pub slug: String,
    pub content: String,
    pub summary: Option<String>,
    pub cover_images: Option<Vec<String>>,
    pub published: Option<bool>,
    pub labels: Option<Vec<Uuid>>,
}

#[derive(Debug, Deserialize)]
pub struct UpdatePostRequest {
    pub title: Option<String>,
    pub slug: Option<String>,
    pub content: Option<String>,
    pub summary: Option<String>,
    pub cover_images: Option<Vec<String>>,
    pub published: Option<bool>,
    pub labels: Option<Vec<Uuid>>,
}

#[derive(Debug, Serialize)]
pub struct PostSummaryResponse {
    pub id: Uuid,
    pub slug: String,
    pub title: String,
    pub summary: Option<String>,
    pub cover_images: Option<serde_json::Value>,
    pub published: bool,
    pub view_count: i32,
    pub comment_count: i32,
    pub like_count: i32,
    pub author_id: Uuid,
    pub labels: Vec<String>,
    pub published_at: Option<chrono::DateTime<chrono::FixedOffset>>,
    pub created_at: chrono::DateTime<chrono::FixedOffset>,
    pub updated_at: chrono::DateTime<chrono::FixedOffset>,
}

#[derive(Debug, Serialize)]
pub struct PostDetailResponse {
    pub id: Uuid,
    pub slug: String,
    pub title: String,
    pub summary: Option<String>,
    pub content: String,
    pub rendered_html: Option<String>,
    pub toc: Option<serde_json::Value>,
    pub cover_images: Option<serde_json::Value>,
    pub published: bool,
    pub view_count: i32,
    pub comment_count: i32,
    pub like_count: i32,
    pub author_id: Uuid,
    pub labels: Vec<String>,
    pub published_at: Option<chrono::DateTime<chrono::FixedOffset>>,
    pub created_at: chrono::DateTime<chrono::FixedOffset>,
    pub updated_at: chrono::DateTime<chrono::FixedOffset>,
}

#[derive(Debug, Deserialize)]
pub struct CreateCommentRequest {
    pub content: String,
    pub parent_id: Option<Uuid>,
}

#[derive(Debug, Serialize)]
pub struct CommentResponse {
    pub id: Uuid,
    pub content: String,
    pub parent_id: Option<Uuid>,
    pub identity_id: Uuid,
    pub is_deleted: bool,
    pub created_at: chrono::DateTime<chrono::FixedOffset>,
}

// ========== 文章 API ==========

/// 获取所有已发布的文章（公开）
pub async fn get_posts(
    State(state): State<crate::state::AppState>,
    Query(query): Query<PostQuery>,
) -> Result<impl IntoResponse, ApiError> {
    let lang = query.lang.unwrap_or_else(|| "zh-CN".to_string());

    let posts = content_metadata::Entity::find()
        .filter(content_metadata::Column::Published.eq(true))
        .order_by_desc(content_metadata::Column::PublishedAt)
        .all(&state.conn)
        .await?;

    let mut results = Vec::new();
    for meta in posts {
        let content_record = content::Entity::find()
            .filter(content::Column::ContentMetadataId.eq(meta.id))
            .filter(content::Column::LangCode.eq(&lang))
            .one(&state.conn)
            .await?;

        let labels = get_labels_for_metadata(&state.conn, meta.id).await?;

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
                labels,
                published_at: meta.published_at,
                created_at: meta.created_at,
                updated_at: meta.updated_at,
            });
        }
    }

    Ok(ApiResponse::ok(results))
}

/// 获取所有文章（含未发布，管理员接口）
pub async fn get_all_posts(
    State(state): State<crate::state::AppState>,
    Extension(identity): Extension<Identity>,
    Query(query): Query<PostQuery>,
) -> Result<impl IntoResponse, ApiError> {
    identity.require_admin()?;
    let lang = query.lang.unwrap_or_else(|| "zh-CN".to_string());

    let posts = content_metadata::Entity::find()
        .order_by_desc(content_metadata::Column::UpdatedAt)
        .all(&state.conn)
        .await?;

    let mut results = Vec::new();
    for meta in posts {
        let content_record = content::Entity::find()
            .filter(content::Column::ContentMetadataId.eq(meta.id))
            .filter(content::Column::LangCode.eq(&lang))
            .one(&state.conn)
            .await?;

        let labels = get_labels_for_metadata(&state.conn, meta.id).await?;

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
                labels,
                published_at: meta.published_at,
                created_at: meta.created_at,
                updated_at: meta.updated_at,
            });
        }
    }

    Ok(ApiResponse::ok(results))
}

/// 根据 slug 获取文章详情（公开）
pub async fn get_post_by_slug(
    State(state): State<crate::state::AppState>,
    Path(slug): Path<String>,
    Query(query): Query<PostQuery>,
) -> Result<impl IntoResponse, ApiError> {
    let lang = query.lang.unwrap_or_else(|| "zh-CN".to_string());

    let meta = content_metadata::Entity::find()
        .filter(content_metadata::Column::Slug.eq(&slug))
        .one(&state.conn)
        .await?
        .ok_or_else(|| ApiError::not_found(format!("未找到 slug 为 {slug} 的文章")))?;

    let c = content::Entity::find()
        .filter(content::Column::ContentMetadataId.eq(meta.id))
        .filter(content::Column::LangCode.eq(&lang))
        .one(&state.conn)
        .await?
        .ok_or_else(|| ApiError::not_found(format!("未找到语言为 {lang} 的内容")))?;

    let labels = get_labels_for_metadata(&state.conn, meta.id).await?;

    Ok(ApiResponse::ok(PostDetailResponse {
        id: meta.id,
        slug: meta.slug,
        title: c.title,
        summary: c.summary,
        content: c.content,
        rendered_html: c.rendered_html,
        toc: c.toc,
        cover_images: meta.cover_images,
        published: meta.published,
        view_count: meta.view_count,
        comment_count: meta.comment_count,
        like_count: meta.like_count,
        author_id: meta.author_id,
        labels,
        published_at: meta.published_at,
        created_at: meta.created_at,
        updated_at: meta.updated_at,
    }))
}

/// 根据 ID 获取文章详情（兼容旧接口）
pub async fn get_post_by_id(
    State(state): State<crate::state::AppState>,
    Path(id): Path<Uuid>,
    Query(query): Query<PostQuery>,
) -> Result<impl IntoResponse, ApiError> {
    let lang = query.lang.unwrap_or_else(|| "zh-CN".to_string());

    let meta = content_metadata::Entity::find_by_id(id)
        .one(&state.conn)
        .await?
        .ok_or_else(|| ApiError::not_found(format!("未找到 ID 为 {id} 的文章")))?;

    let c = content::Entity::find()
        .filter(content::Column::ContentMetadataId.eq(meta.id))
        .filter(content::Column::LangCode.eq(&lang))
        .one(&state.conn)
        .await?
        .ok_or_else(|| ApiError::not_found(format!("未找到语言为 {lang} 的内容")))?;

    let labels = get_labels_for_metadata(&state.conn, meta.id).await?;

    Ok(ApiResponse::ok(PostDetailResponse {
        id: meta.id,
        slug: meta.slug,
        title: c.title,
        summary: c.summary,
        content: c.content,
        rendered_html: c.rendered_html,
        toc: c.toc,
        cover_images: meta.cover_images,
        published: meta.published,
        view_count: meta.view_count,
        comment_count: meta.comment_count,
        like_count: meta.like_count,
        author_id: meta.author_id,
        labels,
        published_at: meta.published_at,
        created_at: meta.created_at,
        updated_at: meta.updated_at,
    }))
}

/// 创建文章（管理员）
pub async fn create_post(
    State(state): State<crate::state::AppState>,
    Extension(identity): Extension<Identity>,
    Json(req): Json<CreatePostRequest>,
) -> Result<impl IntoResponse, ApiError> {
    let user = identity.require_admin()?;
    let now = Utc::now().fixed_offset();
    let meta_id = Uuid::new_v4();

    let published_at = if req.published.unwrap_or(false) {
        Some(now)
    } else {
        None
    };

    // 创建 content_metadata
    let meta = content_metadata::ActiveModel {
        id: Set(meta_id),
        slug: Set(req.slug.clone()),
        content_type: Set("article".to_string()),
        cover_images: Set(req.cover_images.as_ref().map(|imgs| serde_json::json!(imgs))),
        tags: Set(None),
        original_lang: Set("zh-CN".to_string()),
        view_count: Set(0),
        comment_count: Set(0),
        like_count: Set(0),
        author_id: Set(user.id),
        published: Set(req.published.unwrap_or(false)),
        published_at: Set(published_at),
        created_at: Set(now),
        updated_at: Set(now),
    };
    meta.insert(&state.conn).await?;

    // 创建 content（默认中文）
    let content_model = content::ActiveModel {
        id: Set(Uuid::new_v4()),
        content_metadata_id: Set(meta_id),
        lang_code: Set("zh-CN".to_string()),
        title: Set(req.title),
        summary: Set(req.summary),
        content: Set(req.content),
        rendered_html: Set(None),
        toc: Set(None),
        created_at: Set(now),
        updated_at: Set(now),
    };
    content_model.insert(&state.conn).await?;

    // 关联标签
    if let Some(label_ids) = req.labels {
        for label_id in label_ids {
            let cl = content_label::ActiveModel {
                content_metadata_id: Set(meta_id),
                label_id: Set(label_id),
            };
            cl.insert(&state.conn).await.ok(); // 忽略重复
        }
    }

    Ok(ApiResponse::created(serde_json::json!({
        "id": meta_id,
        "slug": req.slug,
    })))
}

/// 更新文章（管理员）
pub async fn update_post(
    State(state): State<crate::state::AppState>,
    Extension(identity): Extension<Identity>,
    Path(id): Path<Uuid>,
    Json(req): Json<UpdatePostRequest>,
) -> Result<impl IntoResponse, ApiError> {
    identity.require_admin()?;
    let now = Utc::now().fixed_offset();

    // 更新 content_metadata
    let meta = content_metadata::Entity::find_by_id(id)
        .one(&state.conn)
        .await?
        .ok_or_else(|| ApiError::not_found(format!("未找到 ID 为 {id} 的文章")))?;

    let mut meta_update: content_metadata::ActiveModel = meta.into();
    if let Some(slug) = req.slug {
        meta_update.slug = Set(slug);
    }
    if let Some(cover_images) = req.cover_images {
        meta_update.cover_images = Set(Some(serde_json::json!(cover_images)));
    }
    if let Some(published) = req.published {
        meta_update.published = Set(published);
        if published {
            // 首次发布时设置 published_at
            let existing = content_metadata::Entity::find_by_id(id)
                .one(&state.conn)
                .await?;
            if existing.map_or(true, |m| m.published_at.is_none()) {
                meta_update.published_at = Set(Some(now));
            }
        }
    }
    meta_update.updated_at = Set(now);
    meta_update.update(&state.conn).await?;

    // 更新 content（默认中文）
    let content_record = content::Entity::find()
        .filter(content::Column::ContentMetadataId.eq(id))
        .filter(content::Column::LangCode.eq("zh-CN"))
        .one(&state.conn)
        .await?;

    if let Some(c) = content_record {
        let mut c_update: content::ActiveModel = c.into();
        if let Some(title) = req.title {
            c_update.title = Set(title);
        }
        if let Some(summary) = req.summary {
            c_update.summary = Set(Some(summary));
        }
        if let Some(content_text) = req.content {
            c_update.content = Set(content_text);
        }
        c_update.updated_at = Set(now);
        c_update.update(&state.conn).await?;
    }

    // 更新标签关联
    if let Some(label_ids) = req.labels {
        // 删除旧关联
        content_label::Entity::delete_many()
            .filter(content_label::Column::ContentMetadataId.eq(id))
            .exec(&state.conn)
            .await?;
        // 新建关联
        for label_id in label_ids {
            let cl = content_label::ActiveModel {
                content_metadata_id: Set(id),
                label_id: Set(label_id),
            };
            cl.insert(&state.conn).await.ok();
        }
    }

    Ok(ApiResponse::ok(serde_json::json!({ "success": true })))
}

/// 删除文章（管理员）
pub async fn delete_post(
    State(state): State<crate::state::AppState>,
    Extension(identity): Extension<Identity>,
    Path(id): Path<Uuid>,
) -> Result<impl IntoResponse, ApiError> {
    identity.require_admin()?;

    let result = content_metadata::Entity::delete_by_id(id)
        .exec(&state.conn)
        .await?;

    if result.rows_affected == 0 {
        return Err(ApiError::not_found(format!("未找到 ID 为 {id} 的文章")));
    }

    Ok(ApiResponse::ok(serde_json::json!({ "success": true })))
}

/// 获取文章的标签
pub async fn get_post_labels(
    State(state): State<crate::state::AppState>,
    Path(id): Path<Uuid>,
) -> Result<impl IntoResponse, ApiError> {
    let labels = get_label_models_for_metadata(&state.conn, id).await?;
    Ok(ApiResponse::ok(labels))
}

// ========== 浏览量 ==========

/// 增加文章浏览量
pub async fn increase_view_count(
    State(state): State<crate::state::AppState>,
    Path(slug): Path<String>,
) -> Result<impl IntoResponse, ApiError> {
    let meta = content_metadata::Entity::find()
        .filter(content_metadata::Column::Slug.eq(&slug))
        .one(&state.conn)
        .await?
        .ok_or_else(|| ApiError::not_found("文章不存在"))?;

    let mut meta_update: content_metadata::ActiveModel = meta.clone().into();
    meta_update.view_count = Set(meta.view_count + 1);
    meta_update.update(&state.conn).await?;

    Ok(ApiResponse::ok(serde_json::json!({
        "view_count": meta.view_count + 1
    })))
}

// ========== 点赞 ==========

/// 获取文章点赞状态
pub async fn get_likes(
    State(state): State<crate::state::AppState>,
    Extension(identity): Extension<Identity>,
    Path(slug): Path<String>,
) -> Result<impl IntoResponse, ApiError> {
    let meta = content_metadata::Entity::find()
        .filter(content_metadata::Column::Slug.eq(&slug))
        .one(&state.conn)
        .await?
        .ok_or_else(|| ApiError::not_found("文章不存在"))?;

    let liked = if let Some(identity_id) = identity.identity_id() {
        like::Entity::find()
            .filter(like::Column::IdentityId.eq(identity_id))
            .filter(like::Column::ContentMetadataId.eq(meta.id))
            .one(&state.conn)
            .await?
            .is_some()
    } else {
        false
    };

    Ok(ApiResponse::ok(serde_json::json!({
        "liked": liked,
        "like_count": meta.like_count,
    })))
}

/// 点赞/取消点赞
pub async fn toggle_like(
    State(state): State<crate::state::AppState>,
    Extension(mut identity): Extension<Identity>,
    Path(slug): Path<String>,
) -> Result<impl IntoResponse, ApiError> {
    let meta = content_metadata::Entity::find()
        .filter(content_metadata::Column::Slug.eq(&slug))
        .one(&state.conn)
        .await?
        .ok_or_else(|| ApiError::not_found("文章不存在"))?;

    let identity_id = identity.ensure_identity(&state.conn).await?;

    // 检查是否已点赞
    let existing = like::Entity::find()
        .filter(like::Column::IdentityId.eq(identity_id))
        .filter(like::Column::ContentMetadataId.eq(meta.id))
        .one(&state.conn)
        .await?;

    let (liked, new_count) = if let Some(existing_like) = existing {
        // 取消点赞
        like::Entity::delete_by_id(existing_like.id)
            .exec(&state.conn)
            .await?;
        let new_count = (meta.like_count - 1).max(0);
        let mut meta_update: content_metadata::ActiveModel = meta.into();
        meta_update.like_count = Set(new_count);
        meta_update.update(&state.conn).await?;
        (false, new_count)
    } else {
        // 添加点赞
        let new_like = like::ActiveModel {
            id: Set(Uuid::new_v4()),
            identity_id: Set(identity_id),
            content_metadata_id: Set(meta.id),
            created_at: Set(Utc::now().fixed_offset()),
        };
        new_like.insert(&state.conn).await?;
        let new_count = meta.like_count + 1;
        let mut meta_update: content_metadata::ActiveModel = meta.into();
        meta_update.like_count = Set(new_count);
        meta_update.update(&state.conn).await?;
        (true, new_count)
    };

    Ok(ApiResponse::ok(serde_json::json!({
        "liked": liked,
        "like_count": new_count,
    })))
}

// ========== 评论 ==========

/// 获取文章的评论
pub async fn get_comments(
    State(state): State<crate::state::AppState>,
    Path(slug): Path<String>,
) -> Result<impl IntoResponse, ApiError> {
    let meta = content_metadata::Entity::find()
        .filter(content_metadata::Column::Slug.eq(&slug))
        .one(&state.conn)
        .await?
        .ok_or_else(|| ApiError::not_found("文章不存在"))?;

    let comments = comment::Entity::find()
        .filter(comment::Column::ContentMetadataId.eq(meta.id))
        .filter(comment::Column::IsDeleted.eq(false))
        .order_by_asc(comment::Column::CreatedAt)
        .all(&state.conn)
        .await?;

    let results: Vec<CommentResponse> = comments
        .into_iter()
        .map(|c| CommentResponse {
            id: c.id,
            content: c.content,
            parent_id: c.parent_id,
            identity_id: c.identity_id,
            is_deleted: c.is_deleted,
            created_at: c.created_at,
        })
        .collect();

    Ok(ApiResponse::ok(results))
}

/// 创建评论
pub async fn create_comment(
    State(state): State<crate::state::AppState>,
    Extension(mut identity): Extension<Identity>,
    Path(slug): Path<String>,
    Json(req): Json<CreateCommentRequest>,
) -> Result<impl IntoResponse, ApiError> {
    let meta = content_metadata::Entity::find()
        .filter(content_metadata::Column::Slug.eq(&slug))
        .one(&state.conn)
        .await?
        .ok_or_else(|| ApiError::not_found("文章不存在"))?;

    let identity_id = identity.ensure_identity(&state.conn).await?;
    let now = Utc::now().fixed_offset();

    let new_comment = comment::ActiveModel {
        id: Set(Uuid::new_v4()),
        identity_id: Set(identity_id),
        content_metadata_id: Set(meta.id),
        parent_id: Set(req.parent_id),
        content: Set(req.content),
        is_deleted: Set(false),
        created_at: Set(now),
        updated_at: Set(now),
    };
    let inserted = new_comment.insert(&state.conn).await?;

    // 更新评论计数
    let new_comment_count = meta.comment_count + 1;
    let mut meta_update: content_metadata::ActiveModel = meta.into();
    meta_update.comment_count = Set(new_comment_count);
    meta_update.update(&state.conn).await?;

    Ok(ApiResponse::created(CommentResponse {
        id: inserted.id,
        content: inserted.content,
        parent_id: inserted.parent_id,
        identity_id: inserted.identity_id,
        is_deleted: inserted.is_deleted,
        created_at: inserted.created_at,
    }))
}

/// 删除评论（软删除）
pub async fn delete_comment(
    State(state): State<crate::state::AppState>,
    Extension(identity): Extension<Identity>,
    Path(slug): Path<String>,
    Query(params): Query<std::collections::HashMap<String, String>>,
) -> Result<impl IntoResponse, ApiError> {
    let comment_id = params
        .get("comment_id")
        .and_then(|s| Uuid::parse_str(s).ok())
        .ok_or_else(|| ApiError::bad_request("缺少 comment_id 参数"))?;

    let c = comment::Entity::find_by_id(comment_id)
        .one(&state.conn)
        .await?
        .ok_or_else(|| ApiError::not_found("评论不存在"))?;

    // 只有管理员或评论作者可以删除
    let can_delete = identity.is_admin()
        || identity.identity_id().map_or(false, |id| id == c.identity_id);

    if !can_delete {
        return Err(ApiError::forbidden("无权删除此评论"));
    }

    let mut c_update: comment::ActiveModel = c.into();
    c_update.is_deleted = Set(true);
    c_update.updated_at = Set(Utc::now().fixed_offset());
    c_update.update(&state.conn).await?;

    // 更新评论计数
    let _meta = content_metadata::Entity::find()
        .filter(content_metadata::Column::Slug.eq(&slug))
        .one(&state.conn)
        .await?;

    Ok(ApiResponse::ok(serde_json::json!({ "success": true })))
}

// ========== 辅助函数 ==========

/// 获取 content_metadata 关联的标签名列表
async fn get_labels_for_metadata(
    db: &DatabaseConnection,
    metadata_id: Uuid,
) -> Result<Vec<String>, DbErr> {
    let relations = content_label::Entity::find()
        .filter(content_label::Column::ContentMetadataId.eq(metadata_id))
        .all(db)
        .await?;

    let mut names = Vec::new();
    for rel in relations {
        if let Some(l) = label::Entity::find_by_id(rel.label_id).one(db).await? {
            names.push(l.name);
        }
    }
    Ok(names)
}

/// 获取 content_metadata 关联的标签 Model 列表
async fn get_label_models_for_metadata(
    db: &DatabaseConnection,
    metadata_id: Uuid,
) -> Result<Vec<label::Model>, DbErr> {
    let relations = content_label::Entity::find()
        .filter(content_label::Column::ContentMetadataId.eq(metadata_id))
        .all(db)
        .await?;

    let mut labels = Vec::new();
    for rel in relations {
        if let Some(l) = label::Entity::find_by_id(rel.label_id).one(db).await? {
            labels.push(l);
        }
    }
    Ok(labels)
}
