//! API 路由模块
//!
//! 包含所有 API 端点的路由定义。
//! 使用统一的 identity_middleware 替代分层的 auth/admin middleware。

pub mod labelapi;
pub mod postapi;
pub mod userapi;

use axum::{
    Router,
    middleware::from_fn,
    routing::{delete, get, post, put},
};

use crate::middleware::auth;
use crate::state::AppState;

/// 创建 API 路由
pub fn create_routes() -> Router<AppState> {
    Router::new()
        // ============ 认证 ============
        .route("/users/register", post(userapi::register_user))
        .route("/users/login", post(userapi::login_user))
        .route("/auth/refresh", post(auth::refresh_token_handler))
        .route("/auth/logout", post(auth::logout_handler))
        .route("/me", get(auth::me_handler))
        // ============ 文章（公开） ============
        .route("/posts", get(postapi::get_posts))
        .route("/posts/{slug}", get(postapi::get_post_by_slug))
        .route("/posts/id/{id}", get(postapi::get_post_by_id))
        .route("/posts/{id}/labels", get(postapi::get_post_labels))
        // ============ 文章交互 ============
        .route("/posts/{slug}/views", post(postapi::increase_view_count))
        .route(
            "/posts/{slug}/likes",
            get(postapi::get_likes).post(postapi::toggle_like),
        )
        .route(
            "/posts/{slug}/comments",
            get(postapi::get_comments)
                .post(postapi::create_comment)
                .delete(postapi::delete_comment),
        )
        // ============ 标签（公开） ============
        .route("/labels", get(labelapi::get_labels))
        .route("/labels/{id}/posts", get(labelapi::get_posts_by_label))
        // ============ 管理接口 ============
        .route("/admin/posts", get(postapi::get_all_posts))
        .route("/admin/posts", post(postapi::create_post))
        .route("/admin/posts/{id}", put(postapi::update_post))
        .route("/admin/posts/{id}", delete(postapi::delete_post))
        .route("/admin/labels", post(labelapi::create_label))
        .route("/admin/labels/{id}", put(labelapi::update_label))
        .route("/admin/labels/{id}", delete(labelapi::delete_label))
        .route("/admin/users", get(userapi::get_users))
        .route("/admin/users/{id}", put(userapi::update_user))
        .route("/admin/users/{id}", delete(userapi::delete_user))
        // ============ 统一身份中间件 ============
        .layer(from_fn(auth::identity_middleware))
}
