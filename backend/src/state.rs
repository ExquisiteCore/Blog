use sea_orm::DatabaseConnection;
use std::sync::Arc;

use crate::llm::LlmClient;

/// 应用状态
#[derive(Clone)]
pub struct AppState {
    /// SeaORM 数据库连接
    pub conn: DatabaseConnection,
    /// LLM 客户端（可选）
    pub llm_client: Option<Arc<LlmClient>>,
}

impl AppState {
    pub fn new(conn: DatabaseConnection, llm_client: Option<LlmClient>) -> Self {
        Self {
            conn,
            llm_client: llm_client.map(Arc::new),
        }
    }
}
