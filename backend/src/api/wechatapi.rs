//! 微信公众号 API 模块
//!
//! 提供微信公众号完整功能：消息处理、用户管理、菜单管理、模板消息、客服消息、二维码等

use axum::{
    Json,
    extract::{Query, State},
    http::StatusCode,
    response::{IntoResponse, Response},
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tracing::{error, info};
use wechat_oa_sdk::{
    WeChatClient,
    api::message::IncomingMessage,
    models::reply::{TextReply, empty_reply},
};

use crate::error::{AppError, AppErrorType};
use crate::llm::LlmClient;
use crate::state::AppState;

// ============================================================================
// 通用类型和辅助函数
// ============================================================================

/// 微信 API 错误转换为 AppError
fn wechat_error(msg: impl ToString) -> AppError {
    AppError::new_message(&msg.to_string(), AppErrorType::Internal)
}

/// 从 AppState 获取微信客户端引用
fn get_client(state: &AppState) -> Result<&Arc<WeChatClient>, AppError> {
    state
        .wechat_client
        .as_ref()
        .ok_or_else(|| AppError::new_message("微信功能未配置", AppErrorType::Internal))
}

/// 通用成功响应
#[derive(Serialize)]
pub struct SuccessResponse {
    success: bool,
    message: String,
}

impl SuccessResponse {
    fn ok() -> Self {
        Self {
            success: true,
            message: "ok".to_string(),
        }
    }
}

// ============================================================================
// 消息接收与验证
// ============================================================================

/// 微信服务器验证请求参数
#[derive(Debug, Deserialize)]
pub struct VerifyQuery {
    signature: String,
    timestamp: String,
    nonce: String,
    echostr: Option<String>,
    // 加密模式额外参数
    msg_signature: Option<String>,
    encrypt_type: Option<String>,
}

/// 微信服务器配置验证 (GET 请求)
pub async fn verify_server(
    State(state): State<AppState>,
    Query(query): Query<VerifyQuery>,
) -> Response {
    let client = match &state.wechat_client {
        Some(c) => c,
        None => {
            error!("微信配置未设置");
            return (StatusCode::INTERNAL_SERVER_ERROR, "WeChat not configured").into_response();
        }
    };

    // 验证签名
    if !client.verify_signature(&query.signature, &query.timestamp, &query.nonce) {
        error!("微信服务器验证失败：签名不匹配");
        return (StatusCode::FORBIDDEN, "Invalid signature").into_response();
    }

    info!("微信服务器验证成功");

    // 处理 echostr
    match query.echostr {
        Some(echostr) => {
            // 检查是否是加密模式（echostr 需要解密）
            if query.encrypt_type.as_deref() == Some("aes") {
                match client.decrypt_echostr(&echostr) {
                    Ok(decrypted) => (StatusCode::OK, decrypted).into_response(),
                    Err(e) => {
                        error!("解密 echostr 失败: {}", e);
                        (StatusCode::INTERNAL_SERVER_ERROR, "Decrypt failed").into_response()
                    }
                }
            } else {
                // 明文模式
                (StatusCode::OK, echostr).into_response()
            }
        }
        None => (StatusCode::OK, "success").into_response(),
    }
}

/// 接收微信消息/事件 (POST 请求)
pub async fn receive_message(
    State(state): State<AppState>,
    Query(query): Query<VerifyQuery>,
    body: String,
) -> Response {
    let client = match &state.wechat_client {
        Some(c) => c,
        None => {
            error!("微信配置未设置");
            return (StatusCode::INTERNAL_SERVER_ERROR, "WeChat not configured").into_response();
        }
    };

    // 判断是否为加密模式
    let is_encrypted = query.encrypt_type.as_deref() == Some("aes");

    // 解析消息
    let message = if is_encrypted {
        // 加密模式：需要 msg_signature
        let msg_signature = match &query.msg_signature {
            Some(sig) => sig,
            None => {
                error!("加密模式缺少 msg_signature");
                return (StatusCode::BAD_REQUEST, "Missing msg_signature").into_response();
            }
        };

        match client.parse_encrypted_message(&body, msg_signature, &query.timestamp, &query.nonce) {
            Ok(msg) => msg,
            Err(e) => {
                error!("加密消息解析失败: {}", e);
                return (StatusCode::OK, empty_reply()).into_response();
            }
        }
    } else {
        // 明文模式：验证签名
        if !client.verify_signature(&query.signature, &query.timestamp, &query.nonce) {
            error!("消息签名验证失败");
            return (StatusCode::FORBIDDEN, "Invalid signature").into_response();
        }

        match client.parse_message(&body) {
            Ok(msg) => msg,
            Err(e) => {
                error!("消息解析失败: {}", e);
                return (StatusCode::OK, empty_reply()).into_response();
            }
        }
    };

    // 处理消息并生成回复
    let reply_xml = handle_message(message, state.llm_client.as_ref()).await;

    // 如果是加密模式，加密回复
    if is_encrypted && reply_xml != "success" {
        match client.encrypt_reply_auto(&reply_xml) {
            Ok(encrypted) => (StatusCode::OK, encrypted).into_response(),
            Err(e) => {
                error!("加密回复失败: {}", e);
                (StatusCode::OK, empty_reply()).into_response()
            }
        }
    } else {
        (StatusCode::OK, reply_xml).into_response()
    }
}

/// 处理接收到的消息/事件
async fn handle_message(message: IncomingMessage, llm_client: Option<&Arc<LlmClient>>) -> String {
    match message {
        IncomingMessage::Text(msg) => {
            info!("收到文本消息: {} from {}", msg.content, msg.from_user_name);

            // 先处理特殊命令
            let reply_content = match msg.content.trim().to_lowercase().as_str() {
                "帮助" | "help" | "?" => {
                    "可用命令：\n- 博客：获取博客链接\n- 清除：清除对话历史\n\n其他消息我会用 AI 回复你！".to_string()
                }
                "博客" | "blog" => "访问我的博客：https://blog.exquisitecore.xyz".to_string(),
                "清除" | "clear" | "reset" => {
                    // 清除对话历史
                    if let Some(client) = llm_client {
                        client.clear_history(&msg.from_user_name).await;
                    }
                    "对话历史已清除！".to_string()
                }
                _ => {
                    // 使用 LLM 回复
                    if let Some(client) = llm_client {
                        match client.chat(&msg.from_user_name, &msg.content).await {
                            Ok(response) => response,
                            Err(e) => {
                                error!("LLM 调用失败: {}", e);
                                format!("抱歉，AI 服务暂时不可用：{}", e)
                            }
                        }
                    } else {
                        // 没有配置 LLM，使用简单回复
                        format!("收到：{}", msg.content)
                    }
                }
            };
            TextReply::new(&msg.from_user_name, &msg.to_user_name, reply_content).to_xml()
        }
        IncomingMessage::SubscribeEvent(event) => {
            info!("用户关注: {}", event.from_user_name);
            let welcome = "感谢关注！\n\n这里是我的个人博客公众号，会不定期分享技术文章。\n\n💡 你可以直接向我发消息，我会用 AI 回复你！\n\n回复「帮助」查看更多命令";
            TextReply::new(&event.from_user_name, &event.to_user_name, welcome).to_xml()
        }
        IncomingMessage::UnsubscribeEvent(event) => {
            info!("用户取消关注: {}", event.from_user_name);
            empty_reply().to_string()
        }
        IncomingMessage::ScanEvent(event) => {
            info!(
                "用户扫码: {} scene={}",
                event.from_user_name, event.event_key
            );
            TextReply::new(&event.from_user_name, &event.to_user_name, "扫码成功！").to_xml()
        }
        IncomingMessage::MenuClickEvent(event) => {
            info!("菜单点击: {} key={}", event.from_user_name, event.event_key);
            let reply = match event.event_key.as_str() {
                "latest_post" => "正在获取最新文章...".to_string(),
                "about" => "这是一个技术博客公众号".to_string(),
                _ => format!("点击了：{}", event.event_key),
            };
            TextReply::new(&event.from_user_name, &event.to_user_name, reply).to_xml()
        }
        IncomingMessage::Image(msg) => {
            info!("收到图片消息 from {}", msg.from_user_name);
            TextReply::new(&msg.from_user_name, &msg.to_user_name, "收到图片！").to_xml()
        }
        IncomingMessage::Voice(msg) => {
            info!("收到语音消息 from {}", msg.from_user_name);
            let reply = msg
                .recognition
                .map(|r| format!("语音识别结果：{}", r))
                .unwrap_or_else(|| "收到语音消息！".to_string());
            TextReply::new(&msg.from_user_name, &msg.to_user_name, reply).to_xml()
        }
        IncomingMessage::Location(msg) => {
            info!(
                "收到位置消息 from {}: ({}, {})",
                msg.from_user_name, msg.location_x, msg.location_y
            );
            TextReply::new(
                &msg.from_user_name,
                &msg.to_user_name,
                format!("收到位置：{}", msg.label),
            )
            .to_xml()
        }
        _ => {
            info!("收到未处理的消息类型");
            empty_reply().to_string()
        }
    }
}

// ============================================================================
// 用户管理 API
// ============================================================================

#[derive(Debug, Deserialize)]
pub struct GetUserInfoQuery {
    openid: String,
    lang: Option<String>,
}

/// 获取用户信息
pub async fn get_user_info(
    State(state): State<AppState>,
    Query(params): Query<GetUserInfoQuery>,
) -> Result<Json<serde_json::Value>, AppError> {
    let client = get_client(&state)?;

    let info = client
        .get_user_info(&params.openid, params.lang.as_deref())
        .await
        .map_err(wechat_error)?;

    Ok(Json(serde_json::json!({
        "subscribe": info.subscribe,
        "openid": info.openid,
        "language": info.language,
        "subscribe_time": info.subscribe_time,
        "unionid": info.unionid,
        "remark": info.remark,
        "groupid": info.groupid,
        "tagid_list": info.tagid_list,
        "subscribe_scene": info.subscribe_scene,
        "qr_scene": info.qr_scene,
        "qr_scene_str": info.qr_scene_str,
    })))
}

#[derive(Debug, Deserialize)]
pub struct BatchGetUserInfoRequest {
    openids: Vec<String>,
    lang: Option<String>,
}

/// 批量获取用户信息
pub async fn batch_get_user_info(
    State(state): State<AppState>,
    Json(req): Json<BatchGetUserInfoRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    let client = get_client(&state)?;

    let openids: Vec<&str> = req.openids.iter().map(|s| s.as_str()).collect();
    let result = client
        .batch_get_user_info(&openids, req.lang.as_deref())
        .await
        .map_err(wechat_error)?;

    let users: Vec<serde_json::Value> = result
        .user_info_list
        .into_iter()
        .map(|info| {
            serde_json::json!({
                "subscribe": info.subscribe,
                "openid": info.openid,
                "language": info.language,
                "subscribe_time": info.subscribe_time,
                "unionid": info.unionid,
                "remark": info.remark,
                "groupid": info.groupid,
                "tagid_list": info.tagid_list,
                "subscribe_scene": info.subscribe_scene,
                "qr_scene": info.qr_scene,
                "qr_scene_str": info.qr_scene_str,
            })
        })
        .collect();

    Ok(Json(serde_json::json!({ "user_info_list": users })))
}

#[derive(Debug, Deserialize)]
pub struct GetUserListQuery {
    next_openid: Option<String>,
}

/// 获取用户列表（关注者列表）
pub async fn get_user_list(
    State(state): State<AppState>,
    Query(params): Query<GetUserListQuery>,
) -> Result<Json<serde_json::Value>, AppError> {
    let client = get_client(&state)?;

    let result = client
        .get_user_list(params.next_openid.as_deref())
        .await
        .map_err(wechat_error)?;

    Ok(Json(serde_json::json!({
        "total": result.total,
        "count": result.count,
        "data": result.data.map(|d| d.openid),
        "next_openid": result.next_openid,
    })))
}

#[derive(Debug, Deserialize)]
pub struct SetUserRemarkRequest {
    openid: String,
    remark: String,
}

/// 设置用户备注
pub async fn set_user_remark(
    State(state): State<AppState>,
    Json(req): Json<SetUserRemarkRequest>,
) -> Result<Json<SuccessResponse>, AppError> {
    let client = get_client(&state)?;

    client
        .set_user_remark(&req.openid, &req.remark)
        .await
        .map_err(wechat_error)?;

    Ok(Json(SuccessResponse::ok()))
}

// ============================================================================
// 用户标签管理 API
// ============================================================================

#[derive(Debug, Deserialize)]
pub struct CreateTagRequest {
    name: String,
}

/// 创建用户标签
pub async fn create_tag(
    State(state): State<AppState>,
    Json(req): Json<CreateTagRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    let client = get_client(&state)?;

    let tag = client.create_tag(&req.name).await.map_err(wechat_error)?;

    Ok(Json(serde_json::json!({
        "id": tag.id,
        "name": tag.name,
    })))
}

/// 获取所有标签
pub async fn get_tags(
    State(state): State<AppState>,
) -> Result<Json<serde_json::Value>, AppError> {
    let client = get_client(&state)?;

    let result = client.get_tags().await.map_err(wechat_error)?;

    let tags: Vec<serde_json::Value> = result
        .tags
        .into_iter()
        .map(|t| {
            serde_json::json!({
                "id": t.id,
                "name": t.name,
                "count": t.count,
            })
        })
        .collect();

    Ok(Json(serde_json::json!({ "tags": tags })))
}

#[derive(Debug, Deserialize)]
pub struct UpdateTagRequest {
    id: i32,
    name: String,
}

/// 更新标签名称
pub async fn update_tag(
    State(state): State<AppState>,
    Json(req): Json<UpdateTagRequest>,
) -> Result<Json<SuccessResponse>, AppError> {
    let client = get_client(&state)?;

    client
        .update_tag(req.id, &req.name)
        .await
        .map_err(wechat_error)?;

    Ok(Json(SuccessResponse::ok()))
}

#[derive(Debug, Deserialize)]
pub struct DeleteTagRequest {
    id: i32,
}

/// 删除标签
pub async fn delete_tag(
    State(state): State<AppState>,
    Json(req): Json<DeleteTagRequest>,
) -> Result<Json<SuccessResponse>, AppError> {
    let client = get_client(&state)?;

    client.delete_tag(req.id).await.map_err(wechat_error)?;

    Ok(Json(SuccessResponse::ok()))
}

#[derive(Debug, Deserialize)]
pub struct GetUsersByTagQuery {
    tag_id: i32,
    next_openid: Option<String>,
}

/// 获取标签下的用户列表
pub async fn get_users_by_tag(
    State(state): State<AppState>,
    Query(params): Query<GetUsersByTagQuery>,
) -> Result<Json<serde_json::Value>, AppError> {
    let client = get_client(&state)?;

    let result = client
        .get_users_by_tag(params.tag_id, params.next_openid.as_deref())
        .await
        .map_err(wechat_error)?;

    Ok(Json(serde_json::json!({
        "count": result.count,
        "data": result.data.map(|d| d.openid),
        "next_openid": result.next_openid,
    })))
}

#[derive(Debug, Deserialize)]
pub struct BatchTagUsersRequest {
    openids: Vec<String>,
    tag_id: i32,
}

/// 批量为用户打标签
pub async fn batch_tag_users(
    State(state): State<AppState>,
    Json(req): Json<BatchTagUsersRequest>,
) -> Result<Json<SuccessResponse>, AppError> {
    let client = get_client(&state)?;

    let openids: Vec<&str> = req.openids.iter().map(|s| s.as_str()).collect();
    client
        .batch_tag_users(&openids, req.tag_id)
        .await
        .map_err(wechat_error)?;

    Ok(Json(SuccessResponse::ok()))
}

/// 批量为用户取消标签
pub async fn batch_untag_users(
    State(state): State<AppState>,
    Json(req): Json<BatchTagUsersRequest>,
) -> Result<Json<SuccessResponse>, AppError> {
    let client = get_client(&state)?;

    let openids: Vec<&str> = req.openids.iter().map(|s| s.as_str()).collect();
    client
        .batch_untag_users(&openids, req.tag_id)
        .await
        .map_err(wechat_error)?;

    Ok(Json(SuccessResponse::ok()))
}

#[derive(Debug, Deserialize)]
pub struct GetUserTagsQuery {
    openid: String,
}

/// 获取用户的标签列表
pub async fn get_user_tags(
    State(state): State<AppState>,
    Query(params): Query<GetUserTagsQuery>,
) -> Result<Json<serde_json::Value>, AppError> {
    let client = get_client(&state)?;

    let tag_ids = client
        .get_user_tags(&params.openid)
        .await
        .map_err(wechat_error)?;

    Ok(Json(serde_json::json!({ "tagid_list": tag_ids })))
}

// ============================================================================
// 菜单管理 API
// ============================================================================

/// 获取当前菜单配置
pub async fn get_menu(
    State(state): State<AppState>,
) -> Result<Json<serde_json::Value>, AppError> {
    let client = get_client(&state)?;

    let menu = client.get_menu().await.map_err(wechat_error)?;

    Ok(Json(serde_json::json!({
        "menu": menu.menu.map(|m| {
            serde_json::json!({
                "button": m.button.iter().map(convert_menu_button_to_json).collect::<Vec<_>>()
            })
        }),
        "conditionalmenu": menu.conditionalmenu.map(|cms| {
            cms.iter().map(|cm| {
                serde_json::json!({
                    "button": cm.button.iter().map(convert_menu_button_to_json).collect::<Vec<_>>(),
                    "matchrule": cm.matchrule.clone(),
                    "menuid": cm.menuid,
                })
            }).collect::<Vec<_>>()
        }),
    })))
}

#[derive(Debug, Deserialize)]
pub struct CreateMenuRequest {
    buttons: Vec<MenuButtonRequest>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct MenuButtonRequest {
    #[serde(rename = "type")]
    pub button_type: Option<String>,
    pub name: String,
    pub key: Option<String>,
    pub url: Option<String>,
    pub media_id: Option<String>,
    pub article_id: Option<String>,
    pub appid: Option<String>,
    pub pagepath: Option<String>,
    pub sub_button: Option<Vec<MenuButtonRequest>>,
}

/// 创建自定义菜单
pub async fn create_menu(
    State(state): State<AppState>,
    Json(req): Json<CreateMenuRequest>,
) -> Result<Json<SuccessResponse>, AppError> {
    let client = get_client(&state)?;

    let buttons = convert_menu_buttons(req.buttons);
    client.create_menu(buttons).await.map_err(wechat_error)?;

    Ok(Json(SuccessResponse::ok()))
}

/// 删除所有菜单
pub async fn delete_menu(
    State(state): State<AppState>,
) -> Result<Json<SuccessResponse>, AppError> {
    let client = get_client(&state)?;

    client.delete_menu().await.map_err(wechat_error)?;

    Ok(Json(SuccessResponse::ok()))
}

#[derive(Debug, Deserialize)]
pub struct CreateConditionalMenuRequest {
    buttons: Vec<MenuButtonRequest>,
    matchrule: MatchRuleRequest,
}

#[derive(Debug, Deserialize)]
pub struct MatchRuleRequest {
    pub tag_id: Option<String>,
    pub client_platform_type: Option<String>,
}

/// 创建个性化菜单
pub async fn create_conditional_menu(
    State(state): State<AppState>,
    Json(req): Json<CreateConditionalMenuRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    let client = get_client(&state)?;

    let buttons = convert_menu_buttons(req.buttons);
    let match_rule = wechat_oa_sdk::models::menu::MatchRule {
        tag_id: req.matchrule.tag_id,
        client_platform_type: req.matchrule.client_platform_type,
    };

    let menu_id = client
        .create_conditional_menu(buttons, match_rule)
        .await
        .map_err(wechat_error)?;

    Ok(Json(serde_json::json!({ "menuid": menu_id })))
}

#[derive(Debug, Deserialize)]
pub struct DeleteConditionalMenuRequest {
    menuid: i64,
}

/// 删除个性化菜单
pub async fn delete_conditional_menu(
    State(state): State<AppState>,
    Json(req): Json<DeleteConditionalMenuRequest>,
) -> Result<Json<SuccessResponse>, AppError> {
    let client = get_client(&state)?;

    client
        .delete_conditional_menu(req.menuid)
        .await
        .map_err(wechat_error)?;

    Ok(Json(SuccessResponse::ok()))
}

#[derive(Debug, Deserialize)]
pub struct TryMatchMenuRequest {
    user_id: String,
}

/// 测试个性化菜单匹配
pub async fn try_match_menu(
    State(state): State<AppState>,
    Json(req): Json<TryMatchMenuRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    let client = get_client(&state)?;

    let menu = client
        .try_match_menu(&req.user_id)
        .await
        .map_err(wechat_error)?;

    // 手动转换 Menu 结构
    let buttons: Vec<serde_json::Value> = menu
        .button
        .into_iter()
        .map(|b| convert_menu_button_to_json(&b))
        .collect();

    Ok(Json(serde_json::json!({ "button": buttons })))
}

/// 转换菜单按钮请求到 SDK 类型
fn convert_menu_buttons(
    buttons: Vec<MenuButtonRequest>,
) -> Vec<wechat_oa_sdk::models::menu::MenuButton> {
    buttons.into_iter().map(convert_single_button).collect()
}

fn convert_single_button(btn: MenuButtonRequest) -> wechat_oa_sdk::models::menu::MenuButton {
    wechat_oa_sdk::models::menu::MenuButton {
        name: btn.name,
        button_type: btn.button_type,
        key: btn.key,
        url: btn.url,
        media_id: btn.media_id,
        article_id: btn.article_id,
        appid: btn.appid,
        pagepath: btn.pagepath,
        sub_button: btn.sub_button.map(convert_menu_buttons),
    }
}

fn convert_menu_button_to_json(btn: &wechat_oa_sdk::models::menu::MenuButton) -> serde_json::Value {
    serde_json::json!({
        "type": btn.button_type,
        "name": btn.name,
        "key": btn.key,
        "url": btn.url,
        "media_id": btn.media_id,
        "article_id": btn.article_id,
        "appid": btn.appid,
        "pagepath": btn.pagepath,
        "sub_button": btn.sub_button.as_ref().map(|subs| {
            subs.iter().map(convert_menu_button_to_json).collect::<Vec<_>>()
        }),
    })
}

// ============================================================================
// 模板消息 API
// ============================================================================

#[derive(Debug, Deserialize)]
pub struct SendTemplateRequest {
    touser: String,
    template_id: String,
    url: Option<String>,
    miniprogram: Option<MiniProgramRequest>,
    data: HashMap<String, TemplateDataItemRequest>,
    client_msg_id: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct MiniProgramRequest {
    appid: String,
    pagepath: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct TemplateDataItemRequest {
    value: String,
    color: Option<String>,
}

/// 发送模板消息
pub async fn send_template_message(
    State(state): State<AppState>,
    Json(req): Json<SendTemplateRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    let client = get_client(&state)?;

    use wechat_oa_sdk::models::template::{TemplateDataItem, TemplateMessage};

    let mut data = HashMap::new();
    for (key, item) in req.data {
        let mut tdi = TemplateDataItem::new(item.value);
        if let Some(color) = item.color {
            tdi = tdi.with_color(color);
        }
        data.insert(key, tdi);
    }

    let mut message = TemplateMessage::new(&req.touser, &req.template_id, data);

    if let Some(url) = req.url {
        message = message.with_url(url);
    }

    if let Some(mp) = req.miniprogram {
        message = message.with_miniprogram(mp.appid, mp.pagepath);
    }

    if let Some(client_msg_id) = req.client_msg_id {
        message = message.with_client_msg_id(client_msg_id);
    }

    let msg_id = client
        .send_template_message(&message)
        .await
        .map_err(wechat_error)?;

    Ok(Json(serde_json::json!({
        "success": true,
        "msgid": msg_id,
    })))
}

#[derive(Debug, Deserialize)]
pub struct SetIndustryRequest {
    industry_id1: String,
    industry_id2: String,
}

/// 设置所属行业
pub async fn set_industry(
    State(state): State<AppState>,
    Json(req): Json<SetIndustryRequest>,
) -> Result<Json<SuccessResponse>, AppError> {
    let client = get_client(&state)?;

    client
        .set_industry(&req.industry_id1, &req.industry_id2)
        .await
        .map_err(wechat_error)?;

    Ok(Json(SuccessResponse::ok()))
}

/// 获取设置的行业信息
pub async fn get_industry(
    State(state): State<AppState>,
) -> Result<Json<serde_json::Value>, AppError> {
    let client = get_client(&state)?;

    let result = client.get_industry().await.map_err(wechat_error)?;

    Ok(Json(serde_json::json!({
        "primary_industry": {
            "first_class": result.primary_industry.first_class,
            "second_class": result.primary_industry.second_class,
        },
        "secondary_industry": {
            "first_class": result.secondary_industry.first_class,
            "second_class": result.secondary_industry.second_class,
        },
    })))
}

#[derive(Debug, Deserialize)]
pub struct AddTemplateRequest {
    template_id_short: String,
}

/// 从模板库添加模板
pub async fn add_template(
    State(state): State<AppState>,
    Json(req): Json<AddTemplateRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    let client = get_client(&state)?;

    let template_id = client
        .add_template(&req.template_id_short)
        .await
        .map_err(wechat_error)?;

    Ok(Json(serde_json::json!({ "template_id": template_id })))
}

/// 获取所有模板列表
pub async fn get_all_templates(
    State(state): State<AppState>,
) -> Result<Json<serde_json::Value>, AppError> {
    let client = get_client(&state)?;

    let result = client.get_all_templates().await.map_err(wechat_error)?;

    let templates: Vec<serde_json::Value> = result
        .template_list
        .into_iter()
        .map(|t| {
            serde_json::json!({
                "template_id": t.template_id,
                "title": t.title,
                "primary_industry": t.primary_industry,
                "deputy_industry": t.deputy_industry,
                "content": t.content,
                "example": t.example,
            })
        })
        .collect();

    Ok(Json(serde_json::json!({ "template_list": templates })))
}

#[derive(Debug, Deserialize)]
pub struct DeleteTemplateRequest {
    template_id: String,
}

/// 删除模板
pub async fn delete_template(
    State(state): State<AppState>,
    Json(req): Json<DeleteTemplateRequest>,
) -> Result<Json<SuccessResponse>, AppError> {
    let client = get_client(&state)?;

    client
        .delete_template(&req.template_id)
        .await
        .map_err(wechat_error)?;

    Ok(Json(SuccessResponse::ok()))
}

// ============================================================================
// 客服消息 API
// ============================================================================

#[derive(Debug, Deserialize)]
pub struct SendTextRequest {
    touser: String,
    content: String,
}

/// 发送客服文本消息
pub async fn send_text(
    State(state): State<AppState>,
    Json(req): Json<SendTextRequest>,
) -> Result<Json<SuccessResponse>, AppError> {
    let client = get_client(&state)?;

    client
        .send_text(&req.touser, &req.content)
        .await
        .map_err(wechat_error)?;

    Ok(Json(SuccessResponse::ok()))
}

#[derive(Debug, Deserialize)]
pub struct SendImageRequest {
    touser: String,
    media_id: String,
}

/// 发送客服图片消息
pub async fn send_image(
    State(state): State<AppState>,
    Json(req): Json<SendImageRequest>,
) -> Result<Json<SuccessResponse>, AppError> {
    let client = get_client(&state)?;

    client
        .send_image(&req.touser, &req.media_id)
        .await
        .map_err(wechat_error)?;

    Ok(Json(SuccessResponse::ok()))
}

#[derive(Debug, Deserialize)]
pub struct SendVoiceRequest {
    touser: String,
    media_id: String,
}

/// 发送客服语音消息
pub async fn send_voice(
    State(state): State<AppState>,
    Json(req): Json<SendVoiceRequest>,
) -> Result<Json<SuccessResponse>, AppError> {
    let client = get_client(&state)?;

    client
        .send_voice(&req.touser, &req.media_id)
        .await
        .map_err(wechat_error)?;

    Ok(Json(SuccessResponse::ok()))
}

#[derive(Debug, Deserialize)]
pub struct SendVideoRequest {
    touser: String,
    media_id: String,
    thumb_media_id: String,
    title: Option<String>,
    description: Option<String>,
}

/// 发送客服视频消息
pub async fn send_video(
    State(state): State<AppState>,
    Json(req): Json<SendVideoRequest>,
) -> Result<Json<SuccessResponse>, AppError> {
    let client = get_client(&state)?;

    client
        .send_video(
            &req.touser,
            &req.media_id,
            &req.thumb_media_id,
            req.title.as_deref(),
            req.description.as_deref(),
        )
        .await
        .map_err(wechat_error)?;

    Ok(Json(SuccessResponse::ok()))
}

#[derive(Debug, Deserialize)]
pub struct SendNewsRequest {
    touser: String,
    articles: Vec<NewsArticleRequest>,
}

#[derive(Debug, Deserialize)]
pub struct NewsArticleRequest {
    title: String,
    description: String,
    url: String,
    picurl: String,
}

/// 发送客服图文消息
pub async fn send_news(
    State(state): State<AppState>,
    Json(req): Json<SendNewsRequest>,
) -> Result<Json<SuccessResponse>, AppError> {
    let client = get_client(&state)?;

    use wechat_oa_sdk::api::customer_service::NewsArticle;

    let articles: Vec<NewsArticle> = req
        .articles
        .into_iter()
        .map(|a| NewsArticle {
            title: a.title,
            description: a.description,
            url: a.url,
            picurl: a.picurl,
        })
        .collect();

    client
        .send_news(&req.touser, articles)
        .await
        .map_err(wechat_error)?;

    Ok(Json(SuccessResponse::ok()))
}

#[derive(Debug, Deserialize)]
pub struct SetTypingRequest {
    touser: String,
    typing: bool,
}

/// 设置用户输入状态
pub async fn set_typing(
    State(state): State<AppState>,
    Json(req): Json<SetTypingRequest>,
) -> Result<Json<SuccessResponse>, AppError> {
    let client = get_client(&state)?;

    client
        .set_typing(&req.touser, req.typing)
        .await
        .map_err(wechat_error)?;

    Ok(Json(SuccessResponse::ok()))
}

// ============================================================================
// 二维码 API
// ============================================================================

#[derive(Debug, Deserialize)]
pub struct CreateQrcodeRequest {
    scene_id: Option<u32>,
    scene_str: Option<String>,
    action: String, // "temporary", "permanent", "temporary_str", "permanent_str"
    expire_seconds: Option<i64>,
}

/// 创建带参数二维码
pub async fn create_qrcode(
    State(state): State<AppState>,
    Json(req): Json<CreateQrcodeRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    let client = get_client(&state)?;

    use wechat_oa_sdk::models::qrcode::QrCodeAction;

    let action = match req.action.as_str() {
        "temporary" => QrCodeAction::Temporary,
        "permanent" => QrCodeAction::Permanent,
        "temporary_str" => QrCodeAction::TemporaryStr,
        "permanent_str" => QrCodeAction::PermanentStr,
        _ => return Err(AppError::new_message("无效的二维码类型", AppErrorType::Internal)),
    };

    let result = if let Some(scene_id) = req.scene_id {
        client
            .create_qrcode(scene_id, action, req.expire_seconds)
            .await
            .map_err(wechat_error)?
    } else if let Some(scene_str) = req.scene_str {
        client
            .create_qrcode_str(&scene_str, action, req.expire_seconds)
            .await
            .map_err(wechat_error)?
    } else {
        return Err(AppError::new_message(
            "需要提供 scene_id 或 scene_str",
            AppErrorType::Internal,
        ));
    };

    let qrcode_url = WeChatClient::get_qrcode_url(&result.ticket);

    Ok(Json(serde_json::json!({
        "ticket": result.ticket,
        "expire_seconds": result.expire_seconds,
        "url": result.url,
        "qrcode_url": qrcode_url,
    })))
}

#[derive(Debug, Deserialize)]
pub struct GetQrcodeUrlQuery {
    ticket: String,
}

/// 获取二维码图片 URL
pub async fn get_qrcode_url(
    Query(params): Query<GetQrcodeUrlQuery>,
) -> Result<Json<serde_json::Value>, AppError> {
    let url = WeChatClient::get_qrcode_url(&params.ticket);
    Ok(Json(serde_json::json!({ "url": url })))
}

#[derive(Debug, Deserialize)]
pub struct CreateShortUrlRequest {
    long_url: String,
}

/// 长链接转短链接
pub async fn create_short_url(
    State(state): State<AppState>,
    Json(req): Json<CreateShortUrlRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    let client = get_client(&state)?;

    let short_url = client
        .create_short_url(&req.long_url)
        .await
        .map_err(wechat_error)?;

    Ok(Json(serde_json::json!({ "short_url": short_url })))
}
