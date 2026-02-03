use once_cell::sync::OnceCell;
use serde::{Deserialize, Serialize};
use std::fs::File;
use std::io::Read;
use std::path::Path;
use std::sync::Arc;

// 全局配置单例
static CONFIG: OnceCell<Arc<Config>> = OnceCell::new();

/// 获取全局配置实例
pub fn get_config() -> &'static Arc<Config> {
    CONFIG.get().expect("配置未初始化")
}

/// 初始化全局配置
pub fn init_config(config: Config) {
    let config = Arc::new(config);
    CONFIG.set(config).expect("配置已经初始化过");
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Config {
    pub server: ServerConfig,
    pub database: DatabaseConfig,
    pub jwt: JwtConfig,
    pub cors: CorsConfig,
    #[serde(default)]
    pub wechat: Option<WeChatConfig>,
    #[serde(default)]
    pub llm: Option<LlmConfig>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LlmConfig {
    pub provider: String,      // "deepseek", "openai", etc.
    pub api_key: String,
    pub base_url: Option<String>,
    pub model: Option<String>,
    pub max_tokens: Option<u32>,
    pub timeout_secs: Option<u64>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct WeChatConfig {
    pub app_id: String,
    pub app_secret: String,
    pub token: String,
    pub encoding_aes_key: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ServerConfig {
    pub host: String,
    pub port: u16,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DatabaseConfig {
    pub url: String,
    pub max_connections: u32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct JwtConfig {
    pub secret: String,
    pub expiration: u64, // 过期时间（分钟）
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CorsConfig {
    pub allowed_origins: Vec<String>,
    pub allowed_methods: Vec<String>,
    pub allowed_headers: Vec<String>,
    pub allow_credentials: bool,
}

impl Config {
    #[allow(dead_code)]
    pub fn new() -> Self {
        Self::default()
    }

    pub fn from_file<P: AsRef<Path>>(path: P) -> Result<Self, Box<dyn std::error::Error>> {
        let mut file = File::open(path)?;
        let mut contents = String::new();
        file.read_to_string(&mut contents)?;
        let config: Config = toml::from_str(&contents)?;
        Ok(config)
    }
}

impl Default for Config {
    fn default() -> Self {
        Config {
            server: ServerConfig {
                host: "127.0.0.1".to_string(),
                port: 8080,
            },
            database: DatabaseConfig {
                url: "postgres://postgres:postgres@localhost/blog".to_string(),
                max_connections: 5,
            },
            jwt: JwtConfig {
                secret: "default_secret_key_change_in_production".to_string(),
                expiration: 60, // 60分钟
            },
            cors: CorsConfig {
                allowed_origins: vec!["http://localhost:4321".to_string()],
                allowed_methods: vec![
                    "GET".to_string(),
                    "POST".to_string(),
                    "PUT".to_string(),
                    "DELETE".to_string(),
                    "OPTIONS".to_string(),
                ],
                allowed_headers: vec!["Authorization".to_string(), "Content-Type".to_string()],
                allow_credentials: true,
            },
            wechat: None,
            llm: None,
        }
    }
}
