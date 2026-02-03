//! API路由模块
//!
//! 包含所有API端点的路由定义

mod labelapi;
mod postapi;
mod userapi;
mod wechatapi;

use axum::{
    Router,
    middleware::from_fn,
    routing::{delete, get, post, put},
};

use crate::middleware::auth;
use crate::state::AppState;

/// 创建API路由
pub fn create_routes() -> Router<AppState> {
    // 公共路由 - 不需要认证
    let public_routes = Router::new()
        .route("/users/register", post(userapi::register_user))
        .route("/users/login", post(userapi::login_user))
        .route("/auth/refresh", post(auth::refresh_token_handler))
        .route("/posts", get(postapi::get_posts))
        .route("/posts/{id}", get(postapi::get_post_by_id))
        .route("/posts/{id}/labels", get(postapi::get_post_labels))
        .route("/labels", get(labelapi::get_labels))
        .route("/labels/{id}/posts", get(labelapi::get_posts_by_label));

    // 微信公众号回调路由（公开，但需要签名验证）
    let wechat_callback_routes = Router::new()
        .route("/wechat", get(wechatapi::verify_server))
        .route("/wechat", post(wechatapi::receive_message));

    // 用户路由 - 需要用户认证
    let user_routes = Router::new().layer(from_fn(auth::auth_middleware));

    // 管理员路由 - 需要管理员权限
    let admin_routes = Router::new()
        // 博客管理
        .route("/posts", post(postapi::create_post))
        .route("/posts/{id}", put(postapi::update_post))
        .route("/posts/{id}", delete(postapi::delete_post))
        .route("/admin/posts", get(postapi::get_all_posts))
        .route("/labels", post(labelapi::create_label))
        .route("/labels/{id}", put(labelapi::update_label))
        .route("/labels/{id}", delete(labelapi::delete_label))
        // 用户管理
        .route("/admin/users", get(userapi::get_users))
        .route("/admin/users/{id}", put(userapi::update_user))
        .route("/admin/users/{id}", delete(userapi::delete_user))
        // ============ 微信用户管理 ============
        .route("/wechat/user", get(wechatapi::get_user_info))
        .route("/wechat/user/batch", post(wechatapi::batch_get_user_info))
        .route("/wechat/user/list", get(wechatapi::get_user_list))
        .route("/wechat/user/remark", post(wechatapi::set_user_remark))
        .route("/wechat/user/tags", get(wechatapi::get_user_tags))
        // ============ 微信用户标签管理 ============
        .route("/wechat/tags", get(wechatapi::get_tags))
        .route("/wechat/tags", post(wechatapi::create_tag))
        .route("/wechat/tags", put(wechatapi::update_tag))
        .route("/wechat/tags", delete(wechatapi::delete_tag))
        .route("/wechat/tags/users", get(wechatapi::get_users_by_tag))
        .route("/wechat/tags/batch", post(wechatapi::batch_tag_users))
        .route(
            "/wechat/tags/batch/untag",
            post(wechatapi::batch_untag_users),
        )
        // ============ 微信菜单管理 ============
        .route("/wechat/menu", get(wechatapi::get_menu))
        .route("/wechat/menu", post(wechatapi::create_menu))
        .route("/wechat/menu", delete(wechatapi::delete_menu))
        .route(
            "/wechat/menu/conditional",
            post(wechatapi::create_conditional_menu),
        )
        .route(
            "/wechat/menu/conditional",
            delete(wechatapi::delete_conditional_menu),
        )
        .route("/wechat/menu/match", post(wechatapi::try_match_menu))
        // ============ 微信模板消息 ============
        .route(
            "/wechat/template/send",
            post(wechatapi::send_template_message),
        )
        .route("/wechat/template/industry", get(wechatapi::get_industry))
        .route("/wechat/template/industry", post(wechatapi::set_industry))
        .route("/wechat/template", post(wechatapi::add_template))
        .route("/wechat/template/list", get(wechatapi::get_all_templates))
        .route("/wechat/template", delete(wechatapi::delete_template))
        // ============ 微信客服消息 ============
        .route("/wechat/message/text", post(wechatapi::send_text))
        .route("/wechat/message/image", post(wechatapi::send_image))
        .route("/wechat/message/voice", post(wechatapi::send_voice))
        .route("/wechat/message/video", post(wechatapi::send_video))
        .route("/wechat/message/news", post(wechatapi::send_news))
        .route("/wechat/message/typing", post(wechatapi::set_typing))
        // ============ 微信二维码 ============
        .route("/wechat/qrcode", post(wechatapi::create_qrcode))
        .route("/wechat/qrcode/url", get(wechatapi::get_qrcode_url))
        .route("/wechat/shorturl", post(wechatapi::create_short_url))
        .layer(from_fn(auth::admin_middleware));

    // 合并所有路由
    Router::new()
        .merge(user_routes)
        .merge(admin_routes)
        .merge(wechat_callback_routes)
        .merge(public_routes)
}
