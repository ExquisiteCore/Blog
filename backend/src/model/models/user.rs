//! 用户模型
//!
//! 提供用户的数据结构和数据库操作方法

use bcrypt;
use serde::{Deserialize, Serialize};
use sqlx::{Error, postgres::PgPool};
use time::OffsetDateTime;
use uuid::Uuid;

/// 用户角色枚举
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum UserRole {
    /// 管理员角色
    Admin,
    /// 普通用户角色
    User,
}

impl Default for UserRole {
    fn default() -> Self {
        Self::User
    }
}

impl AsRef<str> for UserRole {
    fn as_ref(&self) -> &str {
        match self {
            UserRole::Admin => "admin",
            UserRole::User => "user",
        }
    }
}

impl From<String> for UserRole {
    fn from(s: String) -> Self {
        match s.to_lowercase().as_str() {
            "admin" => UserRole::Admin,
            _ => UserRole::User,
        }
    }
}

/// 用户结构体
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    /// 用户ID
    pub id: Uuid,
    /// 用户名
    pub username: String,
    /// 电子邮件
    pub email: String,
    /// 密码哈希
    #[serde(skip_serializing)]
    pub password_hash: String,
    /// 显示名称
    pub display_name: Option<String>,
    /// 头像URL
    pub avatar_url: Option<String>,
    /// 个人简介
    pub bio: Option<String>,
    /// 用户角色
    pub role: String,
    /// 创建时间
    pub created_at: OffsetDateTime,
    /// 更新时间
    pub updated_at: OffsetDateTime,
}

/// 创建用户的请求数据结构
#[derive(Debug, Deserialize)]
pub struct CreateUserRequest {
    /// 用户名
    pub username: String,
    /// 电子邮件
    pub email: String,
    /// 密码
    pub password: String,
    /// 显示名称
    pub display_name: Option<String>,
    /// 头像URL
    pub avatar_url: Option<String>,
    /// 个人简介
    pub bio: Option<String>,
    /// 用户角色
    pub role: Option<String>,
}

/// 更新用户的请求数据结构
#[derive(Debug, Deserialize)]
pub struct UpdateUserRequest {
    /// 用户名
    pub username: Option<String>,
    /// 电子邮件
    pub email: Option<String>,
    /// 密码
    pub password: Option<String>,
    /// 显示名称
    pub display_name: Option<String>,
    /// 头像URL
    pub avatar_url: Option<String>,
    /// 个人简介
    pub bio: Option<String>,
    /// 用户角色
    pub role: Option<String>,
}

/// 用户登录请求数据结构
#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    /// 用户名或电子邮件
    pub username_or_email: String,
    /// 密码
    pub password: String,
}

