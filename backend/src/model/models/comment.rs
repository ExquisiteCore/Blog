//! 评论模型
//!
//! 提供博客评论的数据结构和数据库操作方法

use serde::{Deserialize, Serialize};
use sqlx::{Error, postgres::PgPool};
use time::OffsetDateTime;
use uuid::Uuid;

/// 评论结构体
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Comment {
    /// 评论ID
    pub id: Uuid,
    /// 评论内容
    pub content: String,
    /// 关联的文章ID
    pub post_id: Uuid,
    /// 评论作者ID
    pub user_id: Uuid,
    /// 父评论ID（回复的评论）
    pub parent_id: Option<Uuid>,
    /// 创建时间
    pub created_at: OffsetDateTime,
    /// 更新时间
    pub updated_at: OffsetDateTime,
}

/// 创建评论的请求数据结构
#[derive(Debug, Deserialize)]
pub struct CreateCommentRequest {
    /// 评论内容
    pub content: String,
    /// 关联的文章ID
    pub post_id: Uuid,
    /// 评论作者ID
    pub user_id: Uuid,
    /// 父评论ID（回复的评论）
    pub parent_id: Option<Uuid>,
}

/// 更新评论的请求数据结构
#[derive(Debug, Deserialize)]
pub struct UpdateCommentRequest {
    /// 评论内容
    pub content: String,
}

impl Comment {
    /// 创建新评论
    pub async fn create(pool: &PgPool, req: CreateCommentRequest) -> Result<Self, Error> {
        let id = Uuid::new_v4();
        let now = OffsetDateTime::now_utc();

        let comment = sqlx::query_as!(
            Self,
            r#"
            INSERT INTO comments (id, content, post_id, user_id, parent_id, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, content, post_id, user_id, parent_id, created_at, updated_at
            "#,
            id,
            req.content,
            req.post_id,
            req.user_id,
            req.parent_id,
            now,
            now
        )
        .fetch_one(pool)
        .await?;

        Ok(comment)
    }

    /// 根据ID查找评论
    pub async fn find_by_id(pool: &PgPool, id: Uuid) -> Result<Option<Self>, Error> {
        let comment = sqlx::query_as!(
            Self,
            r#"
            SELECT id, content, post_id, user_id, parent_id, created_at, updated_at
            FROM comments
            WHERE id = $1
            "#,
            id
        )
        .fetch_optional(pool)
        .await?;

        Ok(comment)
    }

    /// 获取文章的所有评论（顶级评论，不包括回复）
    pub async fn find_by_post_id(pool: &PgPool, post_id: Uuid) -> Result<Vec<Self>, Error> {
        let comments = sqlx::query_as!(
            Self,
            r#"
            SELECT id, content, post_id, user_id, parent_id, created_at, updated_at
            FROM comments
            WHERE post_id = $1 AND parent_id IS NULL
            ORDER BY created_at DESC
            "#,
            post_id
        )
        .fetch_all(pool)
        .await?;

        Ok(comments)
    }

    /// 获取评论的所有回复
    pub async fn find_replies(pool: &PgPool, comment_id: Uuid) -> Result<Vec<Self>, Error> {
        let replies = sqlx::query_as!(
            Self,
            r#"
            SELECT id, content, post_id, user_id, parent_id, created_at, updated_at
            FROM comments
            WHERE parent_id = $1
            ORDER BY created_at ASC
            "#,
            comment_id
        )
        .fetch_all(pool)
        .await?;

        Ok(replies)
    }

    /// 获取文章的所有评论（包括回复）
    pub async fn find_all_by_post_id(pool: &PgPool, post_id: Uuid) -> Result<Vec<Self>, Error> {
        let comments = sqlx::query_as!(
            Self,
            r#"
            SELECT id, content, post_id, user_id, parent_id, created_at, updated_at
            FROM comments
            WHERE post_id = $1
            ORDER BY created_at DESC
            "#,
            post_id
        )
        .fetch_all(pool)
        .await?;

        Ok(comments)
    }

    /// 获取用户的所有评论
    pub async fn find_by_user_id(pool: &PgPool, user_id: Uuid) -> Result<Vec<Self>, Error> {
        let comments = sqlx::query_as!(
            Self,
            r#"
            SELECT id, content, post_id, user_id, parent_id, created_at, updated_at
            FROM comments
            WHERE user_id = $1
            ORDER BY created_at DESC
            "#,
            user_id
        )
        .fetch_all(pool)
        .await?;

        Ok(comments)
    }

    /// 更新评论
    pub async fn update(pool: &PgPool, id: Uuid, req: UpdateCommentRequest) -> Result<Self, Error> {
        let comment = Self::find_by_id(pool, id).await?;

        if let Some(_) = comment {
            let now = OffsetDateTime::now_utc();

            let updated_comment = sqlx::query_as!(
                Self,
                r#"
                UPDATE comments
                SET content = $1, updated_at = $2
                WHERE id = $3
                RETURNING id, content, post_id, user_id, parent_id, created_at, updated_at
                "#,
                req.content,
                now,
                id
            )
            .fetch_one(pool)
            .await?;

            Ok(updated_comment)
        } else {
            Err(Error::RowNotFound)
        }
    }

    /// 删除评论
    pub async fn delete(pool: &PgPool, id: Uuid) -> Result<bool, Error> {
        let result = sqlx::query!("DELETE FROM comments WHERE id = $1", id)
            .execute(pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }

    /// 删除文章的所有评论
    pub async fn delete_by_post_id(pool: &PgPool, post_id: Uuid) -> Result<u64, Error> {
        let result = sqlx::query!("DELETE FROM comments WHERE post_id = $1", post_id)
            .execute(pool)
            .await?;

        Ok(result.rows_affected())
    }
}
