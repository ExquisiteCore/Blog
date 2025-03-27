//! 数据库连接和初始化模块
//!
//! 提供数据库连接池和初始化功能

use sqlx::Row;
use sqlx::postgres::{PgPool, PgPoolOptions};
use std::sync::Arc;
use tracing::info;

use crate::config::Config;

/// 获取数据库连接池
pub async fn get_db_pool(config: &Arc<Config>) -> Result<PgPool, sqlx::Error> {
    let pool = PgPoolOptions::new()
        .max_connections(config.database.max_connections)
        .connect(&config.database.url)
        .await?;

    info!("数据库连接成功");
    if is_db_empty(&pool).await? {
        init_db(&pool).await?;
    }
    Ok(pool)
}

/// 初始化数据库
///
/// 如果数据库表不存在，则创建表
async fn init_db(pool: &PgPool) -> Result<(), sqlx::Error> {
    info!("初始化数据库...");

    // 创建用户表
    sqlx::query(
        "
        CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY,
            username VARCHAR(50) NOT NULL UNIQUE,
            email VARCHAR(100) NOT NULL UNIQUE,
            password_hash VARCHAR(100) NOT NULL,
            display_name VARCHAR(100),
            avatar_url TEXT,
            bio TEXT,
            role VARCHAR(20) NOT NULL DEFAULT 'user',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    ",
    )
    .execute(pool)
    .await?;

    // 创建文章表
    sqlx::query(
        "
        CREATE TABLE IF NOT EXISTS posts (
            id UUID PRIMARY KEY,
            title VARCHAR(200) NOT NULL,
            slug VARCHAR(200) NOT NULL UNIQUE,
            content TEXT NOT NULL,
            excerpt TEXT,
            featured_image TEXT,
            published BOOLEAN NOT NULL DEFAULT FALSE,
            author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            published_at TIMESTAMPTZ
        )
    ",
    )
    .execute(pool)
    .await?;

    // 创建标签表
    sqlx::query(
        "
        CREATE TABLE IF NOT EXISTS label (
            id UUID PRIMARY KEY,
            name VARCHAR(50) NOT NULL UNIQUE,
            slug VARCHAR(50) NOT NULL UNIQUE,
            description TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    ",
    )
    .execute(pool)
    .await?;

    // 创建文章标签关联表
    sqlx::query(
        "
        CREATE TABLE IF NOT EXISTS post_tags (
            post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
            tag_id UUID NOT NULL REFERENCES label(id) ON DELETE CASCADE,
            PRIMARY KEY (post_id, tag_id)
        )
    ",
    )
    .execute(pool)
    .await?;

    // 创建评论表
    sqlx::query(
        "
        CREATE TABLE IF NOT EXISTS comments (
            id UUID PRIMARY KEY,
            content TEXT NOT NULL,
            post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    ",
    )
    .execute(pool)
    .await?;

    info!("数据库初始化完成");
    Ok(())
}

/// 检查数据库是否为空
///
/// 通过查询information_schema.tables表，检查是否存在应用程序使用的表
/// 如果没有找到这些表，则认为数据库是空的
async fn is_db_empty(pool: &PgPool) -> Result<bool, sqlx::Error> {
    info!("检查数据库是否为空...");

    // 查询数据库中是否存在我们的表
    let row = sqlx::query(
        "
        SELECT COUNT(*) as count FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('users', 'posts', 'label', 'post_tags', 'comments')
        ",
    )
    .fetch_one(pool)
    .await?;

    let count: i64 = row.get("count");

    // 如果count为0，表示数据库中没有我们的表，认为数据库是空的
    let is_empty = count == 0;

    info!("数据库是否为空: {}", is_empty);
    Ok(is_empty)
}