impl User {
    /// 创建新用户
    pub async fn create(pool: &PgPool, req: CreateUserRequest) -> Result<Self, Error> {
        let id = Uuid::new_v4();
        let now = OffsetDateTime::now_utc();
        let role = req.role.unwrap_or_else(|| "user".to_string());

        // 使用已经哈希处理过的密码
        let password_hash = req.password;

        let user = sqlx::query_as!(
            Self,
            r#"
            INSERT INTO users (id, username, email, password_hash, display_name, avatar_url, bio, role, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id, username, email, password_hash, display_name, avatar_url, bio, role, created_at, updated_at
            "#,
            id,
            req.username,
            req.email,
            password_hash,
            req.display_name,
            req.avatar_url,
            req.bio,
            role,
            now,
            now
        )
        .fetch_one(pool)
        .await?;

        Ok(user)
    }

    /// 根据ID查找用户
    pub async fn find_by_id(pool: &PgPool, id: Uuid) -> Result<Option<Self>, Error> {
        let user = sqlx::query_as!(
            Self,
            r#"
            SELECT id, username, email, password_hash, display_name, avatar_url, bio, role, created_at, updated_at
            FROM users
            WHERE id = $1
            "#,
            id
        )
        .fetch_optional(pool)
        .await?;

        Ok(user)
    }

    /// 根据用户名查找用户
    pub async fn find_by_username(pool: &PgPool, username: &str) -> Result<Option<Self>, Error> {
        let user = sqlx::query_as!(
            Self,
            r#"
            SELECT id, username, email, password_hash, display_name, avatar_url, bio, role, created_at, updated_at
            FROM users
            WHERE username = $1
            "#,
            username
        )
        .fetch_optional(pool)
        .await?;

        Ok(user)
    }

    /// 根据电子邮件查找用户
    pub async fn find_by_email(pool: &PgPool, email: &str) -> Result<Option<Self>, Error> {
        let user = sqlx::query_as!(
            Self,
            r#"
            SELECT id, username, email, password_hash, display_name, avatar_url, bio, role, created_at, updated_at
            FROM users
            WHERE email = $1
            "#,
            email
        )
        .fetch_optional(pool)
        .await?;

        Ok(user)
    }

    /// 根据用户名或电子邮件查找用户
    pub async fn find_by_username_or_email(
        pool: &PgPool,
        username_or_email: &str,
    ) -> Result<Option<Self>, Error> {
        let user = sqlx::query_as!(
            Self,
            r#"
            SELECT id, username, email, password_hash, display_name, avatar_url, bio, role, created_at, updated_at
            FROM users
            WHERE username = $1 OR email = $1
            "#,
            username_or_email
        )
        .fetch_optional(pool)
        .await?;

        Ok(user)
    }

    /// 获取所有用户
    pub async fn find_all(pool: &PgPool) -> Result<Vec<Self>, Error> {
        let users = sqlx::query_as!(
            Self,
            r#"
            SELECT id, username, email, password_hash, display_name, avatar_url, bio, role, created_at, updated_at
            FROM users
            ORDER BY username ASC
            "#
        )
        .fetch_all(pool)
        .await?;

        Ok(users)
    }

    /// 更新用户
    pub async fn update(pool: &PgPool, id: Uuid, req: UpdateUserRequest) -> Result<Self, Error> {
        let user = Self::find_by_id(pool, id).await?;

        if let Some(user) = user {
            let username = req.username.unwrap_or(user.username);
            let email = req.email.unwrap_or(user.email);
            let password_hash = match req.password {
                Some(password) => {
                    // 对新密码进行哈希处理
                    match bcrypt::hash(&password, bcrypt::DEFAULT_COST) {
                        Ok(hashed) => hashed,
                        Err(_) => return Err(Error::ColumnNotFound("密码加密失败".to_string())),
                    }
                }
                None => user.password_hash,
            };
            let display_name = req.display_name.or(user.display_name);
            let avatar_url = req.avatar_url.or(user.avatar_url);
            let bio = req.bio.or(user.bio);
            let role = req.role.unwrap_or(user.role);
            let now = OffsetDateTime::now_utc();

            let updated_user = sqlx::query_as!(
                Self,
                r#"
                UPDATE users
                SET username = $1, email = $2, password_hash = $3, display_name = $4, avatar_url = $5, bio = $6, role = $7, updated_at = $8
                WHERE id = $9
                RETURNING id, username, email, password_hash, display_name, avatar_url, bio, role, created_at, updated_at
                "#,
                username,
                email,
                password_hash,
                display_name,
                avatar_url,
                bio,
                role,
                now,
                id
            )
            .fetch_one(pool)
            .await?;

            Ok(updated_user)
        } else {
            Err(Error::RowNotFound)
        }
    }

    /// 删除用户
    pub async fn delete(pool: &PgPool, id: Uuid) -> Result<bool, Error> {
        let result = sqlx::query!("DELETE FROM users WHERE id = $1", id)
            .execute(pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }

    /// 验证用户密码
    pub async fn verify_password(&self, password: &str) -> bool {
        // 使用bcrypt验证密码
        match bcrypt::verify(password, &self.password_hash) {
            Ok(result) => result,
            Err(_) => false, // 验证过程出错，返回验证失败
        }
    }

    /// 用户登录
    pub async fn login(pool: &PgPool, req: LoginRequest) -> Result<Option<Self>, Error> {
        let user = Self::find_by_username_or_email(pool, &req.username_or_email).await?;

        if let Some(user) = user {
            if user.verify_password(&req.password).await {
                Ok(Some(user))
            } else {
                Ok(None) // 密码错误
            }
        } else {
            Ok(None) // 用户不存在
        }
    }
}
