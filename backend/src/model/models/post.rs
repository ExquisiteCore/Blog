//! 文章模型
//!
//! 提供博客文章的数据结构和数据库操作方法

use serde::{Deserialize, Serialize};
use sqlx::{Error, postgres::PgPool};
use time::OffsetDateTime;
use uuid::Uuid;

/// 文章结构体
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Post {
    /// 文章ID
    pub id: Uuid,
    /// 文章标题
    pub title: String,
    /// 文章别名(URL友好)
    pub slug: String,
    /// 文章内容
    pub content: String,
    /// 文章摘要
    pub excerpt: Option<String>,
    /// 特色图片
    pub featured_image: Option<String>,
    /// 是否发布
    pub published: bool,
    /// 作者ID
    pub author_id: Uuid,
    /// 创建时间
    pub created_at: OffsetDateTime,
    /// 更新时间
    pub updated_at: OffsetDateTime,
    /// 发布时间
    pub published_at: Option<OffsetDateTime>,
}

/// 文章摘要结构体（不包含content字段）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PostSummary {
    /// 文章ID
    pub id: Uuid,
    /// 文章标题
    pub title: String,
    /// 文章别名(URL友好)
    pub slug: String,
    /// 文章摘要
    pub excerpt: Option<String>,
    /// 特色图片
    pub featured_image: Option<String>,
    /// 是否发布
    pub published: bool,
    /// 作者ID
    pub author_id: Uuid,
    /// 创建时间
    pub created_at: OffsetDateTime,
    /// 更新时间
    pub updated_at: OffsetDateTime,
    /// 发布时间
    pub published_at: Option<OffsetDateTime>,
}

/// 带标签的文章摘要结构体
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PostSummaryWithLabels {
    /// 文章ID
    pub id: Uuid,
    /// 文章标题
    pub title: String,
    /// 文章别名(URL友好)
    pub slug: String,
    /// 文章摘要
    pub excerpt: Option<String>,
    /// 特色图片
    pub featured_image: Option<String>,
    /// 是否发布
    pub published: bool,
    /// 作者ID
    pub author_id: Uuid,
    /// 创建时间
    pub created_at: OffsetDateTime,
    /// 更新时间
    pub updated_at: OffsetDateTime,
    /// 发布时间
    pub published_at: Option<OffsetDateTime>,
    /// 文章标签名列表
    pub labels: Vec<String>,
}

/// 创建文章的请求数据结构
#[derive(Debug, Deserialize)]
pub struct CreatePostRequest {
    /// 文章标题
    pub title: String,
    /// 文章别名(URL友好)
    pub slug: String,
    /// 文章内容
    pub content: String,
    /// 文章摘要
    pub excerpt: Option<String>,
    /// 特色图片
    pub featured_image: Option<String>,
    /// 是否发布
    pub published: bool,
    /// 作者ID
    pub author_id: Uuid,
    /// 文章标签ID列表
    pub labels: Option<Vec<Uuid>>,
}

/// 更新文章的请求数据结构
#[derive(Debug, Deserialize)]
pub struct UpdatePostRequest {
    /// 文章标题
    pub title: Option<String>,
    /// 文章别名(URL友好)
    pub slug: Option<String>,
    /// 文章内容
    pub content: Option<String>,
    /// 文章摘要
    pub excerpt: Option<String>,
    /// 特色图片
    pub featured_image: Option<String>,
    /// 是否发布
    pub published: Option<bool>,
}

