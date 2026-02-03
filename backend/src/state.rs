//! 应用状态模块
//!
//! 定义应用的共享状态

use sqlx::{Pool, Postgres};
use std::sync::Arc;
use wechat_oa_sdk::WeChatClient;

use crate::llm::LlmClient;

/// 应用状态
#[derive(Clone)]
pub struct AppState {
    /// 数据库连接池
    pub pool: Arc<Pool<Postgres>>,
    /// 微信客户端（可选）
    pub wechat_client: Option<Arc<WeChatClient>>,
    /// LLM 客户端（可选）
    pub llm_client: Option<Arc<LlmClient>>,
}

impl AppState {
    /// 创建新的应用状态
    pub fn new(
        pool: Arc<Pool<Postgres>>,
        wechat_client: Option<WeChatClient>,
        llm_client: Option<LlmClient>,
    ) -> Self {
        Self {
            pool,
            wechat_client: wechat_client.map(Arc::new),
            llm_client: llm_client.map(Arc::new),
        }
    }
}
