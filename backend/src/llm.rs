//! LLM 集成模块
//!
//! 支持 DeepSeek 等大语言模型 API

use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::RwLock;
use tracing::{error, info};

use crate::config::LlmConfig;

/// LLM 客户端
pub struct LlmClient {
    config: LlmConfig,
    http: Client,
    /// 用户对话历史缓存 (openid -> messages)
    conversations: Arc<RwLock<HashMap<String, Vec<ChatMessage>>>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatMessage {
    pub role: String, // "system", "user", "assistant"
    pub content: String,
}

#[derive(Debug, Serialize)]
struct ChatRequest {
    model: String,
    messages: Vec<ChatMessage>,
    max_tokens: Option<u32>,
    temperature: Option<f32>,
    stream: bool,
}

#[derive(Debug, Deserialize)]
struct ChatResponse {
    choices: Vec<Choice>,
}

#[derive(Debug, Deserialize)]
struct Choice {
    message: ChatMessage,
}

#[derive(Debug, Deserialize)]
struct ErrorResponse {
    error: ApiError,
}

#[derive(Debug, Deserialize)]
struct ApiError {
    message: String,
}

impl LlmClient {
    pub fn new(config: LlmConfig) -> Self {
        let timeout = config.timeout_secs.unwrap_or(30);
        let http = Client::builder()
            .timeout(Duration::from_secs(timeout))
            .build()
            .expect("Failed to create HTTP client");

        Self {
            config,
            http,
            conversations: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// 与 LLM 聊天
    ///
    /// `user_id`: 用户标识（微信 openid），用于维护对话上下文
    /// `message`: 用户消息
    pub async fn chat(&self, user_id: &str, message: &str) -> Result<String, String> {
        // 获取或创建对话历史
        let mut conversations = self.conversations.write().await;
        let history = conversations.entry(user_id.to_string()).or_insert_with(|| {
            vec![ChatMessage {
                role: "system".to_string(),
                content: "你是一个友好的助手，用简洁的中文回复用户问题。回复尽量控制在100字以内。"
                    .to_string(),
            }]
        });

        // 添加用户消息
        history.push(ChatMessage {
            role: "user".to_string(),
            content: message.to_string(),
        });

        // 限制历史长度（保留最近10轮对话）
        if history.len() > 21 {
            // 1 system + 20 user/assistant
            let system_msg = history[0].clone();
            let recent: Vec<_> = history.iter().skip(history.len() - 20).cloned().collect();
            history.clear();
            history.push(system_msg);
            history.extend(recent);
        }

        // 构建请求
        let base_url = self
            .config
            .base_url
            .as_deref()
            .unwrap_or("https://api.deepseek.com");
        let model = self.config.model.as_deref().unwrap_or("deepseek-chat");

        let request = ChatRequest {
            model: model.to_string(),
            messages: history.clone(),
            max_tokens: self.config.max_tokens.or(Some(500)),
            temperature: Some(0.7),
            stream: false,
        };

        info!("Calling LLM API for user {}", user_id);

        // 发送请求
        let response = self
            .http
            .post(format!("{}/v1/chat/completions", base_url))
            .header("Authorization", format!("Bearer {}", self.config.api_key))
            .header("Content-Type", "application/json")
            .json(&request)
            .send()
            .await
            .map_err(|e| {
                error!("LLM API request failed: {}", e);
                format!("请求失败: {}", e)
            })?;

        let status = response.status();
        let body = response
            .text()
            .await
            .map_err(|e| format!("读取响应失败: {}", e))?;

        if !status.is_success() {
            error!("LLM API error: {} - {}", status, body);
            // 尝试解析错误信息
            if let Ok(err) = serde_json::from_str::<ErrorResponse>(&body) {
                return Err(format!("API错误: {}", err.error.message));
            }
            return Err(format!("API错误: {}", status));
        }

        // 解析响应
        let chat_response: ChatResponse = serde_json::from_str(&body).map_err(|e| {
            error!("Failed to parse LLM response: {} - {}", e, body);
            format!("解析响应失败: {}", e)
        })?;

        let assistant_message = chat_response
            .choices
            .first()
            .map(|c| c.message.content.clone())
            .unwrap_or_else(|| "抱歉，我没有生成回复。".to_string());

        // 保存助手回复到历史
        history.push(ChatMessage {
            role: "assistant".to_string(),
            content: assistant_message.clone(),
        });

        info!(
            "LLM response for user {}: {} chars",
            user_id,
            assistant_message.len()
        );

        Ok(assistant_message)
    }

    /// 清除用户对话历史
    pub async fn clear_history(&self, user_id: &str) {
        let mut conversations = self.conversations.write().await;
        conversations.remove(user_id);
        info!("Cleared conversation history for user {}", user_id);
    }
}
