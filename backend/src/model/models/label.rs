//! 标签模型
//!
//! 提供博客标签的数据结构和数据库操作方法

use serde::{Deserialize, Serialize};
use sqlx::{Error, postgres::PgPool};
use time::OffsetDateTime;
use uuid::Uuid;

/// 标签结构体
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Label {
    /// 标签ID
    pub id: Uuid,
    /// 标签名称
    pub name: String,
    /// 标签别名(URL友好)
    pub slug: String,
    /// 标签描述
    pub description: Option<String>,
    /// 创建时间
    pub created_at: OffsetDateTime,
    /// 更新时间
    pub updated_at: OffsetDateTime,
}

/// 创建标签的请求数据结构
#[derive(Debug, Deserialize)]
pub struct CreateLabelRequest {
    /// 标签名称
    pub name: String,
    /// 标签别名(URL友好)
    pub slug: String,
    /// 标签描述
    pub description: Option<String>,
}

/// 更新标签的请求数据结构
#[derive(Debug, Deserialize)]
pub struct UpdateLabelRequest {
    /// 标签名称
    pub name: Option<String>,
    /// 标签别名(URL友好)
    pub slug: Option<String>,
    /// 标签描述
    pub description: Option<String>,
}

impl Label {
    /// 创建新标签
    pub async fn create(pool: &PgPool, req: CreateLabelRequest) -> Result<Self, Error> {
        let id = Uuid::new_v4();
        let now = OffsetDateTime::now_utc();

        let label = sqlx::query_as!(
            Self,
            r#"
            INSERT INTO label (id, name, slug, description, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, name, slug, description, created_at, updated_at
            "#,
            id,
            req.name,
            req.slug,
            req.description,
            now,
            now
        )
        .fetch_one(pool)
        .await?;

        Ok(label)
    }

    /// 根据ID查找标签
    pub async fn find_by_id(pool: &PgPool, id: Uuid) -> Result<Option<Self>, Error> {
        let label = sqlx::query_as!(
            Self,
            r#"
            SELECT id, name, slug, description, created_at, updated_at
            FROM label
            WHERE id = $1
            "#,
            id
        )
        .fetch_optional(pool)
        .await?;

        Ok(label)
    }

    /// 根据别名查找标签
    pub async fn find_by_slug(pool: &PgPool, slug: &str) -> Result<Option<Self>, Error> {
        let label = sqlx::query_as!(
            Self,
            r#"
            SELECT id, name, slug, description, created_at, updated_at
            FROM label
            WHERE slug = $1
            "#,
            slug
        )
        .fetch_optional(pool)
        .await?;

        Ok(label)
    }

    /// 获取所有标签
    pub async fn find_all(pool: &PgPool) -> Result<Vec<Self>, Error> {
        let labels = sqlx::query_as!(
            Self,
            r#"
            SELECT id, name, slug, description, created_at, updated_at
            FROM label
            ORDER BY name ASC
            "#
        )
        .fetch_all(pool)
        .await?;

        Ok(labels)
    }

    /// 更新标签
    pub async fn update(pool: &PgPool, id: Uuid, req: UpdateLabelRequest) -> Result<Self, Error> {
        let label = Self::find_by_id(pool, id).await?;

        if let Some(label) = label {
            let name = req.name.unwrap_or(label.name);
            let slug = req.slug.unwrap_or(label.slug);
            let description = req.description.or(label.description);
            let now = OffsetDateTime::now_utc();

            let updated_label = sqlx::query_as!(
                Self,
                r#"
                UPDATE label
                SET name = $1, slug = $2, description = $3, updated_at = $4
                WHERE id = $5
                RETURNING id, name, slug, description, created_at, updated_at
                "#,
                name,
                slug,
                description,
                now,
                id
            )
            .fetch_one(pool)
            .await?;

            Ok(updated_label)
        } else {
            Err(Error::RowNotFound)
        }
    }

    /// 删除标签
    pub async fn delete(pool: &PgPool, id: Uuid) -> Result<bool, Error> {
        let result = sqlx::query!("DELETE FROM label WHERE id = $1", id)
            .execute(pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }

    /// 获取文章的所有标签
    pub async fn find_by_post_id(pool: &PgPool, post_id: Uuid) -> Result<Vec<Self>, Error> {
        let labels = sqlx::query_as!(
            Self,
            r#"
            SELECT l.id, l.name, l.slug, l.description, l.created_at, l.updated_at
            FROM label l
            JOIN post_label pt ON l.id = pt.label_id
            WHERE pt.post_id = $1
            ORDER BY l.name ASC
            "#,
            post_id
        )
        .fetch_all(pool)
        .await?;

        Ok(labels)
    }

    /// 为文章添加标签
    pub async fn add_to_post(pool: &PgPool, post_id: Uuid, tag_id: Uuid) -> Result<(), Error> {
        sqlx::query!(
            r#"
            INSERT INTO post_label (post_id, label_id)
            VALUES ($1, $2)
            ON CONFLICT (post_id, label_id) DO NOTHING
            "#,
            post_id,
            tag_id
        )
        .execute(pool)
        .await?;

        Ok(())
    }

    /// 从文章中移除标签
    pub async fn remove_from_post(
        pool: &PgPool,
        post_id: Uuid,
        tag_id: Uuid,
    ) -> Result<bool, Error> {
        let result = sqlx::query!(
            r#"
            DELETE FROM post_label
            WHERE post_id = $1 AND label_id = $2
            "#,
            post_id,
            tag_id
        )
        .execute(pool)
        .await?;

        Ok(result.rows_affected() > 0)
    }
}
