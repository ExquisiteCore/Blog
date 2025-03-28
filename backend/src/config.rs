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

    pub fn default() -> Self {
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
        }
    }
}