impl Post {
    /// 创建新文章
    pub async fn create(pool: &PgPool, req: CreatePostRequest) -> Result<Self, Error> {
        let id = Uuid::new_v4();
        let now = OffsetDateTime::now_utc();
        let published_at = if req.published { Some(now) } else { None };

        let post = sqlx::query_as!(
            Self,
            r#"
            INSERT INTO posts (id, title, slug, content, excerpt, featured_image, published, author_id, created_at, updated_at, published_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING id, title, slug, content, excerpt, featured_image, published, author_id, created_at, updated_at, published_at
            "#,
            id,
            req.title,
            req.slug,
            req.content,
            req.excerpt,
            req.featured_image,
            req.published,
            req.author_id,
            now,
            now,
            published_at
        )
        .fetch_one(pool)
        .await?;

        // 如果提供了标签列表，则为文章添加标签
        if let Some(labels) = req.labels {
            for label_id in labels {
                Self::add_label(pool, post.id, label_id).await?;
            }
        }

        Ok(post)
    }

    /// 根据ID查找文章
    pub async fn find_by_id(pool: &PgPool, id: Uuid) -> Result<Option<Self>, Error> {
        let post = sqlx::query_as!(
            Self,
            r#"
            SELECT id, title, slug, content, excerpt, featured_image, published, author_id, created_at, updated_at, published_at
            FROM posts
            WHERE id = $1
            "#,
            id
        )
        .fetch_optional(pool)
        .await?;

        Ok(post)
    }

    /// 根据别名查找文章
    pub async fn find_by_slug(pool: &PgPool, slug: &str) -> Result<Option<Self>, Error> {
        let post = sqlx::query_as!(
            Self,
            r#"
            SELECT id, title, slug, content, excerpt, featured_image, published, author_id, created_at, updated_at, published_at
            FROM posts
            WHERE slug = $1
            "#,
            slug
        )
        .fetch_optional(pool)
        .await?;

        Ok(post)
    }

    /// 获取所有文章（不包含content字段）
    pub async fn find_all(pool: &PgPool, published_only: bool) -> Result<Vec<PostSummary>, Error> {
        let posts = if published_only {
            sqlx::query_as!(
                PostSummary,
                r#"
                SELECT id, title, slug, excerpt, featured_image, published, author_id, created_at, updated_at, published_at
                FROM posts
                WHERE published = true
                ORDER BY published_at DESC
                "#
            )
            .fetch_all(pool)
            .await?
        } else {
            sqlx::query_as!(
                PostSummary,
                r#"
                SELECT id, title, slug, excerpt, featured_image, published, author_id, created_at, updated_at, published_at
                FROM posts
                ORDER BY updated_at DESC
                "#
            )
            .fetch_all(pool)
            .await?
        };

        Ok(posts)
    }

    /// 获取作者的所有文章
    pub async fn find_by_author(
        pool: &PgPool,
        author_id: Uuid,
        published_only: bool,
    ) -> Result<Vec<Self>, Error> {
        let posts = if published_only {
            sqlx::query_as!(
                Self,
                r#"
                SELECT id, title, slug, content, excerpt, featured_image, published, author_id, created_at, updated_at, published_at
                FROM posts
                WHERE author_id = $1 AND published = true
                ORDER BY published_at DESC
                "#,
                author_id
            )
            .fetch_all(pool)
            .await?
        } else {
            sqlx::query_as!(
                Self,
                r#"
                SELECT id, title, slug, content, excerpt, featured_image, published, author_id, created_at, updated_at, published_at
                FROM posts
                WHERE author_id = $1
                ORDER BY updated_at DESC
                "#,
                author_id
            )
            .fetch_all(pool)
            .await?
        };

        Ok(posts)
    }

    /// 获取标签下的所有文章
    pub async fn find_by_label(
        pool: &PgPool,
        label_id: Uuid,
        published_only: bool,
    ) -> Result<Vec<Self>, Error> {
        let posts = if published_only {
            sqlx::query_as!(
                Self,
                r#"
                SELECT p.id, p.title, p.slug, p.content, p.excerpt, p.featured_image, p.published, p.author_id, p.created_at, p.updated_at, p.published_at
                FROM posts p
                JOIN post_label pl ON p.id = pl.post_id
                WHERE pl.label_id = $1 AND p.published = true
                ORDER BY p.published_at DESC
                "#,
                label_id
            )
            .fetch_all(pool)
            .await?
        } else {
            sqlx::query_as!(
                Self,
                r#"
                SELECT p.id, p.title, p.slug, p.content, p.excerpt, p.featured_image, p.published, p.author_id, p.created_at, p.updated_at, p.published_at
                FROM posts p
                JOIN post_label pl ON p.id = pl.post_id
                WHERE pl.label_id = $1
                ORDER BY p.updated_at DESC
                "#,
                label_id
            )
            .fetch_all(pool)
            .await?
        };

        Ok(posts)
    }

    /// 更新文章
    pub async fn update(pool: &PgPool, id: Uuid, req: UpdatePostRequest) -> Result<Self, Error> {
        let post = Self::find_by_id(pool, id).await?;

        if let Some(post) = post {
            let title = req.title.unwrap_or(post.title);
            let slug = req.slug.unwrap_or(post.slug);
            let content = req.content.unwrap_or(post.content);
            let excerpt = req.excerpt.or(post.excerpt);
            let featured_image = req.featured_image.or(post.featured_image);
            let now = OffsetDateTime::now_utc();

            // 处理发布状态变更
            let (published, published_at) = match (req.published, post.published, post.published_at)
            {
                (Some(true), false, _) => (true, Some(now)), // 从未发布变为发布
                (Some(false), true, _) => (false, None),     // 从发布变为未发布
                (_, _, published_at) => (post.published, published_at), // 保持原状态
            };

            let updated_post = sqlx::query_as!(
                Self,
                r#"
                UPDATE posts
                SET title = $1, slug = $2, content = $3, excerpt = $4, featured_image = $5, 
                    published = $6, updated_at = $7, published_at = $8
                WHERE id = $9
                RETURNING id, title, slug, content, excerpt, featured_image, published, author_id, created_at, updated_at, published_at
                "#,
                title,
                slug,
                content,
                excerpt,
                featured_image,
                published,
                now,
                published_at,
                id
            )
            .fetch_one(pool)
            .await?;

            Ok(updated_post)
        } else {
            Err(Error::RowNotFound)
        }
    }

    /// 删除文章
    pub async fn delete(pool: &PgPool, id: Uuid) -> Result<bool, Error> {
        let result = sqlx::query!("DELETE FROM posts WHERE id = $1", id)
            .execute(pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }

    /// 为文章添加标签
    pub async fn add_label(pool: &PgPool, post_id: Uuid, label_id: Uuid) -> Result<(), Error> {
        sqlx::query!(
            r#"
            INSERT INTO post_label (post_id, label_id)
            VALUES ($1, $2)
            ON CONFLICT (post_id, label_id) DO NOTHING
            "#,
            post_id,
            label_id
        )
        .execute(pool)
        .await?;

        Ok(())
    }

    /// 从文章移除标签
    pub async fn remove_label(pool: &PgPool, post_id: Uuid, label_id: Uuid) -> Result<bool, Error> {
        let result = sqlx::query!(
            r#"
            DELETE FROM post_label
            WHERE post_id = $1 AND label_id = $2
            "#,
            post_id,
            label_id
        )
        .execute(pool)
        .await?;

        Ok(result.rows_affected() > 0)
    }

    /// 移除文章的所有标签
    pub async fn remove_all_labels(pool: &PgPool, post_id: Uuid) -> Result<u64, Error> {
        let result = sqlx::query!(
            r#"
            DELETE FROM post_label
            WHERE post_id = $1
            "#,
            post_id
        )
        .execute(pool)
        .await?;

        Ok(result.rows_affected())
    }

    /// 获取所有文章（包含标签信息）
    pub async fn find_all_with_labels(
        pool: &PgPool,
        published_only: bool,
    ) -> Result<Vec<PostSummaryWithLabels>, Error> {
        // 先获取所有文章
        let post_summaries = Self::find_all(pool, published_only).await?;

        // 创建带标签的文章列表
        let mut posts_with_labels = Vec::with_capacity(post_summaries.len());

        // 为每篇文章获取标签
        for post in post_summaries {
            // 获取文章的标签
            let labels_objects =
                crate::model::models::label::Label::find_by_post_id(pool, post.id).await?;

            // 只提取标签名
            let labels = labels_objects.into_iter().map(|label| label.name).collect();

            // 创建带标签的文章摘要
            let post_with_labels = PostSummaryWithLabels {
                id: post.id,
                title: post.title,
                slug: post.slug,
                excerpt: post.excerpt,
                featured_image: post.featured_image,
                published: post.published,
                author_id: post.author_id,
                created_at: post.created_at,
                updated_at: post.updated_at,
                published_at: post.published_at,
                labels,
            };

            posts_with_labels.push(post_with_labels);
        }

        Ok(posts_with_labels)
    }
    /// 获取标签下的所有文章
    pub async fn find_by_label_id(
        pool: &PgPool,
        label_id: Uuid,
        published_only: bool,
    ) -> Result<Vec<PostSummary>, Error> {
        let posts = if published_only {
            sqlx::query_as!(
                PostSummary,
                r#"
                SELECT p.id, p.title, p.slug, p.excerpt, p.featured_image, p.published, p.author_id, p.created_at, p.updated_at, p.published_at
                FROM posts p
                JOIN post_label pl ON p.id = pl.post_id
                WHERE pl.label_id = $1 AND p.published = true
                ORDER BY p.published_at DESC
                "#,
                label_id
            )
            .fetch_all(pool)
            .await?
        } else {
            sqlx::query_as!(
                PostSummary,
                r#"
                SELECT p.id, p.title, p.slug, p.excerpt, p.featured_image, p.published, p.author_id, p.created_at, p.updated_at, p.published_at
                FROM posts p
                JOIN post_label pl ON p.id = pl.post_id
                WHERE pl.label_id = $1
                ORDER BY p.updated_at DESC
                "#,
                label_id
            )
            .fetch_all(pool)
            .await?
        };

        Ok(posts)
    }
}
